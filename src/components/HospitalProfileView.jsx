import React, { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { defaultExtendedProfile } from './HospitalExtendedProfileForm';
import {
    Award, Shield, Users, Stethoscope, Building2, FileCheck,
    CreditCard, Phone, Mail, ChevronDown, ChevronUp,
    Check, X, AlertCircle, Plane, Clock
} from 'lucide-react';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Unknown';
    }
};

const getDisasterLevelColor = (level) => {
    switch (level) {
        case 'national_response_ready': return 'bg-green-100 text-green-800 border border-green-300';
        case 'advanced': return 'bg-blue-100 text-blue-800 border border-blue-300';
        default: return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
};

const getDisasterLevelLabel = (level) => {
    switch (level) {
        case 'national_response_ready': return 'National Response Ready';
        case 'advanced': return 'Advanced';
        default: return 'Basic';
    }
};

// =============================================================================
// SUB-COMPONENTS - Light Theme
// =============================================================================

function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-gray-100 text-gray-700 border border-gray-200',
        success: 'bg-green-100 text-green-800 border border-green-200',
        info: 'bg-blue-100 text-blue-800 border border-blue-200',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        accent: 'bg-purple-100 text-purple-800 border border-purple-200'
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
}

function StatusIndicator({ active, label }) {
    return (
        <div className="flex items-center gap-2">
            {active ? (
                <Check className="w-4 h-4 text-green-600" />
            ) : (
                <X className="w-4 h-4 text-gray-400" />
            )}
            <span className={active ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
        </div>
    );
}

function ContactCard({ coordinator }) {
    if (!coordinator) return null;

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow">
                    {coordinator.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{coordinator.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{coordinator.role || 'Coordinator'}</p>
                    <div className="mt-2 space-y-1">
                        {coordinator.phone && (
                            <a href={`tel:${coordinator.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                                <Phone className="w-3 h-3" />
                                {coordinator.phone}
                            </a>
                        )}
                        {coordinator.email && (
                            <a href={`mailto:${coordinator.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                                <Mail className="w-3 h-3" />
                                {coordinator.email}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ icon: Icon, title, children, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors"
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
            {isOpen && (
                <div className="p-4 bg-white">
                    {children}
                </div>
            )}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex items-center gap-2 text-gray-400 text-sm italic">
            <AlertCircle className="w-4 h-4" />
            {message}
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT - Light Theme
// =============================================================================

export default function HospitalProfileView({ hospital, onEdit }) {
    const { role } = useAuth();
    const profile = hospital?.extendedProfile || defaultExtendedProfile;

    const canEdit = ['hospital_admin', 'admin'].includes(role);

    return (
        <div className="space-y-4">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Extended Profile</h3>
                    <p className="text-gray-500 text-sm">
                        Operational intelligence & compliance data
                    </p>
                </div>
                {canEdit && onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Accreditation & Certifications */}
            <Section icon={Award} title="Accreditation & Certifications">
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">Accreditations</p>
                        {profile.accreditation?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.accreditation.map((acc, idx) => (
                                    <Badge key={idx} variant="success">{acc}</Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No accreditations listed" />
                        )}
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">Trauma Certifications</p>
                        {profile.traumaCertifications?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.traumaCertifications.map((cert, idx) => (
                                    <Badge key={idx} variant="warning">{cert}</Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No trauma certifications" />
                        )}
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">Emergency Certifications</p>
                        {profile.emergencyCertifications?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.emergencyCertifications.map((cert, idx) => (
                                    <Badge key={idx} variant="accent">{cert}</Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No emergency certifications" />
                        )}
                    </div>
                </div>
            </Section>

            {/* Insurance & Financial */}
            <Section icon={CreditCard} title="Insurance & Financial" defaultOpen={false}>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">Insurance Partners</p>
                        {profile.insurancePartners?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.insurancePartners.map((ins, idx) => (
                                    <Badge key={idx} variant="info">{ins}</Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No insurance partners listed" />
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <StatusIndicator active={profile.cashlessAvailable} label="Cashless Treatment" />
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">Government Schemes</p>
                        {profile.governmentSchemesAccepted?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.governmentSchemesAccepted.map((scheme, idx) => (
                                    <Badge key={idx} variant="success">{scheme}</Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No government schemes accepted" />
                        )}
                    </div>
                </div>
            </Section>

            {/* Emergency Coordinators */}
            <Section icon={Users} title="Emergency Coordinators">
                {profile.emergencyCoordinators?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.emergencyCoordinators.map((coord, idx) => (
                            <ContactCard key={idx} coordinator={coord} />
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No emergency coordinators listed" />
                )}
            </Section>

            {/* Special Programs */}
            <Section icon={Stethoscope} title="Special Emergency Programs" defaultOpen={false}>
                {profile.specialPrograms?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {profile.specialPrograms.map((prog, idx) => (
                            <Badge key={idx} variant="accent">{prog}</Badge>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No special programs listed" />
                )}
            </Section>

            {/* Infrastructure */}
            <Section icon={Building2} title="Infrastructure Support" defaultOpen={false}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Plane className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700 font-medium">Helipad</span>
                            </div>
                            <div className="space-y-1">
                                <StatusIndicator
                                    active={profile.helipadDetails?.available}
                                    label="Helipad Available"
                                />
                                <StatusIndicator
                                    active={profile.helipadDetails?.nightLanding}
                                    label="Night Landing"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700 font-medium">Disaster Preparedness</span>
                            </div>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getDisasterLevelColor(profile.disasterPreparednessLevel)}`}>
                                {getDisasterLevelLabel(profile.disasterPreparednessLevel)}
                            </span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Legal Compliance */}
            <Section icon={FileCheck} title="Legal & Compliance" defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatusIndicator active={profile.medicoLegalReady} label="Medico-Legal Ready" />
                    <StatusIndicator active={profile.policeCaseHandling} label="Police Case Handling" />
                </div>
            </Section>

            {/* Hospital Notes */}
            {profile.hospitalNotes && (
                <Section icon={Shield} title="Additional Notes" defaultOpen={false}>
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.hospitalNotes}</p>
                </Section>
            )}

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Clock className="w-3 h-3" />
                Last updated: {formatDate(profile.lastProfileUpdated)}
                {profile.updatedBy && <span>by {profile.updatedBy}</span>}
            </div>
        </div>
    );
}
