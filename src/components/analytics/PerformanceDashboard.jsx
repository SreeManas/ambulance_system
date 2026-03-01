/**
 * PerformanceDashboard.jsx — Response Time Analytics & Performance Intelligence
 *
 * Sections:
 * 1. Core Metrics Cards (Avg Acceptance, Enroute, P90, Golden Hour)
 * 2. Escalation Insights (rate, override, avg rejections, delay)
 * 3. Hospital Responsiveness Table
 * 4. Response Time Distribution (div-based bar chart)
 *
 * Access: admin, dispatcher, command_center
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { Navigate } from 'react-router-dom';
import { computeAllAnalytics } from '../../services/analyticsService.js';
import {
    Activity, Clock, AlertTriangle, Shield, TrendingUp, TrendingDown,
    BarChart3, Loader2, RefreshCw, Timer, Zap, Heart
} from 'lucide-react';

const ALLOWED_ROLES = ['admin', 'dispatcher', 'command_center'];

const TIME_WINDOWS = [
    { key: '24h', label: 'Last 24 Hours' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'all', label: 'All Time' },
];

// Benchmark thresholds (minutes)
const BENCHMARKS = {
    acceptance: { green: 5, red: 10 },
    enroute: { green: 8, red: 15 },
    p90Acceptance: { green: 8, red: 15 },
    goldenHour: { green: 80, red: 50 },
};

function getBenchmarkColor(value, benchmark, higherIsBetter = false) {
    if (value === 0 || value === null) return '#64748b';
    if (higherIsBetter) {
        if (value >= benchmark.green) return '#22c55e';
        if (value >= benchmark.red) return '#f59e0b';
        return '#ef4444';
    }
    if (value <= benchmark.green) return '#22c55e';
    if (value <= benchmark.red) return '#f59e0b';
    return '#ef4444';
}

export default function PerformanceDashboard() {
    const { role } = useAuth();
    const [timeWindow, setTimeWindow] = useState('7d');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const prevAnalyticsRef = useRef(null);

    // Role guard
    if (!ALLOWED_ROLES.includes(role)) {
        return <Navigate to="/not-authorized" replace />;
    }

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await computeAllAnalytics(timeWindow);
            prevAnalyticsRef.current = analytics;
            setAnalytics(data);
        } catch (err) {
            console.error('Analytics fetch failed:', err);
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [timeWindow]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Memoize computed values
    const core = useMemo(() => analytics?.core || {}, [analytics]);
    const goldenHour = useMemo(() => analytics?.goldenHour || {}, [analytics]);
    const escalation = useMemo(() => analytics?.escalation || {}, [analytics]);
    const hospitals = useMemo(() => analytics?.hospitals || [], [analytics]);
    const distribution = useMemo(() => analytics?.distribution || [], [analytics]);
    const totalCases = analytics?.totalCases || 0;

    // Trend indicator (compare current vs previous)
    const getTrend = (current, prevKey) => {
        const prev = prevAnalyticsRef.current;
        if (!prev) return null;
        const prevVal = prevKey.split('.').reduce((o, k) => o?.[k], prev);
        if (prevVal === undefined || prevVal === null) return null;
        if (current > prevVal) return 'up';
        if (current < prevVal) return 'down';
        return 'same';
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            padding: '24px',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div>
                    <h1 style={{
                        color: '#f1f5f9', fontSize: '24px', fontWeight: 800, margin: 0,
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <BarChart3 size={24} color="#3b82f6" />
                        Performance Intelligence
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                        Real-time operational KPIs • {totalCases} case{totalCases !== 1 ? 's' : ''} analyzed
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Time window selector */}
                    <div style={{
                        display: 'flex', background: '#1e293b', borderRadius: '10px',
                        border: '1px solid #334155', overflow: 'hidden',
                    }}>
                        {TIME_WINDOWS.map(tw => (
                            <button
                                key={tw.key}
                                onClick={() => setTimeWindow(tw.key)}
                                id={`tw-${tw.key}`}
                                style={{
                                    padding: '6px 14px', border: 'none', fontSize: '12px',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                    background: timeWindow === tw.key ? '#3b82f6' : 'transparent',
                                    color: timeWindow === tw.key ? 'white' : '#94a3b8',
                                }}
                            >
                                {tw.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        id="btn-refresh-analytics"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 12px', background: '#334155', color: '#94a3b8',
                            border: 'none', borderRadius: '8px', fontSize: '12px',
                            cursor: 'pointer', fontWeight: 600,
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Loading / Error */}
            {loading && !analytics && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                    <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            {error && (
                <div style={{
                    background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '10px',
                    padding: '16px', color: '#fca5a5', fontSize: '13px', marginBottom: '20px',
                }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    {error}
                </div>
            )}

            {/* Zero cases message */}
            {!loading && analytics && totalCases === 0 && (
                <div style={{
                    background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
                    padding: '48px', textAlign: 'center', color: '#64748b',
                }}>
                    <BarChart3 size={40} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#94a3b8' }}>No cases in this time window</p>
                    <p style={{ fontSize: '13px' }}>Analytics will populate as cases move through the lifecycle.</p>
                </div>
            )}

            {analytics && totalCases > 0 && (
                <>
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 1 — Core Metrics Cards                            */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '14px', marginBottom: '24px',
                    }}>
                        <MetricCard
                            icon={<Clock size={18} />}
                            label="Avg Acceptance Time"
                            value={core.avgTimeToAcceptance}
                            unit="min"
                            color={getBenchmarkColor(core.avgTimeToAcceptance, BENCHMARKS.acceptance)}
                            sample={core.sampleSizes?.acceptance}
                        />
                        <MetricCard
                            icon={<Timer size={18} />}
                            label="Avg Enroute Time"
                            value={core.avgTimeToEnroute}
                            unit="min"
                            color={getBenchmarkColor(core.avgTimeToEnroute, BENCHMARKS.enroute)}
                            sample={core.sampleSizes?.enroute}
                        />
                        <MetricCard
                            icon={<TrendingUp size={18} />}
                            label="P90 Acceptance"
                            value={core.p90Acceptance}
                            unit="min"
                            color={getBenchmarkColor(core.p90Acceptance, BENCHMARKS.p90Acceptance)}
                        />
                        <MetricCard
                            icon={<Heart size={18} />}
                            label="Golden Hour Compliance"
                            value={goldenHour.pctAccepted8}
                            unit="%"
                            color={getBenchmarkColor(goldenHour.pctAccepted8, BENCHMARKS.goldenHour, true)}
                            subtitle={`${goldenHour.total || 0} critical cases`}
                        />
                        <MetricCard
                            icon={<Activity size={18} />}
                            label="Avg Hospital Response"
                            value={core.avgHospitalResponseTime}
                            unit="min"
                            color={getBenchmarkColor(core.avgHospitalResponseTime, BENCHMARKS.acceptance)}
                            sample={core.sampleSizes?.response}
                        />
                        <MetricCard
                            icon={<Zap size={18} />}
                            label="Avg First Notification"
                            value={core.avgTimeToFirstNotification}
                            unit="min"
                            color={getBenchmarkColor(core.avgTimeToFirstNotification, { green: 1, red: 3 })}
                            sample={core.sampleSizes?.notification}
                        />
                    </div>

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 2 — Escalation Insights                           */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    <h2 style={{
                        color: '#e2e8f0', fontSize: '16px', fontWeight: 700, margin: '0 0 12px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <AlertTriangle size={16} color="#f59e0b" /> Escalation Intelligence
                    </h2>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '14px', marginBottom: '24px',
                    }}>
                        <InsightCard
                            label="Escalation Rate"
                            value={escalation.pctEscalated}
                            unit="%"
                            trend={getTrend(escalation.pctEscalated, 'escalation.pctEscalated')}
                            color={escalation.pctEscalated > 30 ? '#ef4444' : escalation.pctEscalated > 15 ? '#f59e0b' : '#22c55e'}
                        />
                        <InsightCard
                            label="Override Rate"
                            value={escalation.pctOverride}
                            unit="%"
                            trend={getTrend(escalation.pctOverride, 'escalation.pctOverride')}
                            color={escalation.pctOverride > 20 ? '#ef4444' : '#f59e0b'}
                        />
                        <InsightCard
                            label="Avg Rejections Before Escalation"
                            value={escalation.avgRejectionsBeforeEscalation}
                            unit=""
                            color="#94a3b8"
                        />
                        <InsightCard
                            label="Avg Escalation Delay"
                            value={escalation.avgEscalationDelay}
                            unit="min"
                            color="#94a3b8"
                        />
                    </div>

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 3 — Hospital Responsiveness Table                 */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    <h2 style={{
                        color: '#e2e8f0', fontSize: '16px', fontWeight: 700, margin: '0 0 12px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Activity size={16} color="#3b82f6" /> Hospital Responsiveness
                    </h2>

                    {hospitals.length > 0 ? (
                        <div style={{
                            background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
                            overflow: 'hidden', marginBottom: '24px',
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                        {['Hospital Name', 'Avg Response', 'Accept %', 'Reject %', 'Escalation %'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 14px', textAlign: 'left',
                                                color: '#64748b', fontWeight: 600, fontSize: '11px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {hospitals.map((h, i) => {
                                        const isSlowest = i === hospitals.length - 1 && hospitals.length > 1;
                                        return (
                                            <tr key={h.hospitalId} style={{
                                                borderBottom: '1px solid #334155',
                                                background: isSlowest ? '#2c1a1a' : 'transparent',
                                            }}>
                                                <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>
                                                    {h.hospitalName}
                                                    {isSlowest && <span style={{ color: '#f87171', fontSize: '10px', marginLeft: 6 }}>Slowest</span>}
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                                                    <span style={{ color: getBenchmarkColor(h.avgResponseTime, BENCHMARKS.acceptance), fontWeight: 700 }}>
                                                        {h.avgResponseTime}
                                                    </span> min
                                                </td>
                                                <td style={{ padding: '10px 14px', color: h.acceptanceRate >= 70 ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                                                    {h.acceptanceRate}%
                                                </td>
                                                <td style={{ padding: '10px 14px', color: h.rejectionRate > 40 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                                                    {h.rejectionRate}%
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                                                    {h.escalationPct}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{
                            background: '#1e293b', borderRadius: '12px', padding: '24px',
                            textAlign: 'center', color: '#64748b', fontSize: '13px',
                            marginBottom: '24px', border: '1px solid #334155',
                        }}>
                            No hospital notification data available.
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 4 — Response Time Distribution                    */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    <h2 style={{
                        color: '#e2e8f0', fontSize: '16px', fontWeight: 700, margin: '0 0 12px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <BarChart3 size={16} color="#8b5cf6" /> Response Time Distribution
                    </h2>

                    <div style={{
                        background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
                        padding: '20px', marginBottom: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
                            {distribution.map((b, i) => {
                                const barColors = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
                                return (
                                    <div key={b.label} style={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                                    }}>
                                        <span style={{
                                            color: '#e2e8f0', fontSize: '12px', fontWeight: 700, marginBottom: '4px',
                                        }}>
                                            {b.count}
                                        </span>
                                        <div style={{
                                            width: '100%', maxWidth: '60px',
                                            height: `${Math.max(b.pct, 4)}%`,
                                            background: `linear-gradient(180deg, ${barColors[i]}cc, ${barColors[i]}88)`,
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'height 0.5s ease-out',
                                            minHeight: '4px',
                                        }} />
                                        <span style={{
                                            color: '#94a3b8', fontSize: '10px', marginTop: '6px',
                                            textAlign: 'center', fontWeight: 600,
                                        }}>
                                            {b.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* P95 Footer */}
                    <div style={{
                        display: 'flex', gap: '24px', justifyContent: 'center',
                        color: '#64748b', fontSize: '11px', fontWeight: 600, marginBottom: '16px',
                    }}>
                        <span>P90 Acceptance: <strong style={{ color: '#e2e8f0' }}>{core.p90Acceptance} min</strong></span>
                        <span>P95 Acceptance: <strong style={{ color: '#e2e8f0' }}>{core.p95Acceptance} min</strong></span>
                        <span>P90 Enroute: <strong style={{ color: '#e2e8f0' }}>{core.p90Enroute} min</strong></span>
                        <span>P95 Enroute: <strong style={{ color: '#e2e8f0' }}>{core.p95Enroute} min</strong></span>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({ icon, label, value, unit, color, sample, subtitle }) {
    return (
        <div style={{
            background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                {icon}
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ color, fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>
                    {value ?? 'N/A'}
                </span>
                {unit && <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>{unit}</span>}
            </div>
            {(sample !== undefined || subtitle) && (
                <span style={{ color: '#475569', fontSize: '10px', fontWeight: 500 }}>
                    {subtitle || `${sample} sample${sample !== 1 ? 's' : ''}`}
                </span>
            )}
        </div>
    );
}

function InsightCard({ label, value, unit, trend, color }) {
    return (
        <div style={{
            background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
            padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color, fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>
                    {value ?? 'N/A'}
                </span>
                {unit && <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>{unit}</span>}
                {trend === 'up' && <TrendingUp size={14} color="#ef4444" />}
                {trend === 'down' && <TrendingDown size={14} color="#22c55e" />}
            </div>
        </div>
    );
}
