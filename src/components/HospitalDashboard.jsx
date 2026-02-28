import React, { useState, useEffect, useRef, useCallback } from 'react';
import IncomingCaseAlert from './hospital/IncomingCaseAlert.jsx';
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import mapboxgl from 'mapbox-gl';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, Save, X, AlertTriangle, FileText, MapPin, Loader2, Navigation, Building2 } from 'lucide-react';
import HospitalExtendedProfileForm, { defaultExtendedProfile } from './HospitalExtendedProfileForm';
import HospitalProfileView from './HospitalProfileView';
import { useAuth } from './auth/AuthProvider';
import { useTPreload, useTBatch, useT } from "../hooks/useT";
import { PRELOAD_HOSPITAL } from "../constants/translationKeys";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Sprint-2: Default schema to prevent crashes from undefined fields
const defaultHospitalSchema = {
    basicInfo: { name: '', hospitalType: 'general', traumaLevel: 'none', address: '', phone: '', location: { latitude: 0, longitude: 0 } },
    clinicalCapabilities: { strokeCenter: false, emergencySurgery: false, ctScanAvailable: false, mriAvailable: false, radiology24x7: false },
    serviceAvailability: { emergency24x7: true, surgery24x7: false, radiology24x7: false, lab24x7: false },
    caseAcceptance: { acceptsTrauma: true, acceptsCardiac: true, acceptsBurns: false, acceptsPediatric: true, acceptsInfectious: false },
    specialists: { cardiologist: 0, neurologist: 0, traumaSurgeon: 0, radiologist: 0, pulmonologist: 0, burnSpecialist: 0 },
    equipment: { ventilators: { total: 0, available: 0 }, defibrillators: 0, dialysisMachines: 0, portableXRay: 0, ultrasound: 0 },
    bedAvailability: { total: 0, available: 0, icu: { total: 0, available: 0 }, emergency: { total: 0, available: 0 }, traumaBeds: { total: 0, available: 0 }, isolationBeds: { total: 0, available: 0 }, pediatricBeds: { total: 0, available: 0 } },
    emergencyReadiness: { status: 'accepting', diversionStatus: false, ambulanceQueue: 0 },
    infectionControl: { negativePressureRooms: 0, infectiousDiseaseUnit: false },
    supportFacilities: { helipadAvailable: false, pharmacy24x7: false },
    transferCapability: { acceptsReferrals: true, maxTransferCapacityPerHour: 0 },
    performanceMetrics: { averageAmbulanceHandoverTime: 0, emergencyResponseRating: 3, survivalRateIndex: 0 },
    capabilities: { specializations: [], hasTraumaCenter: false, hasICU: false, hasBurnUnit: false },
    extendedProfile: {
        accreditation: [],
        traumaCertifications: [],
        emergencyCertifications: [],
        insurancePartners: [],
        cashlessAvailable: false,
        governmentSchemesAccepted: [],
        emergencyCoordinators: [],
        specialPrograms: [],
        helipadDetails: { available: false, nightLanding: false },
        disasterPreparednessLevel: 'basic',
        medicoLegalReady: false,
        policeCaseHandling: false,
        hospitalNotes: '',
        lastProfileUpdated: null,
        updatedBy: ''
    }
};

// Sprint-2: Deep merge helper to safely combine schema defaults with loaded data
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] !== null && source[key] !== undefined) {
            if (typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    return result;
}

// =============================================================================
// SPECIALISTS NORMALIZATION (Crash Hardening)
// =============================================================================

const IS_DEV = typeof window !== 'undefined' && window.location?.hostname === 'localhost';

// Default specialist structure with all known types
const DEFAULT_SPECIALISTS = {
    cardiologist: 0,
    neurologist: 0,
    traumaSurgeon: 0,
    radiologist: 0,
    pulmonologist: 0,
    burnSpecialist: 0,
    orthopedicSurgeon: 0,
    anesthesiologist: 0,
    emergencyPhysician: 0,
    pediatrician: 0
};

/**
 * Safely extracts a numeric value from any input type
 * Handles: number, {available, count, total}, undefined, null, NaN, string
 */
function safeSpecialistCount(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : Math.max(0, Math.round(value));
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Extract from nested object structures: {available, count, total}
        const num = value.available ?? value.count ?? value.total ?? 0;
        return typeof num === 'number' && !isNaN(num) ? Math.max(0, Math.round(num)) : 0;
    }
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return 0;
}

/**
 * Normalizes specialists data from any Firestore format to a safe, uniform structure
 * Handles: undefined, null, object with numbers, object with nested objects, array (legacy)
 */
function normalizeSpecialists(specialists) {
    // Start with defaults
    const normalized = { ...DEFAULT_SPECIALISTS };

    // Guard: undefined, null, or non-object input
    if (!specialists || typeof specialists !== 'object') {
        if (IS_DEV) console.log('normalizeSpecialists: Invalid input, using defaults', specialists);
        return normalized;
    }

    // Guard: Legacy array format
    if (Array.isArray(specialists)) {
        if (IS_DEV) console.warn('normalizeSpecialists: Array format detected (legacy)', specialists);
        // Try to parse array of {type, count} objects
        specialists.forEach(item => {
            if (item && typeof item === 'object' && item.type && DEFAULT_SPECIALISTS.hasOwnProperty(item.type)) {
                normalized[item.type] = safeSpecialistCount(item.count || item.available || 1);
            }
        });
        return normalized;
    }

    // Normal object format - extract counts safely
    Object.keys(DEFAULT_SPECIALISTS).forEach(specType => {
        if (specialists.hasOwnProperty(specType)) {
            normalized[specType] = safeSpecialistCount(specialists[specType]);
        }
    });

    // Handle any additional specialist types not in defaults
    Object.keys(specialists).forEach(specType => {
        if (!DEFAULT_SPECIALISTS.hasOwnProperty(specType)) {
            normalized[specType] = safeSpecialistCount(specialists[specType]);
        }
    });

    if (IS_DEV) console.log('normalizeSpecialists:', normalized);

    return normalized;
}

