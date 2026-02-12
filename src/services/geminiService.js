/**
 * geminiService.js — Frontend API client for the Gemini AI Copilot
 * 
 * Calls Vercel serverless endpoints at /api/gemini to keep API key secure.
 */

const GEMINI_API_BASE = '/api/gemini';

/**
 * Send a chat message to the Gemini copilot.
 * @param {Object} params
 * @param {string} params.message - User message
 * @param {string} params.role - User role (paramedic, dispatcher, etc.)
 * @param {Object} [params.contextIds] - Optional {caseId, hospitalId}
 * @param {string} [params.sessionId] - Optional session identifier
 * @returns {Promise<{success: boolean, reply: string, suggestedFollowups: string[], contextUsed: Object}>}
 */
export async function sendChatMessage({ message, role, contextIds, sessionId }) {
    try {
        const res = await fetch(`${GEMINI_API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                role: role || 'paramedic',
                contextIds: contextIds || {},
                sessionId: sessionId || null
            })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error('Gemini chat error:', err);
        return {
            success: false,
            reply: `⚠️ Unable to reach AI Copilot: ${err.message}`,
            suggestedFollowups: [],
            contextUsed: {}
        };
    }
}

/**
 * Get suggested prompts for a role.
 * @param {string} role
 * @param {Object} contextIds
 * @returns {Promise<string[]>}
 */
export async function fetchSuggestedPrompts(role, contextIds = {}) {
    try {
        const params = new URLSearchParams({ role });
        if (contextIds.caseId) params.set('caseId', contextIds.caseId);
        if (contextIds.hospitalId) params.set('hospitalId', contextIds.hospitalId);

        const res = await fetch(`${GEMINI_API_BASE}/suggestions?${params}`);
        if (!res.ok) return [];

        const data = await res.json();
        return data.prompts || [];
    } catch {
        return [];
    }
}

/**
 * Check if the Gemini server is healthy.
 * @returns {Promise<boolean>}
 */
export async function checkGeminiHealth() {
    try {
        const res = await fetch(`${GEMINI_API_BASE}/health`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.status === 'ok' && data.configured;
    } catch {
        return false;
    }
}
