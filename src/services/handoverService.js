/**
 * handoverService.js — Digital Patient Handover Protocol
 *
 * Extends case lifecycle: enroute → handover_initiated → handover_acknowledged → completed
 *
 * Functions:
 * - buildHandoverSummary: generates structured summary from case data
 * - initiateHandover: driver/paramedic initiates digital handover (transaction)
 * - acknowledgeHandover: hospital confirms handover received (transaction)
 *
 * Guards:
 * - No double initiation
 * - No acknowledge before initiation
 * - No non-target hospital acknowledgement
 * - No initiation after completion
 * - No double acknowledgement
 */

import {
    getFirestore, doc, runTransaction, serverTimestamp, addDoc,
    collection, Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CASE_STATUS, logEscalationEvent } from './hospitalResponseEngine.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TIMESTAMP HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function toMs(ts) {
    if (!ts) return null;
    if (ts.toMillis) return ts.toMillis();
    if (ts._seconds) return ts._seconds * 1000;
    if (ts.seconds) return ts.seconds * 1000;
    const d = new Date(ts).getTime();
    return isNaN(d) ? null : d;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED HANDOVER SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

export function buildHandoverSummary(caseData) {
    const vitals = caseData.vitals || {};

    // Golden hour remaining (minutes from createdAt)
    let goldenHourRemaining = null;
    const createdMs = toMs(caseData.createdAt);
    if (createdMs) {
        const elapsed = (Date.now() - createdMs) / 60000;
        goldenHourRemaining = Math.max(0, Math.round(60 - elapsed));
    }

    return {
        patient: {
            name: caseData.patientName || 'Unknown',
            age: caseData.patientAge || caseData.age || null,
            gender: caseData.patientGender || caseData.gender || null,
        },
        clinical: {
            aiTriageLevel: caseData.acuityLevel || caseData.aiTriage?.acuity_level || null,
            triageConfidence: caseData.aiTriage?.confidence || null,
            triageFlags: caseData.aiTriage?.flags || [],
            triageReasoning: caseData.aiTriage?.reasoning || null,
            vitals: {
                heartRate: vitals.heartRate ?? vitals.hr ?? null,
                systolicBP: vitals.systolicBP ?? vitals.bloodPressureSystolic ?? null,
                diastolicBP: vitals.diastolicBP ?? vitals.bloodPressureDiastolic ?? null,
                spO2: vitals.spO2 ?? vitals.oxygenSaturation ?? null,
                respiratoryRate: vitals.respiratoryRate ?? vitals.rr ?? null,
                temperature: vitals.temperature ?? vitals.temp ?? null,
            },
            traumaFlags: caseData.traumaFlags || caseData.emergencyContext?.traumaType || null,
            consciousnessLevel: vitals.consciousnessLevel ?? vitals.gcsTotal ?? null,
            clinicalFlags: caseData.aiTriage?.flags || caseData.clinicalFlags || [],
        },
        timeline: {
            createdAt: caseData.createdAt || null,
            dispatchedAt: caseData.dispatchedAt || null,
            acceptedAt: caseData.acceptedAt || null,
            enrouteAt: caseData.enrouteAt || null,
            escalationTriggeredAt: caseData.escalationTriggeredAt || null,
            overrideUsed: caseData.overrideUsed || false,
        },
        operational: {
            goldenHourRemaining,
            rejectionCount: caseData.rejectionCount || 0,
            equipmentUsed: caseData.equipmentUsed || null,
            emergencyType: caseData.emergencyContext?.emergencyType || null,
        },
        attachments: {
            incidentPhotos: (caseData.incidentPhotos || []).map(p =>
                typeof p === 'string' ? p : p?.url || null
            ).filter(Boolean),
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIATE HANDOVER (Ambulance/Driver side)
// ═══════════════════════════════════════════════════════════════════════════════

export async function initiateHandover(caseId) {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const caseRef = doc(db, 'emergencyCases', caseId);

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const data = snap.data();

        // Guard: only from enroute
        if (data.status !== CASE_STATUS.ENROUTE) {
            throw new Error(`Cannot initiate handover from status: ${data.status}`);
        }

        // Guard: no double initiation
        if (data.handoverStatus === 'initiated' || data.handoverStatus === 'acknowledged') {
            throw new Error('Handover already initiated or acknowledged');
        }

        const summary = buildHandoverSummary(data);

        txn.update(caseRef, {
            status: CASE_STATUS.HANDOVER_INITIATED,
            handoverStatus: 'initiated',
            handoverInitiatedAt: serverTimestamp(),
            handoverInitiatedBy: user.uid,
            handoverSummary: summary,
        });
    });

    // Audit log
    logEscalationEvent('handover_initiated', {
        caseId,
        metadata: { actorUid: user.uid },
    });

    return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACKNOWLEDGE HANDOVER (Hospital side)
// ═══════════════════════════════════════════════════════════════════════════════

export async function acknowledgeHandover(caseId, hospitalId) {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const caseRef = doc(db, 'emergencyCases', caseId);

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const data = snap.data();

        // Guard: must be in handover_initiated
        if (data.status !== CASE_STATUS.HANDOVER_INITIATED) {
            throw new Error(`Cannot acknowledge handover from status: ${data.status}`);
        }

        // Guard: must not be already acknowledged
        if (data.handoverStatus === 'acknowledged') {
            throw new Error('Handover already acknowledged');
        }

        // Guard: only the target hospital can acknowledge
        const targetHospital = data.acceptedHospitalId || data.overrideHospitalId;
        if (targetHospital && targetHospital !== hospitalId) {
            throw new Error('Only the assigned hospital can acknowledge this handover');
        }

        txn.update(caseRef, {
            status: CASE_STATUS.HANDOVER_ACKNOWLEDGED,
            handoverStatus: 'acknowledged',
            handoverAcknowledgedAt: serverTimestamp(),
            handoverAcknowledgedBy: user.uid,
        });
    });

    // Audit log
    logEscalationEvent('handover_acknowledged', {
        caseId,
        hospitalId,
        metadata: { actorUid: user.uid },
    });

    return { success: true };
}
