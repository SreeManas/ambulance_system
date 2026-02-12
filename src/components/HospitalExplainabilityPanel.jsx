/**
 * HospitalExplainabilityPanel.jsx
 * Phase-2: AI Explainability Layer
 * 
 * Provides visual breakdown of WHY a hospital was scored the way it was.
 * Shows factor weights, sub-scores, golden hour urgency, and plain-English reasons.
 */
import React, { useMemo, useState } from 'react';
import { useTBatch } from "../hooks/useT";
import {
    Brain, Shield, Stethoscope, Bed,
    Activity, Navigation, Clock, AlertTriangle,
    CheckCircle, ChevronDown, ChevronUp, Zap, TrendingUp
} from 'lucide-react';

// ─── Score Factor Config ──────────────────────────────────────────────
const FACTOR_CONFIG = {
    capability: {
        label: 'Clinical Capability',
        icon: Shield,
        color: '#2563eb',  // blue-600
        bgClass: 'bg-blue-50',
        description: 'Stroke center, cardiac cath lab, burn unit match'
    },
    specialists: {
        label: 'Specialist Match',
        icon: Stethoscope,
        color: '#059669',  // emerald-600
        bgClass: 'bg-emerald-50',
        description: 'Available specialists for this emergency type'
    },
    equipment: {
        label: 'Equipment Ready',
        icon: Zap,
        color: '#9333ea',  // purple-600
        bgClass: 'bg-purple-50',
        description: 'Critical equipment (ventilators, defib) availability'
    },
    beds: {
        label: 'Bed Capacity',
        icon: Bed,
        color: '#dc2626',  // red-600
        bgClass: 'bg-red-50',
        description: 'ICU, emergency, and specialty bed availability'
    },
    load: {
        label: 'Current Load',
        icon: Activity,
        color: '#d97706',  // amber-600
        bgClass: 'bg-amber-50',
        description: 'Ambulance queue size and diversion status penalty'
    },
    distance: {
        label: 'Proximity',
        icon: Navigation,
        color: '#0891b2',  // cyan-600
        bgClass: 'bg-cyan-50',
        description: 'Distance from pickup location (Haversine)'
    }
};

