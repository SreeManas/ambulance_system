/**
 * IncomingHandoverCard.jsx — Hospital-side handover acknowledgement
 * All user-facing strings use useT(TK.HO_*) for full i18n compliance.
 */

import React, { useState, useEffect, useRef } from 'react';
import { acknowledgeHandover } from '../../services/handoverService.js';
import {
    User, Heart, Clock, AlertTriangle, CheckCircle, Loader2,
    Camera, Zap, Shield, Activity
} from 'lucide-react';
import { useT } from '../../hooks/useT.js';
import { TK } from '../../constants/translationKeys.js';

const ACUITY_COLORS = {
    1: { bg: '#450a0a', border: '#dc2626', text: '#fca5a5', label: 'IMMEDIATE' },
    2: { bg: '#431407', border: '#ea580c', text: '#fdba74', label: 'CRITICAL' },
    3: { bg: '#422006', border: '#d97706', text: '#fcd34d', label: 'URGENT' },
    4: { bg: '#052e16', border: '#16a34a', text: '#86efac', label: 'MODERATE' },
    5: { bg: '#1e293b', border: '#64748b', text: '#94a3b8', label: 'MINOR' },
};

function toMs(ts) {
    if (!ts) return null;
    if (ts.toMillis) return ts.toMillis();
    if (ts._seconds) return ts._seconds * 1000;
    if (ts.seconds) return ts.seconds * 1000;
    const d = new Date(ts).getTime();
    return isNaN(d) ? null : d;
}

