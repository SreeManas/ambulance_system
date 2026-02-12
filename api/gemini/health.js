/**
 * health.js — Gemini Health Check Serverless Endpoint
 * 
 * GET /api/gemini/health
 */

const GEMINI_MODEL = 'gemini-2.5-flash';

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const configured = Boolean(process.env.GEMINI_API_KEY);

    return res.status(200).json({
        status: 'ok',
        model: GEMINI_MODEL,
        configured,
        timestamp: new Date().toISOString(),
        serverless: true
    });
}
