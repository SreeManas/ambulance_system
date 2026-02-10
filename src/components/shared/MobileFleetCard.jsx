/**
 * MobileFleetCard.jsx
 * Mobile-optimized card component for ambulance fleet tracking
 * Replaces table rows on small screens (<768px)
 */
import React from 'react';
import {
    Ambulance, MapPin, Clock, Activity,
    Navigation, Battery, Signal
} from 'lucide-react';

export default function MobileFleetCard({ ambulance, onClick, isSelected }) {
    if (!ambulance) return null;

    const {
        id,
        driverId = 'Unknown',
        location,
        status = 'unknown',
        lastUpdated,
        etaMinutes,
        destinationHospitalName,
        batteryLevel
    } = ambulance;

    // Status color mapping
    const getStatusStyle = (s) => {
        if (s === 'available') return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' };
        if (s === 'enroute') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' };
        if (s === 'busy') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' };
        if (s === 'offline') return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
    };

    const statusStyle = getStatusStyle(status);

    // Time since last update
    const getTimeSince = (ts) => {
        if (!ts) return '—';
        const diff = Date.now() - (ts?.toMillis?.() || new Date(ts).getTime());
        const secs = Math.floor(diff / 1000);
        if (secs < 60) return `${secs}s ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ago`;
    };

    return (
        <button
            onClick={() => onClick?.(ambulance)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left touch-target ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${statusStyle.bg}`}>
                        <Ambulance className={`w-5 h-5 ${statusStyle.text}`} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-base">
                            Unit {id?.slice(0, 6).toUpperCase() || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                            Driver: {driverId?.slice(0, 8) || '—'}
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border flex items-center gap-1.5`}>
                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot} animate-pulse`}></span>
                    <span className="text-xs font-semibold capitalize">{status}</span>
                </div>
            </div>

            {/* Location & Destination */}
            {status === 'enroute' && destinationHospitalName && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                        <Navigation className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 font-medium truncate">
                            → {destinationHospitalName}
                        </span>
                    </div>
                    {etaMinutes != null && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>ETA: {etaMinutes} min</span>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                {/* Last Updated */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Signal className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-gray-900 font-semibold">
                        {getTimeSince(lastUpdated)}
                    </div>
                    <div className="text-[9px] text-gray-400">Updated</div>
                </div>

                {/* Location */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <MapPin className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-gray-900 font-semibold truncate">
                        {location?.latitude ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : '—'}
                    </div>
                    <div className="text-[9px] text-gray-400">GPS</div>
                </div>

                {/* Battery */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Battery className="w-3 h-3" />
                    </div>
                    <div className={`text-[10px] font-semibold ${batteryLevel > 50 ? 'text-green-600' : batteryLevel > 20 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                        {batteryLevel != null ? `${batteryLevel}%` : '—'}
                    </div>
                    <div className="text-[9px] text-gray-400">Battery</div>
                </div>
            </div>
        </button>
    );
}
