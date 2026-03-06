/**
 * IncomingCaseAlert.jsx — Hospital Incoming Case Notification
 *
 * Displays incoming emergency case details to hospital staff.
 * Shows patient acuity, vitals, and countdown timer.
 * No accept/reject — hospital receives case for information only.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getTimeoutRemaining } from '../../services/hospitalResponseEngine.js';
import { AlertTriangle, Clock, Activity, Ambulance } from 'lucide-react';

const ACUITY_COLORS = {
    1: { bg: '#dc2626', text: 'IMMEDIATE', pulseColor: '#fca5a5' },
    2: { bg: '#ea580c', text: 'CRITICAL', pulseColor: '#fdba74' },
    3: { bg: '#d97706', text: 'URGENT', pulseColor: '#fcd34d' },
    4: { bg: '#2563eb', text: 'DELAYED', pulseColor: '#93c5fd' },
    5: { bg: '#16a34a', text: 'MINOR', pulseColor: '#86efac' },
};

const AMB_TYPE_COLORS = {
    'ICU Ambulance': '#dc2626',
    'Trauma Ambulance': '#ea580c',
    'Cardiac Ambulance': '#6366f1',
    'Basic Ambulance': '#10b981',
    'Neonatal Ambulance': '#d946ef',
};

export default function IncomingCaseAlert({ caseData, hospitalId, onActionComplete }) {
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

    const formatCountdown = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // ── Resolve field paths — Firestore stores under patientInfo / vitals / emergencyContext ──
    const patientName = caseData.patientInfo?.name || caseData.patientName || 'Unknown';
    const age = caseData.patientInfo?.age || caseData.age || '—';
    const gender = caseData.patientInfo?.gender || caseData.gender || '—';
    const emergencyType = caseData.emergencyContext?.emergencyType || caseData.emergencyType || '—';
    const heartRate = caseData.vitals?.heartRate || caseData.primaryVitals?.heartRate || null;
    const spo2 = caseData.vitals?.spo2 || caseData.primaryVitals?.spo2 || null;
    const bp = caseData.vitals?.bloodPressure || caseData.primaryVitals?.bloodPressure || null;
    const rr = caseData.vitals?.respiratoryRate || null;
    const ambType = caseData.ambulanceType || (caseData.aiTriage?.acuityLevel
        ? { 1: 'ICU Ambulance', 2: 'Trauma Ambulance', 3: 'Cardiac Ambulance', 4: 'Basic Ambulance', 5: 'Basic Ambulance' }[caseData.aiTriage.acuityLevel]
        : 'Basic Ambulance');
    const ambColor = AMB_TYPE_COLORS[ambType] || '#10b981';

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
                        ⚡ INCOMING AMBULANCE
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
                        ETA {formatCountdown(countdown)}
                    </span>
                </div>
            </div>

            {/* Ambulance type banner */}
            <div style={{
                background: `${ambColor}18`,
                borderBottom: `1px solid ${ambColor}44`,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <span style={{ fontSize: '16px' }}>🚑</span>
                <span style={{ color: ambColor, fontWeight: 700, fontSize: '13px' }}>
                    {ambType} — En Route to Your Facility
                </span>
                <span style={{
                    marginLeft: 'auto',
                    background: '#052e16',
                    border: '1px solid #16a34a',
                    color: '#4ade80',
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '999px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'liveDot 1.2s infinite' }} />
                    LIVE
                </span>
            </div>

            {/* Patient summary */}
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InfoRow label="Patient" value={patientName} />
                <InfoRow label="Age / Gender" value={`${age} / ${gender}`} />
                <InfoRow label="Emergency" value={emergencyType} />
                <InfoRow label="Heart Rate" value={heartRate ? `${heartRate} bpm` : '—'} critical={heartRate > 130 || heartRate < 50} />
                <InfoRow label="SpO₂" value={spo2 ? `${spo2}%` : '—'} critical={spo2 < 90} />
                <InfoRow label="BP" value={bp || '—'} />
                {rr && <InfoRow label="Resp. Rate" value={`${rr}/min`} critical={rr > 30} />}
            </div>

            {/* AI Triage info */}
            {caseData.aiTriage && (
                <div style={{
                    margin: '0 16px 14px', padding: '10px 12px',
                    background: '#1e293b', borderRadius: '8px',
                    fontSize: '11px', color: '#94a3b8',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                    <div>
                        <Activity size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        AI Triage: <strong style={{ color: '#e2e8f0' }}>{caseData.aiTriage.severityLabel}</strong>
                        {' '}— Confidence: {caseData.aiTriage.confidence}%
                    </div>
                    {caseData.aiTriage.clinicalFlags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {caseData.aiTriage.clinicalFlags.slice(0, 3).map((f, i) => (
                                <span key={i} style={{
                                    background: '#0f172a', border: '1px solid #334155',
                                    color: '#cbd5e1', fontSize: '10px',
                                    padding: '2px 7px', borderRadius: '4px',
                                }}>⚑ {f}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Info-only footer — no actions */}
            <div style={{
                padding: '10px 16px',
                background: '#020617',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <span style={{ fontSize: '13px' }}>🏥</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>
                    Prepare receiving area — ambulance is en route to your facility.
                </span>
            </div>

            <style>{`
                @keyframes urgentPulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${acuityConfig.pulseColor}66; }
                    50% { box-shadow: 0 0 20px 6px ${acuityConfig.pulseColor}33; }
                }
                @keyframes liveDot {
                    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

function InfoRow({ label, value, critical }) {
    return (
        <div>
            <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
            <p style={{
                color: critical ? '#f87171' : '#e2e8f0',
                fontSize: '13px', fontWeight: 600, margin: '2px 0 0',
            }}>
                {value}
            </p>
        </div>
    );
}
