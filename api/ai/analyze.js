/**
 * NyayaSetu — Statutory Legal Analysis API (Google Gemini 2.5 Flash)
 * Strictly refers to the Constitution of India and statutory Indian enactments.
 */

const GEMINI_KEY = process.env.GEMINI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function handleAnalyze(req, res) {
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

      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Legal query is required.' }));
        return;
      }

      const prompt = `STRICT STATUTORY INSTRUCTION:
You must strictly and exclusively refer to the Constitution of India, statutory Indian legislations (including Bharatiya Nyaya Sanhita 2023 / Indian Penal Code, Bharatiya Nagarik Suraksha Sanhita 2023 / Code of Criminal Procedure, Bharatiya Sakshya Adhiniyam 2023 / Indian Evidence Act, Code of Civil Procedure 1908, Negotiable Instruments Act 1881, Consumer Protection Act 2019, Transfer of Property Act 1882, Right to Information Act 2005, and applicable Central and State Statutes), and established Supreme Court of India precedents.
Do NOT invent, hallucinate, or assume any facts or legal provisions. Nothing from generic AI speculation. Every act, section, limitation period, and procedural forum must be authentic and verifiable under Indian law.

Citizen Legal Grievance:
"${query}"

Return ONLY a valid JSON object (without markdown code blocks, backticks, or other text) with the following exact keys:
{
  "act": "Primary governing Indian Act(s) (e.g. Negotiable Instruments Act, 1881 / Consumer Protection Act, 2019 / Transfer of Property Act, 1882 / Bharatiya Nyaya Sanhita, 2023)",
  "title": "Formal statutory legal title of the matter",
  "summary": "Concise factual statutory explanation of the citizen legal position under Indian law",
  "sections": ["Section X (Authentic description)", "Section Y (Authentic description)"],
  "constitution": ["Relevant Article of the Constitution of India (e.g. Article 14, 19(1)(g), 21, 300A)"],
  "limitation": "Exact statutory limitation period under the Limitation Act, 1963 or governing statute",
  "court": "Competent court, tribunal, forum or authority having territorial and pecuniary jurisdiction",
  "remedies": ["Statutory action step 1", "Statutory action step 2", "Statutory action step 3"],
  "docType": "one of: sec138, rti, consumer, eviction, affidavit",
  "sender": "Suggested applicant/sender name or role",
  "recipient": "Suggested opposite party name or authority",
  "particulars": "Key transaction, property, or dispute particulars",
  "grievance": "Concise factual grievance statement for drafting statutory notice"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are an authoritative Indian legal compliance analyst. Strictly refer to the Constitution of India and codified Indian statutory acts. Return only valid JSON.'
            }]
          },
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Statutory AI Engine error', details: errText }));
        return;
      }

      const geminiData = await geminiRes.json();
      let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const analysis = JSON.parse(rawText);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(analysis));
    } catch (err) {
      console.error('[API /api/ai/analyze error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal AI analysis error' }));
    }
  });
}

module.exports = handleAnalyze;
