/**
 * /api/voice-intake/index.js — Voice-to-Intake AI Structured Extraction
 *
 * POST /api/voice-intake
 * Receives paramedic speech transcript, returns structured clinical fields.
 * Uses Gemini 2.5 Flash with temperature 0.1 for deterministic extraction.
 * Returns JSON-only — rejects free text and malformed output.
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_TRANSCRIPT_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 10_000;

// ─── In-memory rate limit ──────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return true;
    rateLimitMap.set(ip, entry);
    return false;
}

// ─── Sanitize transcript ───────────────────────────────────────────────────
function sanitizeTranscript(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/[`\\]/g, '')          // strip backticks and backslashes
        .replace(/\s+/g, ' ')           // collapse whitespace
        .trim()
        .slice(0, MAX_TRANSCRIPT_LENGTH);
}

// ─── Validate extracted response schema ───────────────────────────────────
function validateExtracted(obj) {
    if (typeof obj !== 'object' || obj === null) return false;
    if (!('extractedData' in obj)) return false;
    if (typeof obj.confidenceScore !== 'number') return false;
    if (!Array.isArray(obj.missingCriticalFields)) return false;
    return true;
}

// ─── System prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical AI extraction engine for an emergency medical services platform.
Your sole function is to parse paramedic speech transcripts and extract structured patient data.

RULES:
1. Output ONLY valid JSON. No prose, no markdown, no code fences.
2. If a field is not mentioned, use null.
3. Do not infer values not explicitly mentioned.
4. confidenceScore is your 0–1 confidence in the overall extraction quality.
5. missingCriticalFields lists field keys from extractedData that are null but critical for triage.

  OUTPUT SCHEMA (exactly this structure, no extra keys):
{
  "extractedData": {
    "patientName": string | null,
    "age": number | null,
    "gender": "male" | "female" | "other" | null,
    "heartRate": number | null,
    "systolicBP": number | null,
    "diastolicBP": number | null,
    "spo2": number | null,
    "respiratoryRate": number | null,
    "temperature": number | null,
    "consciousnessLevel": "alert" | "voice" | "pain" | "unresponsive" | null,
    "burnsPercentage": number (0-100, body surface area burned) | null,
    "bleedingSeverity": "none" | "mild" | "severe" | null,
    "traumaIndicators": string | null,
    "symptoms": string | null,
    "emergencyType": "cardiac" | "trauma" | "respiratory" | "neurological" | "obstetric" | "medical" | "burns" | "toxicological" | null,
    "locationDescription": string | null
  },
  "confidenceScore": number,
  "missingCriticalFields": string[]
}

For burnsPercentage: extract from phrases like '25% burns', 'burns coverage 30%', 'thirty percent body surface area'.
For bleedingSeverity: 'heavy/uncontrolled/massive' → 'severe', 'minor/slight/controlled' → 'mild', 'no bleeding' → 'none'.
Critical fields for triage: ["age", "heartRate", "spo2", "consciousnessLevel", "emergencyType"]`;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
    }

    const { transcript } = req.body || {};
    if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ success: false, error: 'transcript is required' });
    }

    const clean = sanitizeTranscript(transcript);
    if (clean.length < 5) {
        return res.status(400).json({ success: false, error: 'Transcript too short' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: `Extract clinical data from this paramedic transcript:\n\n"${clean}"` }] }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
        },
    };

    let result;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('Gemini API error:', response.status, errText);
            return res.status(502).json({ success: false, error: 'Gemini API error', details: response.status });
        }

        const geminiResponse = await response.json();
        const rawText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            return res.status(502).json({ success: false, error: 'Empty Gemini response' });
        }

        try {
            result = JSON.parse(rawText);
        } catch {
            // Strip any accidental markdown fences
            const stripped = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            try {
                result = JSON.parse(stripped);
            } catch {
                return res.status(502).json({ success: false, error: 'Gemini returned malformed JSON', raw: rawText.slice(0, 200) });
            }
        }

        if (!validateExtracted(result)) {
            return res.status(502).json({ success: false, error: 'Gemini response failed schema validation', raw: rawText.slice(0, 200) });
        }

    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ success: false, error: 'Request timed out after 10 seconds' });
        }
        console.error('Voice intake request error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    return res.status(200).json({ success: true, ...result });
}
