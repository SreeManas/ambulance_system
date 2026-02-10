/**
 * MobileActionBar.jsx — Sticky Bottom Action Bar
 * 
 * Phase 6: Thumb-zone optimized emergency actions.
 * Sticky bottom positioning with safe-area padding for notched devices.
 */

import React from 'react';

export default function MobileActionBar({ children, className = '' }) {
    return (
        <div className={`sticky-bottom safe-footer ${className}`}>
            <div className="flex gap-3 p-3">
                {children}
            </div>
        </div>
    );
}

export function MobileActionButton({ onClick, icon: Icon, label, variant = 'primary', className = '' }) {
    const baseClasses = 'btn-mobile-full flex items-center justify-center gap-2 transition-all';

    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg',
        success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={20} />}
            <span className="font-bold">{label}</span>
        </button>
    );
}
