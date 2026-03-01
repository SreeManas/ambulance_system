/**
 * hospitalResponseEngine.js — Hospital Response + Escalation Engine
 *
 * Production-grade response workflow:
 * - Sequential vs parallel notification (acuity-aware)
 * - Accept/reject with mandatory reasons
 * - Dual escalation (rejection threshold + timeout)
 * - Constrained override mode (re-rank with rejection penalty)
 * - Golden hour escalation amplification
 * - Full audit logging to dispatchEscalationLogs
 * - Firestore transaction safety for all critical writes
 */

import {
    getFirestore, doc, updateDoc, addDoc, collection,
    serverTimestamp, getDoc, runTransaction, Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// CASE STATUS LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

export const CASE_STATUS = {
    CREATED: 'created',
    TRIAGED: 'triaged',
    DISPATCHED: 'dispatched',
    AWAITING_RESPONSE: 'awaiting_response',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    ESCALATION_REQUIRED: 'escalation_required',
    DISPATCHER_OVERRIDE: 'dispatcher_override',
    ENROUTE: 'enroute',
    HANDOVER_INITIATED: 'handover_initiated',
    HANDOVER_ACKNOWLEDGED: 'handover_acknowledged',
    COMPLETED: 'completed',
};

// ═══════════════════════════════════════════════════════════════════════════════
// REJECTION REASONS
// ═══════════════════════════════════════════════════════════════════════════════

export const REJECTION_REASONS = [
    { id: 'no_icu', label: 'No ICU Available', icon: '🛏️' },
    { id: 'no_specialist', label: 'No Specialist Available', icon: '👨‍⚕️' },
    { id: 'over_capacity', label: 'Over Capacity', icon: '🚫' },
    { id: 'equipment_unavailable', label: 'Equipment Unavailable', icon: '⚙️' },
    { id: 'other', label: 'Other', icon: '📝' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACUITY-AWARE ESCALATION THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

const ESCALATION_THRESHOLDS = {
    1: { maxRejections: 1, timeoutSeconds: 60 },
    2: { maxRejections: 2, timeoutSeconds: 90 },
    3: { maxRejections: 3, timeoutSeconds: 120 },
    4: { maxRejections: 3, timeoutSeconds: 180 },
    5: { maxRejections: 3, timeoutSeconds: 180 },
};

// Rejection penalty for constrained override re-ranking
const REJECTION_PENALTY_MULTIPLIER = 0.85;

// Parallel notification count for Level 1
const PARALLEL_NOTIFY_COUNT = 2;

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

export async function logEscalationEvent(eventType, data) {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        await addDoc(collection(db, 'dispatchEscalationLogs'), {
            eventType,
            caseId: data.caseId || null,
            hospitalId: data.hospitalId || null,
            timestamp: serverTimestamp(),
            userId: user?.uid || null,
            metadata: data.metadata || {},
        });
    } catch (err) {
        console.warn('Escalation audit log failed:', err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dispatch hospital notification(s) for a case.
 * - Level 1: parallel notify top 2
 * - Level 2+: sequential notify top 1
 *
 * Updates case document with hospitalNotifications array and status.
 * Uses transaction to prevent duplicate notifications.
 */
export async function dispatchHospitalNotification(caseId, rankedHospitals, acuityLevel) {
    const db = getFirestore();
    const caseRef = doc(db, 'emergencyCases', caseId);

    const notifyCount = acuityLevel === 1 ? PARALLEL_NOTIFY_COUNT : 1;
    const hospitalsToNotify = rankedHospitals
        .filter(h => !h.disqualified)
        .slice(0, notifyCount);

    if (hospitalsToNotify.length === 0) return { success: false, reason: 'no_eligible_hospitals' };

    const now = Timestamp.now();

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const caseData = snap.data();
        const existing = caseData.hospitalNotifications || [];

        // Prevent duplicate notifications
        const alreadyNotified = new Set(existing.map(n => n.hospitalId));
        const newNotifications = hospitalsToNotify
            .filter(h => !alreadyNotified.has(h.hospitalId))
            .map(h => ({
                hospitalId: h.hospitalId,
                hospitalName: h.hospitalName,
                notifiedAt: now,
                respondedAt: null,
                response: null,
                reason: null,
                score: h.suitabilityScore,
                rank: hospitalsToNotify.indexOf(h) + 1,
            }));

        if (newNotifications.length === 0) return;

        txn.update(caseRef, {
            hospitalNotifications: [...existing, ...newNotifications],
            status: CASE_STATUS.AWAITING_RESPONSE,
            awaitingResponseSince: caseData.awaitingResponseSince || now,
            // Analytics: record dispatch timestamp (first dispatch only)
            ...(existing.length === 0 ? { dispatchedAt: now } : {}),
        });
    });

    // Audit log each notification
    for (const h of hospitalsToNotify) {
        logEscalationEvent('hospital_notified', {
            caseId,
            hospitalId: h.hospitalId,
            metadata: {
                hospitalName: h.hospitalName,
                score: h.suitabilityScore,
                acuityLevel,
                mode: acuityLevel === 1 ? 'parallel' : 'sequential',
            }
        });
    }

    return { success: true, notified: hospitalsToNotify.map(h => h.hospitalId) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOSPITAL ACCEPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hospital accepts a case. Uses transaction for race condition safety.
 * - Marks notification as accepted
 * - Cancels all other pending notifications
 * - Sets case status → accepted
 */
export async function handleHospitalAccept(caseId, hospitalId) {
    const db = getFirestore();
    const caseRef = doc(db, 'emergencyCases', caseId);
    const now = Timestamp.now();

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const caseData = snap.data();

        // Prevent double-accept
        if (caseData.status === CASE_STATUS.ACCEPTED) {
            throw new Error('Case already accepted by another hospital');
        }

        const notifications = (caseData.hospitalNotifications || []).map(n => {
            if (n.hospitalId === hospitalId && n.response === null) {
                return { ...n, response: 'accepted', respondedAt: now };
            }
            // Cancel all other pending notifications
            if (n.response === null && n.hospitalId !== hospitalId) {
                return { ...n, response: 'cancelled', respondedAt: now };
            }
            return n;
        });

        txn.update(caseRef, {
            hospitalNotifications: notifications,
            status: CASE_STATUS.ACCEPTED,
            acceptedHospitalId: hospitalId,
            acceptedAt: now, // Analytics: record acceptance timestamp
        });
    });

    // Audit log
    logEscalationEvent('hospital_accepted', { caseId, hospitalId });

    // Log cancellations for parallel cases
    const db2 = getFirestore();
    const snap = await getDoc(doc(db2, 'emergencyCases', caseId));
    if (snap.exists()) {
        for (const n of snap.data().hospitalNotifications || []) {
            if (n.response === 'cancelled') {
                logEscalationEvent('parallel_cancelled', {
                    caseId,
                    hospitalId: n.hospitalId,
                    metadata: { cancelledBy: hospitalId }
                });
            }
        }
    }

    return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOSPITAL REJECT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hospital rejects a case with mandatory reason.
 * - Marks notification as rejected
 * - Increments rejectionCount
 * - Evaluates escalation
 */
export async function handleHospitalReject(caseId, hospitalId, reasonId, reasonText = '') {
    const db = getFirestore();
    const caseRef = doc(db, 'emergencyCases', caseId);
    const now = Timestamp.now();

    let needsEscalation = false;
    let caseDataAfter = null;

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const caseData = snap.data();

        const notifications = (caseData.hospitalNotifications || []).map(n => {
            if (n.hospitalId === hospitalId && n.response === null) {
                return {
                    ...n,
                    response: 'rejected',
                    respondedAt: now,
                    reason: reasonId === 'other' ? (reasonText || 'Other') : reasonId,
                };
            }
            return n;
        });

        const newRejectionCount = (caseData.rejectionCount || 0) + 1;

        txn.update(caseRef, {
            hospitalNotifications: notifications,
            rejectionCount: newRejectionCount,
        });

        caseDataAfter = {
            ...caseData,
            hospitalNotifications: notifications,
            rejectionCount: newRejectionCount,
        };
    });

    // Audit log
    logEscalationEvent('hospital_rejected', {
        caseId,
        hospitalId,
        metadata: { reason: reasonId, reasonText }
    });

    // Evaluate escalation after rejection
    if (caseDataAfter) {
        const escalationResult = evaluateEscalation(caseDataAfter);
        if (escalationResult.shouldEscalate) {
            await triggerEscalation(caseId, escalationResult.reason);
            needsEscalation = true;
        }
    }

    return { success: true, escalated: needsEscalation };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESCALATION EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate whether a case needs escalation.
 * Checks rejection count and timeout thresholds based on acuity.
 * Returns { shouldEscalate, reason }.
 */
export function evaluateEscalation(caseData) {
    // Skip if already escalated or resolved
    const nonEscalatable = [
        CASE_STATUS.ACCEPTED,
        CASE_STATUS.ESCALATION_REQUIRED,
        CASE_STATUS.DISPATCHER_OVERRIDE,
        CASE_STATUS.ENROUTE,
        CASE_STATUS.HANDOVER_INITIATED,
        CASE_STATUS.HANDOVER_ACKNOWLEDGED,
        CASE_STATUS.COMPLETED,
    ];
    if (nonEscalatable.includes(caseData.status)) {
        return { shouldEscalate: false, reason: null };
    }

    const acuity = caseData.acuityLevel || caseData.aiTriage?.acuityLevel || 3;
    const thresholds = ESCALATION_THRESHOLDS[acuity] || ESCALATION_THRESHOLDS[3];
    const rejections = caseData.rejectionCount || 0;

    const rejectionHit = rejections >= thresholds.maxRejections;

    // Timeout check
    let timeoutHit = false;
    if (caseData.awaitingResponseSince) {
        let sinceMs;
        if (caseData.awaitingResponseSince.toMillis) {
            sinceMs = caseData.awaitingResponseSince.toMillis();
        } else if (caseData.awaitingResponseSince._seconds) {
            sinceMs = caseData.awaitingResponseSince._seconds * 1000;
        } else {
            sinceMs = new Date(caseData.awaitingResponseSince).getTime();
        }
        const elapsed = (Date.now() - sinceMs) / 1000;
        timeoutHit = elapsed >= thresholds.timeoutSeconds;
    }

    if (rejectionHit && timeoutHit) {
        return { shouldEscalate: true, reason: 'both' };
    }
    if (rejectionHit) {
        return { shouldEscalate: true, reason: 'rejections' };
    }
    if (timeoutHit) {
        return { shouldEscalate: true, reason: 'timeout' };
    }

    return { shouldEscalate: false, reason: null };
}

/**
 * Trigger escalation on a case.
 * Sets status → escalation_required, records reason and timestamp.
 * Prevents duplicate escalation via transaction check.
 */
export async function triggerEscalation(caseId, reason) {
    const db = getFirestore();
    const caseRef = doc(db, 'emergencyCases', caseId);

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) return;

        const data = snap.data();
        // Guard: prevent multiple escalations
        if (data.status === CASE_STATUS.ESCALATION_REQUIRED ||
            data.status === CASE_STATUS.DISPATCHER_OVERRIDE ||
            data.status === CASE_STATUS.ACCEPTED) {
            return;
        }

        txn.update(caseRef, {
            status: CASE_STATUS.ESCALATION_REQUIRED,
            escalationTriggeredAt: serverTimestamp(),
            escalationReason: reason,
        });
    });

    logEscalationEvent('escalation_triggered', {
        caseId,
        metadata: { reason }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRAINED OVERRIDE MODE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Re-rank hospitals for constrained override mode.
 * Previously rejected hospitals are included but penalized by 0.85 multiplier.
 * Returns re-ranked list with penalty annotations.
 */
export function rerankWithRejectionPenalty(rankedHospitals, hospitalNotifications) {
    const rejectedIds = new Set(
        (hospitalNotifications || [])
            .filter(n => n.response === 'rejected')
            .map(n => n.hospitalId)
    );

    return rankedHospitals.map(h => {
        if (rejectedIds.has(h.hospitalId)) {
            return {
                ...h,
                suitabilityScore: Math.round(h.suitabilityScore * REJECTION_PENALTY_MULTIPLIER * 10) / 10,
                rejectionPenaltyApplied: true,
                originalScore: h.suitabilityScore,
            };
        }
        return { ...h, rejectionPenaltyApplied: false };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

/**
 * Dispatcher confirms override selection.
 * Uses transaction to prevent multiple overrides.
 */
export async function confirmDispatcherOverride(caseId, selectedHospitalId) {
    const db = getFirestore();
    const caseRef = doc(db, 'emergencyCases', caseId);

    await runTransaction(db, async (txn) => {
        const snap = await txn.get(caseRef);
        if (!snap.exists()) throw new Error('Case not found');

        const data = snap.data();
        // Guard: prevent multiple overrides
        if (data.overrideUsed) {
            throw new Error('Override already used for this case');
        }

        txn.update(caseRef, {
            status: CASE_STATUS.DISPATCHER_OVERRIDE,
            overrideUsed: true,
            overrideHospitalId: selectedHospitalId,
        });
    });

    logEscalationEvent('dispatcher_override', {
        caseId,
        hospitalId: selectedHospitalId,
        metadata: { overrideType: 'constrained' }
    });

    return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOLDEN HOUR ESCALATION AMPLIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate the escalation-aware golden hour boost.
 * - Base golden hour modifier: 0.10 (from scoring engine)
 * - Escalation required: +0.20 (total 0.30) for acuity ≤ 2
 * - Dispatcher override: +0.30 (total 0.40) for acuity ≤ 2
 * Returns additional modifier to ADD to base golden hour.
 */
export function getEscalationGoldenHourBoost(caseData) {
    const acuity = caseData.acuityLevel || caseData.aiTriage?.acuityLevel || 3;
    if (acuity > 2) return 0; // Only applies to critical acuity

    let boost = 0;
    if (caseData.status === CASE_STATUS.ESCALATION_REQUIRED) {
        boost = 0.20;
    }
    if (caseData.status === CASE_STATUS.DISPATCHER_OVERRIDE || caseData.overrideUsed) {
        boost = 0.30;
    }
    return boost;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUT MONITOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check a batch of cases for timeout escalation.
 * Called periodically (every 15s) from Command Center listener.
 * Returns array of caseIds that were escalated.
 */
export async function checkTimeoutEscalations(awaitingCases) {
    const escalated = [];
    for (const caseData of awaitingCases) {
        if (!caseData.id) continue;
        const result = evaluateEscalation(caseData);
        if (result.shouldEscalate) {
            await triggerEscalation(caseData.id, result.reason);
            escalated.push(caseData.id);
        }
    }
    return escalated;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Get escalation threshold for display
// ═══════════════════════════════════════════════════════════════════════════════

export function getEscalationThreshold(acuityLevel) {
    return ESCALATION_THRESHOLDS[acuityLevel] || ESCALATION_THRESHOLDS[3];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Get seconds remaining until timeout
// ═══════════════════════════════════════════════════════════════════════════════

export function getTimeoutRemaining(caseData) {
    const acuity = caseData.acuityLevel || caseData.aiTriage?.acuityLevel || 3;
    const thresholds = ESCALATION_THRESHOLDS[acuity] || ESCALATION_THRESHOLDS[3];

    if (!caseData.awaitingResponseSince) return thresholds.timeoutSeconds;

    let sinceMs;
    if (caseData.awaitingResponseSince.toMillis) {
        sinceMs = caseData.awaitingResponseSince.toMillis();
    } else if (caseData.awaitingResponseSince._seconds) {
        sinceMs = caseData.awaitingResponseSince._seconds * 1000;
    } else {
        sinceMs = new Date(caseData.awaitingResponseSince).getTime();
    }

    const elapsed = (Date.now() - sinceMs) / 1000;
    return Math.max(0, Math.round(thresholds.timeoutSeconds - elapsed));
}
