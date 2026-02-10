import React, { useEffect, useState } from 'react';
import offlineSync from '../utils/offlineSync.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useT } from '../hooks/useT.js';
import CameraCapture from './CameraCapture.jsx';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

// Translation keys
const TRANSLATIONS = {
    patientIntake: 'Patient Intake Form',
    patientIdentification: 'Patient Identification',
    patientName: 'Patient Name (Optional)',
    age: 'Age',
    gender: 'Gender',
    pregnancyStatus: 'Pregnancy Status',
    primaryVitals: 'Primary Vitals',
    bloodPressure: 'Blood Pressure',
    heartRate: 'Heart Rate (bpm)',
    spo2: 'Oxygen Saturation (SpO2 %)',
    temperature: 'Body Temperature',
    respiratoryRate: 'Respiratory Rate (breaths/min)',
    neurologicalStatus: 'Neurological Status',
    consciousnessLevel: 'Consciousness Level',
    headInjurySuspected: 'Head Injury Suspected',
    seizureActivity: 'Seizure Activity',
    respiratoryCardiac: 'Respiratory & Cardiac',
    breathingStatus: 'Breathing Status',
    chestPainPresent: 'Chest Pain Present',
    cardiacHistoryKnown: 'Known Cardiac History',
    traumaAssessment: 'Trauma Assessment',
    injuryType: 'Injury Type',
    bleedingSeverity: 'Bleeding Severity',
    burnsPercentage: 'Burns Coverage (%)',
    emergencyContext: 'Emergency Context',
    emergencyType: 'Emergency Type',
    incidentTimestamp: 'Incident Time',
    environmentalRisks: 'Environmental Risk Factors',
    preHospitalCare: 'Pre-Hospital Care',
    oxygenAdministered: 'Oxygen Administered',
    cprPerformed: 'CPR Performed',
    ivFluidsStarted: 'IV Fluids Started',
    transportSupport: 'Transport & Support Requirements',
    transportPriority: 'Transport Priority',
    ventilatorRequired: 'Ventilator Support Required',
    oxygenRequired: 'Oxygen Support Required',
    defibrillatorRequired: 'Defibrillator Required',
    spinalImmobilization: 'Spinal Immobilization Required',
    infectionRisk: 'Infection Risk Assessment',
    suspectedInfectious: 'Suspected Infectious Disease',
    isolationRequired: 'Isolation Required',
    paramedicNotes: 'Paramedic Notes',
    notesPlaceholder: 'Clinical observations, patient history, medications, allergies...',
    submitCase: 'Submit Patient Case',
    fetchingLocation: 'Fetching location...',
    locationDetected: 'Location detected! Submitting case...',
    caseSubmitted: 'Case submitted successfully!',
    offlineQueued: 'Offline: case queued, will sync automatically when online.',
};

