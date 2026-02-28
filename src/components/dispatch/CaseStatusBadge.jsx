/**
 * CaseStatusBadge.jsx — Case status visual indicator for Command Center
 *
 * Displays:
 *  - Awaiting Response (yellow)
 *  - Escalation Required (red pulse)
 *  - Override Active (orange)
 *  - Accepted (green)
 *  - Rejection count
 *  - Countdown timer
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    CASE_STATUS,
    getTimeoutRemaining,
    getEscalationThreshold,
} from '../../services/hospitalResponseEngine.js';
import { Clock, AlertTriangle, Shield, Check, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
    [CASE_STATUS.CREATED]: { label: 'Created', color: '#64748b', bg: '#1e293b', icon: null },
    [CASE_STATUS.TRIAGED]: { label: 'Triaged', color: '#818cf8', bg: '#1e1b4b', icon: null },
    [CASE_STATUS.DISPATCHED]: { label: 'Dispatched', color: '#38bdf8', bg: '#0c4a6e', icon: null },
    [CASE_STATUS.AWAITING_RESPONSE]: { label: 'Awaiting Response', color: '#fbbf24', bg: '#422006', icon: Clock },
    [CASE_STATUS.ACCEPTED]: { label: 'Accepted', color: '#4ade80', bg: '#052e16', icon: Check },
    [CASE_STATUS.REJECTED]: { label: 'Rejected', color: '#f87171', bg: '#450a0a', icon: null },
    [CASE_STATUS.ESCALATION_REQUIRED]: { label: 'Escalation Required', color: '#ef4444', bg: '#450a0a', icon: AlertTriangle },
    [CASE_STATUS.DISPATCHER_OVERRIDE]: { label: 'Override Active', color: '#fb923c', bg: '#431407', icon: Shield },
    [CASE_STATUS.ENROUTE]: { label: 'En Route', color: '#38bdf8', bg: '#0c4a6e', icon: null },
    [CASE_STATUS.COMPLETED]: { label: 'Completed', color: '#4ade80', bg: '#052e16', icon: Check },
};

export default function CaseStatusBadge({ caseData, showDetails = false }) {
    const [countdown, setCountdown] = useState(null);
    const timerRef = useRef(null);

    const status = caseData?.status || 'created';
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[CASE_STATUS.CREATED];
    const StatusIcon = config.icon;

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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: config.bg,
                border: `1px solid ${config.color}44`,
                borderRadius: '999px',
                padding: '3px 10px',
                animation: isUrgent ? 'statusPulse 1.2s ease-in-out infinite' : 'none',
            }}>
                {StatusIcon && <StatusIcon size={12} color={config.color} />}
                <span style={{
                    color: config.color,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                }}>
                    {config.label}
                </span>
            </div>

            {/* Detail row (countdown, rejection count) */}
            {showDetails && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Rejection count */}
                    {rejections > 0 && (
                        <span style={{
                            fontSize: '10px',
                            color: rejections >= thresholds.maxRejections ? '#f87171' : '#94a3b8',
                            fontWeight: 600,
                        }}>
                            {rejections}/{thresholds.maxRejections} rejections
                        </span>
                    )}

                    {/* Countdown */}
                    {countdown !== null && countdown >= 0 && (
                        <span style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: countdown <= 15 ? '#ef4444' : '#fbbf24',
                        }}>
                            ⏱ {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                    )}

                    {/* Override indicator */}
                    {caseData?.overrideUsed && (
                        <span style={{ fontSize: '10px', color: '#fb923c', fontWeight: 600 }}>
                            ⚠ Override
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
