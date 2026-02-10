/**
 * HospitalProfileTab.jsx
 * Sprint-2: Extended Hospital Profile System
 * Displays detailed hospital metadata including accreditations, certifications,
 * insurance partners, emergency coordinators, and special programs.
 */
import React, { useState } from 'react';
import {
    Award,
    Shield,
    Phone,
    Users,
    Star,
    Edit2,
    Save,
    X,
    Building,
    Heart,
    Zap
} from 'lucide-react';

// Props: hospital - full hospital object, onUpdate - callback for saving changes, canEdit - role-based editing
export default function HospitalProfileTab({ hospital, onUpdate, canEdit = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);

    const profile = hospital?.extendedProfile || {};

    const handleEdit = () => {
        setEditData({
            accreditation: profile.accreditation || [],
            traumaCertifications: profile.traumaCertifications || [],
            insurancePartners: profile.insurancePartners || [],
            emergencyCoordinators: profile.emergencyCoordinators || [],
            specialPrograms: profile.specialPrograms || []
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!onUpdate) return;
        setSaving(true);
        try {
            await onUpdate({
                extendedProfile: editData
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    // Badge component for list items
    const Badge = ({ children, color = 'blue' }) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
            {children}
        </span>
    );

    // Section component for consistent styling
    const ProfileSection = ({ icon: Icon, title, children, color = 'blue' }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
            </div>
            <div>{children}</div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    Extended Hospital Profile
                </h3>
                {canEdit && !isEditing && (
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accreditations */}
                <ProfileSection icon={Award} title="Accreditations" color="yellow">
                    <div className="flex flex-wrap gap-2">
                        {(profile.accreditation || []).length > 0 ? (
                            (profile.accreditation || []).map((acc, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Award className="w-3 h-3 mr-1" />
                                    {acc}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">No accreditations listed</span>
                        )}
                    </div>
                </ProfileSection>

                {/* Trauma Certifications */}
                <ProfileSection icon={Shield} title="Trauma Certifications" color="red">
                    <div className="flex flex-wrap gap-2">
                        {(profile.traumaCertifications || []).length > 0 ? (
                            (profile.traumaCertifications || []).map((cert, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {cert}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">No certifications listed</span>
                        )}
                    </div>
                </ProfileSection>

                {/* Insurance Partners */}
                <ProfileSection icon={Heart} title="Insurance Partners" color="green">
                    <div className="flex flex-wrap gap-2">
                        {(profile.insurancePartners || []).length > 0 ? (
                            (profile.insurancePartners || []).map((ins, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {ins}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">No insurance partners listed</span>
                        )}
                    </div>
                </ProfileSection>

                {/* Special Programs */}
                <ProfileSection icon={Zap} title="Special Programs" color="purple">
                    <div className="flex flex-wrap gap-2">
                        {(profile.specialPrograms || []).length > 0 ? (
                            (profile.specialPrograms || []).map((prog, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Zap className="w-3 h-3 mr-1" />
                                    {prog}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">No special programs listed</span>
                        )}
                    </div>
                </ProfileSection>
            </div>

            {/* Emergency Coordinators - Full width */}
            <ProfileSection icon={Phone} title="Emergency Coordinators" color="blue">
                {(profile.emergencyCoordinators || []).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(profile.emergencyCoordinators || []).map((coord, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{coord.name}</div>
                                    <a
                                        href={`tel:${coord.phone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {coord.phone}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-gray-500">No emergency coordinators listed</span>
                )}
            </ProfileSection>

            {/* Performance Metrics Summary */}
            {hospital?.performanceMetrics && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-indigo-600" />
                        Performance Metrics
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {hospital.performanceMetrics.averageAmbulanceHandoverTime || 0}
                            </div>
                            <div className="text-xs text-gray-600">Avg Handover (min)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {hospital.performanceMetrics.emergencyResponseRating || 0}/5
                            </div>
                            <div className="text-xs text-gray-600">Response Rating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {hospital.performanceMetrics.survivalRateIndex || 0}%
                            </div>
                            <div className="text-xs text-gray-600">Survival Index</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
