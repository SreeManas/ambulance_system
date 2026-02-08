#!/usr/bin/env node
/**
 * Firestore Seed Script for EMS Routing Platform
 * 
 * Populates Firestore with test data:
 * - 10 Hospitals with realistic capabilities
 * - 8 Ambulances for fleet simulation
 * - 5 Emergency cases for testing routing
 * 
 * Usage:
 *   node scripts/seedFirestore.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =============================================================================
// SEED DATA
// =============================================================================

const BANGALORE_CENTER = [77.5946, 12.9716];

function randomLocation(center, radiusKm = 15) {
    const r = radiusKm / 111.32;
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

const HOSPITALS = [
    {
        basicInfo: {
            name: "Manipal Hospital Whitefield",
            address: "ITPL Main Rd, Whitefield, Bangalore",
            phoneNumber: "+91-80-6629-6999",
            email: "whitefield@manipalhospitals.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 8)
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: true,
            specializations: ["cardiology", "neurology", "orthopedics", "trauma"]
        },
        specialists: {
            traumaSurgeon: { count: 4, available: 3 },
            cardiologist: { count: 6, available: 5 },
            neurologist: { count: 3, available: 2 },
            orthopedicSurgeon: { count: 5, available: 4 },
            burnSpecialist: { count: 2, available: 2 },
            pediatrician: { count: 4, available: 3 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 45, available: 12, occupied: 33 },
                general: { total: 200, available: 45, occupied: 155 },
                emergency: { total: 30, available: 8, occupied: 22 },
                isolation: { total: 20, available: 6, occupied: 14 }
            }
        },
        equipment: {
            ventilators: { total: 50, available: 15 },
            defibrillators: { total: 25, available: 20 },
            ctScanners: { total: 3, available: 2 },
            mriMachines: { total: 2, available: 1 },
            xrayMachines: { total: 8, available: 6 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 4,
            avgWaitTime: 15
        }
    },
    {
        basicInfo: {
            name: "Apollo Hospitals Bannerghatta",
            address: "Bannerghatta Road, Bangalore",
            phoneNumber: "+91-80-2630-0100",
            email: "bangalore@apollohospitals.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 10)
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "oncology", "neurology", "orthopedics"]
        },
        specialists: {
            traumaSurgeon: { count: 5, available: 4 },
            cardiologist: { count: 8, available: 6 },
            neurologist: { count: 4, available: 3 },
            orthopedicSurgeon: { count: 6, available: 5 },
            burnSpecialist: { count: 3, available: 2 },
            pediatrician: { count: 5, available: 4 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 60, available: 18, occupied: 42 },
                general: { total: 250, available: 60, occupied: 190 },
                emergency: { total: 40, available: 12, occupied: 28 },
                isolation: { total: 25, available: 8, occupied: 17 }
            }
        },
        equipment: {
            ventilators: { total: 65, available: 20 },
            defibrillators: { total: 30, available: 25 },
            ctScanners: { total: 4, available: 3 },
            mriMachines: { total: 3, available: 2 },
            xrayMachines: { total: 10, available: 8 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 6,
            avgWaitTime: 20
        }
    },
    {
        basicInfo: {
            name: "St. John's Medical College Hospital",
            address: "Sarjapur Road, Koramangala, Bangalore",
            phoneNumber: "+91-80-4966-3666",
            email: "info@stjohns.in",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 6)
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "pulmonology", "neurology"]
        },
        specialists: {
            traumaSurgeon: { count: 3, available: 2 },
            cardiologist: { count: 5, available: 4 },
            neurologist: { count: 2, available: 2 },
            orthopedicSurgeon: { count: 4, available: 3 },
            pulmonologist: { count: 3, available: 2 },
            pediatrician: { count: 4, available: 3 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 35, available: 8, occupied: 27 },
                general: { total: 150, available: 30, occupied: 120 },
                emergency: { total: 25, available: 6, occupied: 19 },
                isolation: { total: 15, available: 4, occupied: 11 }
            }
        },
        equipment: {
            ventilators: { total: 40, available: 10 },
            defibrillators: { total: 20, available: 15 },
            ctScanners: { total: 2, available: 1 },
            mriMachines: { total: 1, available: 1 },
            xrayMachines: { total: 6, available: 5 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "busy",
            queueLength: 8,
            avgWaitTime: 30
        }
    },
    {
        basicInfo: {
            name: "Fortis Hospital Cunningham Road",
            address: "Cunningham Road, Bangalore",
            phoneNumber: "+91-80-6621-4444",
            email: "cunningham@fortishealthcare.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 5)
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: false,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "orthopedics", "neurology"]
        },
        specialists: {
            traumaSurgeon: { count: 3, available: 3 },
            cardiologist: { count: 4, available: 3 },
            neurologist: { count: 3, available: 2 },
            orthopedicSurgeon: { count: 5, available: 4 },
            burnSpecialist: { count: 2, available: 1 },
            pediatrician: { count: 3, available: 2 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 30, available: 5, occupied: 25 },
                general: { total: 120, available: 25, occupied: 95 },
                emergency: { total: 20, available: 4, occupied: 16 },
                isolation: { total: 12, available: 3, occupied: 9 }
            }
        },
        equipment: {
            ventilators: { total: 35, available: 8 },
            defibrillators: { total: 18, available: 14 },
            ctScanners: { total: 2, available: 1 },
            mriMachines: { total: 1, available: 0 },
            xrayMachines: { total: 5, available: 4 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 3,
            avgWaitTime: 18
        }
    },
    {
        basicInfo: {
            name: "Columbia Asia Hospital Whitefield",
            address: "Survey No. 10P, Whitefield, Bangalore",
            phoneNumber: "+91-80-6696-0000",
            email: "whitefield@columbiaasia.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 12)
        },
        traumaLevel: "level_3",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "orthopedics", "pediatrics"]
        },
        specialists: {
            traumaSurgeon: { count: 2, available: 1 },
            cardiologist: { count: 3, available: 2 },
            neurologist: { count: 2, available: 1 },
            orthopedicSurgeon: { count: 3, available: 2 },
            pediatrician: { count: 4, available: 3 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 20, available: 4, occupied: 16 },
                general: { total: 100, available: 20, occupied: 80 },
                emergency: { total: 15, available: 3, occupied: 12 },
                isolation: { total: 10, available: 2, occupied: 8 }
            }
        },
        equipment: {
            ventilators: { total: 25, available: 6 },
            defibrillators: { total: 15, available: 12 },
            ctScanners: { total: 1, available: 1 },
            mriMachines: { total: 1, available: 0 },
            xrayMachines: { total: 4, available: 3 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 2,
            avgWaitTime: 12
        }
    },
    {
        basicInfo: {
            name: "Narayana Health City",
            address: "258/A, Bommasandra, Bangalore",
            phoneNumber: "+91-80-7122-2222",
            email: "enquiry@narayanahealth.org",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 14)
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: true,
            specializations: ["cardiology", "neurology", "oncology", "trauma"]
        },
        specialists: {
            traumaSurgeon: { count: 6, available: 5 },
            cardiologist: { count: 10, available: 8 },
            neurologist: { count: 5, available: 4 },
            orthopedicSurgeon: { count: 7, available: 6 },
            burnSpecialist: { count: 3, available: 3 },
            pediatrician: { count: 6, available: 5 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 80, available: 25, occupied: 55 },
                general: { total: 300, available: 80, occupied: 220 },
                emergency: { total: 50, available: 15, occupied: 35 },
                isolation: { total: 30, available: 10, occupied: 20 }
            }
        },
        equipment: {
            ventilators: { total: 80, available: 25 },
            defibrillators: { total: 40, available: 35 },
            ctScanners: { total: 5, available: 4 },
            mriMachines: { total: 3, available: 2 },
            xrayMachines: { total: 12, available: 10 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 5,
            avgWaitTime: 18
        }
    },
    {
        basicInfo: {
            name: "Sakra World Hospital",
            address: "Devarabeesanahalli, Varthur Hobli, Bangalore",
            phoneNumber: "+91-80-4969-4969",
            email: "info@sakraworldhospital.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 9)
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "neurology", "orthopedics"]
        },
        specialists: {
            traumaSurgeon: { count: 4, available: 3 },
            cardiologist: { count: 5, available: 4 },
            neurologist: { count: 3, available: 3 },
            orthopedicSurgeon: { count: 5, available: 4 },
            pediatrician: { count: 4, available: 3 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 40, available: 10, occupied: 30 },
                general: { total: 180, available: 40, occupied: 140 },
                emergency: { total: 28, available: 7, occupied: 21 },
                isolation: { total: 18, available: 5, occupied: 13 }
            }
        },
        equipment: {
            ventilators: { total: 45, available: 12 },
            defibrillators: { total: 22, available: 18 },
            ctScanners: { total: 3, available: 2 },
            mriMachines: { total: 2, available: 1 },
            xrayMachines: { total: 7, available: 6 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 4,
            avgWaitTime: 16
        }
    },
    {
        basicInfo: {
            name: "BGS Gleneagles Global Hospital",
            address: "Kengeri, Bangalore",
            phoneNumber: "+91-80-4969-8888",
            email: "contact@bgsglobalhospital.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 11)
        },
        traumaLevel: "level_3",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "orthopedics"]
        },
        specialists: {
            traumaSurgeon: { count: 2, available: 2 },
            cardiologist: { count: 4, available: 3 },
            orthopedicSurgeon: { count: 4, available: 3 },
            pediatrician: { count: 3, available: 2 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 25, available: 6, occupied: 19 },
                general: { total: 110, available: 25, occupied: 85 },
                emergency: { total: 18, available: 5, occupied: 13 },
                isolation: { total: 8, available: 2, occupied: 6 }
            }
        },
        equipment: {
            ventilators: { total: 28, available: 7 },
            defibrillators: { total: 16, available: 13 },
            ctScanners: { total: 2, available: 1 },
            mriMachines: { total: 1, available: 1 },
            xrayMachines: { total: 5, available: 4 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 3,
            avgWaitTime: 14
        }
    },
    {
        basicInfo: {
            name: "Aster CMI Hospital",
            address: "43/2, New Airport Road, Bangalore",
            phoneNumber: "+91-80-4344-4444",
            email: "bangalore@astercmi.com",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 7)
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "neurology", "oncology"]
        },
        specialists: {
            traumaSurgeon: { count: 3, available: 2 },
            cardiologist: { count: 6, available: 5 },
            neurologist: { count: 4, available: 3 },
            orthopedicSurgeon: { count: 4, available: 3 },
            burnSpecialist: { count: 2, available: 2 },
            pediatrician: { count: 4, available: 3 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 38, available: 9, occupied: 29 },
                general: { total: 160, available: 35, occupied: 125 },
                emergency: { total: 24, available: 6, occupied: 18 },
                isolation: { total: 16, available: 4, occupied: 12 }
            }
        },
        equipment: {
            ventilators: { total: 42, available: 11 },
            defibrillators: { total: 20, available: 16 },
            ctScanners: { total: 2, available: 2 },
            mriMachines: { total: 2, available: 1 },
            xrayMachines: { total: 6, available: 5 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "available",
            queueLength: 5,
            avgWaitTime: 19
        }
    },
    {
        basicInfo: {
            name: "Sagar Hospital Banashankari",
            address: "DSI Cross, Banashankari, Bangalore",
            phonePhone: "+91-80-2661-2900",
            email: "info@sagarhospitals.in",
            hospitalType: "multi_specialty",
            location: randomLocation(BANGALORE_CENTER, 8)
        },
        traumaLevel: "level_3",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["orthopedics", "pediatrics"]
        },
        specialists: {
            traumaSurgeon: { count: 2, available: 1 },
            orthopedicSurgeon: { count: 3, available: 2 },
            pediatrician: { count: 5, available: 4 }
        },
        capacity: {
            bedsByType: {
                icu: { total: 18, available: 3, occupied: 15 },
                general: { total: 90, available: 18, occupied: 72 },
                emergency: { total: 12, available: 3, occupied: 9 },
                isolation: { total: 6, available: 1, occupied: 5 }
            }
        },
        equipment: {
            ventilators: { total: 20, available: 5 },
            defibrillators: { total: 12, available: 10 },
            ctScanners: { total: 1, available: 1 },
            mriMachines: { total: 0, available: 0 },
            xrayMachines: { total: 4, available: 3 }
        },
        emergencyReadiness: {
            acceptingCases: true,
            status: "busy",
            queueLength: 7,
            avgWaitTime: 25
        }
    }
];

const AMBULANCES = [
    {
        vehicleNumber: "KA-01-EMS-1001",
        type: "ALS",
        baseStation: "Koramangala Fire Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 5),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1002",
        type: "ALS",
        baseStation: "Indiranagar Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 7),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1003",
        type: "BLS",
        baseStation: "Whitefield Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 10),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1004",
        type: "BLS",
        baseStation: "Jayanagar Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 6),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1005",
        type: "ALS",
        baseStation: "Electronic City Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 12),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1006",
        type: "BLS",
        baseStation: "Marathahalli Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 8),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1007",
        type: "ALS",
        baseStation: "Hebbal Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 9),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "KA-01-EMS-1008",
        type: "BLS",
        baseStation: "Banashankari Station",
        currentLocation: randomLocation(BANGALORE_CENTER, 7),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    }
];

const EMERGENCY_CASES = [
    {
        patientName: "Rajesh Kumar",
        patientAge: 45,
        patientGender: "male",
        acuityLevel: 5,
        emergencyContext: {
            emergencyType: "cardiac",
            incidentTimestamp: new Date(Date.now() - 10 * 60000), // 10 minutes ago
            symptoms: ["chest pain", "shortness of breath", "sweating"],
            chiefComplaint: "Severe chest pain radiating to left arm"
        },
        vitals: {
            bloodPressure: { systolic: 160, diastolic: 95 },
            heartRate: 115,
            respiratoryRate: 24,
            oxygenSaturation: 92,
            temperature: 37.2,
            glasgowComaScale: 15
        },
        pickupLocation: randomLocation(BANGALORE_CENTER, 5),
        requiredCapabilities: {
            hasCathLab: true,
            hasICU: true
        },
        requiredEquipment: ["defibrillator", "ventilator"],
        createdAt: new Date()
    },
    {
        patientName: "Priya Sharma",
        patientAge: 28,
        patientGender: "female",
        acuityLevel: 4,
        emergencyContext: {
            emergencyType: "trauma",
            incidentTimestamp: new Date(Date.now() - 25 * 60000), // 25 minutes ago
            symptoms: ["head injury", "bleeding", "confusion"],
            chiefComplaint: "Road traffic accident with head trauma"
        },
        vitals: {
            bloodPressure: { systolic: 110, diastolic: 70 },
            heartRate: 98,
            respiratoryRate: 20,
            oxygenSaturation: 96,
            temperature: 36.8,
            glasgowComaScale: 13
        },
        pickupLocation: randomLocation(BANGALORE_CENTER, 8),
        requiredCapabilities: {
            hasTraumaCenter: true,
            hasICU: true
        },
        requiredEquipment: [],
        createdAt: new Date()
    },
    {
        patientName: "Mohammed Ali",
        patientAge: 62,
        patientGender: "male",
        acuityLevel: 3,
        emergencyContext: {
            emergencyType: "medical",
            incidentTimestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
            symptoms: ["difficulty breathing", "wheezing", "fever"],
            chiefComplaint: "Acute respiratory distress"
        },
        vitals: {
            bloodPressure: { systolic: 135, diastolic: 85 },
            heartRate: 88,
            respiratoryRate: 28,
            oxygenSaturation: 88,
            temperature: 38.5,
            glasgowComaScale: 15
        },
        pickupLocation: randomLocation(BANGALORE_CENTER, 6),
        requiredCapabilities: {
            hasICU: true
        },
        requiredEquipment: ["ventilator"],
        createdAt: new Date()
    },
    {
        patientName: "Lakshmi Devi",
        patientAge: 35,
        patientGender: "female",
        acuityLevel: 4,
        emergencyContext: {
            emergencyType: "burn",
            incidentTimestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
            symptoms: ["burns", "pain", "shock"],
            chiefComplaint: "Thermal burns covering 25% body surface area"
        },
        vitals: {
            bloodPressure: { systolic: 105, diastolic: 65 },
            heartRate: 105,
            respiratoryRate: 22,
            oxygenSaturation: 94,
            temperature: 36.5,
            glasgowComaScale: 14
        },
        pickupLocation: randomLocation(BANGALORE_CENTER, 9),
        requiredCapabilities: {
            hasBurnUnit: true,
            hasICU: true
        },
        requiredEquipment: [],
        createdAt: new Date()
    },
    {
        patientName: "Arjun Reddy",
        patientAge: 19,
        patientGender: "male",
        acuityLevel: 3,
        emergencyContext: {
            emergencyType: "accident",
            incidentTimestamp: new Date(Date.now() - 20 * 60000), // 20 minutes ago
            symptoms: ["leg fracture", "bleeding", "pain"],
            chiefComplaint: "Motorcycle accident with suspected femur fracture"
        },
        vitals: {
            bloodPressure: { systolic: 120, diastolic: 78 },
            heartRate: 92,
            respiratoryRate: 18,
            oxygenSaturation: 97,
            temperature: 37.0,
            glasgowComaScale: 15
        },
        pickupLocation: randomLocation(BANGALORE_CENTER, 11),
        requiredCapabilities: {
            hasTraumaCenter: false,
            hasICU: false
        },
        requiredEquipment: [],
        createdAt: new Date()
    }
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function clearCollection(collectionName) {
    console.log(`🗑️  Clearing ${collectionName} collection...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}`);
}

async function seedHospitals() {
    console.log('\n🏥 Seeding hospitals...');

    for (const hospital of HOSPITALS) {
        const docRef = await addDoc(collection(db, 'hospitals'), {
            ...hospital,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log(`  ✓ Added ${hospital.basicInfo.name} (${docRef.id})`);
    }

    console.log(`✅ Seeded ${HOSPITALS.length} hospitals`);
}

async function seedAmbulances() {
    console.log('\n🚑 Seeding ambulances...');

    for (const ambulance of AMBULANCES) {
        const docRef = await addDoc(collection(db, 'ambulances'), {
            ...ambulance,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log(`  ✓ Added ${ambulance.vehicleNumber} (${ambulance.type}) - ${docRef.id}`);
    }

    console.log(`✅ Seeded ${AMBULANCES.length} ambulances`);
}

async function seedEmergencyCases() {
    console.log('\n🚨 Seeding emergency cases...');

    for (const emergencyCase of EMERGENCY_CASES) {
        const docRef = await addDoc(collection(db, 'emergencyCases'), {
            ...emergencyCase,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log(`  ✓ Added case for ${emergencyCase.patientName} (${emergencyCase.emergencyContext.emergencyType}) - ${docRef.id}`);
    }

    console.log(`✅ Seeded ${EMERGENCY_CASES.length} emergency cases`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('🌱 Firestore Seeding Script for EMS Routing Platform');
    console.log('='.repeat(60));

    try {
        // Clear existing data
        await clearCollection('hospitals');
        await clearCollection('ambulances');
        await clearCollection('emergencyCases');

        // Seed new data
        await seedHospitals();
        await seedAmbulances();
        await seedEmergencyCases();

        console.log('\n✅ Seeding completed successfully!');
        console.log('\nData Summary:');
        console.log(`  🏥 ${HOSPITALS.length} hospitals`);
        console.log(`  🚑 ${AMBULANCES.length} ambulances`);
        console.log(`  🚨 ${EMERGENCY_CASES.length} emergency cases`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
