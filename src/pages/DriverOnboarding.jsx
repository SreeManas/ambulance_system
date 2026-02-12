// src/pages/DriverOnboarding.jsx
/**
 * Ambulance Driver Self-Onboarding & Vehicle Registration
 * Multi-step form: Driver Details → Ambulance Details → License Upload → GPS Location
 * Includes: duplicate vehicle check, GPS fallback, license preview, admin verification flag
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { getFirestore, doc, setDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Step definitions
const STEPS = [
    { id: 1, title: 'Driver Details', icon: '👤', desc: 'Personal information' },
    { id: 2, title: 'Ambulance Details', icon: '🚑', desc: 'Vehicle & equipment' },
    { id: 3, title: 'License Upload', icon: '📄', desc: 'Driving license' },
    { id: 4, title: 'GPS Location', icon: '📍', desc: 'Current position' },
];

const EQUIPMENT_ITEMS = [
    { key: 'oxygen', label: 'Oxygen Cylinder', icon: '🫁' },
    { key: 'ventilator', label: 'Ventilator', icon: '💨' },
    { key: 'defibrillator', label: 'Defibrillator (AED)', icon: '⚡' },
];

export default function DriverOnboarding() {
    const { currentUser, userDoc } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [completed, setCompleted] = useState(false);
    const [registeredAmbulanceId, setRegisteredAmbulanceId] = useState(null);

    // Already onboarded?
    const alreadyOnboarded = userDoc?.onboardingCompleted && userDoc?.ambulanceId;

    // Form state
    const [form, setForm] = useState({
        // Driver details
        fullName: currentUser?.displayName || '',
        phone: '',
        email: currentUser?.email || '',
        aadhaar: '',
        yearsExperience: '',
        // Ambulance details
        vehicleNumber: '',
        ambulanceType: 'BLS',
        equipment: { oxygen: false, ventilator: false, defibrillator: false },
        baseHospital: '',
        // License
        licenseFile: null,
        licensePreview: null,
        // GPS
        lat: '',
        lng: '',
    });

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const updateEquipment = (key) => setForm(prev => ({
        ...prev,
        equipment: { ...prev.equipment, [key]: !prev.equipment[key] }
    }));

    // =========================================================
    // STEP 1: Driver Details
    // =========================================================
    const renderDriverDetails = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Full Name <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        value={form.fullName}
                        onChange={e => updateField('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Phone Number <span className="text-red-400">*</span></label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
                {/* Email (auto-filled) */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Email</label>
                    <input
                        type="email"
                        value={form.email}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/30 border border-gray-700 text-gray-400 cursor-not-allowed"
                    />
                </div>
                {/* Aadhaar */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Aadhaar / ID <span className="text-gray-500 text-xs">(Optional)</span></label>
                    <input
                        type="text"
                        value={form.aadhaar}
                        onChange={e => updateField('aadhaar', e.target.value)}
                        placeholder="XXXX XXXX XXXX"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
                {/* Years Experience */}
                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300">Years of Experience <span className="text-red-400">*</span></label>
                    <input
                        type="number"
                        value={form.yearsExperience}
                        onChange={e => updateField('yearsExperience', e.target.value)}
                        placeholder="e.g. 5"
                        min="0"
                        max="50"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
            </div>
        </div>
    );

    // =========================================================
    // STEP 2: Ambulance Details
    // =========================================================
    const renderAmbulanceDetails = () => (
        <div className="space-y-6">
            {/* Vehicle Number */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">Vehicle Number <span className="text-red-400">*</span></label>
                <input
                    type="text"
                    value={form.vehicleNumber}
                    onChange={e => updateField('vehicleNumber', e.target.value.toUpperCase())}
                    placeholder="KA-01-EMS-3001"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-lg tracking-wider"
                />
                <p className="text-xs text-gray-500">Format: KA-XX-EMS-XXXX</p>
            </div>

            {/* Ambulance Type */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300">Ambulance Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { value: 'BLS', label: 'BLS', desc: 'Basic Life Support', icon: '🏥' },
                        { value: 'ALS', label: 'ALS', desc: 'Advanced Life Support', icon: '🏨' },
                    ].map(t => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => updateField('ambulanceType', t.value)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${form.ambulanceType === t.value
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                : 'border-gray-600 bg-gray-800/40 hover:border-gray-500'
                                }`}
                        >
                            <div className="text-2xl mb-1">{t.icon}</div>
                            <div className="text-white font-bold text-lg">{t.label}</div>
                            <div className="text-gray-400 text-xs">{t.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Equipment Checklist */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300">Equipment Available</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {EQUIPMENT_ITEMS.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => updateEquipment(item.key)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${form.equipment[item.key]
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                                : 'border-gray-600 bg-gray-800/40 text-gray-400 hover:border-gray-500'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {form.equipment[item.key] && <span className="ml-auto text-emerald-400">✓</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Base Hospital */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">Base Hospital <span className="text-gray-500 text-xs">(Optional)</span></label>
                <input
                    type="text"
                    value={form.baseHospital}
                    onChange={e => updateField('baseHospital', e.target.value)}
                    placeholder="Name of your base hospital"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
            </div>
        </div>
    );

    // =========================================================
    // STEP 3: License Upload
    // =========================================================
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setSubmitError('Only JPG, PNG, or PDF files allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSubmitError('File must be under 5 MB.');
            return;
        }
        setSubmitError('');

        // Preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                updateField('licensePreview', ev.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            updateField('licensePreview', 'pdf');
        }
        updateField('licenseFile', file);
    };

    const renderLicenseUpload = () => (
        <div className="space-y-6">
            <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">Upload your valid Driving License. Accepted formats: JPG, PNG, PDF (max 5 MB)</p>
            </div>

            {/* Upload Area */}
            <label className={`block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${form.licenseFile
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-gray-600 bg-gray-800/30 hover:border-gray-400 hover:bg-gray-800/50'
                }`}>
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
                {!form.licenseFile ? (
                    <div>
                        <div className="text-5xl mb-3">📤</div>
                        <p className="text-white font-semibold text-lg">Click to upload</p>
                        <p className="text-gray-500 text-sm mt-1">or drag and drop your license file here</p>
                    </div>
                ) : (
                    <div>
                        <div className="text-4xl mb-2">✅</div>
                        <p className="text-emerald-400 font-semibold">{form.licenseFile.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{(form.licenseFile.size / 1024).toFixed(1)} KB • Click to replace</p>
                    </div>
                )}
            </label>

            {/* Micro-fix #3: License Preview */}
            {form.licensePreview && (
                <div className="rounded-xl border border-gray-600 bg-gray-800/30 p-4">
                    <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Preview</p>
                    {form.licensePreview === 'pdf' ? (
                        <div className="flex items-center gap-3 py-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
                                <span className="text-3xl">📑</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">{form.licenseFile?.name}</p>
                                <p className="text-gray-500 text-xs">PDF Document</p>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={form.licensePreview}
                            alt="License Preview"
                            className="max-h-64 mx-auto rounded-lg border border-gray-600 shadow-xl"
                        />
                    )}
                </div>
            )}

            {!form.licenseFile && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="text-amber-400 font-semibold text-sm">License upload is mandatory</p>
                        <p className="text-amber-400/70 text-xs mt-1">You cannot complete registration without uploading your driving license.</p>
                    </div>
                </div>
            )}
        </div>
    );

    // =========================================================
    // STEP 4: GPS Location
    // =========================================================
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');

    const captureGPS = useCallback(() => {
        setGpsLoading(true);
        setGpsError('');
        if (!navigator.geolocation) {
            setGpsError('Geolocation not supported by browser.');
            setGpsLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updateField('lat', latitude.toFixed(6));
                updateField('lng', longitude.toFixed(6));
                setGpsLoading(false);
            },
            (err) => {
                setGpsError(`GPS failed: ${err.message}. Use manual entry or drag the pin.`);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }, []);

    // Init / update map
    useEffect(() => {
        if (step !== 4 || !mapContainerRef.current) return;

        const lat = parseFloat(form.lat) || 12.9716;
        const lng = parseFloat(form.lng) || 77.5946;

        if (!mapInstanceRef.current) {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [lng, lat],
                zoom: 13,
            });
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Draggable marker (Micro-fix #2: fallback)
            const marker = new mapboxgl.Marker({ color: '#10b981', draggable: true })
                .setLngLat([lng, lat])
                .addTo(map);

            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                updateField('lat', lngLat.lat.toFixed(6));
                updateField('lng', lngLat.lng.toFixed(6));
            });

            // Click to set location
            map.on('click', (e) => {
                marker.setLngLat(e.lngLat);
                updateField('lat', e.lngLat.lat.toFixed(6));
                updateField('lng', e.lngLat.lng.toFixed(6));
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        } else {
            mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 14 });
            markerRef.current?.setLngLat([lng, lat]);
        }

        return () => { };
    }, [step, form.lat, form.lng]);

    // Cleanup map on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const renderGPSLocation = () => (
        <div className="space-y-6">
            {/* GPS Capture Button */}
            <button
                type="button"
                onClick={captureGPS}
                disabled={gpsLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all disabled:opacity-50"
            >
                {gpsLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Capturing Location...</span>
                    </>
                ) : (
                    <>
                        <span className="text-xl">📍</span>
                        <span>Use My Current Location</span>
                    </>
                )}
            </button>

            {gpsError && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-amber-400 text-sm">{gpsError}</p>
                </div>
            )}

            {/* Micro-fix #2: Manual lat/lng fallback */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Latitude <span className="text-red-400">*</span></label>
                    <input
                        type="number"
                        step="any"
                        value={form.lat}
                        onChange={e => updateField('lat', e.target.value)}
                        placeholder="12.9716"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Longitude <span className="text-red-400">*</span></label>
                    <input
                        type="number"
                        step="any"
                        value={form.lng}
                        onChange={e => updateField('lng', e.target.value)}
                        placeholder="77.5946"
                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    />
                </div>
            </div>

            <p className="text-xs text-gray-500 text-center">You can also click on the map or drag the pin to set your location manually.</p>

            {/* Map Preview */}
            <div
                ref={mapContainerRef}
                className="w-full h-64 rounded-xl border border-gray-600 overflow-hidden shadow-inner"
                style={{ minHeight: '250px' }}
            />

            {form.lat && form.lng && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                    <span className="text-blue-300 text-sm font-medium">📍 Location set: {form.lat}, {form.lng}</span>
                </div>
            )}
        </div>
    );

    // =========================================================
    // VALIDATION
    // =========================================================
    const validateStep = (s) => {
        switch (s) {
            case 1: return form.fullName.trim() && form.phone.trim() && form.yearsExperience;
            case 2: return form.vehicleNumber.trim() && form.ambulanceType;
            case 3: return !!form.licenseFile;
            case 4: return form.lat && form.lng;
            default: return false;
        }
    };

    // =========================================================
    // SUBMIT — Correct sequence to avoid permission errors
    // =========================================================
    const handleSubmit = async () => {
        // Final validation
        for (let s = 1; s <= 4; s++) {
            if (!validateStep(s)) {
                setStep(s);
                setSubmitError(`Please complete Step ${s} before submitting.`);
                return;
            }
        }

        setSubmitting(true);
        setSubmitError('');

        const uid = currentUser.uid;
        console.log('[Onboarding] ══════════════════════════════════');
        console.log('[Onboarding] Starting registration for UID:', uid);

        try {
            const db = getFirestore();

            // ── STEP 1: Ensure user document exists with correct role ──
            // This MUST happen before any other Firestore/Storage operation
            // because security rules check users/{uid}.role == 'ambulance_driver'
            console.log('[Onboarding] Step 1/4: Creating user doc with role ambulance_driver...');
            await setDoc(doc(db, 'users', uid), {
                role: 'ambulance_driver',
                email: currentUser.email || null,
                displayName: form.fullName.trim(),
                onboardingCompleted: false,
                createdAt: serverTimestamp(),
            }, { merge: true });
            console.log('[Onboarding] Step 1/4 ✅ User doc created/merged');

            // Brief pause to ensure Firestore rules can read the updated doc
            await new Promise(resolve => setTimeout(resolve, 800));

            // ── Duplicate vehicle number check ──
            // Wrapped in try/catch because drivers can only read their own docs
            try {
                console.log('[Onboarding] Checking duplicate vehicle:', form.vehicleNumber.trim());
                const vehicleQuery = query(
                    collection(db, 'ambulances'),
                    where('vehicleNumber', '==', form.vehicleNumber.trim()),
                    where('driverId', '==', uid)
                );
                const vehicleSnap = await getDocs(vehicleQuery);
                if (!vehicleSnap.empty) {
                    setSubmitError(`Vehicle number ${form.vehicleNumber} is already registered under your account.`);
                    setStep(2);
                    setSubmitting(false);
                    return;
                }
                console.log('[Onboarding] No duplicate found for this driver');
            } catch (dupErr) {
                // If query fails due to permissions, skip duplicate check
                console.warn('[Onboarding] Duplicate check skipped (permission):', dupErr.code);
            }

            // ── STEP 2: Upload license to Firebase Storage ──
            let licenseUrl = '';
            try {
                const storage = getStorage();
                const ext = form.licenseFile.name.split('.').pop();
                const storagePath = `driverLicenses/${uid}/license.${ext}`;
                console.log('[Onboarding] Step 2/4: Uploading license to:', storagePath);
                console.log('[Onboarding] File size:', form.licenseFile.size, 'bytes, type:', form.licenseFile.type);
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, form.licenseFile);
                licenseUrl = await getDownloadURL(storageRef);
                console.log('[Onboarding] Step 2/4 ✅ License uploaded, URL obtained');
            } catch (storageErr) {
                console.error('[Onboarding] ❌ Storage upload failed:', storageErr);
                if (storageErr.code === 'storage/unauthorized') {
                    throw new Error('License upload denied: Storage permissions error. Ensure file is under 5MB and is JPG/PNG/PDF.');
                }
                throw new Error(`License upload failed: ${storageErr.message}`);
            }

            // ── STEP 3: Create ambulance document ──
            const ambulanceData = {
                vehicleNumber: form.vehicleNumber.trim(),
                type: form.ambulanceType,
                driverId: uid,
                driverName: form.fullName.trim(),
                driverPhone: form.phone.trim(),
                driverEmail: form.email,
                licenseUrl,
                equipment: form.equipment,
                baseHospital: form.baseHospital.trim() || null,
                location: {
                    lat: parseFloat(form.lat),
                    lng: parseFloat(form.lng),
                },
                status: 'available',
                source: 'driver_registered',
                verificationStatus: 'pending',
                createdAt: serverTimestamp(),
            };
            console.log('[Onboarding] Step 3/4: Creating ambulance doc. driverId:', uid);
            console.log('[Onboarding] Payload:', JSON.stringify({ ...ambulanceData, createdAt: '(serverTimestamp)' }));

            let docRef;
            try {
                docRef = await addDoc(collection(db, 'ambulances'), ambulanceData);
                console.log('[Onboarding] Step 3/4 ✅ Ambulance created:', docRef.id);
            } catch (ambErr) {
                console.error('[Onboarding] ❌ Ambulance creation failed:', ambErr);
                if (ambErr.code === 'permission-denied') {
                    throw new Error('Ambulance creation denied: Your user role is not set correctly. Try logging out and back in, then retry.');
                }
                throw new Error(`Ambulance creation failed: ${ambErr.message}`);
            }

            // ── STEP 4: Link user ↔ ambulance ──
            console.log('[Onboarding] Step 4/4: Linking ambulance', docRef.id, 'to user', uid);
            try {
                await setDoc(doc(db, 'users', uid), {
                    ambulanceId: docRef.id,
                    onboardingCompleted: true,
                    driverName: form.fullName.trim(),
                    driverPhone: form.phone.trim(),
                }, { merge: true });
                console.log('[Onboarding] Step 4/4 ✅ User linked to ambulance');
            } catch (linkErr) {
                console.error('[Onboarding] ❌ User-ambulance linking failed:', linkErr);
                throw new Error(`Failed to link ambulance to your profile: ${linkErr.message}`);
            }

            console.log('[Onboarding] ══════════════════════════════════');
            console.log('[Onboarding] 🎉 REGISTRATION COMPLETE');
            setRegisteredAmbulanceId(docRef.id);
            setCompleted(true);
        } catch (error) {
            console.error('[Onboarding] ❌ SUBMISSION ERROR:', error);
            setSubmitError(error.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // ALREADY ONBOARDED VIEW
    // =========================================================
    if (alreadyOnboarded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-gray-800/80 backdrop-blur-lg rounded-3xl border border-gray-700 p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Onboarding Complete</h2>
                    <p className="text-gray-400 mb-6">Your ambulance is registered and active in the MEDROUTER fleet.</p>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Ambulance ID</span>
                                <p className="text-emerald-400 font-mono font-bold">{userDoc.ambulanceId?.slice(0, 12)}...</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Status</span>
                                <p className="text-emerald-400 font-bold">Awaiting Dispatch</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-blue-300 text-sm">🚑 Your ambulance is now visible in the Command Center fleet and eligible for dispatch.</p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // SUCCESS SCREEN (Phase 8)
    // =========================================================
    if (completed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-gray-800/80 backdrop-blur-lg rounded-3xl border border-emerald-500/30 p-8 text-center shadow-2xl animate-fadeIn">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                        <span className="text-5xl">🎉</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Registration Complete!</h2>
                    <p className="text-gray-400 mb-8">Your ambulance has been successfully added to the MEDROUTER fleet.</p>

                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 mb-6 text-left space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Ambulance ID</span>
                            <span className="text-emerald-400 font-mono font-bold text-sm">{registeredAmbulanceId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Vehicle</span>
                            <span className="text-white font-bold">{form.vehicleNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Type</span>
                            <span className="text-white">{form.ambulanceType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Status</span>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">AVAILABLE</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Verification</span>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">PENDING</span>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                        <p className="text-blue-300 text-sm">🚑 Your ambulance now appears in the Command Center and can receive dispatch assignments.</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <p className="text-amber-300 text-sm">⏳ Verification is pending. An admin will review your license shortly.</p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // MAIN FORM
    // =========================================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img src="/logo.png" alt="MEDROUTER" className="w-10 h-10 object-contain" />
                        <h1 className="text-3xl font-bold text-white">Driver Onboarding</h1>
                    </div>
                    <p className="text-gray-400">Register your ambulance to join the MEDROUTER fleet</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8 px-2">
                    {STEPS.map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <button
                                onClick={() => {
                                    // Prevent jumping ahead past incomplete steps
                                    if (s.id <= step || validateStep(step)) setStep(s.id);
                                }}
                                className={`flex flex-col items-center gap-1 transition-all ${s.id === step
                                    ? 'scale-110'
                                    : s.id < step || (s.id <= step && validateStep(s.id))
                                        ? 'opacity-80'
                                        : 'opacity-40'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${s.id === step
                                    ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                                    : s.id < step
                                        ? 'border-emerald-500 bg-emerald-500/50'
                                        : 'border-gray-600 bg-gray-800'
                                    }`}>
                                    {s.id < step ? '✓' : s.icon}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${s.id === step ? 'text-emerald-400' : 'text-gray-500'
                                    }`}>{s.title}</span>
                            </button>
                            {idx < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${s.id < step ? 'bg-emerald-500' : 'bg-gray-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-3xl border border-gray-700 p-6 md:p-8 shadow-2xl">
                    {/* Step Title */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="text-2xl">{STEPS[step - 1].icon}</span>
                            {STEPS[step - 1].title}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">{STEPS[step - 1].desc}</p>
                    </div>

                    {/* Error */}
                    {submitError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <span className="text-xl">❌</span>
                            <p className="text-red-400 text-sm">{submitError}</p>
                        </div>
                    )}

                    {/* Step Content */}
                    {step === 1 && renderDriverDetails()}
                    {step === 2 && renderAmbulanceDetails()}
                    {step === 3 && renderLicenseUpload()}
                    {step === 4 && renderGPSLocation()}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={() => { setSubmitError(''); setStep(Math.max(1, step - 1)); }}
                            disabled={step === 1}
                            className="px-6 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (validateStep(step)) {
                                        setSubmitError('');
                                        setStep(step + 1);
                                    } else {
                                        setSubmitError('Please fill in all required fields before proceeding.');
                                    }
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !validateStep(4)}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Registering...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚑</span>
                                        <span>Complete Registration</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Info */}
                <div className="text-center mt-6">
                    <p className="text-gray-600 text-xs">Step {step} of {STEPS.length} • MEDROUTER Driver Registration</p>
                </div>
            </div>
        </div>
    );
}
