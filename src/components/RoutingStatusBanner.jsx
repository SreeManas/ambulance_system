// src/components/RoutingStatusBanner.jsx
/**
 * Routing Status Indicator System
 * Displays operational state of the routing engine
 * 
 * States:
 * 🟢 Routing Synced - Data is fresh and routing is up-to-date
 * 🟡 Recomputing... - Routing calculation in progress
 * 🔴 Capacity Data Stale - Hospital capacity data is older than 24 hours
 */
import React from 'react';

export default function RoutingStatusBanner({
    capacityLastUpdated,
    scoringLastRun,
    isRecomputing,
    hospitalCount = 0
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

        const staleness = Date.now() - capacityLastUpdated;
        const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

        if (staleness > STALE_THRESHOLD) {
            const hoursStale = Math.floor(staleness / (60 * 60 * 1000));
            return {
                color: 'red',
                icon: '🔴',
                text: `Capacity data stale (${hoursStale}h old - refresh recommended)`,
                pulse: true
            };
        }

        // Calculate freshness indicator
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
        <div className={`px-4 py-2.5 rounded-lg border ${bgColorClasses[status.color]} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center gap-2">
                <span className={status.pulse ? 'animate-pulse' : ''}>{status.icon}</span>
                <span className="text-sm font-medium">{status.text}</span>
            </div>
            {scoringLastRun && (
                <span className="text-xs opacity-70">
                    Last scored: {new Date(scoringLastRun).toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}
