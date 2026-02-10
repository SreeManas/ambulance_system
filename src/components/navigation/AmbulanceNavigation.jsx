/**
 * AmbulanceNavigation.jsx
 * 
 * Turn-by-turn ambulance navigation mode with:
 * - Fullscreen Mapbox map with route + markers
 * - Directions API for step-by-step instructions
 * - Navigation HUD (ETA, distance, hospital, golden hour)
 * - GPS tracking streamed to Firestore
 * - SMS location sender panel
 * - Driver controls (end nav, recenter, Google Maps fallback)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    getFirestore, doc, setDoc, updateDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { sendTrackingSMS, getTrackingLink } from '../../services/smsService.js';
import {
    Navigation, MapPin, Clock, Hospital, AlertTriangle,
    ChevronUp, ChevronDown, Phone, Send, Copy, Check,
    X, Maximize2, CornerUpRight, ArrowUp, ArrowLeft,
    ArrowRight, RotateCcw, ExternalLink, Loader2, Share2
} from 'lucide-react';
import { useMapResize } from '../../hooks/useMapResize';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// ─── Maneuver Icons ──────────────────────────────────────────────────
const MANEUVER_ICONS = {
    'turn right': '➡️', 'turn left': '⬅️', 'straight': '⬆️',
    'slight right': '↗️', 'slight left': '↖️', 'sharp right': '⤵️',
    'sharp left': '⤴️', 'uturn': '🔄', 'merge': '🔀',
    'roundabout': '🔁', 'depart': '🚀', 'arrive': '🏁',
    'fork right': '↗️', 'fork left': '↖️', 'ramp': '⬆️',
    'continue': '⬆️', 'end of road': '🛑'
};

function getManeuverIcon(maneuver) {
    if (!maneuver) return '⬆️';
    const type = maneuver.type || '';
    const modifier = maneuver.modifier || '';
    const key = `${type} ${modifier}`.trim().toLowerCase();
    return MANEUVER_ICONS[key] || MANEUVER_ICONS[type] || '⬆️';
}

function formatDistance(meters) {
    if (!meters || meters < 0) return '—';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '—';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
}

// ─── Main Component ──────────────────────────────────────────────────
export default function AmbulanceNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const navState = location.state || {};

    // Data from routing dashboard
    const caseData = navState.caseData || null;
    const hospitalData = navState.hospitalData || null;
    const originCoords = navState.origin || null;  // [lng, lat]
    const destCoords = navState.destination || null;  // [lng, lat]
    const hospitalName = navState.hospitalName || 'Hospital';
    const ambulanceId = navState.ambulanceId || `amb_${Date.now()}`;

    // Map refs
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const ambulanceMarkerRef = useRef(null);
    const watchIdRef = useRef(null);
    const streamIntervalRef = useRef(null);

    // State
    const [mapLoaded, setMapLoaded] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(originCoords);
    const [routeData, setRouteData] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [eta, setEta] = useState(null);
    const [distanceRemaining, setDistanceRemaining] = useState(null);
    const [navigationActive, setNavigationActive] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [smsPanel, setSmsPanel] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsSending, setSmsSending] = useState(false);
    const [smsResult, setSmsResult] = useState(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('acquiring'); // acquiring, active, error
    const [goldenHourEnd, setGoldenHourEnd] = useState(null);
    const [goldenHourRemaining, setGoldenHourRemaining] = useState(null);

    const db = getFirestore();
    const auth = getAuth();

    // ─── Golden Hour Countdown ───────────────────────────────────────
    useEffect(() => {
        if (caseData?.emergencyContext?.incidentTimestamp) {
            const incident = new Date(caseData.emergencyContext.incidentTimestamp);
            const end = new Date(incident.getTime() + 60 * 60 * 1000); // +1 hour
            setGoldenHourEnd(end);
        }
    }, [caseData]);

    useEffect(() => {
        if (!goldenHourEnd) return;
        const timer = setInterval(() => {
            const diff = goldenHourEnd - Date.now();
            if (diff <= 0) {
                setGoldenHourRemaining('EXPIRED');
                clearInterval(timer);
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setGoldenHourRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [goldenHourEnd]);

    // ─── Initialize Map ──────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const center = originCoords || [77.5946, 12.9716];

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center,
            zoom: 14,
            pitch: 45,
            bearing: 0
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
            setMapLoaded(true);
            mapRef.current = map;

            // Ambulance marker
            const el = document.createElement('div');
            el.innerHTML = '🚑';
            el.style.fontSize = '32px';
            el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))';
            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat(center)
                .addTo(map);
            ambulanceMarkerRef.current = marker;

            // Hospital marker
            if (destCoords) {
                const hospEl = document.createElement('div');
                hospEl.innerHTML = '🏥';
                hospEl.style.fontSize = '28px';
                hospEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))';
                new mapboxgl.Marker({ element: hospEl })
                    .setLngLat(destCoords)
                    .setPopup(new mapboxgl.Popup().setHTML(`<strong>${hospitalName}</strong>`))
                    .addTo(map);
            }
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Map Resize Handler (Responsive + Orientation Support)
    useMapResize(mapRef.current);

    // ─── Fetch Directions ────────────────────────────────────────────
    const fetchDirections = useCallback(async (from, to) => {
        if (!from || !to) return;
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&steps=true&overview=full&access_token=${mapboxgl.accessToken}`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setRouteData(route);
                setEta(Math.round(route.duration / 60));
                setDistanceRemaining(route.distance);

                // Extract steps
                const allSteps = route.legs.flatMap(leg => leg.steps || []);
                setSteps(allSteps);
                setCurrentStepIndex(0);

                // Draw route on map
                if (mapRef.current && mapRef.current.getSource('route')) {
                    mapRef.current.getSource('route').setData(route.geometry);
                } else if (mapRef.current) {
                    mapRef.current.addSource('route', {
                        type: 'geojson',
                        data: route.geometry
                    });
                    mapRef.current.addLayer({
                        id: 'route-line',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: {
                            'line-color': '#3b82f6',
                            'line-width': 6,
                            'line-opacity': 0.8
                        }
                    });
                    // Route glow
                    mapRef.current.addLayer({
                        id: 'route-glow',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: {
                            'line-color': '#60a5fa',
                            'line-width': 12,
                            'line-opacity': 0.3
                        }
                    }, 'route-line');

                    // Fit bounds
                    const coords = route.geometry.coordinates;
                    const bounds = coords.reduce(
                        (b, c) => b.extend(c),
                        new mapboxgl.LngLatBounds(coords[0], coords[0])
                    );
                    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
                }
            }
        } catch (err) {
            console.error('Directions error:', err);
        }
    }, []);

    useEffect(() => {
        if (mapLoaded && originCoords && destCoords) {
            fetchDirections(originCoords, destCoords);
        }
    }, [mapLoaded, originCoords, destCoords, fetchDirections]);

    // ─── GPS Tracking ────────────────────────────────────────────────
    useEffect(() => {
        if (!navigationActive) return;

        if ('geolocation' in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const coords = [pos.coords.longitude, pos.coords.latitude];
                    setCurrentPosition(coords);
                    setGpsStatus('active');

                    // Move ambulance marker
                    if (ambulanceMarkerRef.current) {
                        ambulanceMarkerRef.current.setLngLat(coords);
                    }

                    // Update step index based on proximity
                    updateCurrentStep(coords);
                },
                (err) => {
                    console.warn('GPS error:', err.message);
                    setGpsStatus('error');
                    // Fallback: simulate movement along route
                    startSimulation();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
            );
            watchIdRef.current = watchId;
        } else {
            setGpsStatus('error');
            startSimulation();
        }

        return () => {
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [navigationActive]);

    // ─── Simulate movement along route (fallback) ────────────────────
    const startSimulation = useCallback(() => {
        if (!routeData?.geometry?.coordinates) return;
        const coords = routeData.geometry.coordinates;
        let idx = 0;

        const interval = setInterval(() => {
            if (idx >= coords.length || !navigationActive) {
                clearInterval(interval);
                return;
            }
            const pos = coords[idx];
            setCurrentPosition(pos);
            if (ambulanceMarkerRef.current) {
                ambulanceMarkerRef.current.setLngLat(pos);
            }
            updateCurrentStep(pos);
            idx += Math.max(1, Math.floor(coords.length / 60)); // ~1min simulation
        }, 3000);

        return () => clearInterval(interval);
    }, [routeData, navigationActive]);

    // ─── Update current step based on position ───────────────────────
    const updateCurrentStep = useCallback((pos) => {
        if (!steps.length) return;
        for (let i = currentStepIndex; i < steps.length; i++) {
            const stepLoc = steps[i].maneuver?.location;
            if (!stepLoc) continue;
            const dist = Math.sqrt(
                Math.pow(pos[0] - stepLoc[0], 2) + Math.pow(pos[1] - stepLoc[1], 2)
            ) * 111000; // rough meters
            if (dist < 50) {
                setCurrentStepIndex(i + 1);
                break;
            }
        }
    }, [steps, currentStepIndex]);

    // ─── Stream position to Firestore ────────────────────────────────
    useEffect(() => {
        if (!navigationActive || !currentPosition) return;

        // Initial write
        const trackingRef = doc(db, 'ambulanceTracking', ambulanceId);
        setDoc(trackingRef, {
            caseId: caseData?.id || 'unknown',
            ambulanceId,
            driverId: auth.currentUser?.uid || 'unknown',
            location: { latitude: currentPosition[1], longitude: currentPosition[0] },
            destinationHospitalId: hospitalData?.hospitalId || '',
            destinationHospitalName: hospitalName,
            etaMinutes: eta || 0,
            lastUpdated: serverTimestamp(),
            navigationActive: true,
            origin: originCoords ? { latitude: originCoords[1], longitude: originCoords[0] } : null,
            destination: destCoords ? { latitude: destCoords[1], longitude: destCoords[0] } : null
        }, { merge: true }).catch(err => console.error('Tracking init error:', err));

        // Stream every 5 seconds
        const interval = setInterval(() => {
            if (!currentPosition) return;
            updateDoc(trackingRef, {
                location: { latitude: currentPosition[1], longitude: currentPosition[0] },
                etaMinutes: eta || 0,
                lastUpdated: serverTimestamp(),
                navigationActive
            }).catch(err => console.error('Tracking update error:', err));
        }, 5000);
        streamIntervalRef.current = interval;

        return () => clearInterval(interval);
    }, [navigationActive, ambulanceId, currentPosition, eta]);

    // ─── End Navigation ──────────────────────────────────────────────
    const endNavigation = useCallback(() => {
        setNavigationActive(false);
        if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

        // Mark tracking as inactive
        updateDoc(doc(db, 'ambulanceTracking', ambulanceId), {
            navigationActive: false,
            lastUpdated: serverTimestamp()
        }).catch(() => { });

        navigate('/routing');
    }, [ambulanceId, db, navigate]);

    // ─── Recenter Map ────────────────────────────────────────────────
    const recenterMap = useCallback(() => {
        if (mapRef.current && currentPosition) {
            mapRef.current.flyTo({ center: currentPosition, zoom: 16, pitch: 45, duration: 800 });
        }
    }, [currentPosition]);

    // ─── Open Google Maps ────────────────────────────────────────────
    const openGoogleMaps = useCallback(() => {
        if (destCoords) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destCoords[1]},${destCoords[0]}`, '_blank');
        }
    }, [destCoords]);

    // ─── Copy Tracking Link ──────────────────────────────────────────
    const copyTrackingLink = useCallback(() => {
        const link = getTrackingLink(ambulanceId);
        navigator.clipboard.writeText(link).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    }, [ambulanceId]);

    // ─── Send SMS ────────────────────────────────────────────────────
    const handleSendSMS = useCallback(async () => {
        if (!phoneNumber.trim()) return;
        setSmsSending(true);
        setSmsResult(null);
        try {
            const result = await sendTrackingSMS({
                phoneNumber: phoneNumber.trim(),
                trackingLink: getTrackingLink(ambulanceId),
                hospitalName,
                eta: eta || '—',
                caseType: caseData?.emergencyContext?.chiefComplaint || ''
            });
            setSmsResult(result);
        } catch (err) {
            setSmsResult({ success: false, error: err.message });
        } finally {
            setSmsSending(false);
        }
    }, [phoneNumber, ambulanceId, hospitalName, eta, caseData]);

    // ─── No route data fallback ──────────────────────────────────────
    if (!originCoords || !destCoords) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                    <h2 className="text-xl font-bold">Navigation Data Missing</h2>
                    <p className="text-gray-400">Please start navigation from the Routing Dashboard.</p>
                    <button
                        onClick={() => navigate('/routing')}
                        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition font-semibold"
                    >
                        Go to Routing Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentStep = steps[currentStepIndex] || null;
    const nextStep = steps[currentStepIndex + 1] || null;
    const severityLabel = caseData?.severity || caseData?.emergencyContext?.severity;

    return (
        <div className="h-screen w-screen bg-gray-900 relative overflow-hidden">
            {/* ─── Map ─────────────────────────────────────────── */}
            <div ref={mapContainerRef} className="map-fullscreen" />

            {/* ─── Navigation HUD (Top) ────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 z-10">
                <div className="bg-gradient-to-b from-gray-900/95 via-gray-900/80 to-transparent p-4 pb-8">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">
                                Navigation Active
                            </span>
                            {gpsStatus === 'active' && (
                                <span className="text-xs text-gray-500">📡 GPS</span>
                            )}
                            {gpsStatus === 'error' && (
                                <span className="text-xs text-amber-500">⚠️ Simulated</span>
                            )}
                        </div>
                        <button
                            onClick={endNavigation}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition"
                        >
                            ✕ End
                        </button>
                    </div>

                    {/* HUD Stats */}
                    <div className="flex items-center gap-3">
                        {/* ETA */}
                        <div className="bg-gray-800/90 backdrop-blur rounded-xl px-4 py-3 flex-1 border border-gray-700">
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ETA
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {eta ? `${eta}` : '—'}<span className="text-sm text-gray-400 ml-1">min</span>
                            </div>
                        </div>

                        {/* Distance */}
                        <div className="bg-gray-800/90 backdrop-blur rounded-xl px-4 py-3 flex-1 border border-gray-700">
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Distance
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatDistance(distanceRemaining)}
                            </div>
                        </div>

                        {/* Golden Hour */}
                        {goldenHourRemaining && (
                            <div className={`backdrop-blur rounded-xl px-4 py-3 flex-1 border ${goldenHourRemaining === 'EXPIRED'
                                ? 'bg-red-900/90 border-red-700'
                                : 'bg-amber-900/90 border-amber-700'
                                }`}>
                                <div className="text-xs text-amber-300 flex items-center gap-1">
                                    ⏱ Golden Hour
                                </div>
                                <div className={`text-2xl font-bold ${goldenHourRemaining === 'EXPIRED' ? 'text-red-400' : 'text-amber-300'
                                    }`}>
                                    {goldenHourRemaining}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hospital + Case Info */}
                    <div className="mt-3 flex items-center gap-3">
                        <div className="bg-gray-800/80 backdrop-blur rounded-lg px-3 py-2 flex-1 border border-gray-700">
                            <div className="text-white text-sm font-semibold truncate">
                                🏥 {hospitalName}
                            </div>
                        </div>
                        {severityLabel && (
                            <div className="bg-red-600/80 backdrop-blur rounded-lg px-3 py-2 border border-red-500">
                                <div className="text-white text-xs font-bold">
                                    🔴 {typeof severityLabel === 'number' ? `Level ${severityLabel}` : severityLabel}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Current Maneuver (Floating) ─────────────────── */}
            {currentStep && (
                <div className="absolute top-[200px] left-4 right-4 md:left-auto md:right-4 md:w-96 z-10">
                    <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl w-14 h-14 flex items-center justify-center bg-blue-600/20 rounded-xl">
                                {getManeuverIcon(currentStep.maneuver)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-semibold text-sm leading-tight">
                                    {currentStep.maneuver?.instruction || 'Continue straight'}
                                </div>
                                <div className="text-blue-400 text-xs mt-1 font-medium">
                                    {formatDistance(currentStep.distance)} · {formatDuration(currentStep.duration)}
                                </div>
                            </div>
                        </div>

                        {/* Next step preview */}
                        {nextStep && (
                            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3 opacity-60">
                                <span className="text-xl">{getManeuverIcon(nextStep.maneuver)}</span>
                                <span className="text-gray-400 text-xs truncate flex-1">
                                    Then: {nextStep.maneuver?.instruction || 'Continue'}
                                </span>
                                <span className="text-gray-500 text-xs">{formatDistance(nextStep.distance)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Bottom Controls ─────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
                {/* Steps drawer (mobile) */}
                {drawerOpen && (
                    <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 max-h-[50vh] overflow-y-auto rounded-t-2xl">
                        <div className="p-4 space-y-2">
                            <h4 className="text-white font-bold text-sm mb-3">All Directions</h4>
                            {steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition ${i === currentStepIndex
                                        ? 'bg-blue-600/20 border border-blue-500'
                                        : i < currentStepIndex ? 'opacity-40' : 'bg-gray-800/50'
                                        }`}
                                >
                                    <span className="text-lg">{getManeuverIcon(step.maneuver)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-xs truncate">
                                            {step.maneuver?.instruction || 'Continue'}
                                        </div>
                                        <div className="text-gray-500 text-[10px]">
                                            {formatDistance(step.distance)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SMS Panel */}
                {smsPanel && (
                    <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 p-4 rounded-t-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Send Location Update
                            </h4>
                            <button onClick={() => setSmsPanel(false)} className="text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tracking Link */}
                        <div className="bg-gray-800 rounded-lg p-3 mb-3 flex items-center gap-2">
                            <span className="text-xs text-gray-400 flex-1 truncate">{getTrackingLink(ambulanceId)}</span>
                            <button
                                onClick={copyTrackingLink}
                                className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition"
                            >
                                {linkCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-300" />}
                            </button>
                        </div>

                        {/* Phone input */}
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm
                                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={handleSendSMS}
                                disabled={smsSending || !phoneNumber.trim()}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg
                                    flex items-center gap-2 font-semibold text-sm transition"
                            >
                                {smsSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </div>

                        {/* SMS Result */}
                        {smsResult && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${smsResult.success
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-red-900/50 text-red-400'
                                }`}>
                                {smsResult.success ? '✅ SMS sent successfully' : `❌ ${smsResult.error || 'Send failed'}`}
                            </div>
                        )}
                    </div>
                )}

                {/* Control Bar */}
                <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 p-3">
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        {/* Toggle directions */}
                        <button
                            onClick={() => { setDrawerOpen(!drawerOpen); setSmsPanel(false); }}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            {drawerOpen ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
                            <span className="text-[10px] text-gray-400">Steps</span>
                        </button>

                        {/* Recenter */}
                        <button
                            onClick={recenterMap}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            <Maximize2 className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">Center</span>
                        </button>

                        {/* SMS */}
                        <button
                            onClick={() => { setSmsPanel(!smsPanel); setDrawerOpen(false); }}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            <Share2 className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">Share</span>
                        </button>

                        {/* Google Maps */}
                        <button
                            onClick={openGoogleMaps}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-800 transition"
                        >
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">G-Maps</span>
                        </button>

                        {/* End Navigation */}
                        <button
                            onClick={endNavigation}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 transition"
                        >
                            <X className="w-5 h-5 text-red-400" />
                            <span className="text-[10px] text-red-400">End</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