export default function PatientVitalsForm() {
    // Section 1: Patient Identification
    const [patientName, setPatientName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('male');
    const [pregnancyStatus, setPregnancyStatus] = useState('unknown');

    // Section 2: Primary Vitals
    const [bloodPressure, setBloodPressure] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [spo2, setSpo2] = useState('');
    const [temperature, setTemperature] = useState('');
    const [temperatureUnit, setTemperatureUnit] = useState('celsius');
    const [respiratoryRate, setRespiratoryRate] = useState('');

    // Section 3: Neurological Status
    const [consciousnessLevel, setConsciousnessLevel] = useState('alert');
    const [headInjurySuspected, setHeadInjurySuspected] = useState(false);
    const [seizureActivity, setSeizureActivity] = useState(false);

    // Section 4: Respiratory & Cardiac
    const [breathingStatus, setBreathingStatus] = useState('normal');
    const [chestPainPresent, setChestPainPresent] = useState(false);
    const [cardiacHistoryKnown, setCardiacHistoryKnown] = useState(false);

    // Section 5: Trauma Assessment
    const [injuryType, setInjuryType] = useState('none');
    const [bleedingSeverity, setBleedingSeverity] = useState('none');
    const [burnsPercentage, setBurnsPercentage] = useState(0);

    // Section 6: Emergency Context
    const [emergencyType, setEmergencyType] = useState('medical');
    const [incidentTimestamp, setIncidentTimestamp] = useState('');
    const [environmentalRisks, setEnvironmentalRisks] = useState('');

    // Section 7: Pre-Hospital Care
    const [oxygenAdministered, setOxygenAdministered] = useState(false);
    const [cprPerformed, setCprPerformed] = useState(false);
    const [ivFluidsStarted, setIvFluidsStarted] = useState(false);

    // Section 8: Transport & Support Requirements
    const [transportPriority, setTransportPriority] = useState('urgent');
    const [ventilatorRequired, setVentilatorRequired] = useState(false);
    const [oxygenRequired, setOxygenRequired] = useState(false);
    const [defibrillatorRequired, setDefibrillatorRequired] = useState(false);
    const [spinalImmobilization, setSpinalImmobilization] = useState(false);

    // Section 9: Infection Risk
    const [suspectedInfectious, setSuspectedInfectious] = useState(false);
    const [isolationRequired, setIsolationRequired] = useState(false);

    // Section 10: Paramedic Notes
    const [paramedicNotes, setParamedicNotes] = useState('');

    // Form state
    const [coords, setCoords] = useState({ latitude: null, longitude: null });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Sprint-2: Incident Photo Capture State
    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhotos, setCapturedPhotos] = useState([]); // Array of { blob, preview, file }
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

    // Translation hooks
    const tPatientIntake = useT(TRANSLATIONS.patientIntake);
    const tSubmitCase = useT(TRANSLATIONS.submitCase);
    const tFetchingLocation = useT(TRANSLATIONS.fetchingLocation);
    const tLocationDetected = useT(TRANSLATIONS.locationDetected);
    const tCaseSubmitted = useT(TRANSLATIONS.caseSubmitted);
    const tOfflineQueued = useT(TRANSLATIONS.offlineQueued);

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000
                }
            );
        });
    };

    // Sprint-2: Photo capture handlers
    const handlePhotoCaptured = (photoData) => {
        // photoData can be a File, Blob, or object with file property
        const file = photoData?.file || photoData;
        if (file && (file instanceof Blob || file instanceof File)) {
            const preview = URL.createObjectURL(file);
            setCapturedPhotos(prev => [...prev, {
                file,
                preview,
                timestamp: Date.now()
            }]);
        }
        setShowCamera(false);
    };

    const removePhoto = (index) => {
        setCapturedPhotos(prev => {
            const newPhotos = [...prev];
            // Revoke the object URL to prevent memory leaks
            if (newPhotos[index]?.preview) {
                URL.revokeObjectURL(newPhotos[index].preview);
            }
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    // MF4: File validation constants
    const MAX_PHOTO_SIZE_MB = 10;
    const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

    const validatePhoto = (photo) => {
        if (!photo?.file) return { valid: false, error: 'No file data' };
        const sizeMB = (photo.file.size || photo.file.byteLength || 0) / (1024 * 1024);
        if (sizeMB > MAX_PHOTO_SIZE_MB) {
            return { valid: false, error: `File too large (${sizeMB.toFixed(1)}MB, max ${MAX_PHOTO_SIZE_MB}MB)` };
        }
        // Blob from camera may not have type — allow it
        if (photo.file.type && !ALLOWED_PHOTO_TYPES.includes(photo.file.type)) {
            return { valid: false, error: `Unsupported type: ${photo.file.type}` };
        }
        return { valid: true };
    };

    const uploadPhotosToStorage = async (caseId) => {
        if (capturedPhotos.length === 0) return [];

        setUploadingPhotos(true);
        const storage = getStorage();
        const uploadedUrls = [];

        try {
            for (const photo of capturedPhotos) {
                // MF4: Validate before upload
                const validation = validatePhoto(photo);
                if (!validation.valid) {
                    console.warn('Skipping invalid photo:', validation.error);
                    continue;
                }

                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                const storagePath = `incidentPhotos/${caseId}/${fileName}`;
                const storageRef = ref(storage, storagePath);

                await uploadBytes(storageRef, photo.file);
                const downloadUrl = await getDownloadURL(storageRef);
                uploadedUrls.push(downloadUrl);
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            // MF4: Storage failure should NOT block case submission
            // Photos that uploaded successfully are still included
        } finally {
            setUploadingPhotos(false);
        }

        return uploadedUrls;
    };

    const validateForm = () => {
        const errors = {};

        // Required fields
        if (!age || isNaN(age) || age < 0 || age > 120) {
            errors.age = 'Age must be between 0 and 120';
        }

        if (!heartRate || isNaN(heartRate) || heartRate < 0 || heartRate > 300) {
            errors.heartRate = 'Heart rate must be between 0 and 300 bpm';
        }

        if (!spo2 || isNaN(spo2) || spo2 < 0 || spo2 > 100) {
            errors.spo2 = 'SpO2 must be between 0 and 100%';
        }

        // Optional field validations
        if (respiratoryRate && (isNaN(respiratoryRate) || respiratoryRate < 0 || respiratoryRate > 60)) {
            errors.respiratoryRate = 'Respiratory rate must be between 0 and 60';
        }

        if (temperature) {
            if (temperatureUnit === 'celsius' && (temperature < -10 || temperature > 50)) {
                errors.temperature = 'Temperature must be between -10°C and 50°C';
            } else if (temperatureUnit === 'fahrenheit' && (temperature < 14 || temperature > 122)) {
                errors.temperature = 'Temperature must be between 14°F and 122°F';
            }
        }

        if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
            errors.bloodPressure = 'Blood pressure must be in format: 120/80';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitOnline = async (locationCoords) => {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error('You must be logged in to submit a patient case.');
        }

        // Parse incident timestamp or use current time
        const incidentTime = incidentTimestamp
            ? new Date(incidentTimestamp)
            : new Date();

        const caseData = {
            // Patient Information
            patientInfo: {
                name: patientName || null,
                age: parseInt(age),
                gender,
                pregnancyStatus
            },

            // Primary Vitals
            vitals: {
                bloodPressure: bloodPressure || null,
                heartRate: parseInt(heartRate),
                spo2: parseInt(spo2),
                temperature: temperature ? parseFloat(temperature) : null,
                temperatureUnit,
                respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null
            },

            // Neurological Assessment
            neurological: {
                consciousnessLevel,
                headInjurySuspected,
                seizureActivity
            },

            // Respiratory & Cardiac
            respiratoryCardiac: {
                breathingStatus,
                chestPainPresent,
                cardiacHistoryKnown
            },

            // Trauma Assessment
            traumaAssessment: {
                injuryType,
                bleedingSeverity,
                burnsPercentage: parseInt(burnsPercentage)
            },

            // Emergency Context
            emergencyContext: {
                emergencyType,
                incidentTimestamp: incidentTime,
                environmentalRisks: environmentalRisks || null
            },

            // Pre-Hospital Care
            preHospitalCare: {
                oxygenAdministered,
                cprPerformed,
                ivFluidsStarted
            },

            // Transport Priority
            transportPriority,

            // Support Requirements
            supportRequired: {
                ventilator: ventilatorRequired,
                oxygen: oxygenRequired,
                defibrillator: defibrillatorRequired,
                spinalImmobilization
            },

            // Infection Risk
            infectionRisk: {
                suspectedInfectious,
                isolationRequired
            },

            // Triage Indicators (AI placeholders)
            triageIndicators: {
                shockSuspected: false,
                respiratoryFailureRisk: false,
                neuroCriticalRisk: false,
                cardiacRisk: false,
                traumaPriority: false
            },

            // Paramedic Notes
            paramedicNotes: paramedicNotes || null,

            // Location & Metadata
            pickupLocation: locationCoords,
            createdAt: serverTimestamp(),
            userId: user.uid,

            // AI Triage Placeholder
            acuityLevel: null,

            // Case Status
            caseStatus: 'intake_completed',

            // MF4: Incident Photos — uploaded atomically before case write
            incidentPhotos: []
        };

        // MF4: Upload photos FIRST, then write case with URLs included
        if (capturedPhotos.length > 0) {
            const tempId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const photoUrls = await uploadPhotosToStorage(tempId);
            if (photoUrls.length > 0) {
                caseData.incidentPhotos = photoUrls;
            }
        }

        // Single atomic Firestore write with photo URLs already attached
        await addDoc(collection(db, 'emergencyCases'), caseData);
    };

    async function onSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            setStatus('Please fix validation errors before submitting');
            return;
        }

        setLoading(true);
        setStatus(tFetchingLocation);

        try {
            const locationCoords = await getCurrentLocation();
            setCoords(locationCoords);
            setStatus(tLocationDetected);

            if (navigator.onLine) {
                try {
                    await submitOnline(locationCoords);
                    setStatus(tCaseSubmitted);
                } catch (submitError) {
                    // MF9: Only queue on Firestore write failure, not Storage failure
                    if (submitError.code === 'unavailable' || submitError.code === 'permission-denied' ||
                        submitError.message?.includes('offline') || !navigator.onLine) {
                        console.warn('Firestore unavailable, queuing for later sync');
                        await offlineSync.enqueueReport({
                            type: 'emergencyCase',
                            data: { age, gender, heartRate, spo2, emergencyType },
                            coords: locationCoords
                        });
                        setStatus(tOfflineQueued);
                    } else {
                        throw submitError; // Re-throw non-connectivity errors
                    }
                }
            } else {
                await offlineSync.enqueueReport({
                    type: 'emergencyCase',
                    data: { age, gender, heartRate, spo2, emergencyType },
                    coords: locationCoords
                });
                setStatus(tOfflineQueued);
            }

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Submission failed:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    const resetForm = () => {
        setPatientName('');
        setAge('');
        setGender('male');
        setPregnancyStatus('unknown');
        setBloodPressure('');
        setHeartRate('');
        setSpo2('');
        setTemperature('');
        setRespiratoryRate('');
        setConsciousnessLevel('alert');
        setHeadInjurySuspected(false);
        setSeizureActivity(false);
        setBreathingStatus('normal');
        setChestPainPresent(false);
        setCardiacHistoryKnown(false);
        setInjuryType('none');
        setBleedingSeverity('none');
        setBurnsPercentage(0);
        setEmergencyType('medical');
        setIncidentTimestamp('');
        setEnvironmentalRisks('');
        setOxygenAdministered(false);
        setCprPerformed(false);
        setIvFluidsStarted(false);
        setTransportPriority('urgent');
        setVentilatorRequired(false);
        setOxygenRequired(false);
        setDefibrillatorRequired(false);
        setSpinalImmobilization(false);
        setSuspectedInfectious(false);
        setIsolationRequired(false);
        setParamedicNotes('');
        setValidationErrors({});
    };

    return (
        <div className="card p-6 shadow-lg max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{tPatientIntake}</h2>
                <p className="text-sm text-gray-600">
                    Complete patient assessment for triage classification and hospital routing.
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
                {/* Section 1: Patient Identification */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {useT(TRANSLATIONS.patientIdentification)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.patientName)}
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.age)} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={`input ${validationErrors.age ? 'border-red-500' : ''}`}
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="45"
                                required
                            />
                            {validationErrors.age && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.age}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.gender)} <span className="text-red-500">*</span>
                            </label>
                            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.pregnancyStatus)}
                            </label>
                            <select className="input" value={pregnancyStatus} onChange={(e) => setPregnancyStatus(e.target.value)}>
                                <option value="unknown">Unknown</option>
                                <option value="pregnant">Pregnant</option>
                                <option value="not_pregnant">Not Pregnant</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section 2: Primary Vitals */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-red-50 to-pink-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {useT(TRANSLATIONS.primaryVitals)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.bloodPressure)}
                            </label>
                            <input
                                type="text"
                                className={`input ${validationErrors.bloodPressure ? 'border-red-500' : ''}`}
                                value={bloodPressure}
                                onChange={(e) => setBloodPressure(e.target.value)}
                                placeholder="120/80"
                            />
                            {validationErrors.bloodPressure && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.bloodPressure}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.heartRate)} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={`input ${validationErrors.heartRate ? 'border-red-500' : ''}`}
                                value={heartRate}
                                onChange={(e) => setHeartRate(e.target.value)}
                                placeholder="72"
                                required
                            />
                            {validationErrors.heartRate && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.heartRate}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.spo2)} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className={`input ${validationErrors.spo2 ? 'border-red-500' : ''}`}
                                value={spo2}
                                onChange={(e) => setSpo2(e.target.value)}
                                placeholder="98"
                                required
                            />
                            {validationErrors.spo2 && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.spo2}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.temperature)}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    className={`input flex-1 ${validationErrors.temperature ? 'border-red-500' : ''}`}
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                    placeholder="37.0"
                                />
                                <select className="input w-24" value={temperatureUnit} onChange={(e) => setTemperatureUnit(e.target.value)}>
                                    <option value="celsius">°C</option>
                                    <option value="fahrenheit">°F</option>
                                </select>
                            </div>
                            {validationErrors.temperature && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.temperature}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.respiratoryRate)}
                            </label>
                            <input
                                type="number"
                                className={`input ${validationErrors.respiratoryRate ? 'border-red-500' : ''}`}
                                value={respiratoryRate}
                                onChange={(e) => setRespiratoryRate(e.target.value)}
                                placeholder="16"
                            />
                            {validationErrors.respiratoryRate && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.respiratoryRate}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 3: Neurological Status */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {useT(TRANSLATIONS.neurologicalStatus)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.consciousnessLevel)} <span className="text-red-500">*</span>
                            </label>
                            <select className="input" value={consciousnessLevel} onChange={(e) => setConsciousnessLevel(e.target.value)}>
                                <option value="alert">Alert</option>
                                <option value="verbal">Responds to Verbal</option>
                                <option value="pain">Responds to Pain</option>
                                <option value="unresponsive">Unresponsive</option>
                            </select>
                        </div>
                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={headInjurySuspected}
                                    onChange={(e) => setHeadInjurySuspected(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.headInjurySuspected)}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={seizureActivity}
                                    onChange={(e) => setSeizureActivity(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.seizureActivity)}</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Section 4: Respiratory & Cardiac */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {useT(TRANSLATIONS.respiratoryCardiac)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.breathingStatus)}
                            </label>
                            <select className="input" value={breathingStatus} onChange={(e) => setBreathingStatus(e.target.value)}>
                                <option value="normal">Normal</option>
                                <option value="labored">Labored</option>
                                <option value="assisted">Assisted Ventilation</option>
                                <option value="not_breathing">Not Breathing</option>
                            </select>
                        </div>
                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={chestPainPresent}
                                    onChange={(e) => setChestPainPresent(e.target.checked)}
                                    className="w-4 h-4 text-cyan-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.chestPainPresent)}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cardiacHistoryKnown}
                                    onChange={(e) => setCardiacHistoryKnown(e.target.checked)}
                                    className="w-4 h-4 text-cyan-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.cardiacHistoryKnown)}</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Section 5: Trauma Assessment */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-orange-50 to-red-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {useT(TRANSLATIONS.traumaAssessment)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.injuryType)}
                            </label>
                            <select className="input" value={injuryType} onChange={(e) => setInjuryType(e.target.value)}>
                                <option value="none">None</option>
                                <option value="fracture">Fracture</option>
                                <option value="polytrauma">Polytrauma</option>
                                <option value="burns">Burns</option>
                                <option value="laceration">Laceration</option>
                                <option value="internal">Internal Injury</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.bleedingSeverity)}
                            </label>
                            <select className="input" value={bleedingSeverity} onChange={(e) => setBleedingSeverity(e.target.value)}>
                                <option value="none">None</option>
                                <option value="mild">Mild</option>
                                <option value="severe">Severe</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.burnsPercentage)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                className="w-full"
                                value={burnsPercentage}
                                onChange={(e) => setBurnsPercentage(e.target.value)}
                            />
                            <div className="text-center text-sm font-semibold text-orange-600 mt-1">
                                {burnsPercentage}%
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: Emergency Context */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {useT(TRANSLATIONS.emergencyContext)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.emergencyType)} <span className="text-red-500">*</span>
                            </label>
                            <select className="input" value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)}>
                                <option value="medical">Medical</option>
                                <option value="accident">Accident</option>
                                <option value="cardiac">Cardiac</option>
                                <option value="fire">Fire</option>
                                <option value="industrial">Industrial</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.incidentTimestamp)}
                            </label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={incidentTimestamp}
                                onChange={(e) => setIncidentTimestamp(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.environmentalRisks)}
                            </label>
                            <textarea
                                className="input"
                                rows={2}
                                value={environmentalRisks}
                                onChange={(e) => setEnvironmentalRisks(e.target.value)}
                                placeholder="Hazardous materials, unstable structure, traffic..."
                            />
                        </div>
                    </div>
                </section>

                {/* Section 7: Pre-Hospital Care */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {useT(TRANSLATIONS.preHospitalCare)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-green-200">
                            <input
                                type="checkbox"
                                checked={oxygenAdministered}
                                onChange={(e) => setOxygenAdministered(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{useT(TRANSLATIONS.oxygenAdministered)}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-green-200">
                            <input
                                type="checkbox"
                                checked={cprPerformed}
                                onChange={(e) => setCprPerformed(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{useT(TRANSLATIONS.cprPerformed)}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-green-200">
                            <input
                                type="checkbox"
                                checked={ivFluidsStarted}
                                onChange={(e) => setIvFluidsStarted(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{useT(TRANSLATIONS.ivFluidsStarted)}</span>
                        </label>
                    </div>
                </section>

                {/* Section 8: Transport & Support Requirements */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {useT(TRANSLATIONS.transportSupport)}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {useT(TRANSLATIONS.transportPriority)} <span className="text-red-500">*</span>
                            </label>
                            <select className="input" value={transportPriority} onChange={(e) => setTransportPriority(e.target.value)}>
                                <option value="immediate">Immediate (Red)</option>
                                <option value="urgent">Urgent (Yellow)</option>
                                <option value="delayed">Delayed (Green)</option>
                                <option value="minor">Minor (White)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-indigo-200">
                                <input
                                    type="checkbox"
                                    checked={ventilatorRequired}
                                    onChange={(e) => setVentilatorRequired(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.ventilatorRequired)}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-indigo-200">
                                <input
                                    type="checkbox"
                                    checked={oxygenRequired}
                                    onChange={(e) => setOxygenRequired(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.oxygenRequired)}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-indigo-200">
                                <input
                                    type="checkbox"
                                    checked={defibrillatorRequired}
                                    onChange={(e) => setDefibrillatorRequired(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.defibrillatorRequired)}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-indigo-200">
                                <input
                                    type="checkbox"
                                    checked={spinalImmobilization}
                                    onChange={(e) => setSpinalImmobilization(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{useT(TRANSLATIONS.spinalImmobilization)}</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Section 9: Infection Risk Assessment */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-pink-50 to-red-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {useT(TRANSLATIONS.infectionRisk)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-pink-200">
                            <input
                                type="checkbox"
                                checked={suspectedInfectious}
                                onChange={(e) => setSuspectedInfectious(e.target.checked)}
                                className="w-4 h-4 text-pink-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{useT(TRANSLATIONS.suspectedInfectious)}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-pink-200">
                            <input
                                type="checkbox"
                                checked={isolationRequired}
                                onChange={(e) => setIsolationRequired(e.target.checked)}
                                className="w-4 h-4 text-pink-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{useT(TRANSLATIONS.isolationRequired)}</span>
                        </label>
                    </div>
                </section>

                {/* Section 10: Paramedic Notes */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-gray-50 to-slate-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {useT(TRANSLATIONS.paramedicNotes)}
                    </h3>
                    <textarea
                        className="input"
                        rows={4}
                        value={paramedicNotes}
                        onChange={(e) => setParamedicNotes(e.target.value)}
                        placeholder={useT(TRANSLATIONS.notesPlaceholder)}
                    />
                </section>

                {/* Sprint-2: Section 11 - Incident Photo Capture */}
                <section className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-amber-50 to-yellow-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-amber-600" />
                        Incident Photo Documentation
                    </h3>

                    {/* Photo Grid */}
                    {capturedPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {capturedPhotos.map((photo, index) => (
                                <div key={photo.timestamp} className="relative group">
                                    <img
                                        src={photo.preview}
                                        alt={`Incident photo ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border border-amber-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Capture Button */}
                    <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors w-full justify-center"
                    >
                        <Camera className="w-5 h-5" />
                        {capturedPhotos.length === 0 ? 'Capture Incident Photo' : 'Add Another Photo'}
                    </button>

                    {capturedPhotos.length > 0 && (
                        <p className="text-xs text-amber-700 mt-2 text-center">
                            {capturedPhotos.length} photo{capturedPhotos.length > 1 ? 's' : ''} captured
                        </p>
                    )}
                </section>

                {/* GPS Auto-Capture Notice */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-green-800">GPS Location Auto-Capture</p>
                            <p className="text-xs text-green-700">Pickup location will be automatically captured when you submit</p>
                        </div>
                    </div>
                </div>

                {/* Camera Modal */}
                {showCamera && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h4 className="text-lg font-semibold">Capture Incident Photo</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <CameraCapture
                                    onPhotoCaptured={handlePhotoCaptured}
                                    onClose={() => setShowCamera(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    className="btn btn-primary w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting…
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            {tSubmitCase}
                        </>
                    )}
                </button>

                {/* Status Messages */}
                {status && (
                    <div className={`p-4 rounded-lg border ${status.includes('successfully') || status.includes('Offline')
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : status.includes('Error') || status.includes('fix validation')
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {status.includes('successfully') || status.includes('Offline') ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : status.includes('Error') || status.includes('fix validation') ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                            <span className="text-sm font-medium">{status}</span>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
