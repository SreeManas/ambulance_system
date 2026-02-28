/**
 * TriagePanel.jsx — AI Vital-Sign Triage UI
 *
 * Displays the triage button, spinner, acuity badge,
 * confidence progress bar, collapsible reasoning panel,
 * and AI disclaimer.
 *
 * Props:
 *   triageResult  — result object from runAITriage() or null
 *   isLoading     — boolean
 *   onRunTriage   — callback()
 *   error         — error string or null
 */

import React, { useState } from 'react';
import { SEVERITY_CONFIG } from '../../services/triageService.js';
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Loader2, Zap } from 'lucide-react';

export default function TriagePanel({ triageResult, isLoading, onRunTriage, error }) {
    const [expanded, setExpanded] = useState(false);

    const config = triageResult?.acuity_level ? SEVERITY_CONFIG[triageResult.acuity_level] : null;

    return (
        <div style={{
            border: '1px solid #334155',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0f172a',
            marginTop: '8px',
        }}>
            {/* ── Header bar ─────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={18} color="#818cf8" />
                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>
                        AI Triage Engine
                    </span>
                    <span style={{
                        fontSize: '10px',
                        background: '#312e81',
                        color: '#a5b4fc',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                    }}>
                        START / SALT
                    </span>
                </div>

                {/* Run / status button */}
                <button
                    type="button"
                    onClick={onRunTriage}
                    disabled={isLoading}
                    id="btn-run-ai-triage"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isLoading ? '#334155' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {isLoading
                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                        : <><Zap size={14} /> Calculate AI Triage</>
                    }
                </button>
            </div>

            {/* ── Error state ─────────────────────────────────────────── */}
            {error && !isLoading && (
                <div style={{
                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                    padding: '12px 16px', background: '#450a0a',
                    borderTop: '1px solid #7f1d1d',
                }}>
                    <AlertTriangle size={16} color="#f87171" style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: '12px' }}>{error}</span>
                </div>
            )}

            {/* ── Insufficient data notice ─────────────────────────────── */}
            {triageResult?.error === 'insufficient_data' && !isLoading && (
                <div style={{
                    padding: '12px 16px',
                    background: '#1c1917',
                    borderTop: '1px solid #292524',
                    color: '#a8a29e',
                    fontSize: '12px',
                }}>
                    ⚠️ Insufficient vitals for AI triage. Please enter Heart Rate, SpO₂, or Respiratory Rate and try again.
                </div>
            )}

            {/* ── Result panel ─────────────────────────────────────────── */}
            {triageResult && !triageResult.error && config && !isLoading && (
                <div style={{ borderTop: '1px solid #1e293b' }}>
                    {/* Acuity badge row */}
                    <div style={{
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                        background: '#0f172a',
                    }}>
                        {/* Badge */}
                        <div style={{
                            background: config.color,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            letterSpacing: '0.08em',
                            flexShrink: 0,
                        }}>
                            LEVEL {triageResult.acuity_level} — {config.label}
                        </div>

                        {/* Source pill */}
                        <span style={{
                            fontSize: '10px',
                            background: triageResult.source === 'gemini' ? '#064e3b' : '#1c1917',
                            color: triageResult.source === 'gemini' ? '#6ee7b7' : '#a8a29e',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontWeight: 600,
                        }}>
                            {triageResult.source === 'gemini' ? '✦ Gemini AI' : '⚙ Rule-Based Fallback'}
                        </span>

                        {/* Expand toggle */}
                        <button
                            type="button"
                            onClick={() => setExpanded(v => !v)}
                            style={{
                                marginLeft: 'auto',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                            }}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expanded ? 'Hide' : 'Clinical Detail'}
                        </button>
                    </div>

                    {/* Confidence bar */}
                    <div style={{ padding: '0 16px 12px', background: '#0f172a' }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            color: '#64748b', fontSize: '11px', marginBottom: '5px',
                        }}>
                            <span>Confidence</span>
                            <span style={{ fontWeight: 700, color: '#94a3b8' }}>
                                {triageResult.confidence}%
                            </span>
                        </div>
                        <div style={{
                            height: '6px', borderRadius: '999px',
                            background: '#1e293b', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${triageResult.confidence}%`,
                                background: triageResult.confidence >= 80
                                    ? config.color
                                    : '#d97706',
                                borderRadius: '999px',
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                    </div>

                    {/* Collapsible reasoning section */}
                    {expanded && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#020617',
                            borderTop: '1px solid #1e293b',
                        }}>
                            {/* Reasoning summary */}
                            <p style={{
                                color: '#e2e8f0', fontSize: '13px',
                                lineHeight: '1.5', marginBottom: '12px',
                            }}>
                                {triageResult.reasoning_summary}
                            </p>

                            {/* Clinical flags */}
                            {triageResult.clinical_flags?.length > 0 && (
                                <div>
                                    <div style={{
                                        color: '#64748b', fontSize: '10px',
                                        fontWeight: 700, letterSpacing: '0.1em',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                    }}>
                                        Triggered Clinical Rules
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {triageResult.clinical_flags.map((flag, i) => (
                                            <span key={i} style={{
                                                background: '#1e293b',
                                                border: `1px solid ${config.color}66`,
                                                color: '#e2e8f0',
                                                fontSize: '11px',
                                                padding: '3px 9px',
                                                borderRadius: '6px',
                                            }}>
                                                ⚑ {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Disclaimer ──────────────────────────────────────────── */}
            <div style={{
                padding: '8px 16px',
                background: '#0c0a09',
                borderTop: '1px solid #1c1917',
            }}>
                <p style={{ color: '#57534e', fontSize: '10px', margin: 0 }}>
                    ⚠ AI triage is a decision-support tool only. It does not diagnose, prescribe, or replace paramedic clinical judgment. Final triage authority rests with the attending clinician.
                </p>
            </div>

            {/* Spinner animation */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
