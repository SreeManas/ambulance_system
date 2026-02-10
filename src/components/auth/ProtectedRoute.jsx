// src/components/auth/ProtectedRoute.jsx
/**
 * Role-Based Access Control Route Wrapper
 * Protects routes based on user roles from Firestore
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

// Role access matrix for route protection
const ROLE_ACCESS = {
    '/intake': ['paramedic', 'dispatcher', 'admin'],
    '/hospitals': ['hospital_admin', 'admin'],
    '/routing': ['dispatcher', 'admin', 'paramedic', 'command_center'],
    '/command-center': ['dispatcher', 'admin', 'command_center'],
    '/live-capacity': ['hospital_admin', 'command_center', 'dispatcher', 'admin', 'paramedic'],
    '/navigate': ['paramedic', 'dispatcher', 'admin', 'command_center'],
    '/feedback': ['paramedic', 'dispatcher', 'hospital_admin', 'admin', 'citizen', 'command_center']
};

export default function ProtectedRoute({ children }) {
    const { currentUser, role, loading } = useAuth();
    const location = useLocation();

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role access
    const allowedRoles = ROLE_ACCESS[location.pathname] || ['admin'];
    if (!allowedRoles.includes(role)) {
        return <Navigate to="/not-authorized" replace />;
    }

    return children;
}