// ─── Factor Bar ───────────────────────────────────────────────────────
function FactorBar({ factorKey, score, weight, maxScore = 100 }) {
    const config = FACTOR_CONFIG[factorKey];
    if (!config) return null;

    const Icon = config.icon;
    const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
    const weightPct = Math.round(weight * 100);
    const contribution = Math.round(score * weight);

    return (
        <div className={`p-3 rounded-xl ${config.bgClass} border border-gray-100 transition-all hover:shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="text-sm font-semibold text-gray-800">{config.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{weightPct}% weight</span>
                    <span className="font-bold text-gray-900">{score}<span className="text-gray-400">/{maxScore}</span></span>
                </div>
            </div>
            <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: config.color }}
                />
            </div>
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">{config.description}</span>
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                    +{contribution} pts
                </span>
            </div>
        </div>
    );
}

// ─── Golden Hour Indicator ────────────────────────────────────────────
function GoldenHourBadge({ goldenHour }) {
    if (!goldenHour?.inGoldenHour) return null;

    const minutesLeft = goldenHour.minutesRemaining ?? 0;
    const urgency = minutesLeft <= 15 ? 'critical' : minutesLeft <= 30 ? 'urgent' : 'active';

    const styles = {
        critical: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        urgent: 'bg-amber-100 text-amber-800 border-amber-300',
        active: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    };

    return (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${styles[urgency]}`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">
                ⏱️ Golden Hour: {minutesLeft}min remaining
            </span>
            <span className="text-xs">
                ({goldenHour.modifier > 1 ? `${Math.round((goldenHour.modifier - 1) * 100)}% urgency boost` : 'Active'})
            </span>
        </div>
    );
}

// ─── Reason Tags ─────────────────────────────────────────────────────
function ReasonTags({ reasons }) {
    if (!reasons?.length) return null;

    return (
        <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Why This Hospital
            </h5>
            <div className="flex flex-wrap gap-1.5">
                {reasons.map((reason, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100"
                    >
                        <CheckCircle className="w-3 h-3" />
                        {reason}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function HospitalExplainabilityPanel({ hospital, compact = false }) {
    if (!hospital || hospital.disqualified) return null;

    const {
        scoreBreakdown = {},
        weights = {},
        goldenHour,
        recommendationReasons = [],
        suitabilityScore = 0,
        distanceKm,
        etaMinutes
    } = hospital;

    // Phase 5: Batch translate UI labels
    const { translated: et } = useTBatch([
        "Score:", "Top factor:", "Golden hour:",
        "AI Decision Explanation", "Why this hospital scored", "Overall Score",
        "AI Explanation", "Distance", "ETA", "ICU Beds",
        "Data freshness penalty:", "reduction"
    ]);
    const E = {
        score: et[0], topFactor: et[1], goldenHour: et[2],
        aiDecision: et[3], whyScored: et[4], overallScore: et[5],
        aiExplanation: et[6], distance: et[7], eta: et[8], icuBeds: et[9],
        freshnessPenalty: et[10], reduction: et[11]
    };

    // Calculate score contribution breakdown for summary
    const contributions = useMemo(() => {
        const factors = ['capability', 'specialists', 'equipment', 'beds', 'load', 'distance'];
        return factors.map(key => ({
            key,
            score: scoreBreakdown[key === 'load' ? 'loadPenalty' : (key === 'distance' ? 'distanceScore' : key)] ?? 0,
            weight: weights[key] ?? 0,
            contribution: Math.round((scoreBreakdown[key === 'load' ? 'loadPenalty' : (key === 'distance' ? 'distanceScore' : key)] ?? 0) * (weights[key] ?? 0))
        })).sort((a, b) => b.contribution - a.contribution);
    }, [scoreBreakdown, weights]);

    // Top contributing factor
    const topFactor = contributions[0];

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Brain className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium">{E.score} {suitabilityScore}</span>
                    {topFactor && (
                        <span className="text-gray-400">
                            — {E.topFactor} {FACTOR_CONFIG[topFactor.key]?.label} (+{topFactor.contribution})
                        </span>
                    )}
                </div>
                {goldenHour?.inGoldenHour && (
                    <span className="text-xs text-amber-600 font-medium">
                        ⏱️ {E.goldenHour} {goldenHour.minutesRemaining}min
                    </span>
                )}
            </div>
        );
    }

    // Mobile accordion state
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="space-y-4">
            {/* Mobile Accordion Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="w-full p-4 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md touch-target"
            >
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    <span className="font-bold">{E.aiExplanation} ({suitabilityScore}/100)</span>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Accordion Content - works on all screen sizes */}
            <div className={`${isExpanded ? 'block' : 'hidden'} space-y-4 mt-4`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                            <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">{E.aiDecision}</h4>
                            <p className="text-xs text-gray-400">{E.whyScored} {suitabilityScore}/100</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{suitabilityScore}</div>
                        <div className="text-xs text-gray-400">{E.overallScore}</div>
                    </div>
                </div>

                {/* Golden Hour Badge */}
                <GoldenHourBadge goldenHour={goldenHour} />

                {/* Factor Breakdown */}
                <div className="space-y-2">
                    {contributions.map(({ key, score, weight }) => (
                        <FactorBar
                            key={key}
                            factorKey={key}
                            score={key === 'load' ? (scoreBreakdown.loadPenalty ?? 0) : score}
                            weight={weight}
                        />
                    ))}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">
                            {distanceKm != null && distanceKm < 999 ? `${distanceKm}km` : '—'}
                        </div>
                        <div className="text-xs text-gray-400">{E.distance}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">
                            {etaMinutes != null && etaMinutes < 999 ? `${etaMinutes}min` : '—'}
                        </div>
                        <div className="text-xs text-gray-400">{E.eta}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">
                            {scoreBreakdown.icuCount ?? 0}
                        </div>
                        <div className="text-xs text-gray-400">{E.icuBeds}</div>
                    </div>
                </div>

                {/* Recommendation Reasons */}
                <ReasonTags reasons={recommendationReasons} />

                {/* Freshness */}
                {scoreBreakdown.freshnessMultiplier && scoreBreakdown.freshnessMultiplier < 1 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {E.freshnessPenalty} {Math.round((1 - scoreBreakdown.freshnessMultiplier) * 100)}% {E.reduction}
                    </div>
                )}
            </div>

            {/* Desktop version removed - using unified accordion version above for all screen sizes */}
        </div>
    );
}
