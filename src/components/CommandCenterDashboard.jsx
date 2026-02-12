// src/components/CommandCenterDashboard.jsx
/**
 * Dispatcher Command Center Dashboard v1.0
 * 
 * Real-time MEDROUTER Command Center with:
 * - Multi-ambulance live tracking
 * - Emergency case queue
 * - Hospital load board
 * - Ambulance movement simulation
 * - Manual override routing
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, doc, updateDoc, where } from "firebase/firestore";
import { rankHospitals, normalizeHospital } from "../services/capabilityScoringEngine.js";
import {
    Truck, AlertTriangle, Building2, Activity, Navigation, Timer,
    Play, Pause, RotateCcw, Zap, Users, ChevronRight, MapPin,
    Radio, Signal, Target, Gauge, Clock, ArrowRight, Phone, ShieldCheck
} from "lucide-react";
import { useMapResize } from "../hooks/useMapResize";
import { useTPreload, useTBatch } from "../hooks/useT";
import { PRELOAD_COMMAND_CENTER } from "../constants/translationKeys";
import { useAuth } from "./auth/AuthProvider.jsx";
import DriverVerificationPanel from "./DriverVerificationPanel.jsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CENTER = [77.5946, 12.9716]; // Bangalore
const HYDERABAD_CENTER = [78.4867, 17.3850]; // Hyderabad
const DEFAULT_ZOOM = 12;

const AMBULANCE_STATUSES = {
    available: { label: "Available", color: "#3b82f6", icon: "🟦" },
    dispatched: { label: "Dispatched", color: "#eab308", icon: "🟨" },
    en_route_to_scene: { label: "En Route (Scene)", color: "#f97316", icon: "🟧" },
    on_scene: { label: "On Scene", color: "#a855f7", icon: "🟪" },
    en_route_to_hospital: { label: "En Route (Hospital)", color: "#f97316", icon: "🟧" },
    arrived: { label: "Arrived", color: "#22c55e", icon: "🟩" }
};

const AMBULANCE_TYPES = ["ALS", "BLS"];

const INITIAL_AMBULANCES = [
    // Bangalore fleet
    { id: "AMB-001", vehicleNumber: "KA-01-EMS-1001", type: "ALS", city: "Bangalore" },
    { id: "AMB-002", vehicleNumber: "KA-01-EMS-1002", type: "ALS", city: "Bangalore" },
    { id: "AMB-003", vehicleNumber: "KA-01-EMS-1003", type: "BLS", city: "Bangalore" },
    { id: "AMB-004", vehicleNumber: "KA-01-EMS-1004", type: "BLS", city: "Bangalore" },
    { id: "AMB-005", vehicleNumber: "KA-01-EMS-1005", type: "ALS", city: "Bangalore" },
    { id: "AMB-006", vehicleNumber: "KA-01-EMS-1006", type: "BLS", city: "Bangalore" },
    // Hyderabad fleet (Phase 6: Multi-city ambulance visibility)
    { id: "AMB-HYD-001", vehicleNumber: "TS-09-EMS-2001", type: "ALS", city: "Hyderabad" },
    { id: "AMB-HYD-002", vehicleNumber: "TS-09-EMS-2002", type: "BLS", city: "Hyderabad" },
    { id: "AMB-HYD-003", vehicleNumber: "TS-09-EMS-2003", type: "ALS", city: "Hyderabad" },
    { id: "AMB-HYD-004", vehicleNumber: "TS-09-EMS-2004", type: "BLS", city: "Hyderabad" },
];

const OSM_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateRandomLocation(center, radiusKm = 10) {
    const r = radiusKm / 111.32; // degrees
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    return {
        latitude: center[1] + y,
        longitude: center[0] + x
    };
}

function interpolatePosition(start, end, progress) {
    return {
        latitude: start.latitude + (end.latitude - start.latitude) * progress,
        longitude: start.longitude + (end.longitude - start.longitude) * progress
    };
}

function calculateDistance(pos1, pos2) {
    const R = 6371; // km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getAcuityBadge(level) {
    const badges = {
        5: { text: "CRITICAL", bg: "bg-red-600", text_color: "text-white" },
        4: { text: "SEVERE", bg: "bg-orange-500", text_color: "text-white" },
        3: { text: "MODERATE", bg: "bg-yellow-500", text_color: "text-black" },
        2: { text: "MILD", bg: "bg-blue-500", text_color: "text-white" },
        1: { text: "MINOR", bg: "bg-green-500", text_color: "text-white" }
    };
    return badges[level] || { text: "N/A", bg: "bg-gray-500", text_color: "text-white" };
}

function getLoadIndicator(count, max = 20) {
    const ratio = count / max;
    if (ratio >= 0.9) return { color: "bg-red-500", label: "Critical" };
    if (ratio >= 0.7) return { color: "bg-orange-500", label: "High" };
    if (ratio >= 0.4) return { color: "bg-yellow-500", label: "Moderate" };
    return { color: "bg-green-500", label: "Available" };
}

// =============================================================================
// AMBULANCE SIMULATION ENGINE
// =============================================================================

function createAmbulanceFleet(centers) {
    // Phase 6: Multi-city fleet initialization
    return INITIAL_AMBULANCES.map(amb => {
        const center = amb.city === 'Hyderabad'
            ? [HYDERABAD_CENTER[0], HYDERABAD_CENTER[1]]
            : [DEFAULT_CENTER[0], DEFAULT_CENTER[1]];
        return {
            ...amb,
            currentLocation: generateRandomLocation(center, 8),
            status: "available",
            assignedCaseId: null,
            destinationHospitalId: null,
            routePath: null,
            routeProgress: 0,
            speed: 50, // km/h
            eta: null   // Phase 7: ETA tracking per ambulance
        };
    });
}

function getNextStatus(currentStatus) {
    const transitions = {
        available: null,
        dispatched: "en_route_to_scene",
        en_route_to_scene: "on_scene",
        on_scene: "en_route_to_hospital",
        en_route_to_hospital: "arrived",
        arrived: "available"
    };
    return transitions[currentStatus];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CMD_LABELS = [
    "Command Center", "MEDROUTER Command Center", "Available", "Active", "Total",
    "Unassigned", "Pause", "Start", "Reset", "Ambulance Status",
    "Cases", "Fleet", "Hospitals", "Emergency Queue", "Dispatch",
    "Ambulance Fleet", "Hospital Status", "Ambulance Details",
    "Vehicle:", "Type:", "Status:", "Dispatch to Next Case",
    "General", "Queue"
];

export default function CommandCenterDashboard() {
    const { role } = useAuth();
    // Phase 10: Preload translations for this dashboard
    useTPreload(PRELOAD_COMMAND_CENTER);

    // Phase 5: Batch translate all static UI labels
    const { translated: ct } = useTBatch(CMD_LABELS);
    const C = {
        commandCenter: ct[0], emsControl: ct[1], available: ct[2], active: ct[3], total: ct[4],
        unassigned: ct[5], pause: ct[6], start: ct[7], reset: ct[8], ambulanceStatus: ct[9],
        cases: ct[10], fleet: ct[11], hospitals: ct[12], emergencyQueue: ct[13], dispatch: ct[14],
        ambulanceFleet: ct[15], hospitalStatus: ct[16], ambulanceDetails: ct[17],
        vehicle: ct[18], type: ct[19], status: ct[20], dispatchNext: ct[21],
        general: ct[22], queue: ct[23]
    };
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const markersRef = useRef({});
    const routeLayersRef = useRef([]);
    const simulationRef = useRef(null);

    // Map state
    const [mapLoaded, setMapLoaded] = useState(false);

    // Data state
    const [emergencyCases, setEmergencyCases] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [routeCache, setRouteCache] = useState({});

    // Simulation state
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [simulationTicks, setSimulationTicks] = useState(0);

    // UI state
    const [selectedAmbulance, setSelectedAmbulance] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [activePanel, setActivePanel] = useState("cases"); // cases, hospitals, fleet, routing

    // Phase 5: Driver-registered ambulance fleet
    const [driverAmbulances, setDriverAmbulances] = useState([]);
    const [fleetFilter, setFleetFilter] = useState('combined'); // 'system', 'driver', 'combined'

    const db = getFirestore();

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    // Initialize ambulance fleet (Phase 6: Multi-city support)
    useEffect(() => {
        setAmbulances(createAmbulanceFleet());
    }, []);

    // Phase 5: Listen for driver-registered ambulances from Firestore
    useEffect(() => {
        // Single where clause to avoid needing composite Firestore index
        const q = query(
            collection(db, 'ambulances'),
            where('source', '==', 'driver_registered')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const driverAmbs = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        vehicleNumber: data.vehicleNumber || 'Unknown',
                        type: data.type || 'BLS',
                        status: data.status || 'available',
                        source: 'driver_registered',
                        driverName: data.driverName || 'Unknown Driver',
                        driverPhone: data.driverPhone || '',
                        city: 'Driver',
                        currentLocation: {
                            latitude: data.location?.lat || 12.9716,
                            longitude: data.location?.lng || 77.5946
                        },
                        assignedCaseId: data.assignedCaseId || null,
                        routePath: null,
                        routeProgress: 0,
                        verificationStatus: data.verificationStatus || 'pending'
                    };
                })
                // Only show approved driver ambulances in the fleet
                .filter(a => a.verificationStatus === 'approved');
            setDriverAmbulances(driverAmbs);
        }, (err) => console.error('Driver ambulance listener error:', err));
        return () => unsub();
    }, [db]);

    // =============================================================================
    // FIRESTORE LISTENERS
    // =============================================================================

    useEffect(() => {
        const q = query(
            collection(db, "emergencyCases"),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cases = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmergencyCases(cases);
        });

        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "hospitals"), (snapshot) => {
            // Phase 4: Normalize hospital data to prevent NaN/undefined capacity
            const hospitalList = snapshot.docs.map(doc => {
                const raw = { id: doc.id, ...doc.data() };
                return normalizeHospital(raw) || raw;
            });
            setHospitals(hospitalList);
        });

        return () => unsubscribe();
    }, [db]);

    // =============================================================================
    // MAP INITIALIZATION
    // =============================================================================

    useEffect(() => {
        if (mapRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        const initMap = (style) => {
            const map = new mapboxgl.Map({
                container,
                style,
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
            });

            map.addControl(new mapboxgl.NavigationControl(), "top-right");

            map.on("load", () => {
                setMapLoaded(true);
                map.resize();
            });

            mapRef.current = map;
        };

        if (!mapboxgl.accessToken || mapboxgl.accessToken.trim() === "") {
            initMap(OSM_STYLE);
        } else {
            initMap("mapbox://styles/mapbox/dark-v11");
        }

        return () => {
            if (mapRef.current) {
                try { mapRef.current.remove(); } catch { }
                mapRef.current = null;
            }
        };
    }, []);

    // Map Resize Handler (Responsive + Orientation Support)
    useMapResize(mapRef.current);

    // =============================================================================
    // ROUTE FETCHING
    // =============================================================================

    const fetchRoute = useCallback(async (start, end) => {
        if (!mapboxgl.accessToken) return null;

        const key = `${start.latitude.toFixed(4)},${start.longitude.toFixed(4)}-${end.latitude.toFixed(4)},${end.longitude.toFixed(4)}`;
        if (routeCache[key]) return routeCache[key];

        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes?.[0]) {
                const route = {
                    geometry: data.routes[0].geometry,
                    distance: data.routes[0].distance / 1000, // km
                    duration: data.routes[0].duration / 60 // minutes
                };
                setRouteCache(prev => ({ ...prev, [key]: route }));
                return route;
            }
        } catch (error) {
            console.error("Route fetch error:", error);
        }
        return null;
    }, [routeCache]);

    // =============================================================================
    // SIMULATION ENGINE
    // =============================================================================

    const dispatchAmbulance = useCallback(async (ambulanceId, caseData) => {
        if (!caseData?.pickupLocation) return;

        const ambulance = ambulances.find(a => a.id === ambulanceId);
        if (!ambulance || ambulance.status !== "available") return;

        // Rank hospitals for this case
        const ranked = rankHospitals(hospitals, caseData);
        const topHospital = ranked.find(h => !h.disqualified);
        const hospitalData = hospitals.find(h => h.id === topHospital?.hospitalId);

        // Fetch route to scene
        const routeToScene = await fetchRoute(ambulance.currentLocation, caseData.pickupLocation);

        setAmbulances(prev => prev.map(a => {
            if (a.id !== ambulanceId) return a;
            return {
                ...a,
                status: "dispatched",
                assignedCaseId: caseData.id,
                destinationHospitalId: topHospital?.hospitalId || null,
                routePath: routeToScene?.geometry?.coordinates || null,
                routeProgress: 0,
                targetLocation: caseData.pickupLocation,
                hospitalLocation: hospitalData?.basicInfo?.location || null
            };
        }));
    }, [ambulances, hospitals, fetchRoute]);

    const simulationTick = useCallback(() => {
        setAmbulances(prev => prev.map(amb => {
            if (amb.status === "available" || amb.status === "arrived") return amb;

            // Move ambulance along route
            if (amb.routePath && amb.routePath.length > 1) {
                const progress = amb.routeProgress + (0.02 * speedMultiplier);

                if (progress >= 1) {
                    // Reached destination, transition to next status
                    const nextStatus = getNextStatus(amb.status);

                    if (nextStatus === "on_scene") {
                        // At scene, now route to hospital
                        return {
                            ...amb,
                            status: "on_scene",
                            routeProgress: 0,
                            currentLocation: amb.targetLocation
                        };
                    } else if (nextStatus === "arrived") {
                        // Phase 7: Arrived at hospital — sync ETA to 0
                        return {
                            ...amb,
                            status: "arrived",
                            routeProgress: 0,
                            currentLocation: amb.hospitalLocation || amb.currentLocation,
                            eta: 0
                        };
                    } else if (nextStatus === "available") {
                        // Reset ambulance
                        return {
                            ...amb,
                            status: "available",
                            assignedCaseId: null,
                            destinationHospitalId: null,
                            routePath: null,
                            routeProgress: 0
                        };
                    }

                    return { ...amb, status: nextStatus || amb.status, routeProgress: 0 };
                }

                // Interpolate position along route
                const totalPoints = amb.routePath.length;
                const pointIndex = Math.floor(progress * (totalPoints - 1));
                const localProgress = (progress * (totalPoints - 1)) % 1;

                const point1 = amb.routePath[Math.min(pointIndex, totalPoints - 1)];
                const point2 = amb.routePath[Math.min(pointIndex + 1, totalPoints - 1)];

                const newLocation = {
                    longitude: point1[0] + (point2[0] - point1[0]) * localProgress,
                    latitude: point1[1] + (point2[1] - point1[1]) * localProgress
                };

                return { ...amb, currentLocation: newLocation, routeProgress: progress };
            }

            // Status transitions for non-route states
            if (amb.status === "dispatched") {
                return { ...amb, status: "en_route_to_scene" };
            }

            if (amb.status === "on_scene") {
                // After some time on scene, route to hospital
                if (amb.hospitalLocation) {
                    return { ...amb, status: "en_route_to_hospital", routeProgress: 0 };
                }
            }

            return amb;
        }));
        // Phase 7: Recalculate ETA each tick for active ambulances
        setSimulationTicks(t => t + 1);
    }, [speedMultiplier]);

    // Simulation loop
    useEffect(() => {
        if (isSimulationRunning) {
            simulationRef.current = setInterval(simulationTick, 2000 / speedMultiplier);
        } else {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        }

        return () => {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        };
    }, [isSimulationRunning, simulationTick, speedMultiplier]);

    const resetFleet = useCallback(() => {
        setIsSimulationRunning(false);
        setAmbulances(createAmbulanceFleet());
        setSimulationTicks(0);
    }, []);

    // =============================================================================
    // MAP RENDERING
    // =============================================================================

    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;
        const map = mapRef.current;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        // Clear existing route layers
        routeLayersRef.current.forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);
            if (map.getSource(id)) map.removeSource(id);
        });
        routeLayersRef.current = [];

        // Render ambulance markers (system fleet)
        ambulances.forEach(amb => {
            const statusConfig = AMBULANCE_STATUSES[amb.status];

            const el = document.createElement("div");
            el.className = "ambulance-marker cursor-pointer";
            el.innerHTML = `
        <div class="relative transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg border-2 border-white"
               style="background: ${statusConfig.color}">
            <span class="text-white text-sm">🚑</span>
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border ${amb.status !== 'available' ? 'animate-pulse' : ''}"
               style="background: ${statusConfig.color}"></div>
        </div>
      `;

            el.addEventListener("click", () => setSelectedAmbulance(amb));

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([amb.currentLocation.longitude, amb.currentLocation.latitude])
                .addTo(map);

            markersRef.current[`amb-${amb.id}`] = marker;

            // Draw route for active ambulances
            if (amb.routePath && amb.status !== "available") {
                const sourceId = `route-${amb.id}`;

                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            geometry: { type: "LineString", coordinates: amb.routePath }
                        }
                    });

                    map.addLayer({
                        id: sourceId,
                        type: "line",
                        source: sourceId,
                        paint: {
                            "line-color": statusConfig.color,
                            "line-width": 3,
                            "line-opacity": 0.7,
                            "line-dasharray": [2, 1]
                        }
                    });

                    routeLayersRef.current.push(sourceId);
                }
            }
        });

        // Phase 5: Render driver-registered ambulance markers (green)
        driverAmbulances.forEach(amb => {
            const statusConfig = AMBULANCE_STATUSES[amb.status] || AMBULANCE_STATUSES.available;

            const el = document.createElement("div");
            el.className = "driver-ambulance-marker cursor-pointer";
            el.innerHTML = `
        <div class="relative transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg border-2 border-white"
               style="background: #22c55e">
            <span class="text-white text-sm">🚑</span>
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
               style="background: #22c55e"></div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0 rounded text-white font-bold shadow" style="font-size:6px;background:#22c55e;">DRV</div>
        </div>
      `;

            el.addEventListener("click", () => setSelectedAmbulance(amb));

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([amb.currentLocation.longitude, amb.currentLocation.latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
                        `<div style="padding:8px;font-family:system-ui;">
                            <div style="font-weight:bold;color:#22c55e;">🚑 Driver Registered</div>
                            <div style="margin-top:4px;"><b>${amb.driverName}</b></div>
                            <div style="color:#888;">${amb.vehicleNumber} • ${amb.type}</div>
                            <div style="color:#888;">📞 ${amb.driverPhone}</div>
                        </div>`
                    )
                )
                .addTo(map);

            markersRef.current[`amb-${amb.id}`] = marker;
        });

        // Render emergency case markers
        emergencyCases.forEach(ec => {
            if (!ec.pickupLocation) return;

            const isAssigned = ambulances.some(a => a.assignedCaseId === ec.id);

            const el = document.createElement("div");
            el.className = "case-marker cursor-pointer";
            el.innerHTML = `
        <div class="relative ${!isAssigned ? 'animate-pulse' : ''}">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
               style="background: ${isAssigned ? '#22c55e' : '#ef4444'}">
            <span class="text-white text-xs">📍</span>
          </div>
        </div>
      `;

            el.addEventListener("click", () => setSelectedCase(ec));

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([ec.pickupLocation.longitude, ec.pickupLocation.latitude])
                .addTo(map);

            markersRef.current[`case-${ec.id}`] = marker;
        });

        // Render hospital markers
        hospitals.forEach(h => {
            if (!h.basicInfo?.location) return;

            const loc = h.basicInfo.location;
            const status = h.emergencyReadiness?.status || "available";
            const loadColor = status === "full" ? "#ef4444" : status === "diverting" ? "#f97316" : "#22c55e";

            const el = document.createElement("div");
            el.className = "hospital-marker cursor-pointer";
            el.innerHTML = `
        <div class="relative">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg border-2 border-white bg-blue-600">
            <span class="text-white text-xs">🏥</span>
          </div>
          <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full" style="background: ${loadColor}"></div>
        </div>
      `;

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([loc.longitude, loc.latitude])
                .addTo(map);

            markersRef.current[`hosp-${h.id}`] = marker;
        });

    }, [mapLoaded, ambulances, driverAmbulances, emergencyCases, hospitals]);

    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================

    const fleetStats = useMemo(() => {
        // Combine system + driver ambulances for stats
        const allAmbs = [...ambulances, ...driverAmbulances];
        const stats = { available: 0, active: 0, total: allAmbs.length, system: ambulances.length, driver: driverAmbulances.length };
        allAmbs.forEach(a => {
            if (a.status === 'available') stats.available++;
            else stats.active++;
        });
        return stats;
    }, [ambulances, driverAmbulances]);

    // Filtered ambulances for rendering
    const filteredAmbulances = useMemo(() => {
        if (fleetFilter === 'system') return ambulances;
        if (fleetFilter === 'driver') return driverAmbulances;
        return [...ambulances, ...driverAmbulances];
    }, [ambulances, driverAmbulances, fleetFilter]);

    const unassignedCases = useMemo(() => {
        return emergencyCases.filter(ec =>
            !ambulances.some(a => a.assignedCaseId === ec.id)
        );
    }, [emergencyCases, ambulances]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
            {/* Top Command Bar */}
            <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Radio className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{C.commandCenter}</h1>
                                <p className="text-xs text-gray-400">{C.emsControl}</p>
                            </div>
                        </div>

                        {/* Fleet Status */}
                        <div className="flex items-center gap-3 ml-6 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-400 text-sm font-medium">{fleetStats.available} {C.available}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-600"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                <span className="text-orange-400 text-sm font-medium">{fleetStats.active} {C.active}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-600"></div>
                            <span className="text-gray-400 text-sm">{fleetStats.total} {C.total}</span>
                        </div>

                        {/* Unassigned Cases Alert */}
                        {unassignedCases.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">{unassignedCases.length} {C.unassigned}</span>
                            </div>
                        )}
                    </div>

                    {/* Simulation Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <select
                                value={speedMultiplier}
                                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                                className="bg-transparent text-gray-300 text-sm border-none outline-none"
                            >
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={2}>2x</option>
                                <option value={4}>4x</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSimulationRunning
                                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                                : "bg-green-600 text-white hover:bg-green-500"
                                }`}
                        >
                            {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isSimulationRunning ? C.pause : C.start}
                        </button>

                        <button
                            onClick={resetFleet}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {C.reset}
                        </button>

                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                            <Signal className="w-4 h-4 text-green-400" />
                            <span className="text-gray-400 text-sm">Tick: {simulationTicks}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map Container */}
                <div className="flex-1 relative">
                    <div ref={containerRef} className="map-container" />

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-gray-800/95 backdrop-blur rounded-xl border border-gray-700 p-3 shadow-xl">
                        <h4 className="text-white font-medium mb-2 text-xs">{C.ambulanceStatus}</h4>
                        <div className="space-y-1">
                            {Object.entries(AMBULANCE_STATUSES).slice(0, 4).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ background: val.color }}></div>
                                    <span className="text-gray-300 text-xs">{val.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
                    {/* Panel Tabs */}
                    <div className="flex border-b border-gray-700">
                        {[
                            { id: "cases", label: C.cases, icon: AlertTriangle },
                            { id: "fleet", label: C.fleet, icon: Truck },
                            { id: "hospitals", label: C.hospitals, icon: Building2 },
                            ...(role === 'admin' ? [{ id: "verifications", label: "Verifications", icon: ShieldCheck }] : [])
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActivePanel(tab.id);
                                    // Phase 5: Trigger map resize on tab switch
                                    setTimeout(() => { if (mapRef.current) mapRef.current.resize(); }, 300);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activePanel === tab.id
                                    ? "bg-gray-700 text-white border-b-2 border-blue-500"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Cases Panel */}
                        {activePanel === "cases" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-medium mb-3">{C.emergencyQueue} ({emergencyCases.length})</h3>

                                {emergencyCases.map(ec => {
                                    const assignedAmb = ambulances.find(a => a.assignedCaseId === ec.id);
                                    const acuity = getAcuityBadge(ec.acuityLevel);

                                    return (
                                        <div
                                            key={ec.id}
                                            onClick={() => setSelectedCase(ec)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedCase?.id === ec.id
                                                ? "bg-blue-500/20 border-blue-500"
                                                : "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-medium text-sm truncate">
                                                    {ec.emergencyContext?.emergencyType || "Emergency"}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${acuity.bg} ${acuity.text_color}`}>
                                                    {acuity.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">{ec.patientName || "Unknown"}</span>
                                                {assignedAmb ? (
                                                    <span className="text-green-400">{assignedAmb.vehicleNumber}</span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const availableAmb = ambulances.find(a => a.status === "available");
                                                            if (availableAmb) dispatchAmbulance(availableAmb.id, ec);
                                                        }}
                                                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                                                    >
                                                        {C.dispatch}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Fleet Panel */}
                        {activePanel === "fleet" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-medium mb-1">{C.ambulanceFleet} ({filteredAmbulances.length})</h3>

                                {/* Micro-fix #5: Fleet Source Filter Toggle */}
                                <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 mb-3">
                                    {[
                                        { key: 'combined', label: 'All', count: fleetStats.total },
                                        { key: 'system', label: 'System', count: fleetStats.system },
                                        { key: 'driver', label: 'Driver', count: fleetStats.driver },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFleetFilter(f.key)}
                                            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${fleetFilter === f.key
                                                ? f.key === 'driver' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:text-gray-200'
                                                }`}
                                        >
                                            {f.label} ({f.count})
                                        </button>
                                    ))}
                                </div>

                                {filteredAmbulances.map(amb => {
                                    const statusConfig = AMBULANCE_STATUSES[amb.status] || AMBULANCE_STATUSES.available;
                                    const assignedCase = emergencyCases.find(c => c.id === amb.assignedCaseId);
                                    const isDriverAmb = amb.source === 'driver_registered';

                                    return (
                                        <div
                                            key={amb.id}
                                            onClick={() => setSelectedAmbulance(amb)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAmbulance?.id === amb.id
                                                ? isDriverAmb ? "bg-green-500/20 border-green-500" : "bg-blue-500/20 border-blue-500"
                                                : "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium text-sm">{amb.vehicleNumber}</span>
                                                    <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">{amb.type}</span>
                                                    {/* Source badge */}
                                                    {isDriverAmb ? (
                                                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-500/30 text-green-300">DRV</span>
                                                    ) : (
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${amb.city === 'Hyderabad' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'}`}>
                                                            {amb.city === 'Hyderabad' ? 'HYD' : 'BLR'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span
                                                    className="px-2 py-0.5 rounded text-xs text-white"
                                                    style={{ background: isDriverAmb ? '#22c55e' : statusConfig.color }}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            {/* Driver info for driver-registered ambulances */}
                                            {isDriverAmb && (
                                                <div className="text-xs text-green-400 mb-1">
                                                    🧑‍✈️ {amb.driverName}
                                                    {amb.verificationStatus === 'pending' && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">⏳ Pending</span>
                                                    )}
                                                </div>
                                            )}

                                            {assignedCase && (
                                                <div className="text-xs text-gray-400">
                                                    Case: {assignedCase.emergencyContext?.emergencyType || "Emergency"}
                                                </div>
                                            )}

                                            {amb.routeProgress > 0 && (
                                                <div className="mt-2">
                                                    <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${amb.routeProgress * 100}%`,
                                                                background: isDriverAmb ? '#22c55e' : statusConfig.color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Hospitals Panel */}
                        {activePanel === "hospitals" && (
                            <div className="space-y-3">
                                <h3 className="text-white font-medium mb-3">{C.hospitalStatus} ({hospitals.length})</h3>

                                {hospitals.map(h => {
                                    // Phase 4: Use normalized bedAvailability instead of broken capacity.bedsByType
                                    const icuCount = h.bedAvailability?.icu?.available ?? 0;
                                    const generalCount = h.bedAvailability?.emergency?.available ?? h.bedAvailability?.available ?? 0;
                                    const status = h.emergencyReadiness?.status || "available";
                                    const queueLen = h.emergencyReadiness?.ambulanceQueue ?? h.emergencyReadiness?.queueLength ?? 0;
                                    const loadIndicator = getLoadIndicator(queueLen);

                                    return (
                                        <div
                                            key={h.id}
                                            className="p-3 rounded-lg bg-gray-700/50 border border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-medium text-sm truncate">
                                                    {h.basicInfo?.name || "Unknown"}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${loadIndicator.color}`}>
                                                    {loadIndicator.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-gray-800 rounded p-2">
                                                    <div className="text-white font-bold">{icuCount}</div>
                                                    <div className="text-gray-400 text-xs">ICU</div>
                                                </div>
                                                <div className="bg-gray-800 rounded p-2">
                                                    <div className="text-white font-bold">{generalCount}</div>
                                                    <div className="text-gray-400 text-xs">{C.general}</div>
                                                </div>
                                                <div className="bg-gray-800 rounded p-2">
                                                    <div className="text-white font-bold">{queueLen}</div>
                                                    <div className="text-gray-400 text-xs">{C.queue}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Driver Verifications Panel (Admin Only) */}
                        {activePanel === "verifications" && role === 'admin' && (
                            <DriverVerificationPanel />
                        )}
                    </div>

                    {/* Selected Item Details */}
                    {selectedAmbulance && (
                        <div className="border-t border-gray-700 p-4 bg-gray-750">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-medium">{C.ambulanceDetails}</h4>
                                <button
                                    onClick={() => setSelectedAmbulance(null)}
                                    className="text-gray-400 hover:text-white"
                                >✕</button>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{C.vehicle}</span>
                                    <span className="text-white">{selectedAmbulance.vehicleNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{C.type}</span>
                                    <span className="text-white">{selectedAmbulance.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{C.status}</span>
                                    <span className="text-white">{(AMBULANCE_STATUSES[selectedAmbulance.status] || AMBULANCE_STATUSES.available).label}</span>
                                </div>
                                {/* Driver info for driver-registered ambulances */}
                                {selectedAmbulance.source === 'driver_registered' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Driver</span>
                                            <span className="text-green-400 font-medium">{selectedAmbulance.driverName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Phone</span>
                                            <span className="text-gray-300">{selectedAmbulance.driverPhone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Source</span>
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">Driver Registered</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Verified</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedAmbulance.verificationStatus === 'approved'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {selectedAmbulance.verificationStatus === 'approved' ? '✓ Verified' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {selectedAmbulance.status === "available" && (
                                    <button
                                        onClick={() => {
                                            const freeCase = unassignedCases[0];
                                            if (freeCase) dispatchAmbulance(selectedAmbulance.id, freeCase);
                                        }}
                                        className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
                                    >
                                        {C.dispatchNext}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
