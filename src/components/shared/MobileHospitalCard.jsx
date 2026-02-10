/**
 * MobileHospitalCard.jsx
 * Mobile-optimized card component for hospital lists
 * Replaces table rows on small screens (<768px)
 */
import React from 'react';
import {
    MapPin, Clock, Bed, AlertCircle,
    CheckCircle, Phone, Navigation
} from 'lucide-react';

export default function MobileHospitalCard({ hospital, onClick, isSelected }) {
    if (!hospital) return null;

    const {
        hospitalName,
        distanceKm,
        etaMinutes,
        suitabilityScore,
        icuBeds = 0,
        emergencyBeds = 0,
        disqualified = false,
        disqualificationReason = '',
        phone
    } = hospital;

    return (
        <button
            onClick={() => onClick?.(hospital)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left touch-target ${isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : disqualified
                        ? 'border-red-200 bg-red-50 opacity-60'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-base mb-1">
                        {hospitalName}
                    </h3>
                    {disqualified ? (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="truncate">{disqualificationReason}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Suitable</span>
                        </div>
                    )}
                </div>
                {!disqualified && (
                    <div className="flex flex-col items-end ml-2">
                        <div className="text-2xl font-bold text-emerald-600">
                            {suitabilityScore}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase">Score</div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            {!disqualified && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    {/* Distance */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <MapPin className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                            {distanceKm != null ? `${distanceKm}km` : '—'}
                        </div>
                        <div className="text-[10px] text-gray-400">Distance</div>
                    </div>

                    {/* ETA */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <Clock className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                            {etaMinutes != null ? `${etaMinutes}m` : '—'}
                        </div>
                        <div className="text-[10px] text-gray-400">ETA</div>
                    </div>

                    {/* Beds */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <Bed className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                            {icuBeds + emergencyBeds}
                        </div>
                        <div className="text-[10px] text-gray-400">Beds</div>
                    </div>
                </div>
            )}

            {/* Phone CTA (if available) */}
            {phone && !disqualified && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                        href={`tel:${phone}`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Phone className="w-4 h-4" />
                        <span>Call Hospital</span>
                    </a>
                </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
            )}
        </button>
    );
}
