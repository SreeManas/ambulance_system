/**
 * VoiceIntakePanel.jsx — Voice-to-Intake with MediaRecorder + Gemini Audio
 *
 * REPLACES Web Speech API entirely.
 * Uses MediaRecorder (browser-native, no Google Speech server dependency).
 *
 * Flow:
 *   🎤 Start → MediaRecorder.start() → audio chunks accumulate
 *   ⏹ Stop  → MediaRecorder.stop() → blob assembled → base64 → POST /api/voice-intake-audio
 *   Gemini transcribes + extracts in one call → show transcript + modal
 *   User confirms → apply to form
 *
 * No Web Speech API. No Google Speech servers. Works on any HTTPS deployment.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Mic, MicOff, Square, Loader2, CheckCircle, XCircle,
    AlertTriangle, Activity, WifiOff
} from 'lucide-react';
import { useT } from '../../hooks/useT.js';
import { TK } from '../../constants/translationKeys.js';

// ─── Capability Check ─────────────────────────────────────────────────────────

function getCapability() {
    const isLocalhost =
        location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocalhost) return 'insecure';
    if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
    if (typeof MediaRecorder === 'undefined') return 'unsupported';
    return 'ready';
}

// ─── Best supported MIME type ─────────────────────────────────────────────────

function getBestMime() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
    ];
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'audio/webm';
}

// ─── blob → base64 ────────────────────────────────────────────────────────────

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE BAR
// ═══════════════════════════════════════════════════════════════════════════════

function ConfidenceBar({ score }) {
    const tConf = useT(TK.VI_CONFIDENCE);
    const tLow = useT(TK.VI_LOW_CONFIDENCE);
    const pct = Math.round((score ?? 0) * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{tConf}</span>
                <span style={{ fontSize: 12, color, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}aa,${color})`, borderRadius: 6, transition: 'width .4s' }} />
            </div>
            {pct < 60 && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: '#fca5a5', fontSize: 11, fontWeight: 600 }}>
                    <AlertTriangle size={11} /> {tLow}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED FIELD
// ═══════════════════════════════════════════════════════════════════════════════

const FIELD_LABELS = {
    patientName: 'Patient Name', age: 'Age', gender: 'Gender',
    heartRate: 'Heart Rate (bpm)', systolicBP: 'Systolic BP', diastolicBP: 'Diastolic BP',
    spo2: 'SpO₂ (%)', respiratoryRate: 'Resp. Rate (/min)', temperature: 'Temperature (°C)',
    consciousnessLevel: 'Consciousness', traumaIndicators: 'Trauma Indicators',
    symptoms: 'Symptoms', emergencyType: 'Emergency Type', locationDescription: 'Location',
};

function ExtractedField({ label, value, isMissing }) {
    if (value == null) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', background: isMissing ? '#422006' : 'transparent', padding: '6px 8px', borderRadius: 4, margin: '2px 0' }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, minWidth: 140 }}>{label}</span>
            <span style={{ color: isMissing ? '#fcd34d' : '#e2e8f0', fontSize: 12, fontWeight: 700, textAlign: 'right', maxWidth: 160, wordBreak: 'break-word' }}>{String(value)}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ConfirmationModal({ transcript, parsedData, onApply, onCancel }) {
    const tTitle = useT(TK.VI_CONFIRM_TITLE);
    const tTr = useT(TK.VI_ORIGINAL_TRANSCRIPT);
    const tEx = useT(TK.VI_EXTRACTED_FIELDS);
    const tNone = useT(TK.VI_NO_FIELDS);
    const tMiss = useT(TK.VI_MISSING_CRITICAL);
    const tApply = useT(TK.VI_APPLY);
    const tCan = useT(TK.VI_CANCEL);

    const { extractedData, confidenceScore, missingCriticalFields } = parsedData;
    const missing = new Set(missingCriticalFields || []);
    const entries = Object.entries(extractedData || {}).filter(([, v]) => v != null);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 720, border: '1px solid #334155', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={18} color="#3b82f6" />
                        <span style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 800 }}>{tTitle}</span>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><XCircle size={20} /></button>
                </div>
                <div style={{ padding: '12px 20px 0' }}><ConfidenceBar score={confidenceScore} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{tTr}</div>
                        <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px', color: '#cbd5e1', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic', maxHeight: 300, overflowY: 'auto', border: '1px solid #334155' }}>{transcript}</div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{tEx}</div>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {entries.length === 0
                                ? <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>{tNone}</div>
                                : entries.map(([k, v]) => <ExtractedField key={k} label={FIELD_LABELS[k] || k} value={v} isMissing={missing.has(k)} />)
                            }
                        </div>
                        {missingCriticalFields?.length > 0 && (
                            <div style={{ marginTop: 8, padding: '6px 8px', background: '#422006', borderRadius: 6, color: '#fcd34d', fontSize: 11, fontWeight: 600 }}>
                                ⚠ {tMiss} {missingCriticalFields.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 16px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{tCan}</button>
                    <button onClick={() => onApply(extractedData)} id="btn-voice-apply" style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />{tApply}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECORDING TIMER
// ═══════════════════════════════════════════════════════════════════════════════

function RecordingTimer({ startTime }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
        return () => clearInterval(id);
    }, [startTime]);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    return <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{m}:{s}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function VoiceIntakePanel({ onApplyData }) {
    const [capability] = useState(getCapability);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    const [softWarning, setSoftWarning] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [recordStart, setRecordStart] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const isProcessingRef = useRef(false);
    const abortRef = useRef(null);
    const streamRef = useRef(null);

    const tModeLabel = useT(TK.VI_MODE_LABEL);
    const tOptional = useT(TK.VI_OPTIONAL);
    const tRecording = useT(TK.VI_RECORDING);
    const tStart = useT(TK.VI_START);
    const tStop = useT(TK.VI_STOP);
    const tExtract = useT(TK.VI_EXTRACT);
    const tExtracting = useT(TK.VI_EXTRACTING);
    const tUnsupported = useT(TK.VI_UNSUPPORTED);
    const tTooLong = useT(TK.VI_TOO_LONG);
    const tTimeout = useT(TK.VI_TIMEOUT);
    const tPermDenied = useT(TK.VI_PERMISSION_DENIED);
    const tInsecure = useT('Voice recognition requires HTTPS.');
    const tTooShort = useT('Recording too short. Please speak for at least 2 seconds.');

    // Cleanup on unmount
    useEffect(() => () => {
        stopStream();
        abortRef.current?.abort();
    }, []);

    const stopStream = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };

    // ── Start Recording ───────────────────────────────────────────────────────

    const startRecording = useCallback(async () => {
        if (isRecording || isProcessingRef.current) return;

        setError(null);
        setSoftWarning(null);
        setTranscript('');
        setParsedData(null);
        chunksRef.current = [];

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
        } catch (err) {
            const msg = err.name === 'NotAllowedError'
                ? tPermDenied
                : 'Microphone access failed. Please check your device.';
            setError(msg);
            return;
        }

        streamRef.current = stream;
        const mime = getBestMime();
        const recorder = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data?.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            stopStream();
            setIsRecording(false);

            const durationSec = (Date.now() - recordStart) / 1000;
            const blob = new Blob(chunksRef.current, { type: mime });

            if (durationSec < 1.5 || blob.size < 1000) {
                setSoftWarning(tTooShort);
                return;
            }

            // Trigger AI processing automatically after stop
            await processAudio(blob, mime);
        };

        recorder.start(100); // collect chunks every 100ms
        setIsRecording(true);
        setRecordStart(Date.now());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording, tPermDenied, tTooShort]);

    // ── Stop Recording ────────────────────────────────────────────────────────

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    // ── Process Audio via Gemini ──────────────────────────────────────────────

    const processAudio = useCallback(async (blob, mimeType) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        setIsProcessing(true);
        setError(null);
        setSoftWarning(null);

        // Size check: 500k base64 chars ≈ ~375kB blob ≈ ~60s at low bitrate
        if (blob.size > 4 * 1024 * 1024) {
            setError(tTooLong);
            isProcessingRef.current = false;
            setIsProcessing(false);
            return;
        }

        let base64;
        try {
            base64 = await blobToBase64(blob);
        } catch {
            setError('Failed to read audio data. Please try again.');
            isProcessingRef.current = false;
            setIsProcessing(false);
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), 30_000);

        try {
            const res = await fetch('/api/voice-intake-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64, mimeType }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'AI extraction failed');

            setTranscript(data.transcript || '');
            setParsedData(data);
            setShowModal(true);
        } catch (err) {
            clearTimeout(timeout);
            setError(err.name === 'AbortError' ? tTimeout : (err.message || 'Processing failed. Try again.'));
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
            abortRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tTooLong, tTimeout]);

    const handleApply = useCallback((extractedData) => {
        setShowModal(false);
        onApplyData(extractedData);
    }, [onApplyData]);

    const handleCancel = useCallback(() => {
        setShowModal(false);
        setParsedData(null);
    }, []);

    // ── Capability Gates ──────────────────────────────────────────────────────

    if (capability === 'insecure') {
        return (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 16px', border: '1px solid #334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <WifiOff size={14} color="#f59e0b" />
                <span style={{ color: '#fcd34d', fontWeight: 600, fontSize: 13 }}>{tInsecure}</span>
            </div>
        );
    }
    if (capability === 'unsupported') {
        return (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 16px', border: '1px solid #334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
                <MicOff size={14} /> {tUnsupported}
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, border: '1px solid #334155', padding: '16px 18px', marginBottom: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mic size={16} color="#3b82f6" />
                        <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{tModeLabel}</span>
                        <span style={{ background: '#1e293b', color: '#64748b', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '.06em' }}>{tOptional}</span>
                    </div>
                    {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'voicePulse 1s ease-in-out infinite' }} />
                            <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>{tRecording}</span>
                            {recordStart && <RecordingTimer startTime={recordStart} />}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!isRecording && !isProcessing && (
                        <button type="button" onClick={startRecording} id="btn-voice-start" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}>
                            <Mic size={14} /> 🎤 {tStart}
                        </button>
                    )}

                    {isRecording && (
                        <button type="button" onClick={stopRecording} id="btn-voice-stop" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', animation: 'voicePulseBorder 1.5s ease-in-out infinite' }}>
                            <Square size={14} fill="white" /> {tStop}
                        </button>
                    )}

                    {isProcessing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            {tExtracting}
                        </div>
                    )}

                    {/* Re-process button if transcript exists but modal was closed */}
                    {transcript && !isRecording && !isProcessing && !showModal && parsedData && (
                        <button type="button" onClick={() => setShowModal(true)} id="btn-voice-review" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <Activity size={14} /> {tExtract}
                        </button>
                    )}
                </div>

                {/* Transcript preview */}
                {transcript && (
                    <div style={{ marginTop: 10, background: '#0f172a', borderRadius: 8, padding: '8px 12px', border: '1px solid #334155', maxHeight: 70, overflowY: 'auto' }}>
                        <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{transcript}</div>
                    </div>
                )}

                {/* Soft warning (amber) */}
                {softWarning && !error && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#422006', borderRadius: 6, color: '#fcd34d', fontSize: 12, fontWeight: 600, border: '1px solid #78350f' }}>
                        <AlertTriangle size={11} /> {softWarning}
                    </div>
                )}

                {/* Hard error (red) */}
                {error && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#450a0a', borderRadius: 6, color: '#fca5a5', fontSize: 12, fontWeight: 600, border: '1px solid #7f1d1d' }}>
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
                @keyframes voicePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
                @keyframes voicePulseBorder { 0%,100%{box-shadow:0 4px 12px rgba(220,38,38,.3)} 50%{box-shadow:0 4px 20px rgba(220,38,38,.6)} }
                @keyframes spin { 100%{transform:rotate(360deg)} }
                @keyframes voiceFieldGlow {
                    0%{box-shadow:0 0 0 0 rgba(59,130,246,0);background:transparent}
                    30%{box-shadow:0 0 0 4px rgba(59,130,246,.3);background:rgba(59,130,246,.08)}
                    100%{box-shadow:0 0 0 0 rgba(59,130,246,0);background:transparent}
                }
                .voice-filled{animation:voiceFieldGlow 1.2s ease-out forwards}
            `}</style>
        </>
    );
}
