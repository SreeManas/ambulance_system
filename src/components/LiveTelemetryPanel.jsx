/**
 * LiveTelemetryPanel.jsx — Live Patient Vitals Streaming (Simulation)
 *
 * Simulates real-time telemetry from ambulance-connected patient monitoring.
 * Updates HR, SpO2, BP, RR every 3–5 seconds with realistic drift.
 * Color-codes values: red if critical, amber if borderline, green if normal.
 *
 * Props: none (self-contained demo component)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Zap, Wind } from 'lucide-react';

// ─── Vital sign threshold rules ──────────────────────────────────────────────
function getVitalStatus(key, value) {
    const rules = {
        hr: { red: v => v > 130 || v < 50, amber: v => v > 100 || v < 60 },
        spo2: { red: v => v < 90, amber: v => v < 95 },
        sbp: { red: v => v < 90 || v > 160, amber: v => v < 100 || v > 140 },
        rr: { red: v => v > 30 || v < 8, amber: v => v > 20 || v < 12 },
    };
    const rule = rules[key];
    if (!rule) return 'normal';
    if (rule.red(value)) return 'critical';
    if (rule.amber(value)) return 'warning';
    return 'normal';
}

// ─── Random drift within bounds ───────────────────────────────────────────────
function drift(value, delta, min, max) {
    const next = value + (Math.random() * delta * 2 - delta);
    return Math.round(Math.min(max, Math.max(min, next)));
}

// ─── Status colors ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
    critical: { text: '#f87171', bg: '#450a0a', border: '#dc2626', pulse: true },
    warning: { text: '#fbbf24', bg: '#451a03', border: '#d97706', pulse: false },
    normal: { text: '#4ade80', bg: '#052e16', border: '#16a34a', pulse: false },
};

// ─── Single Vital Card ────────────────────────────────────────────────────────
function VitalCard({ icon: Icon, label, value, unit, statusKey }) {
    const status = getVitalStatus(statusKey, value);
    const c = STATUS_COLORS[status];
    return (
        <div style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Pulse ring for critical values */}
            {c.pulse && (
                <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px',
                    background: c.text, borderRadius: '50%',
                    animation: 'pulseRing 1.2s infinite',
                }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={13} color={c.text} />
                <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {label}
                </span>
                {status === 'critical' && (
                    <span style={{ color: c.text, fontSize: '9px', fontWeight: 700, background: '#7f1d1d', padding: '1px 6px', borderRadius: '999px', marginLeft: 'auto' }}>
                        ⚠ ALERT
                    </span>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ color: c.text, fontSize: '26px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {value}
                </span>
                <span style={{ color: '#475569', fontSize: '11px', fontWeight: 600 }}>{unit}</span>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveTelemetryPanel({ caseId }) {
    const [vitals, setVitals] = useState({
        hr: 118,
        spo2: 91,
        sbp: 92,
        dbp: 60,
        rr: 24,
    });
    const [tick, setTick] = useState(0);
    const [live, setLive] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!live) return;
        const intervalMs = 3000 + Math.random() * 2000; // 3–5s
        timerRef.current = setTimeout(() => {
            setVitals(prev => ({
                hr: drift(prev.hr, 8, 40, 180),
                spo2: drift(prev.spo2, 2, 70, 100),
                sbp: drift(prev.sbp, 6, 60, 200),
                dbp: drift(prev.dbp, 4, 40, 130),
                rr: drift(prev.rr, 3, 6, 40),
            }));
            setTick(t => t + 1);
        }, intervalMs);
        return () => clearTimeout(timerRef.current);
    }, [tick, live]);

    const bpDisplay = `${vitals.sbp}/${vitals.dbp}`;

    return (
        <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#818cf8" />
                    <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '14px' }}>
                        Live Emergency Telemetry
                    </span>
                    {live && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: '#052e16', border: '1px solid #16a34a',
                            color: '#4ade80', fontSize: '10px', fontWeight: 700,
                            padding: '2px 8px', borderRadius: '999px',
                        }}>
                            <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'pulseRing 1.2s infinite' }} />
                            STREAMING
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setLive(v => !v)}
                    style={{
                        background: live ? '#450a0a' : '#052e16',
                        border: `1px solid ${live ? '#dc2626' : '#16a34a'}`,
                        color: live ? '#f87171' : '#4ade80',
                        fontSize: '11px', fontWeight: 700,
                        padding: '4px 10px', borderRadius: '6px',
                        cursor: 'pointer',
                    }}
                >
                    {live ? '⏹ Pause' : '▶ Resume'}
                </button>
            </div>

            {caseId && (
                <div style={{ padding: '4px 16px', background: '#020617', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ color: '#475569', fontSize: '10px', fontFamily: 'monospace' }}>
                        Patient feed — {caseId}
                    </span>
                </div>
            )}

            {/* Vitals grid */}
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <VitalCard icon={Heart} label="Heart Rate" value={vitals.hr} unit="bpm" statusKey="hr" />
                <VitalCard icon={Activity} label="SpO₂" value={vitals.spo2} unit="%" statusKey="spo2" />
                <VitalCard icon={Zap} label="Blood Pressure" value={bpDisplay} unit="mmHg" statusKey="sbp" />
                <VitalCard icon={Wind} label="Respiratory Rate" value={vitals.rr} unit="breaths/min" statusKey="rr" />
            </div>

            <div style={{ padding: '6px 16px 10px', color: '#475569', fontSize: '9px', borderTop: '1px solid #1e293b' }}>
                ⚡ Simulated telemetry feed · Updates every 3–5s · For demonstration purposes only
            </div>

            <style>{`
                @keyframes pulseRing {
                    0%   { opacity: 1; transform: scale(1); }
                    50%  { opacity: 0.5; transform: scale(1.5); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
