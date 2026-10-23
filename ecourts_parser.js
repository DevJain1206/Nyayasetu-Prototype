/**
 * NyayaSetu — eCourts CIS Response Parser
 * Defensive, resilient HTML parser for official eCourts district court portal responses.
 *
 * Supports:
 * - 2-column tables (Label | Value)
 * - 3-column tables (Label | : | Value)
 * - 4-column tables (Label1 | Value1 | Label2 | Value2) as seen in Katol/Nagpur & other district courts
 * - Flexible court headings (h3, center, card headers)
 * - Clean party & advocate parsing
 * - History table column-order detection
 */

const cheerio = require('cheerio');

/**
 * Clean text from HTML, removing extra spaces, newlines, and colons.
 */
function cleanText(text) {
  if (!text) return null;
  const cleaned = text
    .replace(/&nbsp;/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Determines whether the response indicates a wrong/invalid captcha or captcha verification failure.
 */
function isWrongCaptcha(response) {
  if (!response) return false;

  if (typeof response === 'object') {
    // If it is a portal WAF/session error (like Oops! Invalid Request), it is not a captcha mismatch
    if (isPortalError(response)) {
      return false;
    }
    // In eCourts, status === 0 from searchByCNR indicates captcha failure
    if (response.status === 0 || response.status === '0') {
      return true;
    }
    const msg = (response.errormsg || '').toLowerCase();
    if (msg.includes('captcha') || msg.includes('does not match')) {
      return true;
    }
  }

  if (typeof response === 'string') {
    const lower = response.toLowerCase();
    if (isPortalError(lower)) return false;
    if (lower.includes('invalid captcha') || lower.includes('captcha does not match') || lower.includes('wrong captcha')) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether eCourts returned a general portal/WAF/session error page
 * (e.g. "Oops! There is something wrong.....!!!, Invalid Request")
 */
function isPortalError(response) {
  if (!response) return false;
  const str = typeof response === 'string' ? response : JSON.stringify(response);
  const lower = str.toLowerCase();
  return lower.includes('oops!') ||
         lower.includes('invalid request') ||
         lower.includes('something wrong') ||
         lower.includes('try once again');
}

/**
 * Determines whether the response indicates that no case record was found.
 */
function isCaseNotFound(htmlOrText) {
  if (!htmlOrText) return true;
  const str = typeof htmlOrText === 'string' ? htmlOrText : JSON.stringify(htmlOrText);
  const lower = str.toLowerCase();

  const notFoundPatterns = [
    'this case code does not exists',
    'this case code does not exist',
    'record not found',
    'case does not exist',
    'case not found',
    'invalid cnr',
    'no record found'
  ];

  for (const pattern of notFoundPatterns) {
    if (lower.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to find key-value pairs inside standard eCourts table structures.
 * Supports:
 * - 2-column: [Label, Value]
 * - 3-column: [Label, ":", Value]
 * - 4-column: [Label1, Value1, Label2, Value2]
 */
function extractValueByLabel($, labelPattern) {
  let foundValue = null;

  $('tr').each((_, tr) => {
    if (foundValue) return;
    const cells = $(tr).children('td, th');
    
    for (let i = 0; i < cells.length; i++) {
      const cellText = $(cells[i]).text().trim().toLowerCase();
      if (labelPattern.test(cellText)) {
        // If next cell is colon ':'
        if (i + 2 < cells.length && $(cells[i + 1]).text().trim() === ':') {
          foundValue = $(cells[i + 2]).text();
          return false;
        } else if (i + 1 < cells.length) {
          const valText = $(cells[i + 1]).text();
          foundValue = valText.replace(/^[:\s-]+/, '');
          return false;
        }
      }
    }
  });

  return cleanText(foundValue);
}

/**
 * Extract court name and judge
 */
function extractCourtAndJudge($) {
  let judgeText = extractValueByLabel($, /court\s*(number|no)?\s*and\s*judge|presiding\s*judge|coram/i);
  
  // Also check for court heading at the top (e.g. <center><h3>Civil Judge Junior Division , Katol</h3></center>)
  let courtHeading = null;
  $('h1, h2, h3, h4, center, .court_header, strong').each((_, el) => {
    if (courtHeading) return;
    const txt = $(el).text().trim();
    if (txt.toLowerCase().includes('court') || txt.toLowerCase().includes('judge') || txt.toLowerCase().includes('division')) {
      if (txt.length > 5 && txt.length < 120 && !txt.toLowerCase().includes('case details') && !txt.toLowerCase().includes('case status')) {
        courtHeading = cleanText(txt);
      }
    }
  });

  if (judgeText && courtHeading && !judgeText.toLowerCase().includes(courtHeading.toLowerCase())) {
    return `${courtHeading} (${judgeText})`;
  }

  return judgeText || courtHeading || null;
}

/**
 * Extract party information (Petitioner / Respondent)
 */
function extractParty($, selector, labelPattern) {
  let partyText = null;

  // Try targeted section first
  if (selector && $(selector).length > 0) {
    const raw = $(selector).text();
    partyText = cleanText(raw);
  }

  // Fallback to table cell iteration
  if (!partyText) {
    $('tr').each((_, tr) => {
      if (partyText) return;
      const cells = $(tr).children('td, th');
      for (let i = 0; i < cells.length; i++) {
        const cellText = $(cells[i]).text().trim().toLowerCase();
        if (labelPattern.test(cellText)) {
          const contentCell = (i + 2 < cells.length && $(cells[i + 1]).text().trim() === ':')
            ? cells[i + 2]
            : (i + 1 < cells.length ? cells[i + 1] : null);
          if (contentCell) {
            partyText = cleanText($(contentCell).text().replace(/^[:\s-]+/, ''));
            return false;
          }
        }
      }
    });
  }

  return partyText;
}

/**
 * Extract Hearing History rows into normalized array
 */
function extractHistory($) {
  const history = [];

  // Try finding history table by class or header text
  let historyTable = $('table.history_table, table#history_table');

  if (historyTable.length === 0) {
    $('table').each((_, tbl) => {
      const headerText = $(tbl).text().toLowerCase();
      if (headerText.includes('hearing date') || (headerText.includes('business on date') && headerText.includes('purpose'))) {
        historyTable = $(tbl);
        return false;
      }
    });
  }

  if (historyTable.length > 0) {
    let dateIdx = -1;
    let purposeIdx = -1;
    let businessIdx = -1;

    const headers = historyTable.find('thead tr th, thead tr td, tr:first-child th, tr:first-child td');
    headers.each((idx, th) => {
      const hText = $(th).text().trim().toLowerCase();
      if (hText.includes('hearing date')) dateIdx = idx;
      else if (hText.includes('purpose')) purposeIdx = idx;
      else if (hText.includes('business on date') || hText.includes('business')) businessIdx = idx;
    });

    if (dateIdx === -1) dateIdx = 2;
    if (purposeIdx === -1) purposeIdx = 3;
    if (businessIdx === -1) businessIdx = 1;

    const rows = historyTable.find('tbody tr, tr').filter((i, tr) => {
      const txt = $(tr).text().toLowerCase();
      return !(txt.includes('hearing date') && txt.includes('purpose'));
    });

    rows.each((_, tr) => {
      const cells = $(tr).children('td');
      if (cells.length >= 2) {
        const dateVal = dateIdx < cells.length ? cleanText($(cells[dateIdx]).text()) : null;
        const purposeVal = purposeIdx < cells.length ? cleanText($(cells[purposeIdx]).text()) : null;
        const businessVal = businessIdx < cells.length ? cleanText($(cells[businessIdx]).text()) : null;

        if (dateVal || purposeVal || businessVal) {
          history.push({
            date: dateVal,
            purpose: purposeVal,
            businessOnDate: businessVal
          });
        }
      }
    });
  }

  return history;
}

/**
 * Main parse function
 * @param {string} html - HTML string (e.g. result.casetype_list)
 * @param {string} [inputCnr] - Optional fallback CNR if missing in HTML
 * @returns {object} Normalized case details
 */
function parseCaseDetails(html, inputCnr = null) {
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    throw new Error('EMPTY_HTML_RESPONSE');
  }

  const $ = cheerio.load(html);

  // 1. CNR Number
  let parsedCnr = extractValueByLabel($, /cnr\s*(number|no)?/i);
  if (parsedCnr) {
    // Strip parenthetical notes like "(Note the CNR number for future reference)"
    parsedCnr = cleanText(parsedCnr.replace(/\(.*?\)/g, '').replace(/view qr code.*$/i, ''));
  }
  const cnr = parsedCnr || (inputCnr ? inputCnr.trim().toUpperCase() : null);

  // 2. Case Type
  const caseType = extractValueByLabel($, /case\s*type/i);

  // 3. Filing Details
  const filingNumber = extractValueByLabel($, /filing\s*(number|no)/i);
  const filingDate = extractValueByLabel($, /filing\s*date/i);

  // 4. Registration Details
  const registrationNumber = extractValueByLabel($, /registration\s*(number|no)/i);
  const registrationDate = extractValueByLabel($, /registration\s*date/i);

  // 5. Case Stage
  const stage = extractValueByLabel($, /case\s*stage|stage\s*of\s*case/i);

  // 6. Case Status & Disposal
  let status = extractValueByLabel($, /nature\s*of\s*disposal|case\s*status|^status/i);
  if (!status) {
    const statusSpan = $('.case_status_table .badge, #case_status .badge');
    if (statusSpan.length > 0) status = cleanText(statusSpan.first().text());
  }
  if (!status && stage) {
    if (stage.toLowerCase().includes('order') || stage.toLowerCase().includes('disposed') || stage.toLowerCase().includes('dismissal')) {
      status = 'Disposed';
    } else {
      status = 'Pending';
    }
  }

  // 7. Next Hearing Date
  const nextHearingDate = extractValueByLabel($, /next\s*hearing\s*date/i);

  // 8. Court and Presiding Judge
  const courtAndJudge = extractCourtAndJudge($);

  // 9. Parties
  const petitioner = extractParty($, '.Petitioner_Advocate_table', /petitioner/i);
  const respondent = extractParty($, '.Respondent_Advocate_table', /respondent/i);

  // 10. Hearing History
  const history = extractHistory($);

  return {
    cnr,
    caseType,
    filingNumber,
    filingDate,
    registrationNumber,
    registrationDate,
    status,
    nextHearingDate,
    stage,
    courtAndJudge,
    petitioner,
    respondent,
    history
  };
}

module.exports = {
  cleanText,
  isWrongCaptcha,
  isPortalError,
  isCaseNotFound,
  parseCaseDetails
};