// Sprint-2: ErrorBoundary for graceful error handling
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('HospitalDashboard Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg m-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">{H?.somethingWrong || "Something went wrong"}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const HOSPITAL_LABELS = [
    "Hospital Capability Dashboard", "Decision intelligence for AI-powered emergency routing",
    "Add Hospital", "Edit Hospital", "Add New Hospital",
    "Saving...", "Update Hospital", "Cancel",
    "Something went wrong", "Hospital Name", "Hospital Type",
    "Trauma Level", "Phone", "Address", "Latitude", "Longitude",
    "Status", "Accepting", "Diverting", "Full",
    "Trauma Center", "General Hospital", "Cardiac Specialty", "Pediatric",
    "Burn Center", "Specialty", "None",
    "Clinical Capabilities", "Case Acceptance", "Specialists", "available"
];

export default function HospitalDashboard() {
    // Phase 10: Preload translations for this dashboard
    useTPreload(PRELOAD_HOSPITAL);

    // Phase 5: Batch translate all static UI labels
    const { translated: ht } = useTBatch(HOSPITAL_LABELS);
    const H = {
        title: ht[0], subtitle: ht[1],
        addHospital: ht[2], editHospital: ht[3], addNewHospital: ht[4],
        saving: ht[5], updateHospital: ht[6], cancel: ht[7],
        somethingWrong: ht[8], hospitalName: ht[9], hospitalType: ht[10],
        traumaLevel: ht[11], phone: ht[12], address: ht[13], latitude: ht[14], longitude: ht[15],
        status: ht[16], accepting: ht[17], diverting: ht[18], full: ht[19],
        traumaCenter: ht[20], generalHospital: ht[21], cardiacSpecialty: ht[22], pediatric: ht[23],
        burnCenter: ht[24], specialty: ht[25], none: ht[26],
        clinicalCapabilities: ht[27], caseAcceptance: ht[28], specialists: ht[29], available: ht[30]
    };
    const [hospitals, setHospitals] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [formData, setFormData] = useState(getEmptyFormData());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Phase: Ownership & Onboarding
    const { currentUser, role } = useAuth();
    const [userHospitalId, setUserHospitalId] = useState(null);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardingLoading, setOnboardingLoading] = useState(true);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Map preview refs
    const mapPreviewRef = useRef(null);
    const mapPreviewContainerRef = useRef(null);
    const markerRef = useRef(null);

    const db = getFirestore();
    const auth = getAuth();

    // Hospital Response Engine: incoming case notifications
    const [incomingCases, setIncomingCases] = useState([]);

    // Phase: Fetch user doc to check ownership
    useEffect(() => {
        if (!currentUser) {
            setOnboardingLoading(false);
            return;
        }

        const fetchUserDoc = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.hospitalId) {
                        setUserHospitalId(data.hospitalId);
                        setIsOnboarding(false);
                    } else if (role === 'hospital_admin') {
                        setIsOnboarding(true);
                        setShowAddForm(true);
                    }
                } else if (role === 'hospital_admin') {
                    setIsOnboarding(true);
                    setShowAddForm(true);
                }
            } catch (err) {
                console.error('Error fetching user doc:', err);
            } finally {
                setOnboardingLoading(false);
            }
        };

        fetchUserDoc();
    }, [currentUser, role, db]);

    // Hospital Response Engine: listen for pending notifications for this hospital
    useEffect(() => {
        if (!userHospitalId) return;
        const q = query(collection(db, 'emergencyCases'), where('status', 'in', ['awaiting_response']));
        const unsub = onSnapshot(q, (snap) => {
            const cases = [];
            snap.forEach(d => {
                const data = { id: d.id, ...d.data() };
                const hasNotification = (data.hospitalNotifications || []).some(
                    n => n.hospitalId === userHospitalId && n.response === null
                );
                if (hasNotification) cases.push(data);
            });
            setIncomingCases(cases);
        });
        return () => unsub();
    }, [userHospitalId, db]);

    // Phase: GPS Location Capture
    const handleUseCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGpsLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setFormData(prev => ({
                    ...prev,
                    basicInfo: {
                        ...prev.basicInfo,
                        location: { latitude: lat, longitude: lng }
                    }
                }));

                setGpsLoading(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Unable to fetch your location. Please enter coordinates manually or enable location access.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    // Phase: Mapbox Preview in Form
    useEffect(() => {
        if (!showAddForm || !mapPreviewContainerRef.current) return;
        if (!mapboxgl.accessToken || mapboxgl.accessToken.trim() === '') return;

        const lat = formData.basicInfo.location.latitude;
        const lng = formData.basicInfo.location.longitude;
        const hasValidLocation = lat !== 0 || lng !== 0;

        // Default center: India center
        const center = hasValidLocation ? [lng, lat] : [78.9629, 20.5937];
        const zoom = hasValidLocation ? 14 : 4;

        if (!mapPreviewRef.current) {
            // Initialize map
            const map = new mapboxgl.Map({
                container: mapPreviewContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center,
                zoom
            });
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            mapPreviewRef.current = map;

            if (hasValidLocation) {
                markerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
                    .setLngLat([lng, lat])
                    .addTo(map);
            }
        } else {
            // Update existing map
            const map = mapPreviewRef.current;
            map.flyTo({ center, zoom, duration: 1000 });

            if (hasValidLocation) {
                if (markerRef.current) {
                    markerRef.current.setLngLat([lng, lat]);
                } else {
                    markerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
                        .setLngLat([lng, lat])
                        .addTo(map);
                }
            } else if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        }

        return () => {
            // Cleanup only on unmount
        };
    }, [showAddForm, formData.basicInfo.location.latitude, formData.basicInfo.location.longitude]);

    // Cleanup map on component unmount
    useEffect(() => {
        return () => {
            if (mapPreviewRef.current) {
                mapPreviewRef.current.remove();
                mapPreviewRef.current = null;
            }
        };
    }, []);

    // Real-time Firebase sync with Sprint-2 schema guards
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'hospitals'),
            (snapshot) => {
                const hospitalData = snapshot.docs.map(docSnap => {
                    // Sprint-2: Safely merge loaded data with default schema
                    const rawData = docSnap.data() || {};
                    const safeData = deepMerge(defaultHospitalSchema, rawData);

                    // Crash Hardening: Normalize specialists to prevent dropdown crashes
                    safeData.specialists = normalizeSpecialists(safeData.specialists);

                    return {
                        id: docSnap.id,
                        ...safeData
                    };
                });
                setHospitals(hospitalData);
            },
            (error) => {
                console.error('Error fetching hospitals:', error);
                setError('Failed to load hospitals');
            }
        );

        return () => unsubscribe();
    }, [db]);

    function getEmptyFormData() {
        return {
            // Basic Information
            basicInfo: {
                name: '',
                hospitalType: 'general',
                traumaLevel: 'none',
                address: '',
                phone: '',
                location: { latitude: 0, longitude: 0 }
            },
            // Clinical Capabilities
            clinicalCapabilities: {
                strokeCenter: false,
                emergencySurgery: false,
                ctScanAvailable: false,
                mriAvailable: false,
                radiology24x7: false
            },
            // Service Availability
            serviceAvailability: {
                emergency24x7: true,
                surgery24x7: false,
                radiology24x7: false,
                lab24x7: false
            },
            // Case Acceptance
            caseAcceptance: {
                acceptsTrauma: true,
                acceptsCardiac: true,
                acceptsBurns: false,
                acceptsPediatric: true,
                acceptsInfectious: false
            },
            // Specialists
            specialists: {
                cardiologist: 0,
                neurologist: 0,
                traumaSurgeon: 0,
                radiologist: 0,
                pulmonologist: 0,
                burnSpecialist: 0
            },
            // Equipment
            equipment: {
                ventilators: { total: 0, available: 0 },
                defibrillators: 0,
                dialysisMachines: 0,
                portableXRay: 0,
                ultrasound: 0
            },
            // Bed Availability
            bedAvailability: {
                total: 0,
                available: 0,
                icu: { total: 0, available: 0 },
                emergency: { total: 0, available: 0 },
                traumaBeds: { total: 0, available: 0 },
                isolationBeds: { total: 0, available: 0 },
                pediatricBeds: { total: 0, available: 0 }
            },
            // Emergency Readiness
            emergencyReadiness: {
                status: 'accepting',
                diversionStatus: false,
                ambulanceQueue: 0
            },
            // Infection Control
            infectionControl: {
                negativePressureRooms: 0,
                infectiousDiseaseUnit: false
            },
            // Support Facilities
            supportFacilities: {
                helipadAvailable: false,
                pharmacy24x7: false
            },
            // Transfer Capability
            transferCapability: {
                acceptsReferrals: true,
                maxTransferCapacityPerHour: 0
            },
            // Performance Metrics
            performanceMetrics: {
                averageAmbulanceHandoverTime: 0,
                emergencyResponseRating: 3,
                survivalRateIndex: 0
            },
            // Extended Profile
            extendedProfile: { ...defaultExtendedProfile }
        };
    }

    const toggleSection = (hospitalId, section) => {
        setExpandedSections(prev => ({
            ...prev,
            [`${hospitalId}-${section}`]: !prev[`${hospitalId}-${section}`]
        }));
    };

    // Phase 6B: Geo-Integrity Validation
    const validateGeoLocation = () => {
        const lat = formData.basicInfo?.location?.latitude;
        const lng = formData.basicInfo?.location?.longitude;

        if (!lat || !lng || lat === 0 || lng === 0) {
            return { valid: false, error: 'Latitude and longitude are required for routing' };
        }

        // Validate India bounds (rough)
        if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
            return { valid: false, error: 'Location must be within India coordinates' };
        }

        return { valid: true };
    };

    // Phase 7B: Capacity Auto-Normalization Engine
    const normalizeCapacity = (data) => {
        const normalized = JSON.parse(JSON.stringify(data));

        // Beds normalization - available cannot exceed total
        if (normalized.bedAvailability) {
            const beds = normalized.bedAvailability;
            if (beds.available > beds.total) beds.available = beds.total;

            ['icu', 'emergency', 'traumaBeds', 'isolationBeds', 'pediatricBeds'].forEach(key => {
                if (beds[key]?.available > beds[key]?.total) {
                    beds[key].available = beds[key].total;
                }
            });
        }

        // Equipment normalization
        if (normalized.equipment?.ventilators) {
            if (normalized.equipment.ventilators.available > normalized.equipment.ventilators.total) {
                normalized.equipment.ventilators.available = normalized.equipment.ventilators.total;
            }
        }

        // Ambulance queue bounds (0-50)
        if (normalized.emergencyReadiness) {
            const queue = normalized.emergencyReadiness.ambulanceQueue ?? 0;
            normalized.emergencyReadiness.ambulanceQueue = Math.max(0, Math.min(50, queue));
        }

        return normalized;
    };

    const validateForm = () => {
        if (!formData.basicInfo.name || !formData.basicInfo.address || !formData.basicInfo.phone) {
            setError('Name, address, and phone are required');
            return false;
        }

        // Phase 6B: Geo validation
        const geoCheck = validateGeoLocation();
        if (!geoCheck.valid) {
            setError(geoCheck.error);
            return false;
        }

        // Validate at least one case acceptance
        const hasAcceptance = Object.values(formData.caseAcceptance).some(v => v);
        if (!hasAcceptance) {
            setError('Hospital must accept at least one case type');
            return false;
        }

        // Validate available <= total for all capacity fields
        if (formData.equipment.ventilators.available > formData.equipment.ventilators.total) {
            setError('Available ventilators cannot exceed total');
            return false;
        }

        Object.entries(formData.bedAvailability).forEach(([key, value]) => {
            if (typeof value === 'object' && value.available > value.total) {
                setError(`Available ${key} cannot exceed total`);
                return false;
            }
        });

        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in');

            // Block duplicate hospital creation for hospital_admin
            if (!editingId && role === 'hospital_admin' && userHospitalId) {
                setError('You already have a registered hospital. You cannot create another.');
                setLoading(false);
                return;
            }

            // Phase 7B: Apply auto-normalization before saving
            const normalizedData = normalizeCapacity(formData);

            const hospitalData = {
                ...normalizedData,
                capacityLastUpdated: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                updatedBy: user.uid
            };

            if (editingId) {
                await updateDoc(doc(db, 'hospitals', editingId), hospitalData);
            } else {
                // Add ownership fields on creation
                hospitalData.adminId = user.uid;
                hospitalData.createdBy = user.uid;
                hospitalData.createdAt = serverTimestamp();

                const docRef = await addDoc(collection(db, 'hospitals'), hospitalData);

                // Update user document with hospitalId back-link
                if (role === 'hospital_admin') {
                    await updateDoc(doc(db, 'users', user.uid), {
                        hospitalId: docRef.id
                    });
                    setUserHospitalId(docRef.id);
                    setIsOnboarding(false);
                }
            }

            setFormData(getEmptyFormData());
            setShowAddForm(false);
            setEditingId(null);

            // Cleanup map preview on form close
            if (mapPreviewRef.current) {
                mapPreviewRef.current.remove();
                mapPreviewRef.current = null;
                markerRef.current = null;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (hospital) => {
        setFormData(hospital);
        setEditingId(hospital.id);
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this hospital?')) return;
        try {
            await deleteDoc(doc(db, 'hospitals', id));
        } catch (err) {
            setError(err.message);
        }
    };

    const updateNestedField = (path, value) => {
        const keys = path.split('.');
        setFormData(prev => {
            const newData = { ...prev };
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'accepting': return 'bg-green-100 text-green-800 border-green-300';
            case 'diverting': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'full': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Onboarding loading state
    if (onboardingLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading your hospital profile...</p>
                </div>
            </div>
        );
    }

    // Compute filtered hospitals for display
    const displayHospitals = (role === 'hospital_admin' && userHospitalId)
        ? hospitals.filter(h => h.id === userHospitalId)
        : hospitals;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Hospital Response Engine: Incoming Case Alerts */}
            {incomingCases.length > 0 && (
                <div className="mb-6 space-y-4">
                    {incomingCases.map(c => (
                        <IncomingCaseAlert
                            key={c.id}
                            caseData={c}
                            hospitalId={userHospitalId}
                            onActionComplete={(action) => {
                                setIncomingCases(prev => prev.filter(p => p.id !== c.id));
                            }}
                        />
                    ))}
                </div>
            )}
            {/* Onboarding Hero Header */}
            {isOnboarding && (
                <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                            <Building2 className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Register Your Hospital</h1>
                            <p className="text-blue-100 mt-1">
                                Complete the form below to add your hospital to the EMS routing network
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 mt-6">
                        <div className="flex items-center gap-2 text-blue-100 text-sm">
                            <MapPin className="w-4 h-4" /> GPS Location Capture
                        </div>
                        <div className="flex items-center gap-2 text-blue-100 text-sm">
                            <Navigation className="w-4 h-4" /> Live Map Preview
                        </div>
                        <div className="flex items-center gap-2 text-blue-100 text-sm">
                            <Save className="w-4 h-4" /> Instant Activation
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Header — hidden during onboarding */}
            {!isOnboarding && (
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{H.title}</h1>
                        <p className="text-sm text-gray-600 mt-2">
                            {H.subtitle}
                        </p>
                    </div>
                    {role === 'admin' && (
                        <button
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                setFormData(getEmptyFormData());
                                setEditingId(null);
                            }}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {H.addHospital}
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {error}
                </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-8 card p-6 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingId ? H.editHospital : H.addNewHospital}
                        </h2>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setEditingId(null);
                                setFormData(getEmptyFormData());
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Basic Information */}
                        <Section title="🏥 Basic Information" defaultOpen>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {H.hospitalName} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.basicInfo.name}
                                        onChange={(e) => updateNestedField('basicInfo.name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {H.hospitalType} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.basicInfo.hospitalType}
                                        onChange={(e) => updateNestedField('basicInfo.hospitalType', e.target.value)}
                                    >
                                        <option value="trauma_center">{H.traumaCenter}</option>
                                        <option value="general">{H.generalHospital}</option>
                                        <option value="cardiac">{H.cardiacSpecialty}</option>
                                        <option value="pediatric">{H.pediatric}</option>
                                        <option value="burn">{H.burnCenter}</option>
                                        <option value="specialty">{H.specialty}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {H.traumaLevel}
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.basicInfo.traumaLevel}
                                        onChange={(e) => updateNestedField('basicInfo.traumaLevel', e.target.value)}
                                    >
                                        <option value="none">{H.none}</option>
                                        <option value="level_1">Level 1</option>
                                        <option value="level_2">Level 2</option>
                                        <option value="level_3">Level 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {H.phone} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="input"
                                        value={formData.basicInfo.phone}
                                        onChange={(e) => updateNestedField('basicInfo.phone', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {H.address} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.basicInfo.address}
                                        onChange={(e) => updateNestedField('basicInfo.address', e.target.value)}
                                        required
                                    />
                                </div>
                                {/* GPS Capture Button */}
                                <div className="md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentLocation}
                                        disabled={gpsLoading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {gpsLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Fetching your location...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="w-5 h-5" />
                                                📍 Use My Current Location
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{H.latitude} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={formData.basicInfo.location.latitude}
                                        onChange={(e) => updateNestedField('basicInfo.location.latitude', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{H.longitude} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={formData.basicInfo.location.longitude}
                                        onChange={(e) => updateNestedField('basicInfo.location.longitude', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>
                                {/* Mapbox Preview */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">📍 Location Preview</label>
                                    <div
                                        ref={mapPreviewContainerRef}
                                        className="w-full rounded-lg border border-gray-300 overflow-hidden"
                                        style={{ height: '250px' }}
                                    />
                                    {(formData.basicInfo.location.latitude !== 0 || formData.basicInfo.location.longitude !== 0) && (
                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Location set: {formData.basicInfo.location.latitude.toFixed(4)}°N, {formData.basicInfo.location.longitude.toFixed(4)}°E
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Section>

                        {/* Section 2: Clinical Capabilities */}
                        <Section title="🔬 Clinical Capabilities">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CheckboxField
                                    label="Stroke Center"
                                    checked={formData.clinicalCapabilities.strokeCenter}
                                    onChange={(val) => updateNestedField('clinicalCapabilities.strokeCenter', val)}
                                />
                                <CheckboxField
                                    label="Emergency Surgery"
                                    checked={formData.clinicalCapabilities.emergencySurgery}
                                    onChange={(val) => updateNestedField('clinicalCapabilities.emergencySurgery', val)}
                                />
                                <CheckboxField
                                    label="CT Scan Available"
                                    checked={formData.clinicalCapabilities.ctScanAvailable}
                                    onChange={(val) => updateNestedField('clinicalCapabilities.ctScanAvailable', val)}
                                />
                                <CheckboxField
                                    label="MRI Available"
                                    checked={formData.clinicalCapabilities.mriAvailable}
                                    onChange={(val) => updateNestedField('clinicalCapabilities.mriAvailable', val)}
                                />
                                <CheckboxField
                                    label="24/7 Radiology"
                                    checked={formData.clinicalCapabilities.radiology24x7}
                                    onChange={(val) => updateNestedField('clinicalCapabilities.radiology24x7', val)}
                                />
                            </div>
                        </Section>

                        {/* Section 3: Service Availability */}
                        <Section title="🕐 Service Availability (24/7)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CheckboxField
                                    label="Emergency 24/7"
                                    checked={formData.serviceAvailability.emergency24x7}
                                    onChange={(val) => updateNestedField('serviceAvailability.emergency24x7', val)}
                                />
                                <CheckboxField
                                    label="Surgery 24/7"
                                    checked={formData.serviceAvailability.surgery24x7}
                                    onChange={(val) => updateNestedField('serviceAvailability.surgery24x7', val)}
                                />
                                <CheckboxField
                                    label="Radiology 24/7"
                                    checked={formData.serviceAvailability.radiology24x7}
                                    onChange={(val) => updateNestedField('serviceAvailability.radiology24x7', val)}
                                />
                                <CheckboxField
                                    label="Lab 24/7"
                                    checked={formData.serviceAvailability.lab24x7}
                                    onChange={(val) => updateNestedField('serviceAvailability.lab24x7', val)}
                                />
                            </div>
                        </Section>

                        {/* Section 4: Case Acceptance Filters */}
                        <Section title="🎯 Case Acceptance Filters">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CheckboxField
                                    label="Accepts Trauma Cases"
                                    checked={formData.caseAcceptance.acceptsTrauma}
                                    onChange={(val) => updateNestedField('caseAcceptance.acceptsTrauma', val)}
                                />
                                <CheckboxField
                                    label="Accepts Cardiac Cases"
                                    checked={formData.caseAcceptance.acceptsCardiac}
                                    onChange={(val) => updateNestedField('caseAcceptance.acceptsCardiac', val)}
                                />
                                <CheckboxField
                                    label="Accepts Burn Cases"
                                    checked={formData.caseAcceptance.acceptsBurns}
                                    onChange={(val) => updateNestedField('caseAcceptance.acceptsBurns', val)}
                                />
                                <CheckboxField
                                    label="Accepts Pediatric Cases"
                                    checked={formData.caseAcceptance.acceptsPediatric}
                                    onChange={(val) => updateNestedField('caseAcceptance.acceptsPediatric', val)}
                                />
                                <CheckboxField
                                    label="Accepts Infectious Cases"
                                    checked={formData.caseAcceptance.acceptsInfectious}
                                    onChange={(val) => updateNestedField('caseAcceptance.acceptsInfectious', val)}
                                />
                            </div>
                        </Section>

                        {/* Section 5: Specialist Availability */}
                        <Section title="👨‍⚕️ Specialist Availability">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <NumberField
                                    label="Cardiologists"
                                    value={formData.specialists.cardiologist}
                                    onChange={(val) => updateNestedField('specialists.cardiologist', val)}
                                    max={100}
                                />
                                <NumberField
                                    label="Neurologists"
                                    value={formData.specialists.neurologist}
                                    onChange={(val) => updateNestedField('specialists.neurologist', val)}
                                    max={100}
                                />
                                <NumberField
                                    label="Trauma Surgeons"
                                    value={formData.specialists.traumaSurgeon}
                                    onChange={(val) => updateNestedField('specialists.traumaSurgeon', val)}
                                    max={100}
                                />
                                <NumberField
                                    label="Radiologists"
                                    value={formData.specialists.radiologist}
                                    onChange={(val) => updateNestedField('specialists.radiologist', val)}
                                    max={100}
                                />
                                <NumberField
                                    label="Pulmonologists"
                                    value={formData.specialists.pulmonologist}
                                    onChange={(val) => updateNestedField('specialists.pulmonologist', val)}
                                    max={100}
                                />
                                <NumberField
                                    label="Burn Specialists"
                                    value={formData.specialists.burnSpecialist}
                                    onChange={(val) => updateNestedField('specialists.burnSpecialist', val)}
                                    max={100}
                                />
                            </div>
                        </Section>

                        {/* Section 6: Equipment Inventory */}
                        <Section title="🔧 Equipment Inventory">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h4 className="font-semibold mb-3 text-gray-700">Ventilators</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <NumberField
                                            label="Total"
                                            value={formData.equipment.ventilators.total}
                                            onChange={(val) => updateNestedField('equipment.ventilators.total', val)}
                                            max={1000}
                                        />
                                        <NumberField
                                            label="Available"
                                            value={formData.equipment.ventilators.available}
                                            onChange={(val) => updateNestedField('equipment.ventilators.available', val)}
                                            max={1000}
                                        />
                                    </div>
                                </div>
                                <NumberField
                                    label="Defibrillators"
                                    value={formData.equipment.defibrillators}
                                    onChange={(val) => updateNestedField('equipment.defibrillators', val)}
                                    max={1000}
                                />
                                <NumberField
                                    label="Dialysis Machines"
                                    value={formData.equipment.dialysisMachines}
                                    onChange={(val) => updateNestedField('equipment.dialysisMachines', val)}
                                    max={1000}
                                />
                                <NumberField
                                    label="Portable X-Ray"
                                    value={formData.equipment.portableXRay}
                                    onChange={(val) => updateNestedField('equipment.portableXRay', val)}
                                    max={1000}
                                />
                                <NumberField
                                    label="Ultrasound"
                                    value={formData.equipment.ultrasound}
                                    onChange={(val) => updateNestedField('equipment.ultrasound', val)}
                                    max={1000}
                                />
                            </div>
                        </Section>

                        {/* Section 7: Bed Availability */}
                        <Section title="🛏️ Bed Availability">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-blue-50">
                                    <NumberField
                                        label="Total Beds"
                                        value={formData.bedAvailability.total}
                                        onChange={(val) => updateNestedField('bedAvailability.total', val)}
                                        max={10000}
                                    />
                                    <NumberField
                                        label="Available Beds"
                                        value={formData.bedAvailability.available}
                                        onChange={(val) => updateNestedField('bedAvailability.available', val)}
                                        max={10000}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <BedCapacityField
                                        label="ICU Beds"
                                        total={formData.bedAvailability.icu.total}
                                        available={formData.bedAvailability.icu.available}
                                        onTotalChange={(val) => updateNestedField('bedAvailability.icu.total', val)}
                                        onAvailableChange={(val) => updateNestedField('bedAvailability.icu.available', val)}
                                    />
                                    <BedCapacityField
                                        label="Emergency Beds"
                                        total={formData.bedAvailability.emergency.total}
                                        available={formData.bedAvailability.emergency.available}
                                        onTotalChange={(val) => updateNestedField('bedAvailability.emergency.total', val)}
                                        onAvailableChange={(val) => updateNestedField('bedAvailability.emergency.available', val)}
                                    />
                                    <BedCapacityField
                                        label="Trauma Beds"
                                        total={formData.bedAvailability.traumaBeds.total}
                                        available={formData.bedAvailability.traumaBeds.available}
                                        onTotalChange={(val) => updateNestedField('bedAvailability.traumaBeds.total', val)}
                                        onAvailableChange={(val) => updateNestedField('bedAvailability.traumaBeds.available', val)}
                                    />
                                    <BedCapacityField
                                        label="Isolation Beds"
                                        total={formData.bedAvailability.isolationBeds.total}
                                        available={formData.bedAvailability.isolationBeds.available}
                                        onTotalChange={(val) => updateNestedField('bedAvailability.isolationBeds.total', val)}
                                        onAvailableChange={(val) => updateNestedField('bedAvailability.isolationBeds.available', val)}
                                    />
                                    <BedCapacityField
                                        label="Pediatric Beds"
                                        total={formData.bedAvailability.pediatricBeds.total}
                                        available={formData.bedAvailability.pediatricBeds.available}
                                        onTotalChange={(val) => updateNestedField('bedAvailability.pediatricBeds.total', val)}
                                        onAvailableChange={(val) => updateNestedField('bedAvailability.pediatricBeds.available', val)}
                                    />
                                </div>
                            </div>
                        </Section>

                        {/* Section 8: Emergency Readiness */}
                        <Section title="🚨 Emergency Readiness">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{H.status}</label>
                                    <select
                                        className="input"
                                        value={formData.emergencyReadiness.status}
                                        onChange={(e) => {
                                            updateNestedField('emergencyReadiness.status', e.target.value);
                                            updateNestedField('emergencyReadiness.diversionStatus', e.target.value === 'diverting');
                                        }}
                                    >
                                        <option value="accepting">{H.accepting}</option>
                                        <option value="diverting">{H.diverting}</option>
                                        <option value="full">{H.full}</option>
                                    </select>
                                </div>
                                <NumberField
                                    label="Ambulance Queue"
                                    value={formData.emergencyReadiness.ambulanceQueue}
                                    onChange={(val) => updateNestedField('emergencyReadiness.ambulanceQueue', val)}
                                    max={50}
                                />
                                <CheckboxField
                                    label="Diversion Status"
                                    checked={formData.emergencyReadiness.diversionStatus}
                                    onChange={(val) => updateNestedField('emergencyReadiness.diversionStatus', val)}
                                    disabled
                                />
                            </div>
                        </Section>

                        {/* Section 9: Infection Control */}
                        <Section title="🦠 Infection Control">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberField
                                    label="Negative Pressure Rooms"
                                    value={formData.infectionControl.negativePressureRooms}
                                    onChange={(val) => updateNestedField('infectionControl.negativePressureRooms', val)}
                                    max={1000}
                                />
                                <CheckboxField
                                    label="Infectious Disease Unit"
                                    checked={formData.infectionControl.infectiousDiseaseUnit}
                                    onChange={(val) => updateNestedField('infectionControl.infectiousDiseaseUnit', val)}
                                />
                            </div>
                        </Section>

                        {/* Section 10: Support Facilities */}
                        <Section title="🚁 Support Facilities">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <CheckboxField
                                    label="Helipad Available"
                                    checked={formData.supportFacilities.helipadAvailable}
                                    onChange={(val) => updateNestedField('supportFacilities.helipadAvailable', val)}
                                />
                                <CheckboxField
                                    label="24/7 Pharmacy"
                                    checked={formData.supportFacilities.pharmacy24x7}
                                    onChange={(val) => updateNestedField('supportFacilities.pharmacy24x7', val)}
                                />
                            </div>
                        </Section>

                        {/* Section 11: Transfer Capability */}
                        <Section title="🔄 Transfer Capability">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CheckboxField
                                    label="Accepts Referrals"
                                    checked={formData.transferCapability.acceptsReferrals}
                                    onChange={(val) => updateNestedField('transferCapability.acceptsReferrals', val)}
                                />
                                <NumberField
                                    label="Max Transfer Capacity (per hour)"
                                    value={formData.transferCapability.maxTransferCapacityPerHour}
                                    onChange={(val) => updateNestedField('transferCapability.maxTransferCapacityPerHour', val)}
                                    max={50}
                                />
                            </div>
                        </Section>

                        {/* Section 12: Performance Metrics */}
                        <Section title="📊 Performance Metrics">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <NumberField
                                    label="Avg Handover Time (min)"
                                    value={formData.performanceMetrics.averageAmbulanceHandoverTime}
                                    onChange={(val) => updateNestedField('performanceMetrics.averageAmbulanceHandoverTime', val)}
                                    max={300}
                                />
                                <NumberField
                                    label="Emergency Response Rating (1-5)"
                                    value={formData.performanceMetrics.emergencyResponseRating}
                                    onChange={(val) => updateNestedField('performanceMetrics.emergencyResponseRating', val)}
                                    min={1}
                                    max={5}
                                />
                                <NumberField
                                    label="Survival Rate Index (%)"
                                    value={formData.performanceMetrics.survivalRateIndex}
                                    onChange={(val) => updateNestedField('performanceMetrics.survivalRateIndex', val)}
                                    max={100}
                                />
                            </div>
                        </Section>

                        {/* Section 13: Extended Profile */}
                        <Section title="📋 Extended Profile (Optional)">
                            <p className="text-gray-500 text-sm mb-4">
                                Add accreditations, emergency coordinators, and compliance information.
                            </p>
                            <HospitalExtendedProfileForm
                                hospital={editingId ? { id: editingId, ...formData } : null}
                                embedded={true}
                                profile={formData.extendedProfile}
                                onProfileChange={(updatedProfile) => updateNestedField('extendedProfile', updatedProfile)}
                            />
                        </Section>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                className="btn btn-primary flex items-center gap-2"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4" />
                                {loading ? H.saving : (editingId ? H.updateHospital : H.addHospital)}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingId(null);
                                    setFormData(getEmptyFormData());
                                }}
                                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                            >
                                {H.cancel}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Hospital List */}
            <div className="space-y-4">
                {displayHospitals.map((hospital) => (
                    <div key={hospital.id} className="card shadow-md border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900">{hospital.basicInfo?.name || 'Unnamed Hospital'}</h3>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-sm text-gray-600">
                                            {hospital.basicInfo?.hospitalType?.replace('_', ' ')}
                                        </span>
                                        {hospital.basicInfo?.traumaLevel !== 'none' && (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                                {hospital.basicInfo?.traumaLevel?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 text-xs font-semibold rounded border ${getStatusBadgeColor(hospital.emergencyReadiness?.status)}`}>
                                            {hospital.emergencyReadiness?.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(hospital)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(hospital.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <StatCard label="Total Beds" value={hospital.bedAvailability?.available || 0} total={hospital.bedAvailability?.total || 0} />
                                <StatCard label="ICU Beds" value={hospital.bedAvailability?.icu?.available || 0} total={hospital.bedAvailability?.icu?.total || 0} />
                                <StatCard label="Ventilators" value={hospital.equipment?.ventilators?.available || 0} total={hospital.equipment?.ventilators?.total || 0} />
                                <StatCard label="Ambulance Queue" value={hospital.emergencyReadiness?.ambulanceQueue || 0} />
                            </div>

                            {/* Collapsible Sections */}
                            <div className="space-y-2">
                                <CollapsibleSection
                                    title="Clinical Capabilities"
                                    isOpen={expandedSections[`${hospital.id}-clinical`]}
                                    onToggle={() => toggleSection(hospital.id, 'clinical')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <Badge label="Stroke Center" value={hospital.clinicalCapabilities?.strokeCenter} />
                                        <Badge label="Emergency Surgery" value={hospital.clinicalCapabilities?.emergencySurgery} />
                                        <Badge label="CT Scan" value={hospital.clinicalCapabilities?.ctScanAvailable} />
                                        <Badge label="MRI" value={hospital.clinicalCapabilities?.mriAvailable} />
                                        <Badge label="24/7 Radiology" value={hospital.clinicalCapabilities?.radiology24x7} />
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection
                                    title="Case Acceptance"
                                    isOpen={expandedSections[`${hospital.id}-acceptance`]}
                                    onToggle={() => toggleSection(hospital.id, 'acceptance')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <Badge label="Trauma" value={hospital.caseAcceptance?.acceptsTrauma} />
                                        <Badge label="Cardiac" value={hospital.caseAcceptance?.acceptsCardiac} />
                                        <Badge label="Burns" value={hospital.caseAcceptance?.acceptsBurns} />
                                        <Badge label="Pediatric" value={hospital.caseAcceptance?.acceptsPediatric} />
                                        <Badge label="Infectious" value={hospital.caseAcceptance?.acceptsInfectious} />
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection
                                    title="Specialists"
                                    isOpen={expandedSections[`${hospital.id}-specialists`]}
                                    onToggle={() => toggleSection(hospital.id, 'specialists')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <CountBadge label="Cardiologists" value={hospital.specialists?.cardiologist} />
                                        <CountBadge label="Neurologists" value={hospital.specialists?.neurologist} />
                                        <CountBadge label="Trauma Surgeons" value={hospital.specialists?.traumaSurgeon} />
                                        <CountBadge label="Radiologists" value={hospital.specialists?.radiologist} />
                                        <CountBadge label="Pulmonologists" value={hospital.specialists?.pulmonologist} />
                                        <CountBadge label="Burn Specialists" value={hospital.specialists?.burnSpecialist} />
                                    </div>
                                </CollapsibleSection>

                                {/* Extended Profile Section */}
                                <CollapsibleSection
                                    title="📋 Extended Profile"
                                    isOpen={expandedSections[`${hospital.id}-extended`]}
                                    onToggle={() => toggleSection(hospital.id, 'extended')}
                                >
                                    <HospitalProfileView
                                        hospital={hospital}
                                        onEdit={() => {
                                            setEditingId(hospital.id);
                                            setExpandedSections(prev => ({
                                                ...prev,
                                                [`${hospital.id}-extended-edit`]: true
                                            }));
                                        }}
                                    />
                                </CollapsibleSection>

                                {/* Extended Profile Edit Modal */}
                                {expandedSections[`${hospital.id}-extended-edit`] && (
                                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                                        <div className="max-h-[90vh] overflow-y-auto">
                                            <HospitalExtendedProfileForm
                                                hospital={hospital}
                                                onClose={() => setExpandedSections(prev => ({
                                                    ...prev,
                                                    [`${hospital.id}-extended-edit`]: false
                                                }))}
                                                onUpdate={() => {
                                                    setExpandedSections(prev => ({
                                                        ...prev,
                                                        [`${hospital.id}-extended-edit`]: false
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Reusable Components
function Section({ title, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 flex items-center justify-between text-left font-semibold text-gray-900"
            >
                <span>{title}</span>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
}

function CollapsibleSection({ title, children, isOpen, onToggle }) {
    return (
        <div className="border border-gray-200 rounded">
            <button
                onClick={onToggle}
                className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left text-sm font-medium text-gray-700"
            >
                {title}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
}

function CheckboxField({ label, checked, onChange, disabled = false }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

function NumberField({ label, value, onChange, min = 0, max = 10000 }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="number"
                className="input"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                min={min}
                max={max}
            />
        </div>
    );
}

function BedCapacityField({ label, total, available, onTotalChange, onAvailableChange }) {
    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">{label}</h4>
            <div className="grid grid-cols-2 gap-2">
                <NumberField label="Total" value={total} onChange={onTotalChange} max={10000} />
                <NumberField label="Available" value={available} onChange={onAvailableChange} max={10000} />
            </div>
        </div>
    );
}

function StatCard({ label, value, total }) {
    const percentage = total ? Math.round((value / total) * 100) : 0;

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">
                {value}{total && <span className="text-sm text-gray-500">/{total}</span>}
            </div>
            {total && (
                <div className="text-xs text-gray-500 mt-1">{percentage}% available</div>
            )}
        </div>
    );
}

function Badge({ label, value }) {
    return (
        <div className={`px-3 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            {label}
        </div>
    );
}

/**
 * Hardened CountBadge - safely displays specialist counts
 * Handles: number, object {total, available}, string, undefined, null
 */
function CountBadge({ label, value }) {
    // Safe value extraction - handle any input type
    let displayValue = 0;

    if (typeof value === 'number' && !isNaN(value)) {
        displayValue = value;
    } else if (typeof value === 'object' && value !== null) {
        // Handle {available, count, total} structures
        displayValue = value.available ?? value.count ?? value.total ?? 0;
        if (typeof displayValue !== 'number' || isNaN(displayValue)) {
            displayValue = 0;
        }
    } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        displayValue = isNaN(parsed) ? 0 : parsed;
    }

    return (
        <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded text-xs font-medium">
            {label}: {displayValue}
        </div>
    );
}
