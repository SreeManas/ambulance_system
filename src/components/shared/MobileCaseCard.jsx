/**
 * MobileCaseCard.jsx
 * Mobile-optimized card component for case queues
 * Replaces table rows on small screens (<768px)
 */
import React from 'react';
import {
    Clock, User, MapPin, AlertTriangle,
    Activity, TrendingUp, Calendar
} from 'lucide-react';

export default function MobileCaseCard({ caseData, onClick, isSelected }) {
    if (!caseData) return null;

    const {
        id,
        emergencyContext = {},
        timestamp,
        severity,
        status = 'pending'
    } = caseData;

    const {
        chiefComplaint = 'Unknown',
        patientAge,
        patientGender,
        pickupLocation
    } = emergencyContext;

    // Calculate time ago
    const getTimeAgo = (ts) => {
        if (!ts) return '—';
        const diff = Date.now() - (ts?.toMillis?.() || new Date(ts).getTime());
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ago`;
    };

    // Severity color mapping
    const getSeverityColor = (sev) => {
        if (sev === 1 || sev === 'critical') return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' };
        if (sev === 2 || sev === 'high') return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' };
        if (sev === 3 || sev === 'medium') return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' };
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };
    };

    const sevStyle = getSeverityColor(severity);

    return (
        <button
            onClick={() => onClick?.(caseData)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left touch-target ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-gray-900 text-sm truncate">
                            {chiefComplaint}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Case #{id?.slice(0, 8)}
                    </div>
                </div>

                {/* Severity Badge */}
                <div className={`px-3 py-1 rounded-full ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border} border text-xs font-bold ml-2`}>
                    {typeof severity === 'number' ? `L${severity}` : severity}
                </div>
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{patientAge || '—'}y {patientGender || '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(timestamp)}</span>
                </div>
            </div>

            {/* Location */}
            {pickupLocation && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{pickupLocation}</span>
                </div>
            )}

            {/* Status Badge */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span className="capitalize">{status}</span>
                </div>
            </div>
        </button>
    );
}
