/**
 * NyayaSetu — Bhashini Indic Voice Detection & Speech-to-Text API
 * Powered by Sarvam AI Saaras:v4 Indic Speech-to-Text Model
 */

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_KEY = process.env.SARVAM_KEY || 'sk_lin1rbw1_M6FBDUkcZJ9hSgNfvp3Aftl2';

async function handleVoiceDetect(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const audioBuffer = Buffer.concat(chunks);

      if (!audioBuffer || audioBuffer.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Audio data is required.' }));
        return;
      }

      // Check language query parameter or header if provided
      const url = new URL(req.url, 'http://localhost');
      const langCode = url.searchParams.get('lang') || 'unknown';

      // Determine content type from request header and strip parameters (e.g. codecs=opus)
      let cleanType = (req.headers['content-type'] || 'audio/wav').split(';')[0].trim().toLowerCase();
      if (!cleanType || cleanType === 'application/octet-stream') {
        cleanType = 'audio/wav';
      }
      const ext = cleanType.includes('webm') ? 'webm' : (cleanType.includes('ogg') ? 'ogg' : 'wav');

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: cleanType }), `voice_input.${ext}`);
      formData.append('model', 'saaras:v4');
      formData.append('language_code', langCode);

      const sarvamRes = await fetch(SARVAM_STT_URL, {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_KEY
        },
        body: formData
      });

      if (!sarvamRes.ok) {
        const errText = await sarvamRes.text();
        console.error('[Sarvam Voice Detect Error]:', sarvamRes.status, errText);
        res.writeHead(sarvamRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Voice detection failed', details: errText }));
        return;
      }

      const data = await sarvamRes.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        transcript: data.transcript || '',
        language_code: data.language_code || 'unknown',
        request_id: data.request_id || ''
      }));
    } catch (err) {
      console.error('[API /api/ai/voice-detect error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal voice detection error' }));
    }
  });
}

module.exports = handleVoiceDetect;
