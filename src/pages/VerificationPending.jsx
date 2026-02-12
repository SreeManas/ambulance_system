// src/pages/VerificationPending.jsx
/**
 * Verification Pending Page
 * 
 * Displayed to ambulance drivers after onboarding until admin approves.
 * Shows registration status with realtime Firestore listener.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider.jsx';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { Clock, ShieldCheck, XCircle, Truck, User, RefreshCw } from 'lucide-react';

const STATUS_DISPLAY = {
    pending: {
        icon: Clock,
        color: '#eab308',
        bg: 'rgba(234,179,8,0.1)',
        border: 'rgba(234,179,8,0.3)',
        title: 'Registration Under Review',
        message: 'Your ambulance registration is being reviewed by the MEDROUTER Command Center. You will be notified once approved.',
        gradient: 'from-yellow-900/30 to-amber-900/20'
    },
    rejected: {
        icon: XCircle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.3)',
        title: 'Registration Rejected',
        message: 'Your ambulance registration has been reviewed and could not be approved at this time.',
        gradient: 'from-red-900/30 to-rose-900/20'
    },
    approved: {
        icon: ShieldCheck,
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.1)',
        border: 'rgba(34,197,94,0.3)',
        title: 'Registration Approved!',
        message: 'Your ambulance registration has been approved. You can now access the platform.',
        gradient: 'from-green-900/30 to-emerald-900/20'
    }
};

export default function VerificationPending() {
    const { currentUser, userDoc } = useAuth();
    const [ambulanceData, setAmbulanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    const db = getFirestore();

    // Realtime listener on ambulance doc
    useEffect(() => {
        if (!userDoc?.ambulanceId) {
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(
            doc(db, 'ambulances', userDoc.ambulanceId),
            (snapshot) => {
                if (snapshot.exists()) {
                    setAmbulanceData({ id: snapshot.id, ...snapshot.data() });
                }
                setLoading(false);
            },
            (err) => {
                console.error('Ambulance listener error:', err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [db, userDoc?.ambulanceId]);

    const status = ambulanceData?.verificationStatus || userDoc?.verificationStatus || 'pending';
    const display = STATUS_DISPLAY[status] || STATUS_DISPLAY.pending;
    const StatusIcon = display.icon;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading verification status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="w-full max-w-lg">
                {/* Main Status Card */}
                <div
                    className={`rounded-2xl border p-8 bg-gradient-to-br ${display.gradient} backdrop-blur`}
                    style={{ borderColor: display.border }}
                >
                    {/* Status Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ background: display.bg, border: `2px solid ${display.border}` }}
                        >
                            <StatusIcon className="w-10 h-10" style={{ color: display.color }} />
                        </div>
                    </div>

                    {/* Title & Message */}
                    <h2 className="text-2xl font-bold text-center mb-3" style={{ color: display.color }}>
                        {display.title}
                    </h2>
                    <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
                        {display.message}
                    </p>

                    {/* Rejection Reason */}
                    {status === 'rejected' && ambulanceData?.rejectionReason && (
                        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 mb-6">
                            <div className="text-red-400 text-xs uppercase font-semibold mb-1">Reason for Rejection</div>
                            <p className="text-red-300 text-sm">{ambulanceData.rejectionReason}</p>
                        </div>
                    )}

                    {/* Registration Details */}
                    <div className="space-y-3">
                        <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-500" />
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase">Driver Name</div>
                                <div className="text-white text-sm font-medium">
                                    {ambulanceData?.driverName || userDoc?.driverName || currentUser?.displayName || '—'}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                            <Truck className="w-5 h-5 text-gray-500" />
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase">Vehicle Number</div>
                                <div className="text-white text-sm font-medium">
                                    {ambulanceData?.vehicleNumber || '—'}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                            <StatusIcon className="w-5 h-5" style={{ color: display.color }} />
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase">Verification Status</div>
                                <div className="text-sm font-semibold capitalize" style={{ color: display.color }}>
                                    {status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Update Notice */}
                    {status === 'pending' && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            This page updates in real-time. No need to refresh.
                        </div>
                    )}

                    {/* Approved - redirect hint */}
                    {status === 'approved' && (
                        <div className="mt-6 text-center">
                            <a
                                href="/navigate"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 
                                    text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-900/30"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Enter Dashboard
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    MEDROUTER • Driver Verification System
                </p>
            </div>
        </div>
    );
}