export default function IncomingHandoverCard({ caseData, hospitalId, onAcknowledged }) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [goldenHourRemaining, setGoldenHourRemaining] = useState(null);
    const timerRef = useRef(null);

    // Translate all UI strings
    const tIncoming = useT(TK.HO_INCOMING);
    const tCasePrefix = useT(TK.HO_CASE_PREFIX);
    const tLevel = useT(TK.HO_LEVEL);
    const tCriticalAlert = useT(TK.HO_CRITICAL_ALERT);
    const tPatientInfo = useT(TK.HO_PATIENT_INFO);
    const tVitals = useT(TK.HO_VITALS);
    const tClinicalFlags = useT(TK.HO_CLINICAL_FLAGS);
    const tTimeline = useT(TK.HO_TIMELINE);
    const tPhotos = useT(TK.HO_PHOTOS);
    const tGoldenHour = useT(TK.HO_GOLDEN_HOUR_REMAINING);
    const tCreated = useT(TK.HO_CREATED);
    const tDispatched = useT(TK.HO_DISPATCHED);
    const tAccepted = useT(TK.HO_ACCEPTED);
    const tEnRoute = useT(TK.HO_EN_ROUTE);
    const tOverrideUsed = useT(TK.HO_OVERRIDE_USED);
    const tRejections = useT(TK.HO_REJECTIONS);
    const tName = useT(TK.HO_NAME);
    const tAge = useT(TK.HO_AGE);
    const tGender = useT(TK.HO_GENDER);
    const tEmergency = useT(TK.HO_EMERGENCY);
    const tYrs = useT(TK.HO_YRS);
    const tConfirm = useT(TK.HO_CONFIRM);
    const tConfirming = useT(TK.HO_CONFIRMING);

    const summary = caseData.handoverSummary || {};
    const patient = summary.patient || {};
    const clinical = summary.clinical || {};
    const timeline = summary.timeline || {};
    const operational = summary.operational || {};
    const attachments = summary.attachments || {};
    const vitals = clinical.vitals || {};

    const acuity = clinical.aiTriageLevel || caseData.acuityLevel || 3;
    const acuityStyle = ACUITY_COLORS[acuity] || ACUITY_COLORS[3];

    useEffect(() => {
        const createdMs = toMs(caseData.createdAt);
        if (!createdMs) return;
        const update = () => {
            const elapsed = (Date.now() - createdMs) / 60000;
            setGoldenHourRemaining(Math.max(0, Math.round(60 - elapsed)));
        };
        update();
        timerRef.current = setInterval(update, 10000);
        return () => clearInterval(timerRef.current);
    }, [caseData.createdAt]);

    const handleAcknowledge = async () => {
        if (processing) return;
        setProcessing(true);
        setError(null);
        try {
            await acknowledgeHandover(caseData.id, hospitalId);
            onAcknowledged?.(caseData.id);
        } catch (err) {
            setError(err.message || 'Failed to acknowledge handover');
        } finally {
            setProcessing(false);
        }
    };

    const formatTime = (ts) => {
        const ms = toMs(ts);
        if (!ms) return '—';
        return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            background: '#0f172a', border: `2px solid ${acuityStyle.border}`,
            borderRadius: '16px', overflow: 'hidden',
            boxShadow: `0 0 20px ${acuityStyle.border}22`,
        }}>
            {/* Header */}
            <div style={{
                background: acuityStyle.bg, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${acuityStyle.border}44`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🚑</span>
                    <div>
                        <div style={{ color: acuityStyle.text, fontSize: '14px', fontWeight: 800 }}>
                            {tIncoming}
                        </div>
                        <div style={{ color: acuityStyle.text, fontSize: '11px', opacity: 0.7 }}>
                            {tCasePrefix}{caseData.id?.slice(-6)}
                        </div>
                    </div>
                </div>
                <div style={{
                    background: acuityStyle.border, color: 'white', padding: '4px 12px',
                    borderRadius: '999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em',
                }}>
                    {tLevel} {acuity} — {acuityStyle.label}
                </div>
            </div>

            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Critical alert */}
                {acuity <= 2 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                        background: '#450a0a', border: '1px solid #dc262644', borderRadius: '8px',
                        animation: 'handoverPulse 2s ease-in-out infinite',
                    }}>
                        <AlertTriangle size={14} color="#ef4444" />
                        <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: 700 }}>
                            {tCriticalAlert}
                        </span>
                    </div>
                )}

                {/* Patient Info */}
                <Section icon={<User size={14} />} title={tPatientInfo}>
                    <Row label={tName} value={patient.name} />
                    <Row label={tAge} value={patient.age ? `${patient.age} ${tYrs}` : null} />
                    <Row label={tGender} value={patient.gender} />
                    <Row label={tEmergency} value={operational.emergencyType} />
                </Section>

                {/* Vitals */}
                <Section icon={<Activity size={14} />} title={tVitals}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <VitalChip label="HR" value={vitals.heartRate} unit="bpm" />
                        <VitalChip label="BP" value={vitals.systolicBP && vitals.diastolicBP ? `${vitals.systolicBP}/${vitals.diastolicBP}` : null} unit="mmHg" />
                        <VitalChip label="SpO₂" value={vitals.spO2} unit="%" />
                        <VitalChip label="RR" value={vitals.respiratoryRate} unit="/min" />
                        <VitalChip label="Temp" value={vitals.temperature} unit="°C" />
                        <VitalChip label="GCS" value={clinical.consciousnessLevel} unit="" />
                    </div>
                </Section>

                {/* Clinical Flags */}
                {clinical.clinicalFlags?.length > 0 && (
                    <Section icon={<Zap size={14} />} title={tClinicalFlags}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {clinical.clinicalFlags.map((f, i) => (
                                <span key={i} style={{
                                    background: '#422006', color: '#fcd34d', padding: '2px 8px',
                                    borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                }}>{f}</span>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Timeline */}
                <Section icon={<Clock size={14} />} title={tTimeline}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <Row label={tCreated} value={formatTime(timeline.createdAt)} />
                        <Row label={tDispatched} value={formatTime(timeline.dispatchedAt)} />
                        <Row label={tAccepted} value={formatTime(timeline.acceptedAt)} />
                        <Row label={tEnRoute} value={formatTime(timeline.enrouteAt)} />
                    </div>
                    {timeline.overrideUsed && (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={10} color="#fb923c" />
                            <span style={{ color: '#fb923c', fontSize: '10px', fontWeight: 600 }}>{tOverrideUsed}</span>
                        </div>
                    )}
                </Section>

                {/* Golden Hour */}
                {goldenHourRemaining !== null && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: '8px',
                        background: goldenHourRemaining <= 10 ? '#450a0a' : '#0c4a6e',
                        border: `1px solid ${goldenHourRemaining <= 10 ? '#dc262644' : '#0ea5e944'}`,
                    }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                            ⏱ {tGoldenHour}
                        </span>
                        <span style={{
                            color: goldenHourRemaining <= 10 ? '#ef4444' : '#38bdf8',
                            fontSize: '16px', fontWeight: 800, fontFamily: 'monospace',
                        }}>
                            {goldenHourRemaining} min
                        </span>
                    </div>
                )}

                {/* Photos */}
                {attachments.incidentPhotos?.length > 0 && (
                    <Section icon={<Camera size={14} />} title={`${tPhotos} (${attachments.incidentPhotos.length})`}>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                            {attachments.incidentPhotos.slice(0, 4).map((url, i) => (
                                <img key={i} src={url} alt={`Incident ${i + 1}`} style={{
                                    width: '60px', height: '60px', objectFit: 'cover',
                                    borderRadius: '8px', border: '1px solid #334155',
                                }} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* Rejection count */}
                {operational.rejectionCount > 0 && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {tRejections}: <strong style={{ color: '#f87171' }}>{operational.rejectionCount}</strong>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                        background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '8px',
                        color: '#fca5a5', fontSize: '12px',
                    }}>
                        <AlertTriangle size={12} /> {error}
                    </div>
                )}

                {/* Acknowledge Button */}
                <button
                    onClick={handleAcknowledge}
                    disabled={processing}
                    type="button"
                    id="btn-acknowledge-handover"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '14px',
                        background: processing ? '#065f46' : 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontSize: '14px', fontWeight: 800, cursor: processing ? 'not-allowed' : 'pointer',
                        opacity: processing ? 0.7 : 1, transition: 'all 0.2s',
                        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                    }}
                >
                    {processing
                        ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        : <CheckCircle size={18} />}
                    {processing ? tConfirming : tConfirm}
                </button>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes handoverPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
            `}</style>
        </div>
    );
}

function Section({ icon, title, children }) {
    return (
        <div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#94a3b8', fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
            }}>
                {icon} {title}
            </div>
            {children}
        </div>
    );
}

function Row({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0' }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function VitalChip({ label, value, unit }) {
    return (
        <div style={{
            background: '#1e293b', borderRadius: '8px', padding: '6px 8px',
            textAlign: 'center', border: '1px solid #334155',
        }}>
            <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ color: value ? '#e2e8f0' : '#475569', fontSize: '14px', fontWeight: 800 }}>{value ?? '—'}</div>
            {value && unit && <div style={{ color: '#475569', fontSize: '9px' }}>{unit}</div>}
        </div>
    );
}
