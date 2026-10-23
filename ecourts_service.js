/**
 * NyayaSetu — Official eCourts District Portal Service
 * Interacts with https://services.ecourts.gov.in/ecourtindia_v6/
 *
 * Compliance & Privacy Constraints:
 * - Human-in-the-loop CAPTCHA: The visitor solves the captcha.
 * - Zero server-side persistence: No case data or cookies logged or saved.
 * - In-memory session store with 10-minute expiry.
 * - Polite scraping: 2-second minimum delay per session, 1 request at a time per session,
 *   descriptive User-Agent, and per-IP rate limiting (10 searches/min).
 */

const https = require('https');
const crypto = require('crypto');
const { parseCaseDetails, isWrongCaptcha, isPortalError, isCaseNotFound } = require('./ecourts_parser');

const ECOURTS_BASE_URL = 'https://services.ecourts.gov.in';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MIN_REQUEST_DELAY_MS = 2000; // 2 seconds delay between portal requests
const IP_RATE_LIMIT_MAX = 10; // Max 10 searches per minute per IP
const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// In-Memory Sessions: Map<sessionId, SessionData>
// SessionData: { id, cnr, cookies, appToken, ajaxHeaders, lastRequestTime, lock, createdAt }
const sessions = new Map();

// In-Memory IP Rate Limiter: Map<ip, Array<timestamp>>
const ipRequestLogs = new Map();

/**
 * Periodically purge expired sessions and stale rate limit logs
 */
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
  for (const [ip, timestamps] of ipRequestLogs.entries()) {
    const valid = timestamps.filter(t => now - t < IP_RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRequestLogs.delete(ip);
    } else {
      ipRequestLogs.set(ip, valid);
    }
  }
}, 60 * 1000).unref();

/**
 * Check and enforce per-IP rate limiting (10 searches/minute)
 */
function checkIpRateLimit(ip) {
  const now = Date.now();
  const timestamps = ipRequestLogs.get(ip) || [];
  const recent = timestamps.filter(t => now - t < IP_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= IP_RATE_LIMIT_MAX) {
    return false;
  }

  recent.push(now);
  ipRequestLogs.set(ip, recent);
  return true;
}

/**
 * Low-level HTTPS request helper
 */
function httpsRequest(urlStr, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.5',
        ...(options.headers || {})
      },
      timeout: 15000 // 15 second network timeout
    };

    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          raw: buffer
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('PORTAL_TIMEOUT'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Cookie Jar helpers
 */
function parseSetCookieHeaders(existingCookieMap, setCookieHeader) {
  if (!setCookieHeader) return existingCookieMap;
  const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const item of arr) {
    const [pair] = item.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      existingCookieMap.set(name, val);
    }
  }
  return existingCookieMap;
}

function formatCookieHeader(cookieMap) {
  const parts = [];
  for (const [name, val] of cookieMap.entries()) {
    parts.push(`${name}=${val}`);
  }
  return parts.join('; ');
}

