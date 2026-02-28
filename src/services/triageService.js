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

/**
 * Call the triage API and return the structured result.
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

    return data.triage;
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
