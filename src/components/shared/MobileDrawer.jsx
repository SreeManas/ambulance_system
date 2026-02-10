/**
 * MobileDrawer.jsx — Responsive Sidebar Drawer Component
 * 
 * Desktop: Fixed sidebar
 * Mobile: Slide-in drawer with hamburger toggle
 */

import React from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileDrawer({ isOpen, onToggle, children }) {
    return (
        <>
            {/* Hamburger Button (Mobile Only) */}
            <button
                onClick={onToggle}
                className="show-mobile-only fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg touch-target"
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay Backdrop (Mobile Only) */}
            {isOpen && (
                <div
                    className="drawer-overlay show-mobile-only"
                    onClick={onToggle}
                    role="button"
                    aria-label="Close menu"
                />
            )}

            {/* Drawer */}
            <aside className={`drawer ${isOpen ? 'open' : ''} safe-container`}>
                {children}
            </aside>
        </>
    );
}
