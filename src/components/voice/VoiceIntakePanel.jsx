/**
 * VoiceIntakePanel.jsx — Voice-to-Intake with AI Structured Extraction
 *
 * All user-facing strings are translatable via useT(TK.KEY).
 * Workflow: speak → transcript → Gemini extraction → confirmation modal → apply
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Mic, MicOff, Loader2, CheckCircle, XCircle, AlertTriangle, Activity
} from 'lucide-react';
import { useT } from '../../hooks/useT.js';
import { TK } from '../../constants/translationKeys.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE BAR
// ═══════════════════════════════════════════════════════════════════════════════

function ConfidenceBar({ score }) {
    const tConfidence = useT(TK.VI_CONFIDENCE);
    const tLowConfidence = useT(TK.VI_LOW_CONFIDENCE);

    const pct = Math.round((score ?? 0) * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{tConfidence}</span>
                <span style={{ fontSize: 12, color, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${color}aa, ${color})`,
                    borderRadius: 6, transition: 'width 0.4s ease-out',
                }} />
            </div>
            {pct < 60 && (
                <div style={{
                    marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
                    color: '#fca5a5', fontSize: 11, fontWeight: 600,
                }}>
                    <AlertTriangle size={11} /> {tLowConfidence}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED FIELD ROW
// ═══════════════════════════════════════════════════════════════════════════════

function ExtractedField({ label, value, isMissing }) {
    if (value === null || value === undefined) return null;
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            background: isMissing ? '#422006' : 'transparent',
            padding: '6px 8px', borderRadius: 4, margin: '2px 0',
        }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, minWidth: 140 }}>{label}</span>
            <span style={{
                color: isMissing ? '#fcd34d' : '#e2e8f0', fontSize: 12,
                fontWeight: 700, textAlign: 'right', maxWidth: 160, wordBreak: 'break-word',
            }}>
                {String(value)}
            </span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD LABELS (translated inline)
// ═══════════════════════════════════════════════════════════════════════════════

const RAW_FIELD_LABELS = {
    patientName: 'Patient Name',
    age: 'Age',
    gender: 'Gender',
    heartRate: 'Heart Rate (bpm)',
    systolicBP: 'Systolic BP',
    diastolicBP: 'Diastolic BP',
    spo2: 'SpO₂ (%)',
    respiratoryRate: 'Resp. Rate (/min)',
    temperature: 'Temperature (°C)',
    consciousnessLevel: 'Consciousness',
    traumaIndicators: 'Trauma Indicators',
    symptoms: 'Symptoms',
    emergencyType: 'Emergency Type',
    locationDescription: 'Location',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ConfirmationModal({ transcript, parsedData, onApply, onCancel }) {
    const tTitle = useT(TK.VI_CONFIRM_TITLE);
    const tTranscript = useT(TK.VI_ORIGINAL_TRANSCRIPT);
    const tExtracted = useT(TK.VI_EXTRACTED_FIELDS);
    const tNoFields = useT(TK.VI_NO_FIELDS);
    const tMissingCritical = useT(TK.VI_MISSING_CRITICAL);
    const tApply = useT(TK.VI_APPLY);
    const tCancel = useT(TK.VI_CANCEL);

    const { extractedData, confidenceScore, missingCriticalFields } = parsedData;
    const missingSet = new Set(missingCriticalFields || []);
    const entries = Object.entries(extractedData).filter(([, v]) => v !== null && v !== undefined);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
            <div style={{
                background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 720,
                border: '1px solid #334155', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={18} color="#3b82f6" />
                        <span style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 800 }}>{tTitle}</span>
                    </div>
                    <button onClick={onCancel} id="btn-voice-cancel-modal" style={{
                        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4,
                    }}>
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Confidence */}
                <div style={{ padding: '12px 20px 0' }}>
                    <ConfidenceBar score={confidenceScore} />
                </div>

                {/* Side-by-side */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 16, padding: '12px 20px', overflowY: 'auto', flex: 1,
                }}>
                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                            {tTranscript}
                        </div>
                        <div style={{
                            background: '#1e293b', borderRadius: 8, padding: '10px 12px',
                            color: '#cbd5e1', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic',
                            maxHeight: 300, overflowY: 'auto', border: '1px solid #334155',
                        }}>
                            {transcript}
                        </div>
                    </div>

                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                            {tExtracted}
                        </div>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {entries.length === 0 ? (
                                <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>{tNoFields}</div>
                            ) : (
                                entries.map(([key, val]) => (
                                    <ExtractedField
                                        key={key}
                                        label={RAW_FIELD_LABELS[key] || key}
                                        value={val}
                                        isMissing={missingSet.has(key)}
                                    />
                                ))
                            )}
                        </div>
                        {missingCriticalFields?.length > 0 && (
                            <div style={{
                                marginTop: 8, padding: '6px 8px',
                                background: '#422006', borderRadius: 6,
                                color: '#fcd34d', fontSize: 11, fontWeight: 600,
                            }}>
                                ⚠ {tMissingCritical} {missingCriticalFields.join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    padding: '12px 20px', borderTop: '1px solid #1e293b',
                    display: 'flex', gap: 8, justifyContent: 'flex-end',
                }}>
                    <button onClick={onCancel} id="btn-voice-modal-cancel" style={{
                        padding: '8px 16px', background: '#1e293b', color: '#94a3b8',
                        border: '1px solid #334155', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                        {tCancel}
                    </button>
                    <button onClick={() => onApply(extractedData)} id="btn-voice-apply" style={{
                        padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                    }}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        {tApply}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE INTAKE PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export default function VoiceIntakePanel({ onApplyData }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    const [supported, setSupported] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const recognitionRef = useRef(null);
    const isRecordingRef = useRef(false);
    const abortRef = useRef(null);

    // Translate all UI labels
    const tModeLabel = useT(TK.VI_MODE_LABEL);
    const tOptional = useT(TK.VI_OPTIONAL);
    const tRecordingLabel = useT(TK.VI_RECORDING);
    const tStart = useT(TK.VI_START);
    const tStop = useT(TK.VI_STOP);
    const tExtract = useT(TK.VI_EXTRACT);
    const tExtracting = useT(TK.VI_EXTRACTING);
    const tUnsupported = useT(TK.VI_UNSUPPORTED);
    const tPermDenied = useT(TK.VI_PERMISSION_DENIED);
    const tNoSpeech = useT(TK.VI_NO_SPEECH);
    const tTooShort = useT(TK.VI_TOO_SHORT);
    const tTooLong = useT(TK.VI_TOO_LONG);
    const tTimeout = useT(TK.VI_TIMEOUT);
    const tStartErr = useT(TK.VI_START_ERROR);

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) setSupported(false);
    }, []);

    const stopRecordingCleanup = useCallback(() => {
        setIsRecording(false);
        setInterimText('');
        isRecordingRef.current = false;
    }, []);

    const startRecording = useCallback(() => {
        if (isRecordingRef.current) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setSupported(false); return; }

        setError(null);
        setTranscript('');
        setInterimText('');
        setParsedData(null);

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onstart = () => { setIsRecording(true); isRecordingRef.current = true; };

        recognition.onresult = (event) => {
            let interim = '', final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += text + ' ';
                else interim += text;
            }
            if (final) setTranscript(prev => (prev + final).slice(0, 2000));
            setInterimText(interim);
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'permission-denied') setError(tPermDenied);
            else if (event.error === 'no-speech') setError(tNoSpeech);
            else setError(`Speech recognition error: ${event.error}`);
            stopRecordingCleanup();
        };

        recognition.onend = () => stopRecordingCleanup();

        try {
            recognition.start();
        } catch {
            setError(tStartErr);
            stopRecordingCleanup();
        }
    }, [tPermDenied, tNoSpeech, tStartErr, stopRecordingCleanup]);

    const stopRecording = useCallback(() => {
        recognitionRef.current?.stop();
        stopRecordingCleanup();
    }, [stopRecordingCleanup]);

    const processWithAI = useCallback(async (text) => {
        if (isProcessing) return;
        if (!text || text.trim().length < 5) { setError(tTooShort); return; }
        if (text.length > 2000) { setError(tTooLong); return; }

        setIsProcessing(true);
        setError(null);
        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
            const res = await fetch('/api/voice-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text.trim() }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'AI extraction failed');
            setParsedData(data);
            setShowModal(true);
        } catch (err) {
            clearTimeout(timeout);
            setError(err.name === 'AbortError' ? tTimeout : (err.message || 'AI extraction failed'));
        } finally {
            setIsProcessing(false);
            abortRef.current = null;
        }
    }, [isProcessing, tTooShort, tTooLong, tTimeout]);

    const handleApply = useCallback((extractedData) => {
        setShowModal(false);
        onApplyData(extractedData);
    }, [onApplyData]);

    const handleCancel = useCallback(() => {
        setShowModal(false);
        setParsedData(null);
    }, []);

    if (!supported) {
        return (
            <div style={{
                background: '#1e293b', borderRadius: 12, padding: '12px 16px',
                border: '1px solid #334155', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13,
            }}>
                <MicOff size={14} />
                {tUnsupported}
            </div>
        );
    }

    return (
        <>
            <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                borderRadius: 14, border: '1px solid #334155',
                padding: '16px 18px', marginBottom: 24,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mic size={16} color="#3b82f6" />
                        <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{tModeLabel}</span>
                        <span style={{
                            background: '#1e293b', color: '#64748b', fontSize: 9, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em',
                        }}>{tOptional}</span>
                    </div>
                    {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                                animation: 'voicePulse 1s ease-in-out infinite',
                            }} />
                            <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>{tRecordingLabel}</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!isRecording ? (
                        <button type="button" onClick={startRecording} disabled={isProcessing} id="btn-voice-start"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px',
                                background: isProcessing ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: isProcessing ? '#64748b' : 'white', border: 'none',
                                borderRadius: 8, fontSize: 13, fontWeight: 700,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                boxShadow: isProcessing ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
                            }}>
                            <Mic size={14} /> 🎤 {tStart}
                        </button>
                    ) : (
                        <button type="button" onClick={stopRecording} id="btn-voice-stop"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                color: 'white', border: 'none', borderRadius: 8,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                                animation: 'voicePulseBorder 1.5s ease-in-out infinite',
                            }}>
                            <MicOff size={14} /> {tStop}
                        </button>
                    )}

                    {transcript && !isRecording && !isProcessing && (
                        <button type="button" onClick={() => processWithAI(transcript)} id="btn-voice-process"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                color: 'white', border: 'none', borderRadius: 8,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                            }}>
                            <Activity size={14} /> {tExtract}
                        </button>
                    )}

                    {isProcessing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            {tExtracting}
                        </div>
                    )}
                </div>

                {(transcript || interimText) && (
                    <div style={{
                        marginTop: 10, background: '#0f172a', borderRadius: 8,
                        padding: '8px 12px', border: '1px solid #334155', maxHeight: 80, overflowY: 'auto',
                    }}>
                        <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
                            {transcript}
                            {interimText && <span style={{ color: '#475569', fontStyle: 'italic' }}>{interimText}</span>}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', background: '#450a0a', borderRadius: 6,
                        color: '#fca5a5', fontSize: 12, fontWeight: 600, border: '1px solid #7f1d1d',
                    }}>
                        <AlertTriangle size={11} /> {error}
                    </div>
                )}
            </div>

            {showModal && parsedData && (
                <ConfirmationModal
                    transcript={transcript}
                    parsedData={parsedData}
                    onApply={handleApply}
                    onCancel={handleCancel}
                />
            )}

            <style>{`
                @keyframes voicePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
                @keyframes voicePulseBorder { 0%, 100% { box-shadow: 0 4px 12px rgba(220,38,38,0.3); } 50% { box-shadow: 0 4px 20px rgba(220,38,38,0.6); } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes voiceFieldGlow {
                    0% { box-shadow: 0 0 0 0 rgba(59,130,246,0); background: transparent; }
                    30% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); }
                    100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); background: transparent; }
                }
                .voice-filled { animation: voiceFieldGlow 1.2s ease-out forwards; }
            `}</style>
        </>
    );
}
