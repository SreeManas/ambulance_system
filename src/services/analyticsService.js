/**
 * analyticsService.js — Performance Intelligence Metrics Engine
 *
 * Computes operational KPIs from emergencyCases lifecycle data:
 * - Core response metrics (avg, P90, P95)
 * - Golden hour compliance
 * - Escalation intelligence
 * - Hospital performance ranking
 * - Time window filtering with Firestore timestamp range queries
 */

import {
    getFirestore, collection, query, where, getDocs,
    orderBy, Timestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// TIMESTAMP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function toMs(ts) {
    if (!ts) return null;
    if (ts.toMillis) return ts.toMillis();
    if (ts._seconds) return ts._seconds * 1000;
    if (ts.seconds) return ts.seconds * 1000;
    const d = new Date(ts).getTime();
    return isNaN(d) ? null : d;
}

function diffMinutes(start, end) {
    const s = toMs(start);
    const e = toMs(end);
    if (s === null || e === null) return null;
    const diff = (e - s) / 60000;
    return diff >= 0 ? diff : null;
}

function diffSeconds(start, end) {
    const s = toMs(start);
    const e = toMs(end);
    if (s === null || e === null) return null;
    const diff = (e - s) / 1000;
    return diff >= 0 ? diff : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERCENTILE CALCULATOR (linear interpolation, not naive sort-only)
// ═══════════════════════════════════════════════════════════════════════════════

function percentile(sorted, p) {
    if (!sorted.length) return 0;
    if (sorted.length === 1) return sorted[0];
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    const frac = idx - lower;
    return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FETCHING WITH TIME WINDOW FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

const TIME_WINDOWS = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': null,
};

export async function fetchCasesForAnalytics(timeWindow = 'all') {
    const db = getFirestore();
    const casesRef = collection(db, 'emergencyCases');

    let q;
    if (timeWindow !== 'all' && TIME_WINDOWS[timeWindow]) {
        const since = Timestamp.fromMillis(Date.now() - TIME_WINDOWS[timeWindow]);
        q = query(casesRef, where('createdAt', '>=', since), orderBy('createdAt', 'desc'));
    } else {
        q = query(casesRef, orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// A) CORE RESPONSE METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export function computeCoreMetrics(cases) {
    const timeToFirstNotification = [];
    const hospitalResponseTimes = [];
    const timeToAcceptance = [];
    const timeToEnroute = [];

    for (const c of cases) {
        // Time to first notification = first notifiedAt - dispatchedAt
        const notifications = c.hospitalNotifications || [];
        if (c.dispatchedAt && notifications.length > 0) {
            const firstNotified = notifications.reduce((min, n) => {
                const t = toMs(n.notifiedAt);
                return t !== null && (min === null || t < min) ? t : min;
            }, null);
            if (firstNotified !== null) {
                const d = diffMinutes(c.dispatchedAt, { toMillis: () => firstNotified });
                if (d !== null) timeToFirstNotification.push(d);
            }
        }

        // Hospital response times = respondedAt - notifiedAt (for each response)
        for (const n of notifications) {
            if (n.respondedAt && n.notifiedAt && n.response !== 'cancelled') {
                const d = diffMinutes(n.notifiedAt, n.respondedAt);
                if (d !== null) hospitalResponseTimes.push(d);
            }
        }

        // Time to acceptance = acceptedAt - dispatchedAt (or first notification)
        if (c.acceptedAt && c.dispatchedAt) {
            const d = diffMinutes(c.dispatchedAt, c.acceptedAt);
            if (d !== null) timeToAcceptance.push(d);
        }

        // Time to enroute = enrouteAt - createdAt
        if (c.enrouteAt && c.createdAt) {
            const d = diffMinutes(c.createdAt, c.enrouteAt);
            if (d !== null) timeToEnroute.push(d);
        }
    }

    const sortedAcceptance = [...timeToAcceptance].sort((a, b) => a - b);
    const sortedEnroute = [...timeToEnroute].sort((a, b) => a - b);

    return {
        avgTimeToFirstNotification: Math.round(avg(timeToFirstNotification) * 100) / 100,
        avgHospitalResponseTime: Math.round(avg(hospitalResponseTimes) * 100) / 100,
        avgTimeToAcceptance: Math.round(avg(timeToAcceptance) * 100) / 100,
        avgTimeToEnroute: Math.round(avg(timeToEnroute) * 100) / 100,
        p90Acceptance: Math.round(percentile(sortedAcceptance, 90) * 100) / 100,
        p95Acceptance: Math.round(percentile(sortedAcceptance, 95) * 100) / 100,
        p90Enroute: Math.round(percentile(sortedEnroute, 90) * 100) / 100,
        p95Enroute: Math.round(percentile(sortedEnroute, 95) * 100) / 100,
        sampleSizes: {
            notification: timeToFirstNotification.length,
            response: hospitalResponseTimes.length,
            acceptance: timeToAcceptance.length,
            enroute: timeToEnroute.length,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// B) GOLDEN HOUR COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

export function computeGoldenHourCompliance(cases) {
    const critical = cases.filter(c => {
        const acuity = c.acuityLevel || c.aiTriage?.acuity_level;
        return acuity === 1 || acuity === 2;
    });

    if (critical.length === 0) {
        return {
            total: 0, acceptedWithin8: 0, enrouteWithin10: 0, completedWithin60: 0,
            pctAccepted8: 0, pctEnroute10: 0, pctCompleted60: 0
        };
    }

    let acceptedWithin8 = 0;
    let enrouteWithin10 = 0;
    let completedWithin60 = 0;

    for (const c of critical) {
        // Accepted within 8 minutes of creation
        if (c.acceptedAt && c.createdAt) {
            const d = diffMinutes(c.createdAt, c.acceptedAt);
            if (d !== null && d <= 8) acceptedWithin8++;
        }

        // Enroute within 10 minutes
        if (c.enrouteAt && c.createdAt) {
            const d = diffMinutes(c.createdAt, c.enrouteAt);
            if (d !== null && d <= 10) enrouteWithin10++;
        }

        // Completed within 60 minutes
        if (c.completedAt && c.createdAt) {
            const d = diffMinutes(c.createdAt, c.completedAt);
            if (d !== null && d <= 60) completedWithin60++;
        }
    }

    return {
        total: critical.length,
        acceptedWithin8,
        enrouteWithin10,
        completedWithin60,
        pctAccepted8: Math.round((acceptedWithin8 / critical.length) * 100),
        pctEnroute10: Math.round((enrouteWithin10 / critical.length) * 100),
        pctCompleted60: Math.round((completedWithin60 / critical.length) * 100),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// C) ESCALATION INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

export function computeEscalationMetrics(cases) {
    const total = cases.length;
    if (total === 0) {
        return {
            total: 0, escalated: 0, overrideUsed: 0, pctEscalated: 0,
            pctOverride: 0, avgRejectionsBeforeEscalation: 0, avgEscalationDelay: 0
        };
    }

    const escalated = cases.filter(c =>
        c.escalationTriggeredAt || c.status === 'escalation_required' || c.status === 'dispatcher_override'
    );
    const overrides = cases.filter(c => c.overrideUsed);

    const rejectionsBeforeEscalation = [];
    const escalationDelays = [];

    for (const c of escalated) {
        rejectionsBeforeEscalation.push(c.rejectionCount || 0);

        // Escalation delay = escalationTriggeredAt - dispatchedAt (or createdAt)
        if (c.escalationTriggeredAt && (c.dispatchedAt || c.createdAt)) {
            const d = diffMinutes(c.dispatchedAt || c.createdAt, c.escalationTriggeredAt);
            if (d !== null) escalationDelays.push(d);
        }
    }

    return {
        total,
        escalated: escalated.length,
        overrideUsed: overrides.length,
        pctEscalated: Math.round((escalated.length / total) * 100),
        pctOverride: Math.round((overrides.length / total) * 100),
        avgRejectionsBeforeEscalation: Math.round(avg(rejectionsBeforeEscalation) * 10) / 10,
        avgEscalationDelay: Math.round(avg(escalationDelays) * 100) / 100,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// D) HOSPITAL PERFORMANCE RANKING
// ═══════════════════════════════════════════════════════════════════════════════

export function computeHospitalPerformance(cases) {
    const hospitalMap = {};

    for (const c of cases) {
        const notifications = c.hospitalNotifications || [];
        const isEscalated = !!(c.escalationTriggeredAt || c.status === 'escalation_required' || c.status === 'dispatcher_override');

        for (const n of notifications) {
            if (!n.hospitalId) continue;
            if (!hospitalMap[n.hospitalId]) {
                hospitalMap[n.hospitalId] = {
                    hospitalId: n.hospitalId,
                    hospitalName: n.hospitalName || n.hospitalId,
                    responseTimes: [],
                    accepted: 0,
                    rejected: 0,
                    cancelled: 0,
                    total: 0,
                    escalationInvolved: 0,
                    _escalationCases: new Set(),
                };
            }

            const h = hospitalMap[n.hospitalId];
            h.total++;

            if (n.response === 'accepted') h.accepted++;
            else if (n.response === 'rejected') h.rejected++;
            else if (n.response === 'cancelled') h.cancelled++;

            if (n.respondedAt && n.notifiedAt && n.response !== 'cancelled') {
                const d = diffMinutes(n.notifiedAt, n.respondedAt);
                if (d !== null) h.responseTimes.push(d);
            }

            if (isEscalated && c.id) h._escalationCases.add(c.id);
        }
    }

    const totalCases = cases.length || 1;

    return Object.values(hospitalMap)
        .map(h => ({
            hospitalId: h.hospitalId,
            hospitalName: h.hospitalName,
            avgResponseTime: Math.round(avg(h.responseTimes) * 100) / 100,
            acceptanceRate: h.total > 0 ? Math.round((h.accepted / h.total) * 100) : 0,
            rejectionRate: h.total > 0 ? Math.round((h.rejected / h.total) * 100) : 0,
            escalationPct: Math.round((h._escalationCases.size / totalCases) * 100),
            totalNotifications: h.total,
        }))
        .sort((a, b) => a.avgResponseTime - b.avgResponseTime);
}

// ═══════════════════════════════════════════════════════════════════════════════
// E) RESPONSE TIME DISTRIBUTION (for bar chart)
// ═══════════════════════════════════════════════════════════════════════════════

export function computeResponseDistribution(cases) {
    const buckets = [
        { label: '0–2 min', min: 0, max: 2, count: 0 },
        { label: '2–5 min', min: 2, max: 5, count: 0 },
        { label: '5–8 min', min: 5, max: 8, count: 0 },
        { label: '8–12 min', min: 8, max: 12, count: 0 },
        { label: '12+ min', min: 12, max: Infinity, count: 0 },
    ];

    for (const c of cases) {
        for (const n of c.hospitalNotifications || []) {
            if (n.respondedAt && n.notifiedAt && n.response !== 'cancelled') {
                const d = diffMinutes(n.notifiedAt, n.respondedAt);
                if (d !== null) {
                    for (const b of buckets) {
                        if (d >= b.min && d < b.max) {
                            b.count++;
                            break;
                        }
                    }
                }
            }
        }
    }

    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    return buckets.map(b => ({
        ...b,
        pct: Math.round((b.count / maxCount) * 100),
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER ANALYTICS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function computeAllAnalytics(timeWindow = 'all') {
    const cases = await fetchCasesForAnalytics(timeWindow);

    return {
        totalCases: cases.length,
        core: computeCoreMetrics(cases),
        goldenHour: computeGoldenHourCompliance(cases),
        escalation: computeEscalationMetrics(cases),
        hospitals: computeHospitalPerformance(cases),
        distribution: computeResponseDistribution(cases),
        computedAt: Date.now(),
    };
}
