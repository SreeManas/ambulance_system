/**
 * CaseStatusBadge.jsx — Case status visual indicator for Command Center
 * All user-facing labels now use useTBatch for full i18n compliance.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    CASE_STATUS,
    getTimeoutRemaining,
    getEscalationThreshold,
} from '../../services/hospitalResponseEngine.js';
import { Clock, AlertTriangle, Shield, Check } from 'lucide-react';
import { useTBatch } from '../../hooks/useT.js';
import { TK } from '../../constants/translationKeys.js';

// Static visual config (colors/icons — language-independent)
const STATUS_VISUAL = {
    [CASE_STATUS.CREATED]: { color: '#64748b', bg: '#1e293b', icon: null },
    [CASE_STATUS.TRIAGED]: { color: '#818cf8', bg: '#1e1b4b', icon: null },
    [CASE_STATUS.DISPATCHED]: { color: '#38bdf8', bg: '#0c4a6e', icon: null },
    [CASE_STATUS.AWAITING_RESPONSE]: { color: '#fbbf24', bg: '#422006', icon: Clock },
    [CASE_STATUS.ACCEPTED]: { color: '#4ade80', bg: '#052e16', icon: Check },
    [CASE_STATUS.REJECTED]: { color: '#f87171', bg: '#450a0a', icon: null },
    [CASE_STATUS.ESCALATION_REQUIRED]: { color: '#ef4444', bg: '#450a0a', icon: AlertTriangle },
    [CASE_STATUS.DISPATCHER_OVERRIDE]: { color: '#fb923c', bg: '#431407', icon: Shield },
    [CASE_STATUS.ENROUTE]: { color: '#38bdf8', bg: '#0c4a6e', icon: null },
    [CASE_STATUS.HANDOVER_INITIATED]: { color: '#a78bfa', bg: '#2e1065', icon: null },
    [CASE_STATUS.HANDOVER_ACKNOWLEDGED]: { color: '#2dd4bf', bg: '#042f2e', icon: Check },
    [CASE_STATUS.COMPLETED]: { color: '#4ade80', bg: '#052e16', icon: Check },
};

// English label strings indexed by status (same order as STATUS_VISUAL)
const STATUS_LABEL_KEYS = [
    TK.STATUS_PENDING,         // created
    'Triaged',                 // triaged (no existing TK — use raw string)
    'Dispatched',              // dispatched
    'Awaiting Response',       // awaiting_response
    TK.HO_ACCEPTED,            // accepted
    'Rejected',                // rejected
    'Escalation Required',     // escalation_required
    'Override Active',         // dispatcher_override
    TK.CC_ENROUTE,             // enroute
    TK.HO_BADGE_INITIATED,     // handover_initiated
    TK.HO_BADGE_ACKNOWLEDGED,  // handover_acknowledged
    TK.STATUS_COMPLETED,       // completed
];

// Map index → CASE_STATUS key (same order)
const STATUS_ORDER = [
    CASE_STATUS.CREATED, CASE_STATUS.TRIAGED, CASE_STATUS.DISPATCHED,
    CASE_STATUS.AWAITING_RESPONSE, CASE_STATUS.ACCEPTED, CASE_STATUS.REJECTED,
    CASE_STATUS.ESCALATION_REQUIRED, CASE_STATUS.DISPATCHER_OVERRIDE,
    CASE_STATUS.ENROUTE, CASE_STATUS.HANDOVER_INITIATED,
    CASE_STATUS.HANDOVER_ACKNOWLEDGED, CASE_STATUS.COMPLETED,
];

export default function CaseStatusBadge({ caseData, showDetails = false }) {
    const [countdown, setCountdown] = useState(null);
    const timerRef = useRef(null);

    // Batch-translate all status labels at once (efficient single API call)
    const { translated: labelArray } = useTBatch(STATUS_LABEL_KEYS);

    // Build translated label map
    const labelMap = {};
    STATUS_ORDER.forEach((statusKey, i) => {
        labelMap[statusKey] = labelArray?.[i] || STATUS_LABEL_KEYS[i];
    });

    // Translated detail strings
    const { translated: detailLabels } = useTBatch([
        TK.ESC_REJECTIONS_OF,   // 0 — "rejections"
        TK.ESC_OVERRIDE,        // 1 — "Override"
        TK.ESC_HANDOVER_PENDING,   // 2 — "Handover Pending"
        TK.ESC_HANDOVER_RECEIVED,  // 3 — "Handover Received"
    ]);

    const tRejections = detailLabels?.[0] || 'rejections';
    const tOverride = detailLabels?.[1] || 'Override';
    const tHOPending = detailLabels?.[2] || 'Handover Pending';
    const tHOReceived = detailLabels?.[3] || 'Handover Received';

    const status = caseData?.status || 'created';
    const visual = STATUS_VISUAL[status] || STATUS_VISUAL[CASE_STATUS.CREATED];
    const label = labelMap[status] || status;
    const StatusIcon = visual.icon;

    // Countdown for awaiting_response
    useEffect(() => {
        if (status !== CASE_STATUS.AWAITING_RESPONSE) {
            setCountdown(null);
            clearInterval(timerRef.current);
            return;
        }
        const update = () => setCountdown(getTimeoutRemaining(caseData));
        update();
        timerRef.current = setInterval(update, 1000);
        return () => clearInterval(timerRef.current);
    }, [status, caseData?.awaitingResponseSince, caseData?.acuityLevel]);

    const isUrgent = status === CASE_STATUS.ESCALATION_REQUIRED;
    const rejections = caseData?.rejectionCount || 0;
    const thresholds = getEscalationThreshold(caseData?.acuityLevel || 3);

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
            {/* Status pill */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: visual.bg, border: `1px solid ${visual.color}44`,
                borderRadius: '999px', padding: '3px 10px',
                animation: isUrgent ? 'statusPulse 1.2s ease-in-out infinite' : 'none',
            }}>
                {StatusIcon && <StatusIcon size={12} color={visual.color} />}
                <span style={{ color: visual.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {label}
                </span>
            </div>

            {/* Detail row */}
            {showDetails && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {rejections > 0 && (
                        <span style={{
                            fontSize: '10px',
                            color: rejections >= thresholds.maxRejections ? '#f87171' : '#94a3b8',
                            fontWeight: 600,
                        }}>
                            {rejections}/{thresholds.maxRejections} {tRejections}
                        </span>
                    )}

                    {countdown !== null && countdown >= 0 && (
                        <span style={{
                            fontSize: '10px', fontFamily: 'monospace', fontWeight: 700,
                            color: countdown <= 15 ? '#ef4444' : '#fbbf24',
                        }}>
                            ⏱ {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                    )}

                    {caseData?.overrideUsed && (
                        <span style={{ fontSize: '10px', color: '#fb923c', fontWeight: 600 }}>
                            ⚠ {tOverride}
                        </span>
                    )}

                    {caseData?.handoverStatus === 'initiated' && (
                        <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>
                            🟣 {tHOPending}
                        </span>
                    )}
                    {caseData?.handoverStatus === 'acknowledged' && (
                        <span style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: 600 }}>
                            🟢 {tHOReceived}
                        </span>
                    )}
                </div>
            )}

            <style>{`
                @keyframes statusPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.15); }
                }
            `}</style>
        </div>
    );
}
