/**
 * VoiceIntakePanel.jsx — Voice-to-Intake with AI Structured Extraction
 *
 * Flow:
 *   🎤 Start → collect speech (onresult → transcriptRef) → onspeechend → stop()
 *   → onend → if transcriptRef ≥ 10 chars: show transcript + Extract button
 *             else: show amber "Try speaking longer" warning
 *   User clicks "Extract with AI" → processWithAI()
 *   AI never called automatically.
 *
 * Key fix: transcript accumulated in transcriptRef (sync) AND React state (UI).
 * All length checks use transcriptRef.current, not state (avoids async lag).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Mic, MicOff, Loader2, CheckCircle, XCircle,
    AlertTriangle, Activity, WifiOff
} from 'lucide-react';
import { useT } from '../../hooks/useT.js';
import { TK } from '../../constants/translationKeys.js';

// ─── HTTPS / browser capability check ────────────────────────────────────────

function getCapabilityState() {
    const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:' || isLocalhost;
    if (!isSecure) return 'insecure';
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return SR ? 'ready' : 'unsupported';
}

// ─── Error code → human message ──────────────────────────────────────────────

function mapSpeechError(code) {
    switch (code) {
        case 'not-allowed':
        case 'permission-denied':
        case 'service-not-allowed':
            return TK.VI_PERMISSION_DENIED;
        case 'audio-capture':
            return 'Microphone not detected. Please check your audio device.';
        case 'no-speech':
        case 'aborted':
            return null; // soft / user-initiated — not errors
        case 'network':
            return TK.VI_TIMEOUT;
        case 'language-not-supported':
            return 'Language not supported by browser speech service.';
        default:
            return `Speech recognition unavailable (${code}).`;
    }
}

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
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: '#fca5a5', fontSize: 11, fontWeight: 600 }}>
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
            }}>{String(value)}</span>
        </div>
    );
}

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
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={18} color="#3b82f6" />
                        <span style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 800 }}>{tTitle}</span>
                    </div>
                    <button onClick={onCancel} id="btn-voice-cancel-modal" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div style={{ padding: '12px 20px 0' }}>
                    <ConfidenceBar score={confidenceScore} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{tTranscript}</div>
                        <div style={{
                            background: '#1e293b', borderRadius: 8, padding: '10px 12px',
                            color: '#cbd5e1', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic',
                            maxHeight: 300, overflowY: 'auto', border: '1px solid #334155',
                        }}>{transcript}</div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{tExtracted}</div>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {entries.length === 0
                                ? <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>{tNoFields}</div>
                                : entries.map(([key, val]) => (
                                    <ExtractedField key={key} label={RAW_FIELD_LABELS[key] || key} value={val} isMissing={missingSet.has(key)} />
                                ))
                            }
                        </div>
                        {missingCriticalFields?.length > 0 && (
                            <div style={{ marginTop: 8, padding: '6px 8px', background: '#422006', borderRadius: 6, color: '#fcd34d', fontSize: 11, fontWeight: 600 }}>
                                ⚠ {tMissingCritical} {missingCriticalFields.join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} id="btn-voice-modal-cancel" style={{ padding: '8px 16px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {tCancel}
                    </button>
                    <button onClick={() => onApply(extractedData)} id="btn-voice-apply" style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        {tApply}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MIN_TRANSCRIPT_CHARS = 10;

export default function VoiceIntakePanel({ onApplyData }) {
    const [capability] = useState(() => getCapabilityState());
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');   // UI display
    const [interimText, setInterimText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    const [softWarning, setSoftWarning] = useState(null); // amber, non-blocking
    const [showModal, setShowModal] = useState(false);

    // Refs — sync, immune to React async state batching
    const recognitionRef = useRef(null);
    const isRecordingRef = useRef(false);
    const isProcessingRef = useRef(false); // prevents duplicate AI calls
    const transcriptRef = useRef('');    // accumulates text synchronously
    const abortRef = useRef(null);

    // Translations
    const tModeLabel = useT(TK.VI_MODE_LABEL);
    const tOptional = useT(TK.VI_OPTIONAL);
    const tRecordingLabel = useT(TK.VI_RECORDING);
    const tStart = useT(TK.VI_START);
    const tStop = useT(TK.VI_STOP);
    const tExtract = useT(TK.VI_EXTRACT);
    const tExtracting = useT(TK.VI_EXTRACTING);
    const tUnsupported = useT(TK.VI_UNSUPPORTED);
    const tTooShort = useT(TK.VI_TOO_SHORT);
    const tTooLong = useT(TK.VI_TOO_LONG);
    const tTimeout = useT(TK.VI_TIMEOUT);
    const tPermDenied = useT(TK.VI_PERMISSION_DENIED);
    const tInsecure = useT('Voice recognition requires HTTPS.');
    const tSpeakLonger = useT('Try speaking a little longer.');

    // Resolve TK key → translated string
    const resolveError = useCallback((tkOrRaw) => {
        if (!tkOrRaw) return null;
        if (tkOrRaw === TK.VI_PERMISSION_DENIED) return tPermDenied;
        if (tkOrRaw === TK.VI_TIMEOUT) return tTimeout;
        return tkOrRaw;
    }, [tPermDenied, tTimeout]);

    // Unmount cleanup
    useEffect(() => () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch { /* ignore */ }
        }
    }, []);

    const resetRecordingState = useCallback(() => {
        setIsRecording(false);
        setInterimText('');
        isRecordingRef.current = false;
    }, []);

    // ── Start Recording ───────────────────────────────────────────────────────

    const startRecording = useCallback(() => {
        if (isRecordingRef.current || isProcessingRef.current) return;
        if (capability !== 'ready') return;

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        // Abort stale instance
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }

        // Reset all state for fresh session
        setError(null);
        setSoftWarning(null);
        setTranscript('');
        setInterimText('');
        setParsedData(null);
        transcriptRef.current = '';    // SYNC reset

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = 'en-IN';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsRecording(true);
            isRecordingRef.current = true;
        };

        recognition.onresult = (event) => {
            let interim = '';
            let finalChunk = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalChunk += text + ' ';
                else interim += text;
            }
            if (finalChunk) {
                // Accumulate in REF first (sync) — React state update is async
                const updated = (transcriptRef.current + finalChunk).slice(0, 2000);
                transcriptRef.current = updated;
                setTranscript(updated);
            }
            setInterimText(interim);
        };

        // onspeechend: stop immediately → prevents browser timeout → prevents false "network" error
        recognition.onspeechend = () => {
            try { recognition.stop(); } catch { /* ignore */ }
        };

        recognition.onerror = (event) => {
            const code = event.error;
            // Silent resets — not errors from user's perspective
            if (code === 'aborted' || code === 'no-speech') {
                resetRecordingState();
                return;
            }
            const tkOrRaw = mapSpeechError(code);
            if (tkOrRaw) setError(resolveError(tkOrRaw));
            setTranscript('');
            transcriptRef.current = '';
            resetRecordingState();
        };

        // onend: ONLY finalize state — NEVER trigger AI automatically
        // Use transcriptRef.current (sync) to decide on soft warning
        recognition.onend = () => {
            resetRecordingState();
            recognitionRef.current = null;

            const captured = transcriptRef.current.trim();
            if (captured.length > 0 && captured.length < MIN_TRANSCRIPT_CHARS) {
                // Has some speech but not enough — amber, non-blocking
                setSoftWarning(tSpeakLonger);
            }
            // If captured.length >= MIN_TRANSCRIPT_CHARS → Extract button shown in UI
            // If captured.length === 0 → nothing (silent end, user may have just clicked test)
        };

        try {
            recognition.start();
        } catch {
            setError('Failed to start speech recognition. Please try again.');
            resetRecordingState();
            recognitionRef.current = null;
        }
    }, [capability, resolveError, resetRecordingState, tSpeakLonger]);

    // ── Stop Recording (manual) ───────────────────────────────────────────────

    const stopRecording = useCallback(() => {
        if (!isRecordingRef.current) return;
        try {
            // stop() (not abort) — lets pending onresult fire
            recognitionRef.current?.stop();
        } catch { /* ignore */ }
    }, []);

    // ── AI Extraction ─────────────────────────────────────────────────────────

    const processWithAI = useCallback(async () => {
        // Use ref to prevent duplicate calls (rapid-click guard)
        if (isProcessingRef.current) return;

        const text = transcriptRef.current.trim();

        // Hard guards — checked against ref (sync), not state
        if (!text || text.length < MIN_TRANSCRIPT_CHARS) {
            setSoftWarning(tSpeakLonger);
            return;
        }
        if (text.length > 2000) {
            setError(tTooLong);
            return;
        }

        isProcessingRef.current = true;
        setIsProcessing(true);
        setError(null);
        setSoftWarning(null);

        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
            const res = await fetch('/api/voice-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text }),
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
            isProcessingRef.current = false;
            setIsProcessing(false);
            abortRef.current = null;
        }
    }, [tSpeakLonger, tTooLong, tTimeout]);

    const handleApply = useCallback((extractedData) => {
        setShowModal(false);
        onApplyData(extractedData);
    }, [onApplyData]);

    const handleCancel = useCallback(() => {
        setShowModal(false);
        setParsedData(null);
    }, []);

    // ── Capability gates ──────────────────────────────────────────────────────

    if (capability === 'insecure') {
        return (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 16px', border: '1px solid #334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
                <WifiOff size={14} color="#f59e0b" />
                <span style={{ color: '#fcd34d', fontWeight: 600 }}>{tInsecure}</span>
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

    // Is the transcript long enough to enable the Extract button?
    const canExtract = transcript.trim().length >= MIN_TRANSCRIPT_CHARS;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, border: '1px solid #334155', padding: '16px 18px', marginBottom: 24 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mic size={16} color="#3b82f6" />
                        <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{tModeLabel}</span>
                        <span style={{ background: '#1e293b', color: '#64748b', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>{tOptional}</span>
                    </div>
                    {isRecording && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'voicePulse 1s ease-in-out infinite' }} />
                            <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>{tRecordingLabel}</span>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!isRecording ? (
                        <button type="button" onClick={startRecording} disabled={isProcessing} id="btn-voice-start" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: isProcessing ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: isProcessing ? '#64748b' : 'white', border: 'none', borderRadius: 8,
                            fontSize: 13, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                            boxShadow: isProcessing ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
                        }}>
                            <Mic size={14} /> 🎤 {tStart}
                        </button>
                    ) : (
                        <button type="button" onClick={stopRecording} id="btn-voice-stop" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                            animation: 'voicePulseBorder 1.5s ease-in-out infinite',
                        }}>
                            <MicOff size={14} /> {tStop}
                        </button>
                    )}

                    {/* Extract button — only shown when transcript is long enough AND not recording */}
                    {canExtract && !isRecording && !isProcessing && (
                        <button type="button" onClick={processWithAI} id="btn-voice-process" style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
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

                {/* Live transcript display */}
                {(transcript || interimText) && (
                    <div style={{ marginTop: 10, background: '#0f172a', borderRadius: 8, padding: '8px 12px', border: '1px solid #334155', maxHeight: 80, overflowY: 'auto' }}>
                        <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
                            {transcript}
                            {interimText && <span style={{ color: '#475569', fontStyle: 'italic' }}>{interimText}</span>}
                        </div>
                    </div>
                )}

                {/* Soft amber warning — non-blocking, not red */}
                {softWarning && !error && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#422006', borderRadius: 6, color: '#fcd34d', fontSize: 12, fontWeight: 600, border: '1px solid #78350f' }}>
                        <AlertTriangle size={11} /> {softWarning}
                    </div>
                )}

                {/* Hard error — red, permission denied / network / etc. */}
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
                @keyframes voicePulse { 0%, 100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
                @keyframes voicePulseBorder { 0%, 100% { box-shadow:0 4px 12px rgba(220,38,38,0.3); } 50% { box-shadow:0 4px 20px rgba(220,38,38,0.6); } }
                @keyframes spin { 100% { transform:rotate(360deg); } }
                @keyframes voiceFieldGlow {
                    0% { box-shadow:0 0 0 0 rgba(59,130,246,0); background:transparent; }
                    30% { box-shadow:0 0 0 4px rgba(59,130,246,0.3); background:rgba(59,130,246,0.08); }
                    100% { box-shadow:0 0 0 0 rgba(59,130,246,0); background:transparent; }
                }
                .voice-filled { animation: voiceFieldGlow 1.2s ease-out forwards; }
            `}</style>
        </>
    );
}
