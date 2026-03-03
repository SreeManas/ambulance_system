// src/components/RoutingStatusBanner.jsx
/**
 * Routing Status Indicator System
 * Displays operational state of the routing engine
 * 
 * States:
 * 🟢 Routing Synced - Data is fresh or was recently manually refreshed
 * 🟡 Recomputing... - Routing calculation in progress
 * 🔴 Capacity Data Stale - Hospital capacity data is older than 24 hours
 */
import React from 'react';

export default function RoutingStatusBanner({
    capacityLastUpdated,
    scoringLastRun,
    isRecomputing,
    hospitalCount = 0,
    lastRefreshedAt = null   // timestamp of last manual refresh
}) {
    const getStatus = () => {
        if (isRecomputing) {
            return {
                color: 'yellow',
                icon: '🟡',
                text: 'Recomputing routing recommendations...',
                pulse: true
            };
        }

        if (!capacityLastUpdated || hospitalCount === 0) {
            return {
                color: 'red',
                icon: '🔴',
                text: 'No hospital capacity data available',
                pulse: false
            };
        }

        // If user manually refreshed within last 5 minutes, treat as synced
        const MANUAL_REFRESH_GRACE_MS = 5 * 60 * 1000;
        if (lastRefreshedAt && (Date.now() - lastRefreshedAt) < MANUAL_REFRESH_GRACE_MS) {
            const secsAgo = Math.round((Date.now() - lastRefreshedAt) / 1000);
            return {
                color: 'green',
                icon: '🟢',
                text: `Routing synced • ${hospitalCount} hospitals • Refreshed ${secsAgo}s ago`,
                pulse: false
            };
        }

        const staleness = Date.now() - capacityLastUpdated;
        const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

        if (staleness > STALE_THRESHOLD) {
            const hoursStale = Math.floor(staleness / (60 * 60 * 1000));
            return {
                color: 'yellow',
                icon: '🟡',
                text: `Capacity data ${hoursStale}h old — click Refresh Data to sync`,
                pulse: false
            };
        }

        // Fresh data
        const minutesAgo = Math.floor(staleness / 60000);
        const freshnessText = minutesAgo < 1
            ? 'just now'
            : minutesAgo < 60
                ? `${minutesAgo}m ago`
                : `${Math.floor(minutesAgo / 60)}h ago`;

        return {
            color: 'green',
            icon: '🟢',
            text: `Routing synced • ${hospitalCount} hospitals • Updated ${freshnessText}`,
            pulse: false
        };
    };

    const status = getStatus();

    const bgColorClasses = {
        green: 'bg-green-50 border-green-200 text-green-800',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        red: 'bg-red-50 border-red-200 text-red-800'
    };

    return (
        <div className={`px-3 py-2 rounded-lg border ${bgColorClasses[status.color]} flex items-center justify-between gap-2 shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-2 min-w-0">
                <span className={`flex-shrink-0 ${status.pulse ? 'animate-pulse' : ''}`}>{status.icon}</span>
                <span className="text-xs sm:text-sm font-medium truncate">{status.text}</span>
            </div>
            {scoringLastRun && (
                <span className="text-xs opacity-70 hidden sm:inline flex-shrink-0">
                    Last scored: {new Date(scoringLastRun).toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}
