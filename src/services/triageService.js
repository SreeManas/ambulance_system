/**
 * triageService.js — AI Vital-Sign Triage Frontend Service
 *
 * Calls /api/triage endpoint, logs results to Firestore,
 * and returns triage result to PatientVitalsForm.
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const TRIAGE_API_URL = '/api/triage';

// Severity label → acuity level mapping (for display consistency)
export const SEVERITY_CONFIG = {
    1: { label: 'IMMEDIATE', color: '#dc2626', bg: '#fef2f2', textColor: '#991b1b', badge: 'bg-red-600' },
    2: { label: 'CRITICAL', color: '#ea580c', bg: '#fff7ed', textColor: '#9a3412', badge: 'bg-orange-600' },
    3: { label: 'URGENT', color: '#d97706', bg: '#fffbeb', textColor: '#92400e', badge: 'bg-amber-500' },
    4: { label: 'DELAYED', color: '#2563eb', bg: '#eff6ff', textColor: '#1e40af', badge: 'bg-blue-600' },
    5: { label: 'MINOR', color: '#16a34a', bg: '#f0fdf4', textColor: '#166534', badge: 'bg-green-600' },
};

/**
 * Build the vitals payload for the triage API from PatientVitalsForm state.
 */
export function buildTriagePayload({
    heartRate, spo2, respiratoryRate, bloodPressure,
    temperature, temperatureUnit, consciousnessLevel,
    breathingStatus, bleedingSeverity, injuryType,
    burnsPercentage, cprPerformed, chestPainPresent,
    headInjurySuspected, seizureActivity, emergencyType,
    gender, age
}) {
    return {
        heartRate: heartRate !== '' ? Number(heartRate) : null,
        spo2: spo2 !== '' ? Number(spo2) : null,
        respiratoryRate: respiratoryRate !== '' ? Number(respiratoryRate) : null,
        bloodPressure: bloodPressure || '',
        temperature: temperature !== '' ? Number(temperature) : null,
        temperatureUnit: temperatureUnit || 'celsius',
        consciousnessLevel: consciousnessLevel || '',
        breathingStatus: breathingStatus || '',
        bleedingSeverity: bleedingSeverity || 'none',
        injuryType: injuryType || 'none',
        burnsPercentage: Number(burnsPercentage) || 0,
        cprPerformed: Boolean(cprPerformed),
        chestPainPresent: Boolean(chestPainPresent),
        headInjurySuspected: Boolean(headInjurySuspected),
        seizureActivity: Boolean(seizureActivity),
        emergencyType: emergencyType || '',
        gender: gender || '',
        age: age !== '' ? Number(age) : null,
    };
}

// ─── Client-side rule-based floor (mirrors backend logic) ──────────────────
// Safety dominance defense-in-depth: AI can never downgrade below this floor.
// Lower number = more severe. 1=Immediate, 2=Critical, 3=Urgent, 4=Delayed, 5=Minor
function runLocalRuleFloor(vitals) {
    const spo2 = vitals.spo2 !== null ? Number(vitals.spo2) : null;
    const hr = vitals.heartRate !== null ? Number(vitals.heartRate) : null;
    const rr = vitals.respiratoryRate !== null ? Number(vitals.respiratoryRate) : null;
    const sbp = vitals.bloodPressure
        ? Number(vitals.bloodPressure.toString().split('/')[0]) || null
        : null;
    const avpu = vitals.consciousnessLevel || '';
    const breath = vitals.breathingStatus || '';
    const bleed = vitals.bleedingSeverity || 'none';
    const burns = Number(vitals.burnsPercentage) || 0;
    const cpr = Boolean(vitals.cprPerformed);

    const l1Flags = [];
    if (cpr) l1Flags.push('CPR in progress');
    if (spo2 !== null && spo2 < 85) l1Flags.push('SpO2 < 85%');
    if (sbp !== null && sbp < 90) l1Flags.push('SBP < 90 mmHg');
    if (avpu === 'unresponsive') l1Flags.push('Unresponsive (AVPU=U)');
    if (breath === 'not_breathing') l1Flags.push('Apnea');
    if (l1Flags.length > 0) return { floor: 1, flags: l1Flags };

    const l2Flags = [];
    if (hr !== null && (hr > 130 || hr < 50)) l2Flags.push(hr > 130 ? 'HR > 130' : 'HR < 50');
    if (rr !== null && rr > 30) l2Flags.push('RR > 30');
    if (spo2 !== null && spo2 < 92) l2Flags.push('SpO2 < 92%');
    if (avpu === 'pain') l2Flags.push('AVPU=P');
    if (bleed === 'severe') l2Flags.push('Severe hemorrhage');
    if (burns > 30) l2Flags.push(`Burns ${burns}% BSA`);
    if (l2Flags.length > 0) return { floor: 2, flags: l2Flags };

    return { floor: 5, flags: [] }; // no constraint — AI result is trusted
}

/**
 * Call the triage API and return the structured result.
 * Applies safety dominance: AI result is clamped UP to rule-based floor.
 *
 * @param {Object} vitalsPayload - from buildTriagePayload()
 * @returns {Promise<{acuity_level, severity_label, confidence, clinical_flags, reasoning_summary, source}>}
 */
export async function runAITriage(vitalsPayload) {
    const response = await fetch(TRIAGE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals: vitalsPayload }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Triage API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.triage) {
        throw new Error('Invalid triage API response');
    }

    if (data.triage.error === 'insufficient_data') {
        return { error: 'insufficient_data' };
    }

    const result = data.triage;

    // ── CLIENT-SIDE SAFETY DOMINANCE (defense-in-depth) ───────────────────
    // Backend already applies this, but we re-verify on the client side to
    // guard against any future API changes or unexpected responses.
    if (!result.safety_override) {
        const { floor, flags } = runLocalRuleFloor(vitalsPayload);
        if (floor < result.acuity_level) {
            const LABEL_MAP = { 1: 'Immediate', 2: 'Critical', 3: 'Urgent', 4: 'Delayed', 5: 'Minor' };
            return {
                ...result,
                acuity_level: floor,
                severity_label: LABEL_MAP[floor],
                clinical_flags: [
                    ...flags,
                    `[Client Safety Override] AI returned Level ${result.acuity_level} — upgraded by vital sign rules`
                ],
                reasoning_summary: `Client-side safety dominance: vital signs mandate Level ${floor} (${LABEL_MAP[floor]}). AI result was Level ${result.acuity_level}.`,
                source: 'gemini_client_safety_override',
                safety_override: true,
                ai_original_level: result.acuity_level,
            };
        }
    }

    return result;
}

/**
 * Log triage result to Firestore `triageResults` collection.
 * Subcollection path: triageResults/{caseId?}/{auto-id}
 */
export async function logTriageToFirestore({ triageResult, vitalsPayload, caseId }) {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;

        await addDoc(collection(db, 'triageResults'), {
            caseId: caseId || null,
            userId: user?.uid || null,
            triageResult,
            vitalsSnapshot: vitalsPayload,
            source: triageResult.source || 'unknown',
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        // Non-blocking — don't fail triage over logging issues
        console.warn('Triage Firestore log failed:', err.message);
    }
}
