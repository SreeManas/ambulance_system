import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './auth/AuthProvider';
import {
    Shield, Award, Phone, Mail, Plus, Trash2, Save, X,
    Truck, Building2, FileCheck, CreditCard, AlertTriangle,
    Users, Stethoscope, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

// =============================================================================
// DEFAULT EXTENDED PROFILE SCHEMA
// =============================================================================

export const defaultExtendedProfile = {
    // Accreditation & Certifications
    accreditation: [],
    traumaCertifications: [],
    emergencyCertifications: [],

    // Insurance & Financial
    insurancePartners: [],
    cashlessAvailable: false,
    governmentSchemesAccepted: [],

    // Emergency Coordinators
    emergencyCoordinators: [],

    // Special Programs
    specialPrograms: [],

    // Infrastructure
    helipadDetails: {
        available: false,
        nightLanding: false
    },
    disasterPreparednessLevel: 'basic',

    // Legal Compliance
    medicoLegalReady: false,
    policeCaseHandling: false,

    // Notes
    hospitalNotes: '',

    // Metadata
    lastProfileUpdated: null,
    updatedBy: ''
};

// =============================================================================
// PREDEFINED OPTIONS
// =============================================================================

const ACCREDITATION_OPTIONS = [
    'NABH', 'JCI', 'ISO 9001', 'ISO 14001', 'NABL', 'QCI'
];

const TRAUMA_CERT_OPTIONS = [
    'Level 1 Trauma Center', 'Level 2 Trauma Center', 'Level 3 Trauma Center',
    'Advanced Cardiac Life Support (ACLS)', 'Basic Life Support (BLS)',
    'Pediatric Advanced Life Support (PALS)', 'Trauma Nursing Core Course (TNCC)'
];

const EMERGENCY_CERT_OPTIONS = [
    'Stroke Ready Center', 'Burn Care Certified', 'Cardiac Emergency Center',
    'Neonatal Emergency Ready', 'Poison Control Center', 'Disaster Response Certified'
];

const GOVT_SCHEMES = [
    'Ayushman Bharat', 'State Health Insurance', 'CGHS', 'ESIC', 'Railway Health Service'
];

const DISASTER_LEVELS = [
    { value: 'basic', label: 'Basic Preparedness' },
    { value: 'advanced', label: 'Advanced Response Ready' },
    { value: 'national_response_ready', label: 'National Disaster Response Ready' }
];

// =============================================================================
// VALIDATION
// =============================================================================

const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfile(profile) {
    const errors = [];

    if (!profile.accreditation?.length) {
        errors.push('At least one accreditation is required');
    }

    if (!profile.emergencyCoordinators?.length) {
        errors.push('At least one emergency coordinator is required');
    }

    // Validate coordinator contacts
    profile.emergencyCoordinators?.forEach((coord, idx) => {
        if (!coord.name?.trim()) {
            errors.push(`Coordinator ${idx + 1}: Name is required`);
        }
        if (coord.phone && !PHONE_REGEX.test(coord.phone)) {
            errors.push(`Coordinator ${idx + 1}: Invalid phone format`);
        }
        if (coord.email && !EMAIL_REGEX.test(coord.email)) {
            errors.push(`Coordinator ${idx + 1}: Invalid email format`);
        }
    });

    if (!profile.disasterPreparednessLevel) {
        errors.push('Disaster preparedness level is required');
    }

    return errors;
}

// =============================================================================
// ROLE-BASED ACCESS
// =============================================================================

const EDIT_ROLES = ['hospital_admin', 'admin'];

function canEditProfile(role) {
    return EDIT_ROLES.includes(role);
}

// =============================================================================
// SUBCOMPONENTS - Light Theme
// =============================================================================

function TagInput({ tags, onChange, placeholder, suggestions = [], disabled }) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const addTag = (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
        setShowSuggestions(false);
    };

    const removeTag = (idx) => {
        if (!disabled) {
            onChange(tags.filter((_, i) => i !== idx));
        }
    };

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
    );

    return (
        <div className="relative">
            <div className={`flex flex-wrap gap-2 p-3 border rounded-lg min-h-[48px] ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200'}`}>
                {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm border border-blue-200">
                        {tag}
                        {!disabled && (
                            <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-600 ml-1">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(input);
                            }
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                    />
                )}
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className="w-full px-3 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-sm"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CoordinatorCard({ coordinator, onChange, onRemove, disabled }) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-blue-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-sm">Emergency Coordinator</span>
                </div>
                {!disabled && (
                    <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                    type="text"
                    value={coordinator.name || ''}
                    onChange={(e) => onChange({ ...coordinator, name: e.target.value })}
                    placeholder="Full Name *"
                    disabled={disabled}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <input
                    type="text"
                    value={coordinator.role || ''}
                    onChange={(e) => onChange({ ...coordinator, role: e.target.value })}
                    placeholder="Role (e.g., Trauma Coordinator)"
                    disabled={disabled}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="tel"
                        value={coordinator.phone || ''}
                        onChange={(e) => onChange({ ...coordinator, phone: e.target.value })}
                        placeholder="Phone"
                        disabled={disabled}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="email"
                        value={coordinator.email || ''}
                        onChange={(e) => onChange({ ...coordinator, email: e.target.value })}
                        placeholder="Email"
                        disabled={disabled}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon: Icon, title, isOpen, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-lg transition-colors"
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{title}</span>
            </div>
            {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
        </button>
    );
}

// =============================================================================
// MAIN COMPONENT - Light Theme
// =============================================================================

export default function HospitalExtendedProfileForm({ hospital, onClose, onUpdate, embedded = false, profile: externalProfile, onProfileChange }) {
    const { role, currentUser } = useAuth();
    const [profile, setProfile] = useState({ ...defaultExtendedProfile });
    const [expandedSections, setExpandedSections] = useState({
        accreditation: true,
        insurance: false,
        coordinators: true,
        programs: false,
        infrastructure: false,
        legal: false,
        notes: false
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');

    const canEdit = canEditProfile(role) || embedded;
    const db = getFirestore();

    // Load existing profile or use external profile for embedded mode
    useEffect(() => {
        if (externalProfile) {
            setProfile({ ...defaultExtendedProfile, ...externalProfile });
        } else if (hospital?.extendedProfile) {
            setProfile({ ...defaultExtendedProfile, ...hospital.extendedProfile });
        }
    }, [hospital, externalProfile]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const updateProfile = (field, value) => {
        const updated = { ...profile, [field]: value };
        setProfile(updated);
        setErrors([]);
        // For embedded mode, notify parent of changes
        if (onProfileChange) {
            onProfileChange(updated);
        }
    };

    const updateCoordinator = (idx, data) => {
        const updated = [...profile.emergencyCoordinators];
        updated[idx] = data;
        updateProfile('emergencyCoordinators', updated);
    };

    const addCoordinator = () => {
        updateProfile('emergencyCoordinators', [
            ...profile.emergencyCoordinators,
            { name: '', role: '', phone: '', email: '' }
        ]);
    };

    const removeCoordinator = (idx) => {
        updateProfile('emergencyCoordinators',
            profile.emergencyCoordinators.filter((_, i) => i !== idx)
        );
    };

    const handleSave = async () => {
        // Skip save for embedded mode - parent handles it
        if (embedded) return;

        const validationErrors = validateProfile(profile);
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        setErrors([]);

        try {
            const hospitalRef = doc(db, 'hospitals', hospital.id);
            await updateDoc(hospitalRef, {
                extendedProfile: {
                    ...profile,
                    lastProfileUpdated: serverTimestamp(),
                    updatedBy: currentUser?.email || 'unknown'
                }
            });

            setSuccess('Profile saved successfully!');
            setTimeout(() => setSuccess(''), 3000);

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrors(['Failed to save profile. Please try again.']);
        } finally {
            setSaving(false);
        }
    };

    const containerClass = embedded
        ? "space-y-4"
        : "bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-4xl mx-auto";

    return (
        <div className={containerClass}>
            {/* Header - only show in modal mode */}
            {!embedded && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Extended Hospital Profile</h2>
                        <p className="text-gray-500 text-sm">{hospital?.basicInfo?.name || 'Hospital'}</p>
                    </div>
                    <div className="flex gap-2">
                        {canEdit && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg disabled:opacity-50 shadow-md"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile
                            </button>
                        )}
                        {onClose && (
                            <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Please fix the following:</span>
                    </div>
                    <ul className="list-disc list-inside text-red-600 text-sm">
                        {errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {success}
                </div>
            )}

            {/* Read-only Notice */}
            {!canEdit && !embedded && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                    👁️ View Only — You don't have permission to edit this profile.
                </div>
            )}

            <div className="space-y-4">
                {/* Accreditation Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={Award}
                        title="Accreditation & Certifications"
                        isOpen={expandedSections.accreditation}
                        onToggle={() => toggleSection('accreditation')}
                    />
                    {expandedSections.accreditation && (
                        <div className="p-4 space-y-4 bg-white">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Accreditations *</label>
                                <TagInput
                                    tags={profile.accreditation}
                                    onChange={(v) => updateProfile('accreditation', v)}
                                    placeholder="Add accreditation..."
                                    suggestions={ACCREDITATION_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Trauma Certifications</label>
                                <TagInput
                                    tags={profile.traumaCertifications}
                                    onChange={(v) => updateProfile('traumaCertifications', v)}
                                    placeholder="Add trauma certification..."
                                    suggestions={TRAUMA_CERT_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Emergency Certifications</label>
                                <TagInput
                                    tags={profile.emergencyCertifications}
                                    onChange={(v) => updateProfile('emergencyCertifications', v)}
                                    placeholder="Add emergency certification..."
                                    suggestions={EMERGENCY_CERT_OPTIONS}
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Insurance Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={CreditCard}
                        title="Insurance & Financial Acceptance"
                        isOpen={expandedSections.insurance}
                        onToggle={() => toggleSection('insurance')}
                    />
                    {expandedSections.insurance && (
                        <div className="p-4 space-y-4 bg-white">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Insurance Partners</label>
                                <TagInput
                                    tags={profile.insurancePartners}
                                    onChange={(v) => updateProfile('insurancePartners', v)}
                                    placeholder="Add insurance partner..."
                                    suggestions={['Star Health', 'ICICI Lombard', 'HDFC Ergo', 'Max Bupa', 'New India Assurance']}
                                    disabled={!canEdit}
                                />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.cashlessAvailable}
                                    onChange={(e) => updateProfile('cashlessAvailable', e.target.checked)}
                                    disabled={!canEdit}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Cashless Treatment Available</span>
                            </label>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Government Schemes Accepted</label>
                                <TagInput
                                    tags={profile.governmentSchemesAccepted}
                                    onChange={(v) => updateProfile('governmentSchemesAccepted', v)}
                                    placeholder="Add government scheme..."
                                    suggestions={GOVT_SCHEMES}
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Emergency Coordinators Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={Users}
                        title="Emergency Coordinators"
                        isOpen={expandedSections.coordinators}
                        onToggle={() => toggleSection('coordinators')}
                    />
                    {expandedSections.coordinators && (
                        <div className="p-4 space-y-4 bg-white">
                            {profile.emergencyCoordinators.map((coord, idx) => (
                                <CoordinatorCard
                                    key={idx}
                                    coordinator={coord}
                                    onChange={(data) => updateCoordinator(idx, data)}
                                    onRemove={() => removeCoordinator(idx)}
                                    disabled={!canEdit}
                                />
                            ))}
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={addCoordinator}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 rounded-lg w-full justify-center transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Coordinator
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Special Programs */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={Stethoscope}
                        title="Special Emergency Programs"
                        isOpen={expandedSections.programs}
                        onToggle={() => toggleSection('programs')}
                    />
                    {expandedSections.programs && (
                        <div className="p-4 bg-white">
                            <TagInput
                                tags={profile.specialPrograms}
                                onChange={(v) => updateProfile('specialPrograms', v)}
                                placeholder="Add special program..."
                                suggestions={['24x7 Stroke Response Team', 'Rapid Trauma Response Unit', 'Air Ambulance Support', 'Mobile ICU', 'Burn Response Team']}
                                disabled={!canEdit}
                            />
                        </div>
                    )}
                </div>

                {/* Infrastructure Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={Building2}
                        title="Infrastructure Support"
                        isOpen={expandedSections.infrastructure}
                        onToggle={() => toggleSection('infrastructure')}
                    />
                    {expandedSections.infrastructure && (
                        <div className="p-4 space-y-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile.helipadDetails?.available || false}
                                        onChange={(e) => updateProfile('helipadDetails', {
                                            ...profile.helipadDetails,
                                            available: e.target.checked
                                        })}
                                        disabled={!canEdit}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">Helipad Available</span>
                                </label>
                                <label className={`flex items-center gap-3 ${profile.helipadDetails?.available ? 'cursor-pointer' : 'opacity-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={profile.helipadDetails?.nightLanding || false}
                                        onChange={(e) => updateProfile('helipadDetails', {
                                            ...profile.helipadDetails,
                                            nightLanding: e.target.checked
                                        })}
                                        disabled={!canEdit || !profile.helipadDetails?.available}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">Night Landing Capable</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Disaster Preparedness Level *</label>
                                <select
                                    value={profile.disasterPreparednessLevel}
                                    onChange={(e) => updateProfile('disasterPreparednessLevel', e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                >
                                    {DISASTER_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legal Compliance */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={FileCheck}
                        title="Legal & Compliance"
                        isOpen={expandedSections.legal}
                        onToggle={() => toggleSection('legal')}
                    />
                    {expandedSections.legal && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.medicoLegalReady}
                                    onChange={(e) => updateProfile('medicoLegalReady', e.target.checked)}
                                    disabled={!canEdit}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Medico-Legal Case Ready</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.policeCaseHandling}
                                    onChange={(e) => updateProfile('policeCaseHandling', e.target.checked)}
                                    disabled={!canEdit}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-900">Police Case Handling</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <SectionHeader
                        icon={Shield}
                        title="Additional Notes"
                        isOpen={expandedSections.notes}
                        onToggle={() => toggleSection('notes')}
                    />
                    {expandedSections.notes && (
                        <div className="p-4 bg-white">
                            <textarea
                                value={profile.hospitalNotes}
                                onChange={(e) => updateProfile('hospitalNotes', e.target.value)}
                                disabled={!canEdit}
                                placeholder="Add any additional hospital notes, special instructions, or operational information..."
                                rows={4}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Last Updated Info - only in modal mode */}
            {!embedded && profile.lastProfileUpdated && (
                <div className="mt-6 pt-4 border-t border-gray-200 text-gray-500 text-sm">
                    Last updated: {new Date(profile.lastProfileUpdated?.toDate?.() || profile.lastProfileUpdated).toLocaleString()}
                    {profile.updatedBy && ` by ${profile.updatedBy}`}
                </div>
            )}
        </div>
    );
}
