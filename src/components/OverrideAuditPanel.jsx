/**
 * OverrideAuditPanel.jsx
 * Phase 3: Override Audit Visibility
 * 
 * Displays override history for judges/admins to review.
 * Shows: case ID, AI vs dispatcher hospital, reason, notes, timestamp.
 * Data source: Firestore dispatchOverrides collection.
 */
import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import {
    ShieldAlert, ArrowRight, Clock, UserCheck, FileText, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function OverrideAuditPanel({ caseId = null, maxEntries = 10 }) {
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);

    const db = getFirestore();

    useEffect(() => {
        // Listen to override audit trail — optionally filtered by caseId
        const q = query(
            collection(db, 'dispatchOverrides'),
            orderBy('timestamp', 'desc'),
            limit(maxEntries)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(entry => !caseId || entry.caseId === caseId);
            setOverrides(entries);
            setLoading(false);
        }, (error) => {
            console.error('Override audit listener error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, caseId, maxEntries]);

    if (loading) {
        return (
            <div className="p-4 text-center">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mx-auto mb-2" />
                <span className="text-gray-400 text-sm">Loading audit trail...</span>
            </div>
        );
    }

    if (overrides.length === 0) {
        return (
            <div className="p-4 text-center">
                <ShieldAlert className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No overrides recorded</p>
                <p className="text-gray-500 text-xs mt-1">AI routing has not been overridden</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 pt-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-white">Override Audit Trail</h4>
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                    {overrides.length} record{overrides.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-2 px-4 pb-3 max-h-[400px] overflow-y-auto">
                {overrides.map((entry) => {
                    // Format timestamp
                    let timeStr = 'Unknown';
                    if (entry.timestamp) {
                        const ts = entry.timestamp._seconds
                            ? new Date(entry.timestamp._seconds * 1000)
                            : entry.timestamp.toDate
                                ? entry.timestamp.toDate()
                                : new Date(entry.timestamp);
                        timeStr = ts.toLocaleString('en-IN', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit'
                        });
                    }

                    return (
                        <div
                            key={entry.id}
                            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 space-y-2"
                        >
                            {/* Header: Case ID + Timestamp */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-gray-400">
                                    Case: {(entry.caseId || 'unknown').slice(0, 12)}...
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" /> {timeStr}
                                </span>
                            </div>

                            {/* Routing Change: AI → Override */}
                            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2">
                                {/* AI Recommended */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-green-400 uppercase font-semibold">AI Pick</div>
                                    <div className="text-sm text-white truncate">{entry.previousHospitalName || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">Score: {entry.previousScore ?? '—'}</div>
                                </div>

                                <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />

                                {/* Override Selection */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-blue-400 uppercase font-semibold">Override</div>
                                    <div className="text-sm text-white truncate">{entry.newHospitalName || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">Score: {entry.newScore ?? '—'}</div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-gray-300">{entry.reasonText || entry.reasonCode || 'No reason given'}</div>
                                </div>
                            </div>

                            {/* Dispatcher */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <UserCheck className="w-3 h-3" />
                                <span>{entry.overriddenByEmail || 'Unknown dispatcher'}</span>
                                {entry.scoreDifference > 0 && (
                                    <span className="ml-auto text-amber-400">
                                        −{entry.scoreDifference} pts
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
