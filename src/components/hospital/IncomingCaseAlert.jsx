/**
 * IncomingCaseAlert.jsx — Hospital Incoming Case Alert Card
 *
 * Displays incoming emergency case notification to hospital staff.
 * Accept or Reject with mandatory reason selection.
 * Shows patient acuity, vitals summary, and countdown timer.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    handleHospitalAccept,
    handleHospitalReject,
    REJECTION_REASONS,
    getTimeoutRemaining,
} from '../../services/hospitalResponseEngine.js';
import { AlertTriangle, Check, X, Clock, Activity, ChevronDown } from 'lucide-react';

const ACUITY_COLORS = {
    1: { bg: '#dc2626', text: 'IMMEDIATE', pulseColor: '#fca5a5' },
    2: { bg: '#ea580c', text: 'CRITICAL', pulseColor: '#fdba74' },
    3: { bg: '#d97706', text: 'URGENT', pulseColor: '#fcd34d' },
    4: { bg: '#2563eb', text: 'DELAYED', pulseColor: '#93c5fd' },
    5: { bg: '#16a34a', text: 'MINOR', pulseColor: '#86efac' },
};

export default function IncomingCaseAlert({ caseData, hospitalId, onActionComplete }) {
    const [showRejectPanel, setShowRejectPanel] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [otherReasonText, setOtherReasonText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef(null);

    const acuity = caseData.acuityLevel || 3;
    const acuityConfig = ACUITY_COLORS[acuity] || ACUITY_COLORS[3];

    // Countdown timer
    useEffect(() => {
        const update = () => setCountdown(getTimeoutRemaining(caseData));
        update();
        timerRef.current = setInterval(update, 1000);
        return () => clearInterval(timerRef.current);
    }, [caseData.awaitingResponseSince, caseData.acuityLevel]);

    const handleAccept = async () => {
        setProcessing(true);
        try {
            await handleHospitalAccept(caseData.id, hospitalId);
            onActionComplete?.('accepted');
        } catch (err) {
            console.error('Accept failed:', err);
            alert(err.message || 'Accept failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedReason) return;
        setProcessing(true);
        try {
            const result = await handleHospitalReject(
                caseData.id, hospitalId, selectedReason,
                selectedReason === 'other' ? otherReasonText : ''
            );
            onActionComplete?.('rejected', result.escalated);
        } catch (err) {
            console.error('Reject failed:', err);
            alert(err.message || 'Reject failed');
        } finally {
            setProcessing(false);
            setShowRejectPanel(false);
        }
    };

    const formatCountdown = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            border: `2px solid ${acuityConfig.bg}`,
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0f172a',
            animation: acuity <= 2 ? 'urgentPulse 2s ease-in-out infinite' : 'none',
        }}>
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${acuityConfig.bg}, ${acuityConfig.bg}cc)`,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="white" />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>
                        ⚡ INCOMING CASE
                    </span>
                    <span style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        fontSize: '11px', fontWeight: 700,
                        padding: '2px 8px', borderRadius: '999px',
                    }}>
                        LEVEL {acuity} — {acuityConfig.text}
                    </span>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: countdown <= 15 ? '#dc2626' : 'rgba(0,0,0,0.3)',
                    padding: '4px 10px', borderRadius: '8px',
                    transition: 'background 0.3s',
                }}>
                    <Clock size={14} color="white" />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>
                        {formatCountdown(countdown)}
                    </span>
                </div>
            </div>

            {/* Patient summary */}
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <InfoRow label="Patient" value={caseData.patientName || 'Unknown'} />
                <InfoRow label="Age / Gender" value={`${caseData.age || '—'} / ${caseData.gender || '—'}`} />
                <InfoRow label="Emergency" value={caseData.emergencyContext?.emergencyType || caseData.emergencyType || '—'} />
                <InfoRow label="Heart Rate" value={caseData.primaryVitals?.heartRate ? `${caseData.primaryVitals.heartRate} bpm` : '—'} />
                <InfoRow label="SpO₂" value={caseData.primaryVitals?.spo2 ? `${caseData.primaryVitals.spo2}%` : '—'} />
                <InfoRow label="BP" value={caseData.primaryVitals?.bloodPressure || '—'} />
            </div>

            {/* AI Triage info if available */}
            {caseData.aiTriage && (
                <div style={{
                    margin: '0 16px 10px', padding: '8px 12px',
                    background: '#1e293b', borderRadius: '8px',
                    fontSize: '11px', color: '#94a3b8',
                }}>
                    <Activity size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    AI Triage: <strong style={{ color: '#e2e8f0' }}>{caseData.aiTriage.severityLabel}</strong>
                    {' '} — Confidence: {caseData.aiTriage.confidence}%
                </div>
            )}

            {/* Action buttons */}
            {!showRejectPanel ? (
                <div style={{ padding: '0 16px 14px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleAccept}
                        disabled={processing}
                        id="btn-accept-case"
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                            opacity: processing ? 0.6 : 1,
                        }}
                    >
                        <Check size={16} /> ACCEPT
                    </button>
                    <button
                        onClick={() => setShowRejectPanel(true)}
                        disabled={processing}
                        id="btn-reject-case"
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '10px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                            opacity: processing ? 0.6 : 1,
                        }}
                    >
                        <X size={16} /> REJECT
                    </button>
                </div>
            ) : (
                /* Reject reason panel */
                <div style={{ padding: '0 16px 14px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>
                        Select rejection reason (mandatory):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                        {REJECTION_REASONS.map(r => (
                            <label key={r.id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px', borderRadius: '8px',
                                background: selectedReason === r.id ? '#1e3a5f' : '#1e293b',
                                border: selectedReason === r.id ? '1px solid #3b82f6' : '1px solid #334155',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <input
                                    type="radio"
                                    name="rejectReason"
                                    value={r.id}
                                    checked={selectedReason === r.id}
                                    onChange={() => setSelectedReason(r.id)}
                                    style={{ accentColor: '#3b82f6' }}
                                />
                                <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                                    {r.icon} {r.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {selectedReason === 'other' && (
                        <input
                            type="text"
                            placeholder="Specify reason..."
                            value={otherReasonText}
                            onChange={e => setOtherReasonText(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px', background: '#1e293b',
                                border: '1px solid #334155', borderRadius: '8px',
                                color: '#e2e8f0', fontSize: '13px', marginBottom: '10px',
                            }}
                        />
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleReject}
                            disabled={!selectedReason || processing}
                            style={{
                                flex: 1, padding: '8px', background: selectedReason ? '#dc2626' : '#334155',
                                color: 'white', border: 'none', borderRadius: '8px',
                                fontWeight: 600, fontSize: '13px', cursor: selectedReason ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {processing ? 'Submitting...' : 'Confirm Reject'}
                        </button>
                        <button
                            onClick={() => { setShowRejectPanel(false); setSelectedReason(''); }}
                            style={{
                                padding: '8px 16px', background: '#334155', color: '#94a3b8',
                                border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes urgentPulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${acuityConfig.pulseColor}66; }
                    50% { box-shadow: 0 0 20px 6px ${acuityConfig.pulseColor}33; }
                }
            `}</style>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
            <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, margin: '2px 0 0' }}>
                {value}
            </p>
        </div>
    );
}
