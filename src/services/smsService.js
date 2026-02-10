/**
 * smsService.js — Frontend SMS Service (Backend Proxy)
 *
 * All SMS calls route through the backend proxy at localhost:5000.
 * NO direct Fast2SMS calls from the frontend.
 *
 * Functions:
 *   sendTrackingSMS(data)    — Send live tracking link
 *   sendDispatchSMS(data)    — Send dispatch confirmation
 *   sendHospitalAlert(data)  — Send incoming emergency alert
 *   getTrackingLink(id)      — Generate shareable tracking URL
 */

const SMS_API_BASE = import.meta.env.VITE_SMS_API_URL || 'http://localhost:5001/api/sms';

/**
 * Generic fetch wrapper with error handling
 */
async function callSMSEndpoint(endpoint, body) {
    try {
        const resp = await fetch(`${SMS_API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await resp.json();

        if (!resp.ok) {
            return {
                success: false,
                error: data.error || `HTTP ${resp.status}`,
                messageId: null
            };
        }

        return data;
    } catch (err) {
        console.error(`SMS API error (${endpoint}):`, err);

        // If backend is down, fall back to mock
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
            console.warn('⚠️ SMS backend unreachable — using mock fallback');
            return mockSend(body);
        }

        return { success: false, error: err.message, messageId: null };
    }
}

/**
 * Mock SMS fallback (when backend is down)
 */
async function mockSend(body) {
    console.log('━━━ SMS Mock (backend offline) ━━━');
    console.log('To:', body.phoneNumber || body.hospitalPhone);
    console.log('Data:', JSON.stringify(body, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await new Promise(r => setTimeout(r, 500));
    return { success: true, provider: 'mock', messageId: `mock_${Date.now()}` };
}

/**
 * Send ambulance tracking link SMS
 */
export async function sendTrackingSMS({ phoneNumber, trackingLink, hospitalName, hospitalPhone, eta, caseType }) {
    return callSMSEndpoint('send-tracking', {
        phoneNumber,
        trackingLink,
        hospitalName,
        hospitalPhone: hospitalPhone || '',
        etaMinutes: eta
    });
}

/**
 * Send dispatch confirmation SMS
 */
export async function sendDispatchSMS({ phoneNumber, caseId, ambulanceId }) {
    return callSMSEndpoint('send-dispatch', {
        phoneNumber,
        caseId,
        ambulanceId
    });
}

/**
 * Send hospital incoming emergency alert
 */
export async function sendHospitalAlert({ hospitalPhone, emergencyType, etaMinutes }) {
    return callSMSEndpoint('send-hospital-alert', {
        hospitalPhone,
        emergencyType,
        etaMinutes
    });
}

/**
 * Generate a tracking URL for a given ambulance
 */
export function getTrackingLink(ambulanceId) {
    const base = window.location.origin;
    return `${base}/track/${ambulanceId}`;
}
