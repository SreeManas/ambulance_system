/**
 * NetworkStatusBanner.jsx — Offline/Connection Indicator
 * 
 * Phase 6: Field operations connectivity awareness.
 * Shows online/slow/offline status for paramedics in low-signal areas.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export default function NetworkStatusBanner() {
    const [status, setStatus] = useState('online');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setStatus('online');
            setIsVisible(true);
            setTimeout(() => setIsVisible(false), 3000); // Hide after 3s
        };

        const handleOffline = () => {
            setStatus('offline');
            setIsVisible(true);
        };

        // Check initial status
        if (!navigator.onLine) {
            setStatus('offline');
            setIsVisible(true);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isVisible && status === 'online') return null;

    const statusConfig = {
        online: {
            bg: 'bg-green-100 border-green-300',
            text: 'text-green-800',
            icon: Wifi,
            message: '✅ Connected'
        },
        slow: {
            bg: 'bg-yellow-100 border-yellow-300',
            text: 'text-yellow-800',
            icon: AlertTriangle,
            message: '⚠️ Network Unstable'
        },
        offline: {
            bg: 'bg-red-100 border-red-300',
            text: 'text-red-800',
            icon: WifiOff,
            message: '🔴 Offline Mode'
        }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`sticky-top ${config.bg} ${config.text} border-b px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium safe-header`}>
            <Icon size={16} />
            <span>{config.message}</span>
        </div>
    );
}
