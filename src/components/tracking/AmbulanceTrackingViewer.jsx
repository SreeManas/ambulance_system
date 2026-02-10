/**
 * AmbulanceTrackingViewer.jsx
 *
 * Live ambulance tracking page — shareable via URL.
 * Route: /track/:ambulanceId
 * Shows real-time ambulance position on Mapbox map via Firestore onSnapshot.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import {
    MapPin, Clock, Navigation, Copy, Check, Loader2,
    AlertTriangle, Hospital, Activity
} from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

function formatTime(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString();
}

export default function AmbulanceTrackingViewer() {
    const { ambulanceId } = useParams();
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const ambulanceMarkerRef = useRef(null);
    const hospitalMarkerRef = useRef(null);

    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const db = getFirestore();

    // ─── Firestore listener ──────────────────────────────────────────
    useEffect(() => {
        if (!ambulanceId) { setError('No ambulance ID'); setLoading(false); return; }

        const unsubscribe = onSnapshot(
            doc(db, 'ambulanceTracking', ambulanceId),
            (snap) => {
                if (snap.exists()) {
                    setTrackingData({ id: snap.id, ...snap.data() });
                    setError(null);
                } else {
                    setError('Ambulance not found');
                }
                setLoading(false);
            },
            (err) => {
                console.error('Tracking error:', err);
                setError('Unable to load tracking data');
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [ambulanceId, db]);

    // ─── Initialize map ──────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [77.5946, 12.9716],
            zoom: 12
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
            mapRef.current = map;
            setMapLoaded(true);
        });

        return () => { map.remove(); mapRef.current = null; };
    }, []);

    // ─── Update markers + route from tracking data ───────────────────
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !trackingData?.location) return;

        const { location, destination, origin } = trackingData;
        const ambPos = [location.longitude, location.latitude];

        // Ambulance marker
        if (ambulanceMarkerRef.current) {
            ambulanceMarkerRef.current.setLngLat(ambPos);
        } else {
            const el = document.createElement('div');
            el.innerHTML = '🚑';
            el.style.fontSize = '32px';
            el.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))';
            ambulanceMarkerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat(ambPos)
                .addTo(mapRef.current);
        }

        // Hospital marker
        if (destination && !hospitalMarkerRef.current) {
            const hospEl = document.createElement('div');
            hospEl.innerHTML = '🏥';
            hospEl.style.fontSize = '28px';
            hospEl.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))';
            hospitalMarkerRef.current = new mapboxgl.Marker({ element: hospEl })
                .setLngLat([destination.longitude, destination.latitude])
                .addTo(mapRef.current);
        }

        // Fetch and draw route
        if (destination) {
            const destPos = [destination.longitude, destination.latitude];
            fetchRoute(ambPos, destPos);
        }

        // Pan map to ambulance
        mapRef.current.flyTo({ center: ambPos, duration: 800 });

    }, [trackingData, mapLoaded]);

    // ─── Fetch route ─────────────────────────────────────────────────
    const fetchRoute = useCallback(async (from, to) => {
        if (!mapRef.current) return;
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.routes?.[0]) {
                const geom = data.routes[0].geometry;
                if (mapRef.current.getSource('track-route')) {
                    mapRef.current.getSource('track-route').setData(geom);
                } else {
                    mapRef.current.addSource('track-route', { type: 'geojson', data: geom });
                    mapRef.current.addLayer({
                        id: 'track-route-glow', type: 'line', source: 'track-route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#60a5fa', 'line-width': 10, 'line-opacity': 0.25 }
                    });
                    mapRef.current.addLayer({
                        id: 'track-route-line', type: 'line', source: 'track-route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }
                    });
                }
            }
        } catch (err) {
            console.error('Route fetch error:', err);
        }
    }, []);

    // ─── Copy link ───────────────────────────────────────────────────
    const copyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    }, []);

    // ─── Loading state ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading ambulance tracking...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-white font-semibold">{error}</p>
                    <p className="text-gray-500 text-sm">This tracking link may have expired.</p>
                </div>
            </div>
        );
    }

    const isActive = trackingData?.navigationActive;

    return (
        <div className="h-screen w-screen bg-gray-900 relative overflow-hidden">
            {/* Map */}
            <div ref={mapContainerRef} className="absolute inset-0" />

            {/* Top Info Bar */}
            <div className="absolute top-0 left-0 right-0 z-10">
                <div className="bg-gradient-to-b from-gray-900/95 to-transparent p-4 pb-8">
                    <div className="max-w-lg mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-blue-400" />
                                <span className="text-white font-bold text-sm">Live Ambulance Tracking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Live
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">
                                        Navigation Ended
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-800/90 backdrop-blur rounded-xl p-3 border border-gray-700">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ETA
                                </div>
                                <div className="text-xl font-bold text-white mt-1">
                                    {trackingData?.etaMinutes || '—'}
                                    <span className="text-xs text-gray-400 ml-1">min</span>
                                </div>
                            </div>
                            <div className="bg-gray-800/90 backdrop-blur rounded-xl p-3 border border-gray-700">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Hospital className="w-3 h-3" /> Destination
                                </div>
                                <div className="text-xs font-semibold text-white mt-1 truncate">
                                    {trackingData?.destinationHospitalName || '—'}
                                </div>
                            </div>
                            <div className="bg-gray-800/90 backdrop-blur rounded-xl p-3 border border-gray-700">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Updated
                                </div>
                                <div className="text-xs font-semibold text-white mt-1">
                                    {formatTime(trackingData?.lastUpdated)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
                <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 p-4">
                    <div className="max-w-lg mx-auto flex items-center gap-3">
                        <div className="flex-1">
                            <div className="text-xs text-gray-400 mb-1">Ambulance ID</div>
                            <div className="text-white text-sm font-mono truncate">{ambulanceId}</div>
                        </div>
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                                font-semibold text-sm transition"
                        >
                            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {linkCopied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
