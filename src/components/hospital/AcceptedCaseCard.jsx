/**
 * AcceptedCaseCard.jsx
 *
 * Displays a single accepted case in the hospital dashboard with
 * full patient details, vitals, and incident photos.
 */
import React, { useState } from 'react';
import {
    User, Heart, Thermometer, Wind, Brain, Droplets,
    Clock, ChevronDown, ChevronUp, Activity, AlertTriangle,
    Camera, CheckCircle
} from 'lucide-react';

const ACUITY_STYLES = {
    1: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Immediate' },
    2: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Critical' },
    3: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Urgent' },
    4: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Delayed' },
    5: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Minor' },
};

function formatTimestamp(ts) {
    if (!ts) return '—';
    let date;
    if (ts._seconds) date = new Date(ts._seconds * 1000);
    else if (ts.toMillis) date = new Date(ts.toMillis());
    else if (ts.seconds) date = new Date(ts.seconds * 1000);
    else date = new Date(ts);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export default function AcceptedCaseCard({ caseData }) {
    const [expanded, setExpanded] = useState(false);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    if (!caseData) return null;

    const patient = caseData.patientInfo || {};
    const vitals = caseData.vitals || {};
    const neuro = caseData.neurological || {};
    const respCardiac = caseData.respiratoryCardiac || {};
    const trauma = caseData.traumaAssessment || {};
    const emergency = caseData.emergencyContext || {};
    const preHospital = caseData.preHospitalCare || {};
    const photos = caseData.incidentPhotos || [];
    const acuityLevel = caseData.acuityLevel || caseData.aiTriage?.acuityLevel || 3;
    const acuity = ACUITY_STYLES[acuityLevel] || ACUITY_STYLES[3];

    const acceptedAt = caseData.hospitalNotifications
        ?.find(n => n.response === 'accepted')?.respondedAt;

    return (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            {/* Compact Header */}
            <div
                className="p-4 cursor-pointer hover:bg-green-50/50 transition"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">
                                {patient.name || 'Unknown Patient'}
                                {patient.age && <span className="text-gray-500 font-normal ml-2">{patient.age}y</span>}
                                {patient.gender && <span className="text-gray-400 font-normal ml-1">· {patient.gender}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${acuity.bg} ${acuity.text} ${acuity.border}`}>
                                    {acuity.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {emergency.emergencyType || 'Emergency'}
                                </span>
                                {photos.length > 0 && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Camera className="w-3 h-3" /> {photos.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Accepted</div>
                            <div className="text-xs text-gray-600 font-medium">{formatTimestamp(acceptedAt)}</div>
                        </div>
                        {expanded
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                </div>
            </div>

            {/* Expanded Patient Details */}
            {expanded && (
                <div className="border-t border-green-100 p-4 space-y-4 bg-green-50/30">
                    {/* Vitals Grid */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Activity className="w-4 h-4 text-blue-500" /> Vitals
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {vitals.bloodPressure && (
                                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                                    <div className="text-xs text-gray-400">BP</div>
                                    <div className="text-sm font-bold text-gray-900">{vitals.bloodPressure}</div>
                                </div>
                            )}
                            {vitals.heartRate > 0 && (
                                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> HR</div>
                                    <div className="text-sm font-bold text-gray-900">{vitals.heartRate} bpm</div>
                                </div>
                            )}
                            {vitals.spo2 > 0 && (
                                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                                    <div className="text-xs text-gray-400">SpO₂</div>
                                    <div className="text-sm font-bold text-gray-900">{vitals.spo2}%</div>
                                </div>
                            )}
                            {vitals.temperature > 0 && (
                                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1"><Thermometer className="w-3 h-3" /> Temp</div>
                                    <div className="text-sm font-bold text-gray-900">{vitals.temperature}°{vitals.temperatureUnit || 'C'}</div>
                                </div>
                            )}
                            {vitals.respiratoryRate > 0 && (
                                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1"><Wind className="w-3 h-3" /> RR</div>
                                    <div className="text-sm font-bold text-gray-900">{vitals.respiratoryRate}/min</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Neurological + Respiratory */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                                <Brain className="w-3 h-3" /> Neurological
                            </h5>
                            <div className="space-y-1 text-sm text-gray-700">
                                {neuro.consciousnessLevel && <div>Consciousness: <strong>{neuro.consciousnessLevel}</strong></div>}
                                {neuro.headInjurySuspected && <div className="text-red-600">⚠️ Head injury suspected</div>}
                                {neuro.seizureActivity && <div className="text-red-600">⚠️ Seizure activity</div>}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                                <Heart className="w-3 h-3" /> Respiratory & Cardiac
                            </h5>
                            <div className="space-y-1 text-sm text-gray-700">
                                {respCardiac.breathingStatus && <div>Breathing: <strong>{respCardiac.breathingStatus}</strong></div>}
                                {respCardiac.chestPainPresent && <div className="text-red-600">⚠️ Chest pain present</div>}
                                {respCardiac.cardiacHistoryKnown && <div>Cardiac history: known</div>}
                            </div>
                        </div>
                    </div>

                    {/* Trauma */}
                    {(trauma.injuryType || trauma.bleedingSeverity) && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Trauma Assessment
                            </h5>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                {trauma.injuryType && <span>Injury: <strong>{trauma.injuryType}</strong></span>}
                                {trauma.bleedingSeverity && <span>· Bleeding: <strong>{trauma.bleedingSeverity}</strong></span>}
                                {trauma.burnsPercentage > 0 && <span>· Burns: <strong>{trauma.burnsPercentage}%</strong></span>}
                            </div>
                        </div>
                    )}

                    {/* Pre-hospital care */}
                    {(preHospital.oxygenAdministered || preHospital.cprPerformed || preHospital.ivFluidsStarted) && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="text-xs font-bold text-gray-500 mb-1.5">Pre-Hospital Care</h5>
                            <div className="flex flex-wrap gap-2">
                                {preHospital.oxygenAdministered && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">O₂ Given</span>
                                )}
                                {preHospital.cprPerformed && (
                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">CPR Done</span>
                                )}
                                {preHospital.ivFluidsStarted && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">IV Initiated</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Emergency Context */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h5 className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Emergency Context
                        </h5>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                            <span>Type: <strong>{emergency.emergencyType || '—'}</strong></span>
                            <span>Incident: <strong>{formatTimestamp(emergency.incidentTimestamp)}</strong></span>
                            {emergency.environmentalRisks && <span>Env: <strong>{emergency.environmentalRisks}</strong></span>}
                        </div>
                    </div>

                    {/* Incident Photos */}
                    {photos.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                <Camera className="w-4 h-4 text-amber-500" /> Incident Photos ({photos.length})
                            </h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {photos.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Incident photo ${i + 1}`}
                                        className="w-28 h-28 object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition flex-shrink-0"
                                        onClick={() => setLightboxPhoto(url)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Triage Summary */}
                    {caseData.aiTriage && (
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <h5 className="text-xs font-bold text-purple-700 mb-1">🤖 AI Triage</h5>
                            <div className="text-sm text-purple-800">
                                {caseData.aiTriage.summary || caseData.aiTriage.reasoning || 'AI triage data available'}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Photo Lightbox */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <img
                        src={lightboxPhoto}
                        alt="Full size incident photo"
                        className="max-w-full max-h-full rounded-xl object-contain"
                    />
                    <button
                        className="absolute top-4 right-4 text-white bg-gray-800/80 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition"
                        onClick={() => setLightboxPhoto(null)}
                    >✕</button>
                </div>
            )}
        </div>
    );
}
