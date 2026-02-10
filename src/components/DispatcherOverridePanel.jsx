/**
 * DispatcherOverridePanel.jsx
 * Phase-2: Dispatcher Override Routing
 * 
 * Allows dispatchers to manually override AI-recommended hospital routing.
 * Records reason, creates Firestore audit trail in dispatchOverrides subcollection.
 * Role-gated: only dispatchers and admins can override.
 */
import React, { useState, useCallback } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
    AlertTriangle, ShieldAlert, ArrowRight,
    CheckCircle, Loader2, FileText, Clock, UserCheck
} from 'lucide-react';
import { useTBatch } from "../hooks/useT";

// ─── Override Reasons (pre-defined + free-text) ──────────────────────
const OVERRIDE_REASONS = [
    { id: 'family_request', label: 'Family/Patient Request', icon: '👨‍👩‍👧' },
    { id: 'local_knowledge', label: 'Local Knowledge', icon: '🗺️' },
    { id: 'road_blocked', label: 'Road Blocked / Traffic', icon: '🚧' },
    { id: 'hospital_contacted', label: 'Hospital Pre-Contacted', icon: '📞' },
    { id: 'specialist_available', label: 'Specialist Confirmed Available', icon: '👨‍⚕️' },
    { id: 'capacity_confirmed', label: 'Capacity Confirmed by Phone', icon: '✅' },
    { id: 'other', label: 'Other (specify)', icon: '📝' }
];

export default function DispatcherOverridePanel({
    caseId,
    currentHospital,
    allHospitals = [],
    onOverrideComplete,
    canOverride = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedReason, setSelectedReason] = useState(null);
    const [customReason, setCustomReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Phase 5: Batch translate UI labels
    const { translated: dt } = useTBatch([
        "Override Applied", "Routing updated to", "Override AI Recommendation",
        "Manual Override", "Cancel", "Override AI-recommended routing. This action is audited.",
        "Current:", "Score:", "Override To:", "No alternative hospitals available",
        "Override Reason:", "Applying Override...", "Confirm Override",
        "This override will be recorded in the audit trail"
    ]);
    const D = {
        overrideApplied: dt[0], routingUpdated: dt[1], overrideAI: dt[2],
        manualOverride: dt[3], cancel: dt[4], auditNote: dt[5],
        current: dt[6], score: dt[7], overrideTo: dt[8], noAlternative: dt[9],
        overrideReason: dt[10], applying: dt[11], confirmOverride: dt[12],
        auditTrail: dt[13]
    };

    const db = getFirestore();
    const auth = getAuth();

    // Filter out current hospital from override options
    const overrideOptions = allHospitals.filter(
        h => h.hospitalId !== currentHospital?.hospitalId && !h.disqualified
    );

    const handleOverride = useCallback(async () => {
        if (!caseId || !selectedHospital || !selectedReason) {
            setError('Please select a hospital and reason');
            return;
        }

        const reasonText = selectedReason === 'other'
            ? customReason.trim()
            : OVERRIDE_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

        if (selectedReason === 'other' && !customReason.trim()) {
            setError('Please enter a reason for the override');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const user = auth.currentUser;

            // 1. Create audit trail entry
            const overrideDoc = {
                caseId,
                previousHospitalId: currentHospital?.hospitalId || null,
                previousHospitalName: currentHospital?.hospitalName || 'Unknown',
                previousScore: currentHospital?.suitabilityScore || 0,
                newHospitalId: selectedHospital.hospitalId,
                newHospitalName: selectedHospital.hospitalName,
                newScore: selectedHospital.suitabilityScore || 0,
                reasonCode: selectedReason,
                reasonText,
                overriddenBy: user?.uid || 'unknown',
                overriddenByEmail: user?.email || 'unknown',
                timestamp: serverTimestamp(),
                scoreDifference: (currentHospital?.suitabilityScore || 0) - (selectedHospital.suitabilityScore || 0)
            };

            await addDoc(collection(db, 'dispatchOverrides'), overrideDoc);

            // 2. Update the emergency case with the override
            if (caseId !== 'preview') {
                await updateDoc(doc(db, 'emergencyCases', caseId), {
                    'routing.overriddenHospitalId': selectedHospital.hospitalId,
                    'routing.overriddenHospitalName': selectedHospital.hospitalName,
                    'routing.overrideReason': reasonText,
                    'routing.overriddenAt': serverTimestamp(),
                    'routing.overriddenBy': user?.uid || 'unknown',
                    'routing.wasOverridden': true
                });
            }

            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                if (onOverrideComplete) {
                    onOverrideComplete(selectedHospital, overrideDoc);
                }
            }, 1500);
        } catch (err) {
            console.error('Override failed:', err);
            setError(`Override failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
    }, [caseId, selectedHospital, selectedReason, customReason, currentHospital, db, auth, onOverrideComplete]);

    if (!canOverride) return null;

    // Success state
    if (success) {
        return (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-800">{D.overrideApplied}</p>
                <p className="text-xs text-emerald-600">
                    {D.routingUpdated} {selectedHospital?.hospitalName}
                </p>
            </div>
        );
    }

    // Collapsed toggle button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 rounded-xl text-amber-700 text-sm font-semibold transition-all"
            >
                <ShieldAlert className="w-4 h-4" />
                {D.overrideAI}
            </button>
        );
    }

    // Expanded override form
    return (
        <div className="border-2 border-amber-300 rounded-xl bg-amber-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-700" />
                        <h4 className="font-bold text-amber-900">{D.manualOverride}</h4>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); setError(''); }}
                        className="text-amber-500 hover:text-amber-700 text-sm font-medium"
                    >
                        {D.cancel}
                    </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                    {D.auditNote}
                </p>
            </div>

            <div className="p-4 space-y-4">
                {/* Current Assignment */}
                {currentHospital && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-400">{D.current}</div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                                {currentHospital.hospitalName}
                            </div>
                            <div className="text-xs text-gray-500">
                                {D.score} {currentHospital.suitabilityScore} · {currentHospital.distanceKm}km
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                )}

                {/* Hospital Selection */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                        {D.overrideTo}
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {overrideOptions.length === 0 ? (
                            <p className="text-xs text-gray-400 p-2">{D.noAlternative}</p>
                        ) : (
                            overrideOptions.map(h => (
                                <button
                                    key={h.hospitalId}
                                    onClick={() => setSelectedHospital(h)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all ${selectedHospital?.hospitalId === h.hospitalId
                                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {h.hospitalName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {h.distanceKm}km · {h.etaMinutes}min · {D.score} {h.suitabilityScore}
                                        </div>
                                    </div>
                                    {selectedHospital?.hospitalId === h.hospitalId && (
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Reason Selection */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                        {D.overrideReason}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {OVERRIDE_REASONS.map(reason => (
                            <button
                                key={reason.id}
                                onClick={() => setSelectedReason(reason.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selectedReason === reason.id
                                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <span>{reason.icon}</span>
                                <span className="truncate">{reason.label}</span>
                            </button>
                        ))}
                    </div>

                    {selectedReason === 'other' && (
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Describe the reason for override..."
                            className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                        />
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-600 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleOverride}
                    disabled={!selectedHospital || !selectedReason || saving}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${selectedHospital && selectedReason && !saving
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {D.applying}
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="w-4 h-4" />
                            {D.confirmOverride}
                        </>
                    )}
                </button>

                {/* Audit Warning */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="w-3 h-3" />
                    <span>{D.auditTrail}</span>
                </div>
            </div>
        </div>
    );
}
