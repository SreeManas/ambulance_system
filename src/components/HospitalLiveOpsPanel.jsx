/**
 * HospitalLiveOpsPanel.jsx
 * Phase-2: Live Hospital Operations Panel
 * 
 * Real-time operational capacity management with slider controls,
 * validation, and instant Firestore sync for routing re-ranking.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
    Bed, Activity, AlertTriangle, Clock, Users,
    Stethoscope, Zap, RefreshCw, Save, CheckCircle,
    XCircle, Loader2, Shield, Truck
} from 'lucide-react';

// ─── Default liveOps Schema ───────────────────────────────────────────────
export const defaultLiveOps = {
    bedAvailability: {
        icuAvailable: 0,
        emergencyAvailable: 0,
        traumaAvailable: 0,
        isolationAvailable: 0
    },
    equipmentAvailability: {
        ventilatorsAvailable: 0,
        defibrillatorsAvailable: 0
    },
    emergencyReadiness: {
        status: 'accepting',
        ambulanceQueue: 0
    },
    lastUpdated: null,
    updatedBy: null
};

// ─── Validation Helpers ──────────────────────────────────────────────────
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function validateLiveOps(liveOps, hospital) {
    const beds = hospital?.bedAvailability || {};
    const equipment = hospital?.equipment || {};

    return {
        bedAvailability: {
            icuAvailable: clamp(liveOps.bedAvailability.icuAvailable, 0, beds.icu?.total || 100),
            emergencyAvailable: clamp(liveOps.bedAvailability.emergencyAvailable, 0, beds.emergency?.total || 100),
            traumaAvailable: clamp(liveOps.bedAvailability.traumaAvailable, 0, beds.traumaBeds?.total || 100),
            isolationAvailable: clamp(liveOps.bedAvailability.isolationAvailable, 0, beds.isolationBeds?.total || 100)
        },
        equipmentAvailability: {
            ventilatorsAvailable: clamp(liveOps.equipmentAvailability.ventilatorsAvailable, 0, equipment.ventilators?.total || equipment.ventilators || 100),
            defibrillatorsAvailable: clamp(liveOps.equipmentAvailability.defibrillatorsAvailable, 0, equipment.defibrillators || 100)
        },
        emergencyReadiness: {
            status: ['accepting', 'diverting', 'full'].includes(liveOps.emergencyReadiness.status)
                ? liveOps.emergencyReadiness.status : 'accepting',
            ambulanceQueue: clamp(liveOps.emergencyReadiness.ambulanceQueue, 0, 50)
        }
    };
}

// ─── Sub-Components ──────────────────────────────────────────────────────

function SliderField({ label, value, onChange, max, icon: Icon, color = 'blue', unit = '' }) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const barColor = percentage > 80 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900">{value}</span>
                    <span className="text-xs text-gray-400">/ {max}{unit}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="range"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    style={{ accentColor: color === 'blue' ? '#2563eb' : color === 'purple' ? '#9333ea' : '#059669' }}
                />
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function CounterField({ label, value, onChange, min = 0, max = 50, icon: Icon }) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors"
                    disabled={value <= min}
                >
                    −
                </button>
                <span className="w-10 text-center text-lg font-bold text-gray-900">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors"
                    disabled={value >= max}
                >
                    +
                </button>
            </div>
        </div>
    );
}

function StatusChip({ status, onStatusChange, canEdit }) {
    const configs = {
        accepting: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle, label: 'Accepting' },
        diverting: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle, label: 'Diverting' },
        full: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Full' }
    };
    const current = configs[status] || configs.accepting;
    const StatusIcon = current.icon;

    if (!canEdit) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${current.color}`}>
                <StatusIcon className="w-4 h-4" />
                {current.label}
            </span>
        );
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {Object.entries(configs).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isActive = status === key;
                return (
                    <button
                        key={key}
                        onClick={() => onStatusChange(key)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                            ${isActive
                                ? `${cfg.color} shadow-md scale-105`
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function HospitalLiveOpsPanel({ hospitalId, canEdit = false }) {
    const [hospital, setHospital] = useState(null);
    const [liveOps, setLiveOps] = useState({ ...defaultLiveOps });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const db = getFirestore();
    const auth = getAuth();

    // ─── Real-time Firestore listener ─────────────────────────────────
    useEffect(() => {
        if (!hospitalId) return;

        const unsubscribe = onSnapshot(
            doc(db, 'hospitals', hospitalId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setHospital(data);

                    // Merge existing liveOps with defaults
                    const existingOps = data.liveOps || {};
                    setLiveOps({
                        bedAvailability: { ...defaultLiveOps.bedAvailability, ...existingOps.bedAvailability },
                        equipmentAvailability: { ...defaultLiveOps.equipmentAvailability, ...existingOps.equipmentAvailability },
                        emergencyReadiness: { ...defaultLiveOps.emergencyReadiness, ...existingOps.emergencyReadiness },
                        lastUpdated: existingOps.lastUpdated || null,
                        updatedBy: existingOps.updatedBy || null
                    });

                    if (existingOps.lastUpdated) {
                        const ts = existingOps.lastUpdated?.toDate?.() || new Date(existingOps.lastUpdated);
                        setLastUpdated(ts);
                    }
                }
                setLoading(false);
            },
            (error) => {
                console.error('Live ops listener error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [hospitalId, db]);

    // ─── Update handlers with validation ──────────────────────────────
    const updateBed = useCallback((field, value) => {
        setLiveOps(prev => ({
            ...prev,
            bedAvailability: { ...prev.bedAvailability, [field]: value }
        }));
        setHasChanges(true);
    }, []);

    const updateEquipment = useCallback((field, value) => {
        setLiveOps(prev => ({
            ...prev,
            equipmentAvailability: { ...prev.equipmentAvailability, [field]: value }
        }));
        setHasChanges(true);
    }, []);

    const updateStatus = useCallback((status) => {
        setLiveOps(prev => ({
            ...prev,
            emergencyReadiness: { ...prev.emergencyReadiness, status }
        }));
        setHasChanges(true);
    }, []);

    const updateQueue = useCallback((value) => {
        setLiveOps(prev => ({
            ...prev,
            emergencyReadiness: { ...prev.emergencyReadiness, ambulanceQueue: value }
        }));
        setHasChanges(true);
    }, []);

    // ─── Save to Firestore ────────────────────────────────────────────
    const handleSave = async () => {
        if (!hospitalId || !canEdit || saving) return;

        setSaving(true);
        try {
            const user = auth.currentUser;
            const validated = validateLiveOps(liveOps, hospital);

            const updateData = {
                liveOps: {
                    ...validated,
                    lastUpdated: serverTimestamp(),
                    updatedBy: user?.uid || 'unknown'
                },
                // Also sync key fields to top-level for scoring engine compatibility
                'emergencyReadiness.status': validated.emergencyReadiness.status,
                'emergencyReadiness.ambulanceQueue': validated.emergencyReadiness.ambulanceQueue,
                capacityLastUpdated: serverTimestamp()
            };

            await updateDoc(doc(db, 'hospitals', hospitalId), updateData);
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('LiveOps update failed:', error);
        } finally {
            setSaving(false);
        }
    };

    // ─── Loading / Error states ───────────────────────────────────────
    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading live operations...</p>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                <p>No hospital data available</p>
            </div>
        );
    }

    const beds = hospital.bedAvailability || {};
    const equipment = hospital.equipment || {};

    // ─── Render ───────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Live Operations</h3>
                        <p className="text-xs text-gray-500">
                            {hospital.basicInfo?.name || 'Hospital'} — Real-time capacity
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live
                    </div>
                    {lastUpdated && (
                        <span className="text-xs text-gray-400">
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Emergency Status */}
            <div className={`p-5 rounded-xl border-2 transition-colors ${liveOps.emergencyReadiness.status === 'accepting' ? 'bg-emerald-50 border-emerald-200' :
                    liveOps.emergencyReadiness.status === 'diverting' ? 'bg-amber-50 border-amber-200' :
                        'bg-red-50 border-red-200'
                }`}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Emergency Status
                    </h4>
                </div>
                <StatusChip
                    status={liveOps.emergencyReadiness.status}
                    onStatusChange={updateStatus}
                    canEdit={canEdit}
                />
                <div className="mt-4">
                    <CounterField
                        label="Ambulance Queue"
                        value={liveOps.emergencyReadiness.ambulanceQueue}
                        onChange={updateQueue}
                        max={50}
                        icon={Truck}
                    />
                </div>
            </div>

            {/* Bed Availability Sliders */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Bed className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Bed Availability</h4>
                </div>
                <div className="space-y-5">
                    <SliderField
                        label="ICU Beds"
                        value={liveOps.bedAvailability.icuAvailable}
                        onChange={(v) => updateBed('icuAvailable', v)}
                        max={beds.icu?.total || 20}
                        color="blue"
                    />
                    <SliderField
                        label="Emergency Beds"
                        value={liveOps.bedAvailability.emergencyAvailable}
                        onChange={(v) => updateBed('emergencyAvailable', v)}
                        max={beds.emergency?.total || 30}
                        color="blue"
                    />
                    <SliderField
                        label="Trauma Beds"
                        value={liveOps.bedAvailability.traumaAvailable}
                        onChange={(v) => updateBed('traumaAvailable', v)}
                        max={beds.traumaBeds?.total || 15}
                        color="blue"
                    />
                    <SliderField
                        label="Isolation Beds"
                        value={liveOps.bedAvailability.isolationAvailable}
                        onChange={(v) => updateBed('isolationAvailable', v)}
                        max={beds.isolationBeds?.total || 10}
                        color="blue"
                    />
                </div>
            </div>

            {/* Equipment Availability */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Equipment</h4>
                </div>
                <div className="space-y-5">
                    <SliderField
                        label="Ventilators"
                        value={liveOps.equipmentAvailability.ventilatorsAvailable}
                        onChange={(v) => updateEquipment('ventilatorsAvailable', v)}
                        max={equipment.ventilators?.total || equipment.ventilators || 10}
                        color="purple"
                    />
                    <SliderField
                        label="Defibrillators"
                        value={liveOps.equipmentAvailability.defibrillatorsAvailable}
                        onChange={(v) => updateEquipment('defibrillatorsAvailable', v)}
                        max={equipment.defibrillators || 10}
                        color="purple"
                    />
                </div>
            </div>

            {/* Save Button */}
            {canEdit && (
                <div className="flex items-center justify-between pt-2">
                    <div>
                        {saveSuccess && (
                            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Saved — routing will update automatically
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all ${hasChanges
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {hasChanges ? 'Save Live Ops' : 'No Changes'}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
