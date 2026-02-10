/**
 * useMapResize.js — Map Resize & Orientation Handler Hook
 * 
 * Ensures Mapbox maps properly resize on window/orientation changes.
 * Critical for ambulance tablet rotations and responsive dashboards.
 */

import { useEffect } from 'react';

export function useMapResize(map) {
    useEffect(() => {
        if (!map) return;

        const handleResize = () => {
            // Force Mapbox canvas resize
            map.resize();
        };

        const handleOrientation = () => {
            // Orientation changes (mobile/tablet rotation)
            map.resize();
        };

        // Listen to both resize and orientation changes
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientation);

        // Initial resize (fixes map canvas issues)
        setTimeout(() => map.resize(), 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientation);
        };
    }, [map]);
}
