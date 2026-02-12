/**
 * suggestions.js — Suggested Prompts Serverless Endpoint
 * 
 * GET /api/gemini/suggestions
 */

import { getSuggestedPrompts } from '../utils/suggestedPrompts.js';

const VALID_ROLES = ['paramedic', 'hospital_admin', 'command_center', 'dispatcher', 'admin'];

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

    const role = VALID_ROLES.includes(req.query.role) ? req.query.role : 'paramedic';
    const contextIds = {
        caseId: req.query.caseId || null,
        hospitalId: req.query.hospitalId || null
    };

    const prompts = getSuggestedPrompts(role, contextIds);

    return res.status(200).json({
        success: true,
        prompts
    });
}
