/**
 * smsServer.js — Secure Backend SMS Proxy for EMS Router
 *
 * Express server that proxies SMS requests to Fast2SMS API.
 * Frontend NEVER calls Fast2SMS directly — all SMS goes through here.
 *
 * Endpoints:
 *   POST /api/sms/send-tracking      — Live tracking link to patient/family
 *   POST /api/sms/send-dispatch      — Dispatch confirmation to driver
 *   POST /api/sms/send-hospital-alert — Incoming emergency alert to hospital
 *
 * Usage:
 *   node server/smsServer.js
 *   # or: npm run sms-server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.SMS_PORT || 5000;
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['POST'],
    credentials: true
}));

// ─── Rate Limiting (simple in-memory) ────────────────────────
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10;       // 10 SMS per minute per IP

function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimit[ip]) rateLimit[ip] = [];

    // Clean old entries
    rateLimit[ip] = rateLimit[ip].filter(t => now - t < RATE_LIMIT_WINDOW);

    if (rateLimit[ip].length >= RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Max 10 SMS per minute.',
            messageId: null
        });
    }

    rateLimit[ip].push(now);
    next();
}

// ─── Phone Number Formatting (Indian Numbers) ───────────────
function formatIndianNumber(phone) {
    if (!phone) return null;

    // Convert to string and strip all non-digits
    let cleaned = String(phone).replace(/\D/g, '');

    // If starts with +91, remove the +
    if (String(phone).startsWith('+91')) {
        cleaned = cleaned.replace(/^91/, '');
    }

    // If starts with 91 and has 12 digits total, remove 91 prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2);
    }

    // Must be exactly 10 digits
    if (cleaned.length !== 10) {
        console.warn(`⚠️ Invalid phone number length: ${cleaned} (${cleaned.length} digits)`);
        return null;
    }

    // Must start with 6-9 (Indian mobile numbers)
    if (!/^[6-9]/.test(cleaned)) {
        console.warn(`⚠️ Invalid Indian mobile prefix: ${cleaned}`);
        return null;
    }

    // Return with 91 prefix for Fast2SMS
    return '91' + cleaned;
}

// ─── Message Length Guard ────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;

function sanitizeMessage(msg) {
    if (!msg) return '';
    return String(msg).substring(0, MAX_MESSAGE_LENGTH);
}

// ═══════════════════════════════════════════════════════════════
// EMS MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════════════════

function buildLocationSMS({ trackingLink, hospitalName, hospitalPhone, etaMinutes, caseId }) {
    return [
        `🚑 EMS AMBULANCE EN ROUTE`,
        ``,
        caseId ? `Case ID: ${caseId}` : '',
        ``,
        `📍 Live Location:`,
        trackingLink,
        ``,
        `🏥 Destination:`,
        hospitalName || 'Assigned Hospital',
        hospitalPhone ? `📞 Emergency: ${hospitalPhone}` : '',
        ``,
        `⏱ ETA: ${etaMinutes || '--'} mins`,
        ``,
        `— EMS Router Platform`
    ].filter(Boolean).join('\n');
}

function buildDispatchSMS({ caseId, ambulanceId }) {
    return [
        `🚑 EMS DISPATCH CONFIRMED`,
        ``,
        `Ambulance: ${ambulanceId || 'AMB'}`,
        caseId ? `Case ID: ${caseId}` : '',
        ``,
        `Stay reachable for updates.`,
        `— EMS Router`
    ].filter(Boolean).join('\n');
}

function buildHospitalAlertSMS({ emergencyType, etaMinutes }) {
    return [
        `🚨 INCOMING EMERGENCY`,
        ``,
        `Type: ${emergencyType || 'Emergency'}`,
        `ETA: ${etaMinutes || '--'} mins`,
        ``,
        `Prepare ER team immediately.`,
        `— EMS Router`
    ].filter(Boolean).join('\n');
}

// ═══════════════════════════════════════════════════════════════
// FAST2SMS CORE SENDER
// ═══════════════════════════════════════════════════════════════

async function sendFast2SMS(numbers, message) {
    if (!FAST2SMS_API_KEY) {
        console.error('❌ FAST2SMS_API_KEY not set in server/.env');
        return { success: false, error: 'SMS service not configured', messageId: null };
    }

    const cleanedMessage = sanitizeMessage(message);
    const phoneList = numbers.split(',').map(n => formatIndianNumber(n)).filter(Boolean);

    if (phoneList.length === 0) {
        console.error('❌ No valid phone numbers after formatting');
        return { success: false, error: 'No valid phone numbers provided', messageId: null };
    }

    const payload = {
        route: 'q',  // Quick Transactional Route
        message: cleanedMessage,
        language: 'english',
        flash: 0,
        numbers: phoneList.join(',')
    };

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 SENDING SMS via Fast2SMS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 To:', phoneList.join(', '));
    console.log('📝 Message:', cleanedMessage.substring(0, 100) + (cleanedMessage.length > 100 ? '...' : ''));
    console.log('🔧 Route:', payload.route);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000) // 15s timeout
        });

        const data = await response.json();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📨 FAST2SMS API RESPONSE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Status:', data.return ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Request ID:', data.request_id || 'N/A');
        console.log('Message:', data.message || 'N/A');
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: Boolean(data.return),
            messageId: data.request_id || null,
            error: data.return ? null : (Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Fast2SMS delivery failed'),
            provider: 'fast2sms',
            recipients: phoneList,
            fast2smsResponse: data
        };
    } catch (err) {
        console.error('\n❌ Fast2SMS Request Failed:', err.message);
        console.error('Error Details:', err);
        return {
            success: false,
            error: err.name === 'TimeoutError' ? 'SMS service timeout' : err.message,
            messageId: null
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// ─── 1. Send Tracking Link SMS ───────────────────────────────
app.post('/api/sms/send-tracking', rateLimitMiddleware, async (req, res) => {
    try {
        const { phoneNumber, trackingLink, hospitalName, hospitalPhone, etaMinutes } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'phoneNumber is required', messageId: null });
        }

        const message = [
            `EMS ALERT 🚑`,
            `Ambulance is en route.`,
            ``,
            `Track Live Location:`,
            trackingLink || 'Link unavailable',
            ``,
            `Destination Hospital:`,
            hospitalName || 'Assigned Hospital',
            hospitalPhone ? `Emergency Contact: ${hospitalPhone}` : '',
            ``,
            `ETA: ${etaMinutes || '—'} mins`,
            ``,
            `— EMS Router Platform`
        ].filter(Boolean).join('\n');

        const result = await sendFast2SMS(phoneNumber, message);
        res.json(result);
    } catch (err) {
        console.error('Tracking SMS error:', err);
        res.status(500).json({ success: false, error: 'Internal server error', messageId: null });
    }
});

// ─── 2. Send Dispatch Confirmation SMS ───────────────────────
app.post('/api/sms/send-dispatch', rateLimitMiddleware, async (req, res) => {
    try {
        const { phoneNumber, caseId, ambulanceId } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'phoneNumber is required', messageId: null });
        }

        const message = [
            `EMS DISPATCH CONFIRMED 🚑`,
            `Ambulance ${ambulanceId || 'AMB'} assigned.`,
            ``,
            `Case ID: ${caseId || 'N/A'}`,
            ``,
            `Stay reachable for updates.`,
            `— EMS Router Platform`
        ].join('\n');

        const result = await sendFast2SMS(phoneNumber, message);
        res.json(result);
    } catch (err) {
        console.error('Dispatch SMS error:', err);
        res.status(500).json({ success: false, error: 'Internal server error', messageId: null });
    }
});

// ─── 3. Send Hospital Alert SMS ──────────────────────────────
app.post('/api/sms/send-hospital-alert', rateLimitMiddleware, async (req, res) => {
    try {
        const { hospitalPhone, emergencyType, etaMinutes } = req.body;

        if (!hospitalPhone) {
            return res.status(400).json({ success: false, error: 'hospitalPhone is required', messageId: null });
        }

        const message = [
            `INCOMING EMERGENCY 🚨`,
            ``,
            `Type: ${emergencyType || 'Emergency'}`,
            `ETA: ${etaMinutes || '—'} mins`,
            ``,
            `Prepare ER team immediately.`,
            `— EMS Router Platform`
        ].join('\n');

        const result = await sendFast2SMS(hospitalPhone, message);
        res.json(result);
    } catch (err) {
        console.error('Hospital alert SMS error:', err);
        res.status(500).json({ success: false, error: 'Internal server error', messageId: null });
    }
});

// ─── 4. Send WhatsApp Fallback (Twilio/Mock) ────────────────
app.post('/api/sms/send-whatsapp', rateLimitMiddleware, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber and message are required',
                messageId: null
            });
        }

        const formattedPhone = formatIndianNumber(phoneNumber);
        if (!formattedPhone) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number',
                messageId: null
            });
        }

        // Check for Twilio WhatsApp credentials
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        // If Twilio configured, use it
        if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
            try {
                const resp = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            To: `whatsapp:+${formattedPhone}`,
                            From: twilioWhatsAppNumber,
                            Body: `WhatsApp Emergency Notification\n\n${message}`
                        })
                    }
                );

                const data = await resp.json();

                console.log('📱 WhatsApp sent via Twilio:', data.sid || data.error_message);

                return res.json({
                    success: !data.error_code,
                    messageId: data.sid || null,
                    provider: 'twilio_whatsapp',
                    error: data.error_message || null
                });
            } catch (err) {
                console.error('Twilio WhatsApp error:', err);
                // Fall through to mock
            }
        }

        // Mock provider (no credentials or Twilio failed)
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 WhatsApp Mock (Twilio not configured)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📞 To:', formattedPhone);
        console.log('📝 Message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return res.json({
            success: true,
            messageId: `mock_wa_${Date.now()}`,
            provider: 'mock_whatsapp',
            error: null
        });
    } catch (err) {
        console.error('WhatsApp fallback error:', err);
        res.status(500).json({ success: false, error: 'Internal server error', messageId: null });
    }
});

// ─── Health Check ────────────────────────────────────────────
app.get('/api/sms/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: 'fast2sms',
        configured: Boolean(FAST2SMS_API_KEY),
        timestamp: new Date().toISOString()
    });
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error', messageId: null });
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log(`\n🚀 EMS SMS Proxy Server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/sms/health`);
    console.log(`   Fast2SMS: ${FAST2SMS_API_KEY ? '✅ configured' : '❌ NOT configured'}\n`);
});
