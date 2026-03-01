/**
 * HandoverInitiateButton.jsx — Ambulance/Driver side handover trigger
 *
 * Displayed when case status == enroute.
 * On click: builds summary, sets handoverStatus=initiated via transaction.
 */

import React, { useState } from 'react';
import { initiateHandover } from '../../services/handoverService.js';
import { Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function HandoverInitiateButton({ caseId, caseStatus, onComplete }) {
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);

    if (caseStatus !== 'enroute') return null;

    const handleInitiate = async () => {
        if (processing || done) return;
        setProcessing(true);
        setError(null);
        try {
            await initiateHandover(caseId);
            setDone(true);
            onComplete?.('handover_initiated');
        } catch (err) {
            setError(err.message || 'Failed to initiate handover');
        } finally {
            setProcessing(false);
        }
    };

    if (done) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#052e16', border: '1px solid #16a34a',
                borderRadius: '12px', padding: '12px 16px',
            }}>
                <CheckCircle size={18} color="#4ade80" />
                <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 700 }}>
                    Digital Handover Initiated
                </span>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={handleInitiate}
                disabled={processing}
                id="btn-initiate-handover"
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', justifyContent: 'center',
                    padding: '12px 20px',
                    background: processing
                        ? '#4c1d95'
                        : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: processing ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                }}
            >
                {processing ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                    <Send size={18} />
                )}
                {processing ? 'Initiating Handover...' : 'Initiate Digital Handover'}
            </button>

            {error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '8px', padding: '8px 12px',
                    background: '#450a0a', border: '1px solid #7f1d1d',
                    borderRadius: '8px', color: '#fca5a5', fontSize: '12px',
                }}>
                    <AlertTriangle size={12} />
                    {error}
                </div>
            )}

            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
