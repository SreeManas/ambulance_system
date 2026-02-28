/**
 * useEscalationMonitor.js — Timeout Monitoring Hook
 *
 * Polls every 15 seconds for cases in 'awaiting_response' status.
 * Evaluates escalation thresholds and triggers escalation as needed.
 * Prevents infinite loops and duplicate escalation triggers.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
    evaluateEscalation,
    triggerEscalation,
    CASE_STATUS,
} from '../services/hospitalResponseEngine.js';

const POLL_INTERVAL_MS = 15_000; // 15 seconds

/**
 * @param {Array} emergencyCases - live Firestore snapshot of cases
 * @param {boolean} enabled - whether monitoring is active
 */
export default function useEscalationMonitor(emergencyCases, enabled = true) {
    const escalatedRef = useRef(new Set()); // track already-escalated to prevent duplicates
    const timerRef = useRef(null);

    const checkEscalations = useCallback(async () => {
        if (!emergencyCases?.length) return;

        const awaitingCases = emergencyCases.filter(c =>
            c.status === CASE_STATUS.AWAITING_RESPONSE &&
            !escalatedRef.current.has(c.id)
        );

        for (const caseData of awaitingCases) {
            if (!caseData.id) continue;
            const result = evaluateEscalation(caseData);
            if (result.shouldEscalate) {
                try {
                    await triggerEscalation(caseData.id, result.reason);
                    escalatedRef.current.add(caseData.id); // prevent re-trigger
                } catch (err) {
                    console.warn('Escalation trigger failed for', caseData.id, err.message);
                }
            }
        }
    }, [emergencyCases]);

    useEffect(() => {
        if (!enabled) {
            clearInterval(timerRef.current);
            return;
        }

        // Run immediately on mount / data change
        checkEscalations();

        // Poll every 15 seconds
        timerRef.current = setInterval(checkEscalations, POLL_INTERVAL_MS);

        return () => clearInterval(timerRef.current);
    }, [checkEscalations, enabled]);

    // Clean up escalated set when cases resolve
    useEffect(() => {
        if (!emergencyCases?.length) return;
        const activeIds = new Set(emergencyCases.map(c => c.id));
        for (const id of escalatedRef.current) {
            if (!activeIds.has(id)) escalatedRef.current.delete(id);
        }
    }, [emergencyCases]);

    return { escalatedCaseIds: escalatedRef.current };
}
