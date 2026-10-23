/**
 * NyayaSetu — Bhashini Indic Voice Assistant (Google Gemini 2.5 Flash)
 * Strictly refers to the Constitution of India and Indian statutory law.
 */

const GEMINI_KEY = process.env.GEMINI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function handleVoice(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const query = (parsed.query || '').trim();
      const lang = (parsed.lang || 'Hindi').trim();

      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Voice/text query is required.' }));
        return;
      }

      const prompt = `STRICT STATUTORY INSTRUCTION:
You must strictly and exclusively refer to the Constitution of India, statutory Indian legislations (including Bharatiya Nyaya Sanhita 2023 / Indian Penal Code, Bharatiya Nagarik Suraksha Sanhita 2023 / Code of Criminal Procedure, Bharatiya Sakshya Adhiniyam 2023 / Indian Evidence Act, Code of Civil Procedure 1908, Negotiable Instruments Act 1881, Consumer Protection Act 2019, Transfer of Property Act 1882, Right to Information Act 2005, and applicable Central/State Acts), and established Supreme Court of India precedents.
Do NOT give generic AI advice or hallucinated provisions. State only verifiable Indian statutory law.

Citizen Query: "${query}"

Respond in ${lang} language concisely (maximum 2-3 short sentences). Clearly mention the applicable Indian statutory section, legal remedy, or court/forum.`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are an authoritative Indian legal compliance assistant. Strictly refer to the Constitution of India and codified Indian statutory acts.'
            }]
          },
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1
          }
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Statutory Voice Engine error', details: errText }));
        return;
      }

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from statutory engine.';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply: text, text }));
    } catch (err) {
      console.error('[API /api/ai/voice error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal voice AI error' }));
    }
  });
}

module.exports = handleVoice;
