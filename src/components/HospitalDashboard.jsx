import React, { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function HospitalDashboard() {
    const [hospitals, setHospitals] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [formData, setFormData] = useState(getEmptyFormData());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const db = getFirestore();
    const auth = getAuth();

    // Real-time Firebase sync
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'hospitals'),
            (snapshot) => {
                const hospitalData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
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
            }
        };
    }

    const toggleSection = (hospitalId, section) => {
        setExpandedSections(prev => ({
            ...prev,
            [`${hospitalId}-${section}`]: !prev[`${hospitalId}-${section}`]
        }));
    };

    const validateForm = () => {
        if (!formData.basicInfo.name || !formData.basicInfo.address || !formData.basicInfo.phone) {
            setError('Name, address, and phone are required');
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

            const hospitalData = {
                ...formData,
                capacityLastUpdated: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                updatedBy: user.uid
            };

            if (editingId) {
                await updateDoc(doc(db, 'hospitals', editingId), hospitalData);
            } else {
                await addDoc(collection(db, 'hospitals'), hospitalData);
            }

            setFormData(getEmptyFormData());
            setShowAddForm(false);
            setEditingId(null);
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

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hospital Capability Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-2">
                        Decision intelligence for AI-powered emergency routing
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setFormData(getEmptyFormData());
                        setEditingId(null);
                    }}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Hospital
                </button>
            </div>

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
                            {editingId ? 'Edit Hospital' : 'Add New Hospital'}
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
                                        Hospital Name <span className="text-red-500">*</span>
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
                                        Hospital Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.basicInfo.hospitalType}
                                        onChange={(e) => updateNestedField('basicInfo.hospitalType', e.target.value)}
                                    >
                                        <option value="trauma_center">Trauma Center</option>
                                        <option value="general">General Hospital</option>
                                        <option value="cardiac">Cardiac Specialty</option>
                                        <option value="pediatric">Pediatric</option>
                                        <option value="burn">Burn Center</option>
                                        <option value="specialty">Specialty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trauma Level
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.basicInfo.traumaLevel}
                                        onChange={(e) => updateNestedField('basicInfo.traumaLevel', e.target.value)}
                                    >
                                        <option value="none">None</option>
                                        <option value="level_1">Level 1</option>
                                        <option value="level_2">Level 2</option>
                                        <option value="level_3">Level 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
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
                                        Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.basicInfo.address}
                                        onChange={(e) => updateNestedField('basicInfo.address', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={formData.basicInfo.location.latitude}
                                        onChange={(e) => updateNestedField('basicInfo.location.latitude', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={formData.basicInfo.location.longitude}
                                        onChange={(e) => updateNestedField('basicInfo.location.longitude', parseFloat(e.target.value))}
                                    />
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        className="input"
                                        value={formData.emergencyReadiness.status}
                                        onChange={(e) => {
                                            updateNestedField('emergencyReadiness.status', e.target.value);
                                            updateNestedField('emergencyReadiness.diversionStatus', e.target.value === 'diverting');
                                        }}
                                    >
                                        <option value="accepting">Accepting</option>
                                        <option value="diverting">Diverting</option>
                                        <option value="full">Full</option>
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

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                className="btn btn-primary flex items-center gap-2"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : (editingId ? 'Update Hospital' : 'Add Hospital')}
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
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Hospital List */}
            <div className="space-y-4">
                {hospitals.map((hospital) => (
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

function CountBadge({ label, value }) {
    return (
        <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded text-xs font-medium">
            {label}: {value || 0}
        </div>
    );
}
