/**
 * NyayaSetu — Comprehensive AI & Voice Gateway Test Suite
 * 1. Statutory Legal Analysis (/api/ai/analyze)
 * 2. Bhashini Indic Voice Assistant (/api/ai/voice)
 * 3. Bhashini Indic Voice Detection & STT (/api/ai/voice-detect)
 * 4. Bhashini Indic Speech Synthesis (/api/ai/tts)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

// Generate 1-second 16kHz mono WAV file for testing voice detect
function createWav() {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

async function testAllAI() {
  console.log('=== Running NyayaSetu AI & Voice Gateway Test Suite ===\n');

  // Test 1: /api/ai/analyze (Statutory Legal Analysis)
  console.log('Test 1: Testing /api/ai/analyze with Cheque Dishonour grievance...');
  const resAnalyze = await fetch('http://localhost:3000/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'A cheque of Rs 50,000 bounced due to insufficient funds.' })
  });

  assert.strictEqual(resAnalyze.status, 200, 'Should return HTTP 200 from /api/ai/analyze');
  const dataAnalyze = await resAnalyze.json();
  assert.ok(dataAnalyze.act, 'Response should contain primary governing Act');
  assert.ok(dataAnalyze.title, 'Response should contain formal legal title');
  assert.ok(Array.isArray(dataAnalyze.sections) && dataAnalyze.sections.length > 0, 'Sections must be a non-empty array');
  assert.ok(dataAnalyze.limitation, 'Limitation period must be provided');
  assert.ok(dataAnalyze.court, 'Competent court must be provided');
  console.log('✔ [PASS] /api/ai/analyze returned authentic statutory classification: ' + dataAnalyze.act);

  // Test 2: /api/ai/voice (Bhashini Indic Multilingual Voice)
  console.log('\nTest 2: Testing /api/ai/voice with Bhashini Hindi query...');
  const resVoice = await fetch('http://localhost:3000/api/ai/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'उपभोक्ता फोरम में शिकायत कैसे करें?', lang: 'hi-IN' })
  });

  assert.strictEqual(resVoice.status, 200, 'Should return HTTP 200 from /api/ai/voice');
  const dataVoice = await resVoice.json();
  const reply = dataVoice.reply || dataVoice.text;
  assert.ok(reply && reply.length > 10, 'Voice response should contain substantive legal response');
  console.log('✔ [PASS] /api/ai/voice returned concise Hindi statutory response: ' + reply.substring(0, 70) + '...');

  // Test 3: /api/ai/voice-detect (Sarvam AI Saaras:v4 Speech-to-Text)
  console.log('\nTest 3: Testing /api/ai/voice-detect with audio buffer...');
  const wav = createWav();
  const resDetect = await fetch('http://localhost:3000/api/ai/voice-detect?lang=unknown', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav
  });

  assert.strictEqual(resDetect.status, 200, 'Should return HTTP 200 from /api/ai/voice-detect');
  const dataDetect = await resDetect.json();
  assert.ok('transcript' in dataDetect, 'Response should have transcript field');
  assert.ok('language_code' in dataDetect, 'Response should have language_code field');
  console.log('✔ [PASS] /api/ai/voice-detect processed audio stream (Request ID: ' + dataDetect.request_id + ')');

  // Test 4: /api/ai/tts (Sarvam AI Bulbul:v3 Indic Voice Synthesis)
  console.log('\nTest 4: Testing /api/ai/tts with Hindi phrase...');
  const resTts = await fetch('http://localhost:3000/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'न्यायसेतु विधिक साक्षरता केंद्र', lang: 'hi-IN' })
  });

  assert.strictEqual(resTts.status, 200, 'Should return HTTP 200 from /api/ai/tts');
  const dataTts = await resTts.json();
  assert.ok(dataTts.audio && dataTts.audio.length > 1000, 'Response should contain Base64 audio payload');
  console.log('✔ [PASS] /api/ai/tts generated ' + dataTts.audio.length + ' bytes of base64 Indic voice audio (Speaker: ' + dataTts.speaker + ')');

  console.log('\nAll 4 AI & Voice Gateway Tests Passed Successfully (4/4)!\n');
}

testAllAI().catch(err => {
  console.error('❌ AI Test Failed:', err);
  process.exit(1);
});
