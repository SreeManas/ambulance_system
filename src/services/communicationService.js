/**
 * communicationService.js — EMS Communication Intelligence
 *
 * Event-driven multi-channel notification system with WhatsApp fallback.
 * Handles dispatch tracking, hospital alerts, and delivery guarantees.
 *
 * Communication flow:
 *   1. Attempt SMS via backend proxy
 *   2. If SMS fails → Auto WhatsApp fallback
 *   3. Log all attempts to communicationLogs collection
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SMS_API_BASE = import.meta.env.VITE_SMS_API_URL || 'http://localhost:5001/api/sms';

// ═══════════════════════════════════════════════════════════════
// FIRESTORE LOGGING
// ═══════════════════════════════════════════════════════════════

async function logCommunication(logData) {
    try {
        const db = getFirestore();
        await addDoc(collection(db, 'communicationLogs'), {
            ...logData,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error('Communication log error:', err);
    }
}

// ═══════════════════════════════════════════════════════════════
// SMS SENDER WITH RETRY
// ═══════════════════════════════════════════════════════════════

async function sendSMS(endpoint, payload, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const resp = await fetch(`${SMS_API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await resp.json();

            if (data.success) {
                return { success: true, channel: 'sms', data };
            }

            console.warn(`SMS attempt ${attempt + 1} failed:`, data.error);

            if (attempt === retries) {
                return { success: false, error: data.error, channel: 'sms' };
            }
        } catch (err) {
            console.error(`SMS attempt ${attempt + 1} error:`, err.message);

            if (attempt === retries) {
                return { success: false, error: err.message, channel: 'sms' };
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP FALLBACK
// ═══════════════════════════════════════════════════════════════

async function sendWhatsAppFallback(phoneNumber, message) {
    try {
        const resp = await fetch(`${SMS_API_BASE}/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, message }),
            signal: AbortSignal.timeout(5000)
        });

        const data = await resp.json();
        return { success: data.success, channel: 'whatsapp', data };
    } catch (err) {
        console.error('WhatsApp fallback error:', err);
        return { success: false, error: err.message, channel: 'whatsapp' };
    }
}

// ═══════════════════════════════════════════════════════════════
// DISPATCH TRACKING SMS
// ═══════════════════════════════════════════════════════════════

export async function sendDispatchTrackingSMS({ caseData, ambulanceId, etaMinutes, trackingLink }) {
    const recipients = [];

    if (caseData.patientPhone) recipients.push(caseData.patientPhone);
    if (caseData.relativePhone) recipients.push(caseData.relativePhone);
    if (caseData.callerPhone && !recipients.includes(caseData.callerPhone)) {
        recipients.push(caseData.callerPhone);
    }

    if (recipients.length === 0) {
        console.warn('No recipients for dispatch tracking SMS');
        await logCommunication({
            caseId: caseData.id,
            type: 'dispatch_tracking_sms',
            deliveryStatus: 'blocked',
            reason: 'No recipient phone numbers',
            recipients: []
        });
        return { success: false, error: 'No recipients' };
    }

    const results = [];

    for (const phoneNumber of recipients) {
        // Attempt SMS
        const smsResult = await sendSMS('send-dispatch', {
            phoneNumber,
            caseId: caseData.id,
            ambulanceId: ambulanceId || `AMB_${Date.now()}`
        });

        let finalResult = smsResult;

        // WhatsApp fallback if SMS failed
        if (!smsResult.success) {
            console.log(`📱 Triggering WhatsApp fallback for ${phoneNumber}`);
            const whatsappResult = await sendWhatsAppFallback(phoneNumber,
                `🚑 Ambulance ${ambulanceId} dispatched. Case ID: ${caseData.id}. Track: ${trackingLink || 'N/A'}`
            );
            finalResult = whatsappResult;
        }

        results.push({ phoneNumber, ...finalResult });

        // Log to Firestore
        await logCommunication({
            caseId: caseData.id,
            type: 'dispatch_tracking_sms',
            recipient: phoneNumber,
            deliveryStatus: finalResult.success ? 'delivered' : 'failed',
            channel: finalResult.channel,
            error: finalResult.error || null,
            ambulanceId
        });
    }

    return { success: results.some(r => r.success), results, recipients };
}

// ═══════════════════════════════════════════════════════════════
// HOSPITAL ALERT SMS
// ═══════════════════════════════════════════════════════════════

export async function sendHospitalAlertSMS({ caseData, hospital, etaMinutes }) {
    // Failsafe: Don't send if hospital is full
    if (hospital.emergencyReadiness?.status === 'full') {
        console.warn(`Hospital ${hospital.hospitalName} is FULL — blocking alert`);
        await logCommunication({
            caseId: caseData.id,
            type: 'hospital_alert_sms',
            deliveryStatus: 'blocked',
            reason: 'Hospital status: full',
            hospitalId: hospital.hospitalId || hospital.id
        });
        return { success: false, error: 'Hospital full' };
    }

    const hospitalPhone = hospital.basicInfo?.contactNumber || hospital.contactNumber || hospital.phone;

    if (!hospitalPhone) {
        console.warn(`No contact number for hospital ${hospital.hospitalName}`);
        await logCommunication({
            caseId: caseData.id,
            type: 'hospital_alert_sms',
            deliveryStatus: 'blocked',
            reason: 'No hospital contact number',
            hospitalId: hospital.hospitalId || hospital.id
        });
        return { success: false, error: 'No hospital phone' };
    }

    // Attempt SMS
    const smsResult = await sendSMS('send-hospital-alert', {
        hospitalPhone,
        emergencyType: caseData.emergencyContext?.chiefComplaint || caseData.type || 'Emergency',
        etaMinutes: etaMinutes || 0
    });

    let finalResult = smsResult;

    // WhatsApp fallback
    if (!smsResult.success) {
        console.log(`📱 Triggering WhatsApp fallback for hospital ${hospital.hospitalName}`);
        const whatsappResult = await sendWhatsAppFallback(hospitalPhone,
            `🚨 INCOMING EMERGENCY\nType: ${caseData.emergencyContext?.chiefComplaint || 'Emergency'}\nETA: ${etaMinutes} mins\nPrepare ER team.`
        );
        finalResult = whatsappResult;
    }

    // Log to Firestore
    await logCommunication({
        caseId: caseData.id,
        type: 'hospital_alert_sms',
        recipient: hospitalPhone,
        hospitalId: hospital.hospitalId || hospital.id,
        hospitalName: hospital.hospitalName || hospital.name,
        deliveryStatus: finalResult.success ? 'delivered' : 'failed',
        channel: finalResult.channel,
        error: finalResult.error || null,
        etaMinutes
    });

    return finalResult;
}

// ═══════════════════════════════════════════════════════════════
// MANUAL WHATSAPP TRIGGER (for UI buttons)
// ═══════════════════════════════════════════════════════════════

export async function triggerWhatsAppFallback({ phoneNumber, message, caseId }) {
    const result = await sendWhatsAppFallback(phoneNumber, message);

    await logCommunication({
        caseId: caseId || 'manual',
        type: 'manual_whatsapp',
        recipient: phoneNumber,
        deliveryStatus: result.success ? 'delivered' : 'failed',
        channel: 'whatsapp',
        error: result.error || null
    });

    return result;
}
