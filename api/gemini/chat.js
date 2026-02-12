/**
 * chat.js — Gemini 2.5 Flash AI Copilot Serverless Endpoint
 * 
 * Vercel serveless function that handles chat requests to Gemini API.
 * Replaces Express server at server/geminiChat.js
 * 
 * POST /api/gemini/chat
 */

import { SYSTEM_PROMPTS, getExplainabilityInstruction } from '../utils/prompts.js';
import { getSuggestedPrompts } from '../utils/suggestedPrompts.js';

// Constants
const GEMINI_MODEL = 'gemini-2.5-flash';
const VALID_ROLES = ['paramedic', 'hospital_admin', 'command_center', 'dispatcher', 'admin'];

// In-memory conversation history (serverless — will reset per cold start)
// For production, consider Vercel KV or Firestore
const conversationHistory = new Map();
const MAX_HISTORY = 20;
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function getSessionHistory(sessionId) {
    const entry = conversationHistory.get(sessionId);
    if (!entry || Date.now() > entry.expiresAt) return [];
    return entry.messages;
}

function addToHistory(sessionId, role, text) {
    let entry = conversationHistory.get(sessionId);
    if (!entry || Date.now() > entry.expiresAt) {
        entry = { messages: [], expiresAt: Date.now() + SESSION_TTL };
    }
    entry.messages.push({ role, parts: [{ text }] });
    if (entry.messages.length > MAX_HISTORY) {
        entry.messages = entry.messages.slice(-MAX_HISTORY);
    }
    entry.expiresAt = Date.now() + SESSION_TTL;
    conversationHistory.set(sessionId, entry);
}

/**
 * Build minimal context (stateless for MVP — no Firestore)
 * For full context, integrate Firebase Admin here
 */
function buildSimpleContext(role, contextIds = {}) {
    return {
        role,
        data: {
            caseId: contextIds.caseId || null,
            hospitalId: contextIds.hospitalId || null,
            // Add more context from Firestore in future
        }
    };
}

export default async function handler(req, res) {
    // CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Parse body if needed (Vercel sends it as Buffer/string)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid JSON in request body'
                });
            }
        }

        const { message, role, contextIds, sessionId } = body;

        // Validate inputs
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string'
            });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key not configured'
            });
        }

        // Validate role
        const userRole = VALID_ROLES.includes(role) ? role : 'paramedic';

        // Build context (stateless for MVP)
        const roleContext = buildSimpleContext(userRole, contextIds || {});

        // Build system prompt
        const systemPrompt = SYSTEM_PROMPTS[userRole] || SYSTEM_PROMPTS.paramedic;
        const explainability = getExplainabilityInstruction();

        const contextJson = JSON.stringify(roleContext.data, null, 2);
        const fullSystemPrompt = `${systemPrompt}${explainability}

CURRENT CONTEXT DATA:
\`\`\`json
${contextJson}
\`\`\`

Use the above context data to provide accurate, data-driven responses. If the context is empty or incomplete, acknowledge it and provide general EMS guidance.`;

        // Build conversation for Gemini
        const sid = sessionId || `vercel-${userRole}-${Date.now()}`;
        const history = getSessionHistory(sid);

        const contents = [
            // System instruction
            { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTION]\n${fullSystemPrompt}` }] },
            { role: 'model', parts: [{ text: 'Understood. I am ready to assist as your EMS AI Copilot. How can I help?' }] },
            // Past conversation
            ...history,
            // Current message
            { role: 'user', parts: [{ text: message.trim() }] }
        ];

        // Call Gemini API
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error(`Gemini API error (${geminiResponse.status}):`, errorText);
            return res.status(502).json({
                success: false,
                error: `Gemini API returned ${geminiResponse.status}`,
                fallback: '⚠️ AI Copilot temporarily unavailable. Please try again or consult standard EMS protocols.'
            });
        }

        const geminiData = await geminiResponse.json();

        // Extract response
        const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
            || 'I apologize, but I was unable to generate a response. Please try again.';

        // Store in history
        addToHistory(sid, 'user', message.trim());
        addToHistory(sid, 'model', replyText);

        // Get suggested follow-ups
        const suggestedPrompts = getSuggestedPrompts(userRole, contextIds || {});

        return res.status(200).json({
            success: true,
            reply: replyText,
            suggestedFollowups: suggestedPrompts.slice(0, 4),
            contextUsed: {
                role: userRole,
                hasCase: Boolean(roleContext.data.caseId),
                hasHospital: Boolean(roleContext.data.hospitalId),
                dataAvailable: Object.keys(roleContext.data).filter(k => roleContext.data[k]).length > 0
            }
        });

    } catch (err) {
        console.error('Chat endpoint error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            fallback: '⚠️ Unable to reach AI Copilot. Showing general EMS guidance: Follow standard protocols and contact medical control if needed.'
        });
    }
}
