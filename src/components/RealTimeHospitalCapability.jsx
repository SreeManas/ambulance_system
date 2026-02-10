/**
 * RealTimeHospitalCapability.jsx
 * 
 * Dedicated dashboard for real-time hospital capacity management.
 * All hospitals displayed with editable bed counts, equipment, specialists,
 * and emergency readiness. Changes sync to Firestore liveOps and feed
 * directly into the routing scoring engine.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
    Bed, Activity, Zap, Stethoscope, Shield, Clock,
    Search, Filter, ChevronDown, ChevronUp, Save,
    CheckCircle, Loader2, AlertTriangle, RefreshCw,
    Truck, Heart, Brain, Eye, Baby, Flame,
    Thermometer, XCircle
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const safeNum = (v, d = 0) => { const n = Number(v); return isFinite(n) ? n : d; };

// ─── Editable Number Cell ────────────────────────────────────────────
function EditCell({ value, onChange, min = 0, max = 999, label }) {
    return (
        <div className="flex flex-col items-center">
            <input
                type="number"
                value={value}
                onChange={e => onChange(clamp(e.target.value, min, max))}
                min={min}
                max={max}
                className="w-16 h-9 text-center text-sm font-bold border-2 border-gray-200 rounded-lg
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                title={label}
            />
            {label && <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[64px]">{label}</span>}
        </div>
    );
}

// ─── Status Toggle ───────────────────────────────────────────────────
function StatusToggle({ status, onChange }) {
    const configs = {
        accepting: { bg: 'bg-emerald-500', label: '✅ Accepting', ring: 'ring-emerald-200' },
        diverting: { bg: 'bg-amber-500', label: '⚠️ Diverting', ring: 'ring-amber-200' },
        full: { bg: 'bg-red-500', label: '🚫 Full', ring: 'ring-red-200' }
    };
    const order = ['accepting', 'diverting', 'full'];
    const nextStatus = () => {
        const idx = order.indexOf(status);
        onChange(order[(idx + 1) % order.length]);
    };
    const cfg = configs[status] || configs.accepting;

    return (
        <button
            onClick={nextStatus}
            className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold ${cfg.bg} ring-2 ${cfg.ring}
                hover:opacity-90 transition-all shadow-sm`}
            title="Click to cycle status"
        >
            {cfg.label}
        </button>
    );
}

// ─── Specialist Toggle Chip ──────────────────────────────────────────
function SpecialistChip({ name, available, onChange }) {
    const specialistIcons = {
        traumaSurgeon: '🔪', cardiologist: '❤️', neurologist: '🧠',
        orthopedic: '🦴', pulmonologist: '🫁', pediatrician: '👶',
        burnSpecialist: '🔥', toxicologist: '☠️', obstetrician: '🤰',
        generalSurgeon: '⚕️', anesthesiologist: '💉', radiologist: '📡'
    };
    const icon = specialistIcons[name] || '👨‍⚕️';
    const displayName = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

    return (
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">{icon}</span>
            <span className="text-xs text-gray-600 truncate flex-1">{displayName}</span>
            <input
                type="number"
                value={available}
                onChange={e => onChange(clamp(e.target.value, 0, 20))}
                min={0}
                max={20}
                className="w-12 h-7 text-center text-xs font-bold border border-gray-200 rounded-md
                    focus:border-blue-400 focus:ring-1 focus:ring-blue-200 bg-white"
            />
        </div>
    );
}

// ─── Hospital Row ────────────────────────────────────────────────────
function HospitalRow({ hospital, onUpdate, saving, savedId }) {
    const [expanded, setExpanded] = useState(false);
    const [local, setLocal] = useState({});

    // Initialize local state from hospital data
    useEffect(() => {
        const beds = hospital.bedAvailability || {};
        const equip = hospital.equipment || {};
        const ready = hospital.emergencyReadiness || {};
        const specs = hospital.specialists || {};
        const liveOps = hospital.liveOps || {};

        setLocal({
            // Beds — prefer liveOps, fallback to static
            icuAvailable: safeNum(liveOps.bedAvailability?.icuAvailable ?? beds.icu?.available, 0),
            icuTotal: safeNum(beds.icu?.total, 0),
            emergencyAvailable: safeNum(liveOps.bedAvailability?.emergencyAvailable ?? beds.emergency?.available, 0),
            emergencyTotal: safeNum(beds.emergency?.total, 0),
            traumaAvailable: safeNum(liveOps.bedAvailability?.traumaAvailable ?? beds.traumaBeds?.available, 0),
            traumaTotal: safeNum(beds.traumaBeds?.total, 0),
            isolationAvailable: safeNum(liveOps.bedAvailability?.isolationAvailable ?? beds.isolationBeds?.available, 0),
            isolationTotal: safeNum(beds.isolationBeds?.total, 0),
            pediatricAvailable: safeNum(beds.pediatricBeds?.available, 0),
            pediatricTotal: safeNum(beds.pediatricBeds?.total, 0),
            totalBeds: safeNum(beds.total, 0),
            totalAvailable: safeNum(beds.available, 0),

            // Equipment
            ventilatorsAvailable: safeNum(liveOps.equipmentAvailability?.ventilatorsAvailable ?? equip.ventilators?.available ?? equip.ventilators, 0),
            ventilatorsTotal: safeNum(equip.ventilators?.total ?? equip.ventilators, 0),
            defibrillatorsAvailable: safeNum(liveOps.equipmentAvailability?.defibrillatorsAvailable ?? equip.defibrillators, 0),
            defibrillatorsTotal: safeNum(equip.defibrillators, 0),
            ctScanners: safeNum(equip.ctScanners, 0),
            portableXRay: safeNum(equip.portableXRay, 0),

            // Readiness
            status: liveOps.emergencyReadiness?.status || ready.status || 'accepting',
            ambulanceQueue: safeNum(liveOps.emergencyReadiness?.ambulanceQueue ?? ready.ambulanceQueue, 0),

            // Specialists (flatten to available counts)
            specialists: {
                traumaSurgeon: safeNum(specs.traumaSurgeon?.available ?? specs.traumaSurgeon, 0),
                cardiologist: safeNum(specs.cardiologist?.available ?? specs.cardiologist, 0),
                neurologist: safeNum(specs.neurologist?.available ?? specs.neurologist, 0),
                orthopedic: safeNum(specs.orthopedic?.available ?? specs.orthopedic, 0),
                pulmonologist: safeNum(specs.pulmonologist?.available ?? specs.pulmonologist, 0),
                pediatrician: safeNum(specs.pediatrician?.available ?? specs.pediatrician, 0),
                generalSurgeon: safeNum(specs.generalSurgeon?.available ?? specs.generalSurgeon, 0),
                anesthesiologist: safeNum(specs.anesthesiologist?.available ?? specs.anesthesiologist, 0),
            }
        });
    }, [hospital]);

    const updateField = (field, value) => {
        setLocal(prev => ({ ...prev, [field]: value }));
    };

    const updateSpecialist = (name, value) => {
        setLocal(prev => ({
            ...prev,
            specialists: { ...prev.specialists, [name]: value }
        }));
    };

    const handleSave = () => {
        onUpdate(hospital.id, local);
    };

    // Capacity metrics
    const totalUsed = (local.icuTotal - local.icuAvailable) +
        (local.emergencyTotal - local.emergencyAvailable) +
        (local.traumaTotal - local.traumaAvailable);
    const totalCap = local.icuTotal + local.emergencyTotal + local.traumaTotal;
    const occupancy = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
    const occupancyColor = occupancy > 90 ? 'text-red-600' : occupancy > 70 ? 'text-amber-600' : 'text-emerald-600';
    const barColor = occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-emerald-500';

    const hospitalName = hospital.basicInfo?.name || 'Unknown Hospital';
    const hospitalType = hospital.basicInfo?.hospitalType || 'general';
    const isSaving = saving === hospital.id;
    const justSaved = savedId === hospital.id;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Compact Row */}
            <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Status */}
                <StatusToggle
                    status={local.status}
                    onChange={(s) => { updateField('status', s); }}
                />

                {/* Hospital Name */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{hospitalName}</h3>
                    <p className="text-xs text-gray-400 capitalize">{hospitalType}</p>
                </div>

                {/* Quick Bed Stats */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-3">
                        <div className="text-xs text-gray-400">ICU</div>
                        <div className="text-sm font-bold text-blue-600">{local.icuAvailable}/{local.icuTotal}</div>
                    </div>
                    <div className="text-center px-3">
                        <div className="text-xs text-gray-400">ER</div>
                        <div className="text-sm font-bold text-green-600">{local.emergencyAvailable}/{local.emergencyTotal}</div>
                    </div>
                    <div className="text-center px-3">
                        <div className="text-xs text-gray-400">Trauma</div>
                        <div className="text-sm font-bold text-purple-600">{local.traumaAvailable}/{local.traumaTotal}</div>
                    </div>
                    <div className="text-center px-3">
                        <div className="text-xs text-gray-400">Queue</div>
                        <div className="text-sm font-bold text-amber-600">{local.ambulanceQueue}</div>
                    </div>
                </div>

                {/* Occupancy Bar */}
                <div className="w-24 hidden lg:block">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Load</span>
                        <span className={`font-bold ${occupancyColor}`}>{occupancy}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${occupancy}%` }} />
                    </div>
                </div>

                {/* Save + Expand */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                        disabled={isSaving}
                        className={`p-2 rounded-lg transition-all ${justSaved ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                        title="Save changes"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            justSaved ? <CheckCircle className="w-4 h-4" /> :
                                <Save className="w-4 h-4" />}
                    </button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {/* Expanded Edit Section */}
            {expanded && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/50 space-y-5">
                    {/* Bed Availability Grid */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5" /> Bed Availability
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-white rounded-lg border border-blue-100 p-3">
                                <div className="text-xs text-blue-600 font-semibold mb-2">🏥 ICU</div>
                                <div className="flex items-center gap-2">
                                    <EditCell value={local.icuAvailable} onChange={v => updateField('icuAvailable', v)} max={local.icuTotal || 100} label="Avail" />
                                    <span className="text-gray-300">/</span>
                                    <EditCell value={local.icuTotal} onChange={v => updateField('icuTotal', v)} label="Total" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-green-100 p-3">
                                <div className="text-xs text-green-600 font-semibold mb-2">🚑 Emergency</div>
                                <div className="flex items-center gap-2">
                                    <EditCell value={local.emergencyAvailable} onChange={v => updateField('emergencyAvailable', v)} max={local.emergencyTotal || 100} label="Avail" />
                                    <span className="text-gray-300">/</span>
                                    <EditCell value={local.emergencyTotal} onChange={v => updateField('emergencyTotal', v)} label="Total" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-purple-100 p-3">
                                <div className="text-xs text-purple-600 font-semibold mb-2">🩹 Trauma</div>
                                <div className="flex items-center gap-2">
                                    <EditCell value={local.traumaAvailable} onChange={v => updateField('traumaAvailable', v)} max={local.traumaTotal || 100} label="Avail" />
                                    <span className="text-gray-300">/</span>
                                    <EditCell value={local.traumaTotal} onChange={v => updateField('traumaTotal', v)} label="Total" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-yellow-100 p-3">
                                <div className="text-xs text-yellow-600 font-semibold mb-2">🔒 Isolation</div>
                                <div className="flex items-center gap-2">
                                    <EditCell value={local.isolationAvailable} onChange={v => updateField('isolationAvailable', v)} max={local.isolationTotal || 100} label="Avail" />
                                    <span className="text-gray-300">/</span>
                                    <EditCell value={local.isolationTotal} onChange={v => updateField('isolationTotal', v)} label="Total" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-pink-100 p-3">
                                <div className="text-xs text-pink-600 font-semibold mb-2">👶 Pediatric</div>
                                <div className="flex items-center gap-2">
                                    <EditCell value={local.pediatricAvailable} onChange={v => updateField('pediatricAvailable', v)} max={local.pediatricTotal || 100} label="Avail" />
                                    <span className="text-gray-300">/</span>
                                    <EditCell value={local.pediatricTotal} onChange={v => updateField('pediatricTotal', v)} label="Total" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Equipment + Readiness Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Equipment */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" /> Equipment
                            </h4>
                            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <span>🫁</span> Ventilators
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <EditCell value={local.ventilatorsAvailable} onChange={v => updateField('ventilatorsAvailable', v)} max={local.ventilatorsTotal || 50} />
                                        <span className="text-gray-300 text-sm">/</span>
                                        <EditCell value={local.ventilatorsTotal} onChange={v => updateField('ventilatorsTotal', v)} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <span>⚡</span> Defibrillators
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <EditCell value={local.defibrillatorsAvailable} onChange={v => updateField('defibrillatorsAvailable', v)} max={local.defibrillatorsTotal || 50} />
                                        <span className="text-gray-300 text-sm">/</span>
                                        <EditCell value={local.defibrillatorsTotal} onChange={v => updateField('defibrillatorsTotal', v)} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <span>📡</span> CT Scanners
                                    </span>
                                    <EditCell value={local.ctScanners} onChange={v => updateField('ctScanners', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Readiness */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Emergency Readiness
                            </h4>
                            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Status</span>
                                    <StatusToggle status={local.status} onChange={s => updateField('status', s)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-gray-400" /> Ambulance Queue
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateField('ambulanceQueue', Math.max(0, local.ambulanceQueue - 1))}
                                            className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center">−</button>
                                        <span className="w-8 text-center font-bold text-gray-900">{local.ambulanceQueue}</span>
                                        <button onClick={() => updateField('ambulanceQueue', Math.min(50, local.ambulanceQueue + 1))}
                                            className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specialists */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" /> Available Specialists
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white rounded-lg border border-gray-200 p-3">
                            {Object.entries(local.specialists || {}).map(([name, avail]) => (
                                <SpecialistChip
                                    key={name}
                                    name={name}
                                    available={avail}
                                    onChange={v => updateSpecialist(name, v)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                                bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                                text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save to Live Routing'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function RealTimeHospitalCapability() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [saving, setSaving] = useState(null);
    const [savedId, setSavedId] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const db = getFirestore();
    const auth = getAuth();

    // Real-time Firestore listener
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'hospitals'),
            (snapshot) => {
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setHospitals(list);
                setLastRefresh(new Date());
                setLoading(false);
            },
            (err) => {
                console.error('Hospital listener error:', err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [db]);

    // Save handler — writes liveOps + syncs key fields
    const handleUpdate = useCallback(async (hospitalId, localData) => {
        setSaving(hospitalId);
        try {
            const user = auth.currentUser;
            const updatePayload = {
                // liveOps for scoring engine override
                liveOps: {
                    bedAvailability: {
                        icuAvailable: localData.icuAvailable,
                        emergencyAvailable: localData.emergencyAvailable,
                        traumaAvailable: localData.traumaAvailable,
                        isolationAvailable: localData.isolationAvailable
                    },
                    equipmentAvailability: {
                        ventilatorsAvailable: localData.ventilatorsAvailable,
                        defibrillatorsAvailable: localData.defibrillatorsAvailable
                    },
                    emergencyReadiness: {
                        status: localData.status,
                        ambulanceQueue: localData.ambulanceQueue
                    },
                    lastUpdated: serverTimestamp(),
                    updatedBy: user?.uid || 'unknown'
                },
                // Also update top-level fields for backward compatibility
                'bedAvailability.icu.available': localData.icuAvailable,
                'bedAvailability.icu.total': localData.icuTotal,
                'bedAvailability.emergency.available': localData.emergencyAvailable,
                'bedAvailability.emergency.total': localData.emergencyTotal,
                'bedAvailability.traumaBeds.available': localData.traumaAvailable,
                'bedAvailability.traumaBeds.total': localData.traumaTotal,
                'bedAvailability.isolationBeds.available': localData.isolationAvailable,
                'bedAvailability.isolationBeds.total': localData.isolationTotal,
                'bedAvailability.pediatricBeds.available': localData.pediatricAvailable,
                'bedAvailability.pediatricBeds.total': localData.pediatricTotal,
                'equipment.ventilators.available': localData.ventilatorsAvailable,
                'equipment.ventilators.total': localData.ventilatorsTotal,
                'equipment.defibrillators': localData.defibrillatorsAvailable,
                'equipment.ctScanners': localData.ctScanners,
                'emergencyReadiness.status': localData.status,
                'emergencyReadiness.ambulanceQueue': localData.ambulanceQueue,
                // Specialist available counts
                'specialists.traumaSurgeon.available': localData.specialists.traumaSurgeon,
                'specialists.cardiologist.available': localData.specialists.cardiologist,
                'specialists.neurologist.available': localData.specialists.neurologist,
                'specialists.orthopedic.available': localData.specialists.orthopedic,
                'specialists.pulmonologist.available': localData.specialists.pulmonologist,
                'specialists.pediatrician.available': localData.specialists.pediatrician,
                'specialists.generalSurgeon.available': localData.specialists.generalSurgeon,
                'specialists.anesthesiologist.available': localData.specialists.anesthesiologist,
                capacityLastUpdated: serverTimestamp()
            };

            await updateDoc(doc(db, 'hospitals', hospitalId), updatePayload);
            setSavedId(hospitalId);
            setSaveError(null);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
            console.error('Update failed:', err);
            const msg = err?.code === 'permission-denied'
                ? 'Permission denied — your role may not allow hospital edits. Try logging in as Hospital Admin.'
                : `Save failed: ${err?.message || 'Unknown error'}`;
            setSaveError(msg);
        } finally {
            setSaving(null);
        }
    }, [db, auth]);

    // Filtering
    const filtered = useMemo(() => {
        let result = hospitals;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(h =>
                (h.basicInfo?.name || '').toLowerCase().includes(q) ||
                (h.basicInfo?.hospitalType || '').toLowerCase().includes(q) ||
                (h.basicInfo?.address || '').toLowerCase().includes(q)
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter(h => {
                const status = h.liveOps?.emergencyReadiness?.status || h.emergencyReadiness?.status || 'accepting';
                return status === filterStatus;
            });
        }

        return result;
    }, [hospitals, search, filterStatus]);

    // Summary stats
    const stats = useMemo(() => {
        const accepting = hospitals.filter(h => (h.liveOps?.emergencyReadiness?.status || h.emergencyReadiness?.status || 'accepting') === 'accepting').length;
        const diverting = hospitals.filter(h => (h.liveOps?.emergencyReadiness?.status || h.emergencyReadiness?.status) === 'diverting').length;
        const full = hospitals.filter(h => (h.liveOps?.emergencyReadiness?.status || h.emergencyReadiness?.status) === 'full').length;
        const totalIcu = hospitals.reduce((sum, h) => sum + safeNum(h.liveOps?.bedAvailability?.icuAvailable ?? h.bedAvailability?.icu?.available, 0), 0);
        const totalEr = hospitals.reduce((sum, h) => sum + safeNum(h.liveOps?.bedAvailability?.emergencyAvailable ?? h.bedAvailability?.emergency?.available, 0), 0);
        return { accepting, diverting, full, totalIcu, totalEr };
    }, [hospitals]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading hospital data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Error Banner */}
            {saveError && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{saveError}</span>
                    <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        Real-Time Hospital Capability
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Edit bed counts, equipment, and specialists — changes feed into live routing
                    </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live — {hospitals.length} hospitals
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lastRefresh.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">Accepting</div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.accepting}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">Diverting</div>
                    <div className="text-2xl font-bold text-amber-600">{stats.diverting}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">Full</div>
                    <div className="text-2xl font-bold text-red-600">{stats.full}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">ICU Available</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalIcu}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">ER Available</div>
                    <div className="text-2xl font-bold text-green-600">{stats.totalEr}</div>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search hospitals..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'accepting', 'diverting', 'full'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize ${filterStatus === s
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {s === 'all' ? `All (${hospitals.length})` : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hospital List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                        <p>No hospitals match your search</p>
                    </div>
                ) : (
                    filtered.map(hospital => (
                        <HospitalRow
                            key={hospital.id}
                            hospital={hospital}
                            onUpdate={handleUpdate}
                            saving={saving}
                            savedId={savedId}
                        />
                    ))
                )}
            </div>

            {/* Footer info */}
            <div className="text-center text-xs text-gray-400 py-4">
                💡 Changes are saved to Firestore and immediately affect routing scores in the Routing Dashboard
            </div>
        </div>
    );
}
