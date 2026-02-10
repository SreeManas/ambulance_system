/**
 * roleContextBuilder.js — Firestore Context Fetcher per Role
 * 
 * Fetches role-specific data from Firestore to inject into Gemini prompts.
 * Enforces data access boundaries per role.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════
// FIREBASE ADMIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════

let db;

/**
 * Initialize Firebase Admin with service account credentials.
 */
function getDb() {
    if (db) return db;

    try {
        if (getApps().length === 0) {
            const serviceAccount = JSON.parse(
                readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
            );
            initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
        db = getFirestore();
        return db;
    } catch (err) {
        console.warn('Firebase Admin init failed (context will be empty):', err.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// ROLE-SPECIFIC CONTEXT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch paramedic context — only their assigned case and relevant hospitals.
 */
async function buildParamedicContext(contextIds) {
    const firestore = getDb();
    const context = { role: 'paramedic', data: {} };
    if (!firestore) return context;

    try {
        // Fetch assigned case
        if (contextIds?.caseId) {
            const caseDoc = await firestore.collection('emergencyCases').doc(contextIds.caseId).get();
            if (caseDoc.exists) {
                const caseData = caseDoc.data();
                context.data.assignedCase = {
                    id: caseDoc.id,
                    emergencyType: caseData.emergencyContext?.emergencyType || caseData.emergencyType || 'unknown',
                    triageLevel: caseData.acuityLevel || caseData.triageLevel || 'unknown',
                    patientAge: caseData.patientAge || null,
                    patientGender: caseData.patientGender || null,
                    chiefComplaint: caseData.emergencyContext?.chiefComplaint || caseData.chiefComplaint || '',
                    vitalSigns: caseData.vitals || caseData.vitalSigns || {},
                    location: caseData.pickupLocation || caseData.location || null,
                    createdAt: caseData.createdAt || null,
                    status: caseData.status || 'active'
                };
            }
        }

        // Fetch top 5 hospitals (limited for context size)
        const hospitalsSnap = await firestore.collection('hospitals').limit(5).get();
        context.data.nearbyHospitals = hospitalsSnap.docs.map(doc => {
            const h = doc.data();
            return {
                id: doc.id,
                name: h.basicInfo?.name || h.name || 'Unknown',
                type: h.basicInfo?.hospitalType || h.type || '',
                traumaLevel: h.traumaLevel || 'none',
                icuBeds: h.capacity?.bedsByType?.icu?.available ?? h.beds?.icu?.available ?? h.beds?.icu ?? 0,
                emergencyBeds: h.capacity?.bedsByType?.emergency?.available ?? h.beds?.emergency?.available ?? h.beds?.emergency ?? 0,
                specialists: summarizeSpecialists(h.specialists),
                capabilities: h.capabilities || h.clinicalCapabilities || {},
                phone: h.basicInfo?.phoneNumber || h.phone || '',
                emergencyStatus: h.emergencyReadiness?.status || 'unknown'
            };
        });
    } catch (err) {
        console.error('Error building paramedic context:', err.message);
        context.error = 'Failed to fetch some context data';
    }

    return context;
}

/**
 * Fetch dispatcher context — active cases, fleet, hospital load.
 */
async function buildDispatcherContext(contextIds) {
    const firestore = getDb();
    const context = { role: 'dispatcher', data: {} };
    if (!firestore) return context;

    try {
        // Active cases summary
        const casesSnap = await firestore.collection('emergencyCases')
            .where('status', '==', 'active')
            .limit(20)
            .get();

        context.data.activeCases = {
            count: casesSnap.size,
            cases: casesSnap.docs.map(doc => {
                const c = doc.data();
                return {
                    id: doc.id,
                    emergencyType: c.emergencyContext?.emergencyType || c.emergencyType || 'unknown',
                    triageLevel: c.acuityLevel || c.triageLevel || 'unknown',
                    status: c.status || 'active',
                    assignedAmbulance: c.assignedAmbulance || null,
                    assignedHospital: c.assignedHospital || null
                };
            })
        };

        // Ambulance fleet status
        const ambulancesSnap = await firestore.collection('ambulances').limit(20).get();
        const ambulances = ambulancesSnap.docs.map(doc => {
            const a = doc.data();
            return {
                id: doc.id,
                status: a.status || 'unknown',
                location: a.location || null,
                assignedCase: a.assignedCase || null
            };
        });

        context.data.fleet = {
            total: ambulances.length,
            available: ambulances.filter(a => a.status === 'available').length,
            enRoute: ambulances.filter(a => a.status === 'en_route' || a.status === 'dispatched').length,
            atScene: ambulances.filter(a => a.status === 'at_scene').length,
            offline: ambulances.filter(a => a.status === 'offline' || a.status === 'maintenance').length
        };

        // Hospital load summary
        const hospitalsSnap = await firestore.collection('hospitals').limit(15).get();
        context.data.hospitalLoad = hospitalsSnap.docs.map(doc => {
            const h = doc.data();
            return {
                name: h.basicInfo?.name || h.name || doc.id,
                icuBeds: h.capacity?.bedsByType?.icu?.available ?? h.beds?.icu?.available ?? h.beds?.icu ?? 0,
                emergencyBeds: h.capacity?.bedsByType?.emergency?.available ?? h.beds?.emergency?.available ?? h.beds?.emergency ?? 0,
                onDiversion: h.emergencyReadiness?.diversionStatus || h.onDiversion || false,
                traumaLevel: h.traumaLevel || 'none',
                emergencyStatus: h.emergencyReadiness?.status || 'unknown'
            };
        });
    } catch (err) {
        console.error('Error building dispatcher context:', err.message);
        context.error = 'Failed to fetch some context data';
    }

    return context;
}

/**
 * Fetch hospital admin context — only their own hospital.
 */
async function buildHospitalAdminContext(contextIds) {
    const firestore = getDb();
    const context = { role: 'hospital_admin', data: {} };
    if (!firestore) return context;

    try {
        // If a specific hospital ID is provided, fetch only that hospital
        if (contextIds?.hospitalId) {
            const hospitalDoc = await firestore.collection('hospitals').doc(contextIds.hospitalId).get();
            if (hospitalDoc.exists) {
                const h = hospitalDoc.data();
                context.data.hospital = {
                    id: hospitalDoc.id,
                    name: h.basicInfo?.name || h.name || 'Unknown',
                    type: h.basicInfo?.hospitalType || h.type || '',
                    traumaLevel: h.traumaLevel || 'none',
                    beds: h.capacity?.bedsByType || h.beds || {},
                    specialists: h.specialists || {},
                    capabilities: h.capabilities || h.clinicalCapabilities || {},
                    equipment: h.equipment || {},
                    phone: h.basicInfo?.phoneNumber || h.phone || '',
                    address: h.basicInfo?.address || h.address || '',
                    onDiversion: h.emergencyReadiness?.diversionStatus || h.onDiversion || false,
                    lastUpdated: h.lastUpdated || null
                };
            }

            // Incoming cases for this specific hospital
            const incomingSnap = await firestore.collection('emergencyCases')
                .where('assignedHospital', '==', contextIds.hospitalId)
                .where('status', '==', 'active')
                .limit(10)
                .get();

            context.data.incomingCases = incomingSnap.docs.map(doc => {
                const c = doc.data();
                return {
                    id: doc.id,
                    emergencyType: c.emergencyContext?.emergencyType || c.emergencyType || 'unknown',
                    triageLevel: c.acuityLevel || c.triageLevel || 'unknown',
                    eta: c.etaMinutes || null
                };
            });
        } else {
            // No specific hospital — fetch ALL hospitals for general capacity overview
            const hospitalsSnap = await firestore.collection('hospitals').limit(20).get();
            context.data.allHospitals = hospitalsSnap.docs.map(doc => {
                const h = doc.data();
                return {
                    id: doc.id,
                    name: h.basicInfo?.name || h.name || 'Unknown',
                    type: h.basicInfo?.hospitalType || h.type || '',
                    traumaLevel: h.traumaLevel || 'none',
                    beds: h.capacity?.bedsByType || h.beds || {},
                    specialists: h.specialists || {},
                    capabilities: h.capabilities || {},
                    equipment: h.equipment || {},
                    emergencyStatus: h.emergencyReadiness?.status || 'unknown',
                    onDiversion: h.emergencyReadiness?.diversionStatus || false,
                    queueLength: h.emergencyReadiness?.queueLength || 0
                };
            });
        }
    } catch (err) {
        console.error('Error building hospital admin context:', err.message);
        context.error = 'Failed to fetch some context data';
    }

    return context;
}

/**
 * Fetch admin/command center context — system-wide overview.
 */
async function buildAdminContext() {
    const firestore = getDb();
    const context = { role: 'admin', data: {} };
    if (!firestore) return context;

    try {
        // System-wide stats
        const casesSnap = await firestore.collection('emergencyCases').limit(50).get();
        const activeCases = casesSnap.docs.filter(d => d.data().status === 'active');

        context.data.systemStats = {
            totalCases: casesSnap.size,
            activeCases: activeCases.length,
            casesByType: {}
        };

        // Count by emergency type
        casesSnap.docs.forEach(doc => {
            const type = doc.data().emergencyType || 'unknown';
            context.data.systemStats.casesByType[type] =
                (context.data.systemStats.casesByType[type] || 0) + 1;
        });

        // All hospitals summary
        const hospitalsSnap = await firestore.collection('hospitals').limit(20).get();
        context.data.hospitals = hospitalsSnap.docs.map(doc => {
            const h = doc.data();
            return {
                name: h.name || doc.id,
                type: h.type || '',
                traumaLevel: h.traumaLevel || 'none',
                icuBeds: h.beds?.icu?.available ?? h.beds?.icu ?? 0,
                onDiversion: h.onDiversion || false
            };
        });

        // Fleet summary
        const ambulancesSnap = await firestore.collection('ambulances').limit(30).get();
        context.data.fleetSummary = {
            total: ambulancesSnap.size,
            available: ambulancesSnap.docs.filter(d => d.data().status === 'available').length,
            deployed: ambulancesSnap.docs.filter(d =>
                ['en_route', 'dispatched', 'at_scene'].includes(d.data().status)
            ).length
        };
    } catch (err) {
        console.error('Error building admin context:', err.message);
        context.error = 'Failed to fetch some context data';
    }

    return context;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function summarizeSpecialists(specialists) {
    if (!specialists || typeof specialists !== 'object') return {};
    const summary = {};
    for (const [key, val] of Object.entries(specialists)) {
        if (typeof val === 'number') {
            summary[key] = val;
        } else if (val && typeof val === 'object') {
            summary[key] = val.available ?? val.count ?? 0;
        }
    }
    return summary;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Build context data for a given role.
 * @param {string} role - User role
 * @param {Object} contextIds - Optional {caseId, hospitalId}
 * @returns {Object} Context data object
 */
export async function buildRoleContext(role, contextIds = {}) {
    switch (role) {
        case 'paramedic':
            return buildParamedicContext(contextIds);
        case 'dispatcher':
            return buildDispatcherContext(contextIds);
        case 'hospital_admin':
            return buildHospitalAdminContext(contextIds);
        case 'command_center':
            return buildAdminContext(); // Same broad access as admin
        case 'admin':
            return buildAdminContext();
        default:
            return { role: role || 'unknown', data: {}, error: 'Unknown role' };
    }
}
