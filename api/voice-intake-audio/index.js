/**
 * /api/voice-intake-audio/index.js
 *
 * Accepts: { audio: "<base64>", mimeType: "audio/webm" | "audio/ogg" | ... }
 * Uses Gemini 2.5 Flash multimodal to:
 *   1. Transcribe the audio
 *   2. Extract structured clinical fields in ONE call
 * Returns: { success, transcript, extractedData, confidenceScore, missingCriticalFields }
 */

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_SCHEMA = `{
  "transcript": "string — verbatim transcription of the audio",
  "patientName": "string or null",
  "age": "number or null",
  "gender": "male|female|other or null",
  "heartRate": "number or null",
  "systolicBP": "number or null",
  "diastolicBP": "number or null",
  "spo2": "number or null",
  "respiratoryRate": "number or null",
  "temperature": "number or null",
  "consciousnessLevel": "alert|voice|pain|unresponsive or null",
  "traumaIndicators": "string or null",
  "symptoms": "string or null",
  "emergencyType": "string or null",
  "locationDescription": "string or null",
  "confidenceScore": "number 0.0-1.0",
  "missingCriticalFields": ["array of string field names that are clinically important but absent"]
}`;

const SYSTEM_PROMPT = `You are a clinical data extraction AI assistant for emergency medical services.

Listen to the provided audio recording of a paramedic's verbal patient report.

Your task:
1. Transcribe the audio EXACTLY (verbatim, no corrections).
2. Extract the structured clinical data from the transcription.
3. Return ONLY a single JSON object — no markdown, no explanation, no extra text.

JSON schema to return:
${JSON_SCHEMA}

Rules:
- Set fields to null if not mentioned or unclear.
- confidenceScore: 1.0 = all critical fields present and clear, 0.0 = almost nothing captured.
- missingCriticalFields: list fields that are clinically critical but absent (heartRate, spo2, consciousnessLevel, emergencyType).
- Do NOT invent or hallucinate values. Only extract what is clearly stated.`;

// Simple in-memory rate limit: 20 requests per minute per IP
const rateLimitMap = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, reset: now + 60_000 };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
    entry.count++;
    rateLimitMap.set(ip, entry);
    return entry.count <= 20;
}

function validateExtracted(data) {
    const required = ['transcript', 'confidenceScore', 'missingCriticalFields'];
    return required.every(k => k in data);
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).set(CORS_HEADERS).end();
    }
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded. Please wait.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    const { audio, mimeType } = req.body || {};
    if (!audio || typeof audio !== 'string') {
        return res.status(400).json({ success: false, error: 'Missing audio data' });
    }

    // Rough size guard: base64 of 120s audio at 16kbps ≈ 240kB base64 ≈ 320k chars
    if (audio.length > 500_000) {
        return res.status(400).json({ success: false, error: 'Audio too large (max ~60s)' });
    }

    const resolvedMime = mimeType || 'audio/webm';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s for audio

    try {
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: SYSTEM_PROMPT },
                        {
                            inlineData: {
                                mimeType: resolvedMime,
                                data: audio,
                            }
                        }
                    ],
                }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                    maxOutputTokens: 1024,
                },
            }),
        });
        clearTimeout(timeout);

        if (!geminiRes.ok) {
            const errText = await geminiRes.text().catch(() => '');
            console.error('Gemini error:', geminiRes.status, errText);
            return res.status(502).json({ success: false, error: 'AI service error. Please try again.' });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        let parsed;
        try {
            parsed = JSON.parse(rawText.trim());
        } catch {
            // Try to extract JSON from response if extra text present
            const match = rawText.match(/\{[\s\S]*\}/);
            if (!match) {
                return res.status(502).json({ success: false, error: 'AI returned invalid response. Try again.' });
            }
            parsed = JSON.parse(match[0]);
        }

        if (!validateExtracted(parsed)) {
            return res.status(502).json({ success: false, error: 'AI response missing required fields.' });
        }

        // Separate transcript from extractedData
        const { transcript, confidenceScore, missingCriticalFields, ...extractedData } = parsed;

        return res.status(200).json({
            success: true,
            transcript: transcript || '',
            extractedData,
            confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : 0.5,
            missingCriticalFields: Array.isArray(missingCriticalFields) ? missingCriticalFields : [],
        });

    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            return res.status(504).json({ success: false, error: 'Audio processing timed out. Try a shorter recording.' });
        }
        console.error('voice-intake-audio error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
