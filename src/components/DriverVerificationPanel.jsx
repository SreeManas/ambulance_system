// src/components/DriverVerificationPanel.jsx
/**
 * Driver Verification & Approval Panel
 * 
 * Admin-only panel for reviewing, approving, and rejecting
 * driver-registered ambulances. Uses realtime Firestore listener.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    getFirestore, collection, query, where,
    onSnapshot, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
    ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle,
    User, Phone, Truck, FileText, MapPin, Image as ImageIcon,
    AlertTriangle, Loader2, Eye, X, ChevronDown
} from 'lucide-react';

// Status config
const STATUS_CONFIG = {
    pending: { label: 'Pending Review', color: '#eab308', bg: 'rgba(234,179,8,0.15)', icon: Clock },
    approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: XCircle }
};

const EQUIPMENT_LABELS = {
    oxygen: '🫁 Oxygen',
    defibrillator: '⚡ Defibrillator',
    ventilator: '🌬️ Ventilator',
    stretcher: '🛏️ Stretcher',
    suction: '💨 Suction',
    splints: '🦴 Splints',
    iv: '💉 IV Kit',
    monitor: '📊 Monitor',
    medications: '💊 Medications',
    ecg: '📈 ECG',
    bloodPressure: '🩺 BP Monitor'
};

export default function DriverVerificationPanel() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // all, pending, approved, rejected
    const [actionLoading, setActionLoading] = useState(null); // ambulanceId being updated
    const [rejectModal, setRejectModal] = useState(null); // { id, driverName }
    const [rejectionReason, setRejectionReason] = useState('');
    const [licensePreview, setLicensePreview] = useState(null); // URL for modal

    const db = getFirestore();
    const auth = getAuth();

    // ─── Realtime listener ───────────────────────────────────────────
    // Fetch ALL driver-registered ambulances with a single where clause
    // to avoid needing composite Firestore indexes. Filter + sort client-side.
    useEffect(() => {
        const q = query(
            collection(db, 'ambulances'),
            where('source', '==', 'driver_registered')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            let list = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            // Client-side filter by verificationStatus
            if (filter !== 'all') {
                list = list.filter(d => d.verificationStatus === filter);
            }

            // Client-side sort by createdAt descending
            list.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
                const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
                return tb - ta;
            });

            setDrivers(list);
            setLoading(false);
        }, (err) => {
            console.error('Driver verification listener error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [db, filter]);

    // ─── Approve handler ─────────────────────────────────────────────
    const handleApprove = useCallback(async (ambulanceId) => {
        setActionLoading(ambulanceId);
        try {
            await updateDoc(doc(db, 'ambulances', ambulanceId), {
                verificationStatus: 'approved',
                verifiedBy: auth.currentUser?.uid || 'admin',
                verifiedAt: serverTimestamp(),
                rejectionReason: null
            });

            // Also update user doc verificationStatus
            const driver = drivers.find(d => d.id === ambulanceId);
            if (driver?.driverId) {
                await updateDoc(doc(db, 'users', driver.driverId), {
                    verificationStatus: 'approved'
                });
            }
        } catch (err) {
            console.error('Approve error:', err);
            alert('Failed to approve driver: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    }, [db, auth, drivers]);

    // ─── Reject handler ──────────────────────────────────────────────
    const handleReject = useCallback(async () => {
        if (!rejectModal || !rejectionReason.trim()) return;
        setActionLoading(rejectModal.id);
        try {
            await updateDoc(doc(db, 'ambulances', rejectModal.id), {
                verificationStatus: 'rejected',
                rejectionReason: rejectionReason.trim(),
                verifiedBy: auth.currentUser?.uid || 'admin',
                verifiedAt: serverTimestamp()
            });

            // Also update user doc
            const driver = drivers.find(d => d.id === rejectModal.id);
            if (driver?.driverId) {
                await updateDoc(doc(db, 'users', driver.driverId), {
                    verificationStatus: 'rejected'
                });
            }

            setRejectModal(null);
            setRejectionReason('');
        } catch (err) {
            console.error('Reject error:', err);
            alert('Failed to reject driver: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    }, [db, auth, rejectModal, rejectionReason, drivers]);

    // ─── Format timestamp ────────────────────────────────────────────
    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // ─── Check if license URL is an image ────────────────────────────
    const isImageUrl = (url) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.includes('.jpg') || lower.includes('.jpeg') ||
            lower.includes('.png') || lower.includes('.webp') ||
            lower.includes('image%2F');
    };

    // ─── Filter counts ──────────────────────────────────────────────
    const filterTabs = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'all', label: 'All' }
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-bold text-lg">Driver Verifications</h3>
                </div>
                <span className="text-gray-400 text-xs">
                    {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === tab.id
                            ? 'bg-gray-700 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-2 text-gray-400 text-sm">Loading drivers...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && drivers.length === 0 && (
                <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-700/50">
                    <ShieldCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} drivers found</p>
                    <p className="text-gray-500 text-xs mt-1">
                        {filter === 'pending' ? 'All caught up! No drivers awaiting review.' : 'Try changing the filter.'}
                    </p>
                </div>
            )}

            {/* Driver Cards */}
            <div className="space-y-3">
                {drivers.map(driver => {
                    const status = STATUS_CONFIG[driver.verificationStatus] || STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    const isActioning = actionLoading === driver.id;

                    return (
                        <div
                            key={driver.id}
                            className="bg-gray-900/60 backdrop-blur rounded-xl border border-gray-700/60 p-4 hover:border-gray-600/80 transition-all"
                        >
                            {/* Top Row: Name + Status Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-sm">
                                            {(driver.driverName || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-sm">{driver.driverName || 'Unknown Driver'}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Phone className="w-3 h-3 text-gray-500" />
                                            <span className="text-gray-400 text-xs">{driver.driverPhone || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ background: status.bg, color: status.color }}
                                >
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                                    <Truck className="w-3.5 h-3.5 text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Vehicle</div>
                                        <div className="text-white text-xs font-medium">{driver.vehicleNumber || '—'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Type</div>
                                        <div className="text-white text-xs font-medium">{driver.type || 'BLS'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Location</div>
                                        <div className="text-white text-xs font-medium">
                                            {driver.location ? `${driver.location.lat?.toFixed(4)}, ${driver.location.lng?.toFixed(4)}` : '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Registered</div>
                                        <div className="text-white text-xs font-medium">{formatDate(driver.createdAt)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment Badges */}
                            {driver.equipment && Object.keys(driver.equipment).length > 0 && (
                                <div className="mb-3">
                                    <div className="text-[10px] text-gray-500 uppercase mb-1.5">Equipment</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(driver.equipment)
                                            .filter(([_, val]) => val)
                                            .map(([key]) => (
                                                <span
                                                    key={key}
                                                    className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded-full border border-gray-700"
                                                >
                                                    {EQUIPMENT_LABELS[key] || key}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* License Preview */}
                            {driver.licenseUrl && (
                                <div className="mb-3">
                                    <div className="text-[10px] text-gray-500 uppercase mb-1.5">Driver License</div>
                                    {isImageUrl(driver.licenseUrl) ? (
                                        <button
                                            onClick={() => setLicensePreview(driver.licenseUrl)}
                                            className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 hover:bg-gray-700/50 transition-colors w-full text-left"
                                        >
                                            <img
                                                src={driver.licenseUrl}
                                                alt="License"
                                                className="w-12 h-12 object-cover rounded-md border border-gray-600"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div>
                                                <span className="text-blue-400 text-xs flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> View License
                                                </span>
                                                <span className="text-gray-500 text-[10px]">Click to enlarge</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <a
                                            href={driver.licenseUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 hover:bg-gray-700/50 transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-red-400" />
                                            <span className="text-blue-400 text-xs">View License (PDF)</span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Rejection Reason (if rejected) */}
                            {driver.verificationStatus === 'rejected' && driver.rejectionReason && (
                                <div className="mb-3 bg-red-900/20 border border-red-800/40 rounded-lg p-2.5">
                                    <div className="text-[10px] text-red-400 uppercase mb-1">Rejection Reason</div>
                                    <p className="text-red-300 text-xs">{driver.rejectionReason}</p>
                                    <div className="text-gray-500 text-[10px] mt-1">
                                        Rejected: {formatDate(driver.verifiedAt)}
                                    </div>
                                </div>
                            )}

                            {/* Approval Info (if approved) */}
                            {driver.verificationStatus === 'approved' && (
                                <div className="mb-3 bg-green-900/20 border border-green-800/40 rounded-lg p-2.5">
                                    <div className="text-green-300 text-xs flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Approved on {formatDate(driver.verifiedAt)}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons (only for pending) */}
                            {driver.verificationStatus === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                                    <button
                                        onClick={() => handleApprove(driver.id)}
                                        disabled={isActioning}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/40 
                                            text-green-400 font-semibold text-xs rounded-lg border border-green-600/30 
                                            hover:border-green-500 transition-all disabled:opacity-50"
                                    >
                                        {isActioning ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectModal({ id: driver.id, driverName: driver.driverName })}
                                        disabled={isActioning}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 
                                            text-red-400 font-semibold text-xs rounded-lg border border-red-600/30 
                                            hover:border-red-500 transition-all disabled:opacity-50"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Re-approve button for rejected drivers */}
                            {driver.verificationStatus === 'rejected' && (
                                <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                                    <button
                                        onClick={() => handleApprove(driver.id)}
                                        disabled={isActioning}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/40 
                                            text-green-400 font-semibold text-xs rounded-lg border border-green-600/30 
                                            hover:border-green-500 transition-all disabled:opacity-50"
                                    >
                                        {isActioning ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        )}
                                        Re-approve
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ─── Rejection Reason Modal ────────────────────────────── */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldX className="w-5 h-5 text-red-400" />
                                    <h3 className="text-white font-bold">Reject Driver</h3>
                                </div>
                                <button
                                    onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                Provide a reason for rejecting <strong className="text-white">{rejectModal.driverName}</strong>'s registration.
                            </p>
                        </div>
                        <div className="p-5 space-y-4">
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="e.g., License expired, missing equipment, invalid vehicle number..."
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm 
                                    placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 
                                        text-sm font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim() || actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                                        bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl 
                                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    Reject Driver
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── License Preview Modal ─────────────────────────────── */}
            {licensePreview && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setLicensePreview(null)}
                >
                    <div className="relative max-w-2xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setLicensePreview(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center 
                                border border-gray-600 text-gray-300 hover:text-white transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img
                            src={licensePreview}
                            alt="Driver License"
                            className="max-w-full max-h-[80vh] rounded-xl border border-gray-700 shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