function extractAppToken(html) {
  const inputTags = String(html || '').match(/<input\b[^>]*>/gi) || [];
  for (const tag of inputTags) {
    const name = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2];
    const id = tag.match(/\bid\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (name === 'app_token' || id === 'app_token') {
      return tag.match(/\bvalue\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    }
  }
  return '';
}

/**
 * Resolve the rotating eCourts AJAX headers from the portal's own
 * components.js for this session. These values change and must not be
 * hard-coded between sessions.
 */
async function loadAjaxHeaders(session, homeHtml) {
  const scriptMatch = String(homeHtml || '').match(/src=["']([^"']*components\.js[^"']*)["']/i);
  const scriptUrl = scriptMatch
    ? new URL(scriptMatch[1], `${ECOURTS_BASE_URL}/ecourtindia_v6/`).toString()
    : `${ECOURTS_BASE_URL}/ecourtindia_v6/js/components.js`;

  await enforcePoliteDelay(session);
  const response = await httpsRequest(scriptUrl, {
    method: 'GET',
    headers: {
      'Accept': '*/*',
      'Referer': `${ECOURTS_BASE_URL}/ecourtindia_v6/`,
      'Cookie': formatCookieHeader(session.cookies)
    }
  });
  parseSetCookieHeaders(session.cookies, response.headers['set-cookie']);

  const delimiterMatch = response.body.match(/(?:var|let|const)\s+delimeter\s*=\s*(["'])(.*?)\1/i);
  const headersMatch = response.body.match(/headers\s*:\s*\{([^}]+)\}/i);
  const headerNames = headersMatch
    ? [...headersMatch[1].matchAll(/["']([^"']+)["']\s*:\s*delimeter/gi)].map(match => match[1])
    : [];
  const customHeader = headerNames.find(name => name.toLowerCase() !== 'delimeter');

  if (response.statusCode < 200 || response.statusCode >= 300 || !delimiterMatch || !customHeader) {
    const err = new Error('Could not initialize the official eCourts request session. Please start a new search shortly.');
    err.code = 'PORTAL_SESSION_INIT_FAILED';
    err.status = 503;
    throw err;
  }

  const delimiter = delimiterMatch[2];
  session.ajaxHeaders = { delimeter: delimiter, [customHeader]: delimiter };
}

/**
 * Ask eCourts to create a captcha challenge for this session, then fetch the
 * exact image URL returned by that challenge. Fetching securimage directly
 * does not reliably bind the image to the CNR search session.
 */
async function fetchCaptchaChallenge(session) {
  await enforcePoliteDelay(session);
  const body = new URLSearchParams({
    ajax_req: 'true',
    app_token: session.appToken || ''
  }).toString();

  const response = await httpsRequest(`${ECOURTS_BASE_URL}/ecourtindia_v6/?p=casestatus/getCaptcha`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${ECOURTS_BASE_URL}/ecourtindia_v6/`,
      'Cookie': formatCookieHeader(session.cookies),
      ...session.ajaxHeaders,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
  parseSetCookieHeaders(session.cookies, response.headers['set-cookie']);

  let challenge;
  try {
    challenge = JSON.parse(response.body);
  } catch {
    challenge = null;
  }
  const captchaMatch = challenge?.div_captcha?.match(/src=["']([^"']*securimage_show\.php[^"']*)["']/i);
  if (response.statusCode < 200 || response.statusCode >= 300 || !captchaMatch) {
    const err = new Error('The official eCourts portal could not create a captcha for this session. Please start a new search.');
    err.code = 'PORTAL_CAPTCHA_INIT_FAILED';
    err.status = 503;
    throw err;
  }

  session.appToken = challenge.app_token || session.appToken || '';
  return fetchCaptchaImage(session, captchaMatch[1].replace(/&amp;/g, '&'));
}

/**
 * Enforce minimum politeness delay between requests on the same session
 */
async function enforcePoliteDelay(session) {
  const now = Date.now();
  const timeSinceLast = now - (session.lastRequestTime || 0);
  if (timeSinceLast < MIN_REQUEST_DELAY_MS) {
    const waitMs = MIN_REQUEST_DELAY_MS - timeSinceLast;
    await new Promise(r => setTimeout(r, waitMs));
  }
  session.lastRequestTime = Date.now();
}

/**
 * Fetch a fresh binary captcha image from eCourts for a session
 * and convert to base64 data URI
 */
async function fetchCaptchaImage(session, customCaptchaPath = null) {
  await enforcePoliteDelay(session);

  const captchaPath = customCaptchaPath || `/ecourtindia_v6/vendor/securimage/securimage_show.php?${Math.random()}`;
  const fullUrl = captchaPath.startsWith('http') ? captchaPath : `${ECOURTS_BASE_URL}${captchaPath}`;

  const res = await httpsRequest(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': `${ECOURTS_BASE_URL}/ecourtindia_v6/`,
      'Cookie': formatCookieHeader(session.cookies)
    }
  });

  if (res.statusCode < 200 || res.statusCode >= 400 || res.raw.length === 0) {
    throw new Error('PORTAL_UNAVAILABLE');
  }

  // Update cookies if portal sent any
  parseSetCookieHeaders(session.cookies, res.headers['set-cookie']);

  const contentType = res.headers['content-type'] || 'image/png';
  if (!contentType.toLowerCase().startsWith('image/')) {
    const err = new Error('The official eCourts portal returned a page instead of a captcha image. Please start a fresh search.');
    err.code = 'PORTAL_CAPTCHA_INIT_FAILED';
    err.status = 503;
    throw err;
  }
  return `data:${contentType};base64,${res.raw.toString('base64')}`;
}

/**
 * 1. POST /api/search/start
 * Opens session with eCourts portal, fetches fresh captcha image,
 * returns { sessionId, captchaImage }
 */
async function startSearch(rawCnr, clientIp) {
  // 1. Per-IP Rate Limit
  if (!checkIpRateLimit(clientIp)) {
    const err = new Error('RATE_LIMITED');
    err.code = 'RATE_LIMITED';
    err.status = 429;
    throw err;
  }

  // 2. Validate CNR format (16 alphanumeric characters, allowing optional hyphens/spaces from user)
  const cleanedCnr = (rawCnr || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanedCnr.length !== 16) {
    const err = new Error('INVALID_CNR');
    err.code = 'INVALID_CNR';
    err.status = 400;
    err.message = 'CNR must be exactly 16 alphanumeric characters (e.g., MHNG010045212024).';
    throw err;
  }

  // 3. Initiate session with eCourts portal
  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    cnr: cleanedCnr,
    cookies: new Map(),
    appToken: '',
    ajaxHeaders: {},
    lastRequestTime: 0,
    lock: Promise.resolve(),
    createdAt: Date.now()
  };

  try {
    // Replicated Step 1: GET /ecourtindia_v6/
    const homeRes = await httpsRequest(`${ECOURTS_BASE_URL}/ecourtindia_v6/`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    parseSetCookieHeaders(session.cookies, homeRes.headers['set-cookie']);

    // Extract app_token from home HTML if present
    session.appToken = extractAppToken(homeRes.body);

    // eCourts rotates its AJAX verification headers and creates a challenge
    // through getCaptcha. The returned image is bound to this server session.
    await loadAjaxHeaders(session, homeRes.body);
    const captchaImage = await fetchCaptchaChallenge(session);

    sessions.set(sessionId, session);

    return {
      sessionId,
      captchaImage
    };
  } catch (err) {
    if (err.code === 'RATE_LIMITED' || err.code === 'INVALID_CNR' || err.code === 'PORTAL_SESSION_INIT_FAILED' || err.code === 'PORTAL_CAPTCHA_INIT_FAILED') throw err;
    const portalErr = new Error('PORTAL_UNAVAILABLE');
    portalErr.code = 'PORTAL_UNAVAILABLE';
    portalErr.status = 503;
    portalErr.message = 'Official eCourts portal is temporarily unreachable. Please try again.';
    throw portalErr;
  }
}

/**
 * Helper: Refresh captcha for an active session
 */
async function refreshCaptcha(sessionId, clientIp) {
  if (!checkIpRateLimit(clientIp)) {
    const err = new Error('RATE_LIMITED');
    err.code = 'RATE_LIMITED';
    err.status = 429;
    throw err;
  }

  const session = sessions.get(sessionId);
  if (!session || (Date.now() - session.createdAt > SESSION_TTL_MS)) {
    const err = new Error('SESSION_EXPIRED');
    err.code = 'SESSION_EXPIRED';
    err.status = 410;
    err.message = 'Your search session has expired. Please start a new search.';
    throw err;
  }

  // Mutex lock to guarantee one request at a time per session
  return (session.lock = session.lock.catch(() => {}).then(async () => {
    try {
      const captchaImage = await fetchCaptchaChallenge(session);
      return { sessionId, captchaImage };
    } catch (err) {
      if (err.code === 'PORTAL_CAPTCHA_INIT_FAILED' || err.code === 'PORTAL_SESSION_INIT_FAILED') throw err;
      const portalErr = new Error('PORTAL_UNAVAILABLE');
      portalErr.code = 'PORTAL_UNAVAILABLE';
      portalErr.status = 503;
      portalErr.message = 'Unable to refresh captcha from official portal. Please try again.';
      throw portalErr;
    }
  }));
}

/**
 * 2. POST /api/search/submit
 * Submits CNR + Captcha to official portal, parses response, returns normalized JSON.
 */
async function submitSearch(sessionId, rawCaptcha, clientIp) {
  // 1. Per-IP Rate Limit
  if (!checkIpRateLimit(clientIp)) {
    const err = new Error('RATE_LIMITED');
    err.code = 'RATE_LIMITED';
    err.status = 429;
    throw err;
  }

  // 2. Session validation
  const session = sessions.get(sessionId);
  if (!session || (Date.now() - session.createdAt > SESSION_TTL_MS)) {
    const err = new Error('SESSION_EXPIRED');
    err.code = 'SESSION_EXPIRED';
    err.status = 410;
    err.message = 'Session expired or not found. Please click Search to generate a fresh captcha.';
    throw err;
  }

  // Preserve the exact case and characters entered by the human. eCourts
  // captcha validation is case-sensitive, and silently normalizing it can
  // turn a correct transcription into a rejected one.
  const captcha = String(rawCaptcha || '').trim();
  if (!captcha) {
    const err = new Error('CAPTCHA_REQUIRED');
    err.code = 'CAPTCHA_REQUIRED';
    err.status = 400;
    err.message = 'Please enter the captcha shown in the image.';
    throw err;
  }

  // Mutex lock: Ensure one request at a time per session
  // Recover the queue if an earlier request failed. Otherwise one rejected
  // submission permanently poisons this session's promise chain.
  return (session.lock = session.lock.catch(() => {}).then(async () => {
    try {
      await enforcePoliteDelay(session);

      // Replicated Step 3: POST /ecourtindia_v6/?p=cnr_status/searchByCNR/
      const postBody = `cino=${encodeURIComponent(session.cnr)}&fcaptcha_code=${encodeURIComponent(captcha)}&ajax_req=true&app_token=${encodeURIComponent(session.appToken || '')}`;

      const res = await httpsRequest(`${ECOURTS_BASE_URL}/ecourtindia_v6/?p=cnr_status/searchByCNR/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `${ECOURTS_BASE_URL}/ecourtindia_v6/`,
          'Cookie': formatCookieHeader(session.cookies),
          ...session.ajaxHeaders,
          'Content-Length': Buffer.byteLength(postBody)
        }
      }, postBody);

      // Update session cookies from response
      parseSetCookieHeaders(session.cookies, res.headers['set-cookie']);

      let parsedJson = null;
      try {
        parsedJson = JSON.parse(res.body);
      } catch (e) {
        // Some district court errors may return HTML error page
      }

      if (res.statusCode === 429) {
        const err = new Error('The official eCourts portal is rate limiting requests. Please wait a few minutes and start a new search.');
        err.code = 'PORTAL_RATE_LIMITED';
        err.status = 429;
        throw err;
      }

      if (res.statusCode === 403) {
        const err = new Error('The official eCourts portal rejected this request or session. Start a fresh search and solve the new captcha.');
        err.code = 'PORTAL_SESSION_REJECTED';
        err.status = 503;
        throw err;
      }

      // Update app_token if present in response
      if (parsedJson && parsedJson.app_token) {
        session.appToken = parsedJson.app_token;
      }

      // 1. Check for WRONG_CAPTCHA
      if (isWrongCaptcha(parsedJson || res.body)) {
        // Parse new captcha URL from div_captcha if available
        let customCaptchaPath = null;
        if (parsedJson && parsedJson.div_captcha) {
          const match = parsedJson.div_captcha.match(/src=["']([^"']*securimage_show\.php[^"']*)["']/i);
          if (match && match[1]) {
            customCaptchaPath = match[1].replace(/&amp;/g, '&');
          }
        }

        // Fetch new captcha image immediately so user can retry without waiting
        let freshCaptcha = null;
        try {
          freshCaptcha = await fetchCaptchaImage(session, customCaptchaPath);
        } catch (cErr) {
          // If refresh fails, client will call refresh endpoint
        }

        const wrongErr = new Error('WRONG_CAPTCHA');
        wrongErr.code = 'WRONG_CAPTCHA';
        wrongErr.status = 400;
        wrongErr.message = 'The entered captcha was incorrect. A fresh captcha has been loaded for you.';
        wrongErr.captchaImage = freshCaptcha;
        throw wrongErr;
      }

      // A non-JSON response usually means the portal returned a session/WAF
      // page instead of case data. Do not feed that HTML to the case parser.
      if (!parsedJson) {
        const err = new Error('eCourts returned a web page instead of case data. Start a fresh search and try again.');
        err.code = 'PORTAL_SESSION_REJECTED';
        err.status = 503;
        throw err;
      }

      if (parsedJson.status !== undefined && parsedJson.status !== 1 && parsedJson.status !== '1') {
        const err = new Error(parsedJson.errormsg || 'eCourts did not accept the search. Start a fresh search and solve the new captcha.');
        err.code = 'PORTAL_SEARCH_REJECTED';
        err.status = 503;
        throw err;
      }

      // 2. Check for portal WAF/session errors (e.g. "Oops! There is something wrong")
      if (isPortalError(parsedJson || res.body)) {
        const portalErr = new Error('PORTAL_UNAVAILABLE');
        portalErr.code = 'PORTAL_UNAVAILABLE';
        portalErr.status = 503;
        portalErr.message = 'The official eCourts portal returned an invalid request or session error. Please try again with a fresh session.';
        throw portalErr;
      }

      // 3. Check for CASE_NOT_FOUND
      const contentToCheck = parsedJson ? (parsedJson.casetype_list || parsedJson.errormsg || '') : res.body;
      if (isCaseNotFound(contentToCheck)) {
        const notFoundErr = new Error('CASE_NOT_FOUND');
        notFoundErr.code = 'CASE_NOT_FOUND';
        notFoundErr.status = 404;
        notFoundErr.message = `No case record was found for CNR: ${session.cnr}. Please verify the 16-character code.`;
        throw notFoundErr;
      }

      // 4. Parse Case HTML defensively
      const caseData = parseCaseDetails(contentToCheck, session.cnr);

      // Check if parsed data is completely empty (no status, no stage, and no filingNumber)
      if (!caseData.caseType && !caseData.filingNumber && !caseData.status && !caseData.stage && caseData.history.length === 0) {
        const notFoundErr = new Error('CASE_NOT_FOUND');
        notFoundErr.code = 'CASE_NOT_FOUND';
        notFoundErr.status = 404;
        notFoundErr.message = `No case record found for CNR: ${session.cnr}.`;
        throw notFoundErr;
      }

      // Session successfully consumed
      sessions.delete(sessionId);

      return caseData;
    } catch (err) {
      if (err.code === 'WRONG_CAPTCHA' || err.code === 'CASE_NOT_FOUND' || err.code === 'RATE_LIMITED' || err.code === 'SESSION_EXPIRED' || err.code === 'PORTAL_RATE_LIMITED' || err.code === 'PORTAL_SESSION_REJECTED' || err.code === 'PORTAL_SEARCH_REJECTED') {
        throw err;
      }

      const portalErr = new Error('PORTAL_UNAVAILABLE');
      portalErr.code = 'PORTAL_UNAVAILABLE';
      portalErr.status = 503;
      portalErr.message = 'Official eCourts portal returned an unexpected response. Please try again later.';
      throw portalErr;
    }
  }));
}

module.exports = {
  startSearch,
  refreshCaptcha,
  submitSearch,
  sessions,
  ipRequestLogs
};
