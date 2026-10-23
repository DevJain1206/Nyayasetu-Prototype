/**
 * NyayaSetu — Development & Production Node.js Server
 * Serves portal static assets and routes DigiLocker OAuth 2.0 API calls
 * using the same handlers executed on Vercel Serverless Functions.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

// Import shared DigiLocker API handlers
const handleConfig = require('./api/digilocker/config');
const handleAuthorizeUrl = require('./api/digilocker/authorize-url');
const handleToken = require('./api/digilocker/token');

// Import eCourts Search API handlers
const handleSearchStart = require('./api/search/start');
const handleRefreshCaptcha = require('./api/search/refresh-captcha');
const handleSubmitSearch = require('./api/search/submit');

// Import Statutory Legal Engine & Voice API handlers
const handleAnalyze = require('./api/ai/analyze');
const handleVoice = require('./api/ai/voice');
const handleLawyerResearch = require('./api/ai/lawyer-research');
const handleVoiceDetect = require('./api/ai/voice-detect');
const handleTts = require('./api/ai/tts');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=UTF-8',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;

  // Populate req.query object (mimicking Vercel's serverless environment)
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: /api/digilocker/config
  if (pathname === '/api/digilocker/config') {
    return handleConfig(req, res);
  }

  // API 2: /api/digilocker/authorize-url
  if (pathname === '/api/digilocker/authorize-url') {
    return handleAuthorizeUrl(req, res);
  }

  // API 3: /api/digilocker/token
  if (pathname === '/api/digilocker/token') {
    return handleToken(req, res);
  }

  // eCourts Search API 1: /api/search/start
  if (pathname === '/api/search/start') {
    return handleSearchStart(req, res);
  }

  // eCourts Search API 2: /api/search/refresh-captcha
  if (pathname === '/api/search/refresh-captcha') {
    return handleRefreshCaptcha(req, res);
  }

  // eCourts Search API 3: /api/search/submit
  if (pathname === '/api/search/submit') {
    return handleSubmitSearch(req, res);
  }

  // Statutory AI API 1: /api/ai/analyze
  if (pathname === '/api/ai/analyze') {
    return handleAnalyze(req, res);
  }

  // Advocate research API: separate Gemini credential and Google Search grounding
  if (pathname === '/api/ai/lawyer-research') {
    return handleLawyerResearch(req, res);
  }

  // Statutory AI API 2: /api/ai/voice
  if (pathname === '/api/ai/voice') {
    return handleVoice(req, res);
  }

  // Indic Voice Detection (Speech-to-Text): /api/ai/voice-detect
  if (pathname === '/api/ai/voice-detect') {
    return handleVoiceDetect(req, res);
  }

  // Indic Voice Synthesis (Text-to-Speech): /api/ai/tts
  if (pathname === '/api/ai/tts') {
    return handleTts(req, res);
  }

  // Static File Serving
  let relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.replace(/^\//, ''));
  let filePath = path.join(__dirname, relativePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Fallback to index.html if file doesn't exist
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[NyayaSetu] Server running at http://localhost:${PORT}`);
  console.log(`[DigiLocker] OAuth 2.0 Local Callback: http://localhost:${PORT}/callback.html`);
  console.log(`[eCourts] Real-time CNR Search active under /api/search/*`);
  console.log(`[Vercel Ready] Serverless API routes active under /api/digilocker/* and /api/search/*`);
});
