/**
 * EscalationOverridePanel.jsx — Dispatcher Constrained Override Panel
 *
 * Shown when a case reaches escalation_required status.
 * Displays re-ranked hospitals (with rejection penalty 0.85x),
 * least-risk recommendation, and override confirmation workflow.
 */

import React, { useState, useMemo } from 'react';
import {
    confirmDispatcherOverride,
    rerankWithRejectionPenalty,
    CASE_STATUS,
} from '../../services/hospitalResponseEngine.js';
import { AlertTriangle, Shield, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function EscalationOverridePanel({ caseData, rankedHospitals, onOverrideComplete }) {
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState(null);

    // Re-rank with rejection penalty
    const reranked = useMemo(() => {
        if (!rankedHospitals?.length) return [];
        return rerankWithRejectionPenalty(rankedHospitals, caseData.hospitalNotifications);
    }, [rankedHospitals, caseData.hospitalNotifications]);

    const leastRisk = reranked.length > 0 ? reranked[0] : null;

    const handleConfirmOverride = async () => {
        if (!selectedHospitalId) return;
        setConfirming(true);
        setError(null);
        try {
            await confirmDispatcherOverride(caseData.id, selectedHospitalId);
            onOverrideComplete?.(selectedHospitalId);
        } catch (err) {
            setError(err.message || 'Override failed');
        } finally {
            setConfirming(false);
        }
    };

    if (caseData.status !== CASE_STATUS.ESCALATION_REQUIRED) return null;

    return (
        <div style={{
            border: '2px solid #dc2626',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0f172a',
            animation: 'escalationPulse 1.5s ease-in-out infinite',
        }}>
            {/* Warning header */}
            <div style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
            }}>
                <AlertTriangle size={20} color="white" />
                <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>
                        ESCALATION REQUIRED
                    </p>
                    <p style={{ color: '#fecaca', fontSize: '11px', margin: '2px 0 0' }}>
                        {caseData.escalationReason === 'rejections' && 'All hospitals rejected this case.'}
                        {caseData.escalationReason === 'timeout' && 'Response timeout exceeded.'}
                        {caseData.escalationReason === 'both' && 'Rejection limit reached + timeout exceeded.'}
                    </p>
                </div>
            </div>

            {/* Rejection summary */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                    <span>Rejections: <strong style={{ color: '#f87171' }}>{caseData.rejectionCount || 0}</strong></span>
                    <span>Notifications: <strong style={{ color: '#e2e8f0' }}>{(caseData.hospitalNotifications || []).length}</strong></span>
                    <span>Case ID: <strong style={{ color: '#e2e8f0' }}>{caseData.id?.slice(0, 8)}…</strong></span>
                </div>
            </div>

            {/* Least-risk recommendation */}
            {leastRisk && (
                <div style={{
                    margin: '12px 16px',
                    padding: '10px 14px',
                    background: '#1e293b',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                }}>
                    <p style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                        ⚡ RECOMMENDED LEAST-RISK OPTION
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '14px', margin: 0 }}>
                                {leastRisk.hospitalName}
                            </p>
                            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0' }}>
                                Score: {leastRisk.suitabilityScore} | {leastRisk.distanceKm} km | ETA: {leastRisk.etaMinutes} min
                                {leastRisk.rejectionPenaltyApplied && (
                                    <span style={{ color: '#f97316', marginLeft: 6 }}>⚠ 0.85x penalty</span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedHospitalId(leastRisk.hospitalId)}
                            style={{
                                background: selectedHospitalId === leastRisk.hospitalId ? '#16a34a' : '#3b82f6',
                                color: 'white', border: 'none', borderRadius: '8px',
                                padding: '6px 14px', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                            }}
                        >
                            {selectedHospitalId === leastRisk.hospitalId ? '✓ Selected' : 'Select'}
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle full list */}
            <button
                onClick={() => setExpanded(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    width: '100%', background: 'transparent', border: 'none',
                    color: '#64748b', fontSize: '12px', padding: '6px 16px',
                    cursor: 'pointer', justifyContent: 'center',
                }}
            >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? 'Hide full ranking' : `Show all ${reranked.length} hospitals`}
            </button>

            {/* Full re-ranked list */}
            {expanded && (
                <div style={{ padding: '0 16px 10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {reranked.map((h, i) => (
                        <div key={h.hospitalId} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 10px', borderRadius: '6px', marginBottom: '4px',
                            background: selectedHospitalId === h.hospitalId ? '#1e3a5f' : '#1e293b',
                            border: selectedHospitalId === h.hospitalId ? '1px solid #3b82f6' : '1px solid transparent',
                            cursor: 'pointer',
                        }}
                            onClick={() => !h.disqualified && setSelectedHospitalId(h.hospitalId)}
                        >
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '11px', marginRight: 6 }}>#{i + 1}</span>
                                <span style={{ color: h.disqualified ? '#64748b' : '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>
                                    {h.hospitalName}
                                </span>
                                {h.rejectionPenaltyApplied && (
                                    <span style={{ color: '#f97316', fontSize: '10px', marginLeft: 6 }}>
                                        (penalty: {h.originalScore} → {h.suitabilityScore})
                                    </span>
                                )}
                                {h.disqualified && (
                                    <span style={{ color: '#ef4444', fontSize: '10px', marginLeft: 6 }}>DISQUALIFIED</span>
                                )}
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                                {h.suitabilityScore}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm override */}
            <div style={{ padding: '10px 16px 14px' }}>
                {error && (
                    <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px' }}>{error}</p>
                )}
                <button
                    onClick={handleConfirmOverride}
                    disabled={!selectedHospitalId || confirming}
                    id="btn-confirm-override"
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: selectedHospitalId ? 'linear-gradient(135deg, #d97706, #b45309)' : '#334155',
                        color: 'white', border: 'none', borderRadius: '8px',
                        padding: '10px', fontWeight: 700, fontSize: '13px',
                        cursor: selectedHospitalId ? 'pointer' : 'not-allowed',
                        opacity: confirming ? 0.6 : 1,
                    }}
                >
                    <Shield size={16} />
                    {confirming ? 'Confirming Override...' : 'CONFIRM DISPATCHER OVERRIDE'}
                </button>
                <p style={{ color: '#57534e', fontSize: '10px', margin: '6px 0 0', textAlign: 'center' }}>
                    Override will be logged in the escalation audit trail.
                </p>
            </div>

            <style>{`
                @keyframes escalationPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); }
                    50% { box-shadow: 0 0 24px 8px rgba(220, 38, 38, 0.15); }
                }
            `}</style>
        </div>
    );
}
