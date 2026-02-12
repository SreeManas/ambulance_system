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
import { getFirestore, collection, addDoc, serverTimestamp, deleteDoc, getDocs, doc, setDoc } from 'firebase/firestore';
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
const HYDERABAD_CENTER = [78.4867, 17.3850];

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

function randomHyderabadLocation(radiusKm = 20) {
    return randomLocation(HYDERABAD_CENTER, radiusKm);
}

// =============================================================================
// REALISTIC DATA GENERATORS (Sprint-2)
// =============================================================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAvailable(total, minAvail, maxAvail) {
    const available = randomInt(minAvail, maxAvail);
    return Math.min(available, total);
}

function generateBedAvailability() {
    const total = randomInt(100, 800);
    const available = randomAvailable(total, 20, 200);
    const icuTotal = randomInt(10, 60);
    const emergencyTotal = randomInt(20, 80);
    const traumaTotal = randomInt(10, 40);
    const isolationTotal = randomInt(5, 20);
    const pediatricTotal = randomInt(5, 25);

    return {
        total,
        available,
        icu: { total: icuTotal, available: randomAvailable(icuTotal, 2, 15) },
        emergency: { total: emergencyTotal, available: randomAvailable(emergencyTotal, 5, 25) },
        traumaBeds: { total: traumaTotal, available: randomAvailable(traumaTotal, 2, 12) },
        isolationBeds: { total: isolationTotal, available: randomAvailable(isolationTotal, 1, 6) },
        pediatricBeds: { total: pediatricTotal, available: randomAvailable(pediatricTotal, 1, 8) }
    };
}

function generateSpecialists() {
    return {
        traumaSurgeon: { count: randomInt(2, 12), available: randomInt(1, 6) },
        cardiologist: { count: randomInt(2, 10), available: randomInt(1, 5) },
        neurologist: { count: randomInt(1, 6), available: randomInt(1, 3) },
        orthopedicSurgeon: { count: randomInt(1, 8), available: randomInt(1, 4) },
        burnSpecialist: { count: randomInt(0, 4), available: randomInt(0, 2) },
        pediatrician: { count: randomInt(2, 8), available: randomInt(1, 4) },
        pulmonologist: { count: randomInt(1, 5), available: randomInt(1, 3) },
        radiologist: { count: randomInt(2, 6), available: randomInt(1, 3) }
    };
}

function generateEquipment() {
    const ventTotal = randomInt(5, 30);
    const defibTotal = randomInt(2, 10);
    const dialysisTotal = randomInt(1, 6);
    const ctTotal = randomInt(1, 4);
    const mriTotal = randomInt(1, 3);
    const xrayTotal = randomInt(2, 10);

    return {
        ventilators: { total: ventTotal, available: randomAvailable(ventTotal, 2, 15) },
        defibrillators: { total: defibTotal, available: randomAvailable(defibTotal, 1, 6) },
        dialysisMachines: { total: dialysisTotal, available: randomAvailable(dialysisTotal, 0, 3) },
        ctScanners: { total: ctTotal, available: randomAvailable(ctTotal, 0, 2) },
        mriMachines: { total: mriTotal, available: randomAvailable(mriTotal, 0, 2) },
        xrayMachines: { total: xrayTotal, available: randomAvailable(xrayTotal, 1, 6) }
    };
}

function generateEmergencyReadiness() {
    const statuses = ['accepting', 'accepting', 'accepting', 'diverting', 'full'];
    const status = statuses[randomInt(0, statuses.length - 1)];
    return {
        status,
        diversionStatus: status === 'diverting',
        ambulanceQueue: randomInt(0, 12),
        acceptingCases: status !== 'full',
        avgWaitTime: randomInt(5, 45)
    };
}

function generateCaseAcceptance() {
    const acceptance = {
        acceptsTrauma: Math.random() > 0.2,
        acceptsCardiac: Math.random() > 0.2,
        acceptsBurns: Math.random() > 0.5,
        acceptsPediatric: Math.random() > 0.3,
        acceptsInfectious: Math.random() > 0.4
    };
    // Ensure at least one is true
    if (!Object.values(acceptance).some(v => v)) {
        acceptance.acceptsTrauma = true;
    }
    return acceptance;
}

function generateExtendedProfile() {
    const accreditations = ['NABH', 'JCI', 'ISO 9001', 'NABL'];
    const certifications = ['ACS Verified Trauma Center', 'Stroke Certified', 'Cardiac Care Certified', 'Burn Center Verified'];
    const insuranceList = ['Star Health', 'ICICI Lombard', 'Max Bupa', 'HDFC Ergo', 'New India Assurance', 'Bajaj Allianz'];
    const programs = ['24/7 Emergency', 'Air Ambulance Network', 'Telemedicine Support', 'Mobile ICU', 'Disaster Response Team'];

    return {
        accreditation: accreditations.filter(() => Math.random() > 0.5),
        traumaCertifications: certifications.filter(() => Math.random() > 0.6),
        insurancePartners: insuranceList.filter(() => Math.random() > 0.4),
        emergencyCoordinators: [
            { name: `Dr. ${['Sharma', 'Patel', 'Reddy', 'Kumar', 'Singh'][randomInt(0, 4)]}`, phone: `+91-98${randomInt(10000000, 99999999)}` }
        ],
        specialPrograms: programs.filter(() => Math.random() > 0.5)
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

// =============================================================================
// HYDERABAD HOSPITALS (Multi-City Expansion)
// =============================================================================

const HYDERABAD_HOSPITALS = [
    // Gachibowli / Hi-Tech City Zone (5 hospitals)
    {
        basicInfo: {
            name: "Apollo Hospitals Jubilee Hills",
            address: "Road No. 72, Film Nagar, Jubilee Hills, Hyderabad",
            phoneNumber: "+91-40-2360-7777",
            email: "jubileehills@apollohospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4326, longitude: 78.4071 }
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
            specializations: ["cardiology", "neurology", "orthopedics", "trauma", "oncology"]
        }
    },
    {
        basicInfo: {
            name: "Continental Hospitals Gachibowli",
            address: "IT Park Road, Nanakramguda, Gachibowli, Hyderabad",
            phoneNumber: "+91-40-6716-6666",
            email: "gachibowli@continentalhospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4239, longitude: 78.3492 }
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
            specializations: ["cardiology", "neurology", "trauma", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "AIG Hospitals Gachibowli",
            address: "Survey No 136, Plot No 2/3/4/5, Mindspace Road, Gachibowli, Hyderabad",
            phoneNumber: "+91-40-4244-4222",
            email: "info@aighospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4418, longitude: 78.3740 }
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "neurology", "gastroenterology"]
        }
    },
    {
        basicInfo: {
            name: "Sunshine Hospitals Gachibowli",
            address: "PG Road, Beside Paradise Hotel, Gachibowli, Hyderabad",
            phoneNumber: "+91-40-4424-2424",
            email: "gachibowli@sunshinehospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4403, longitude: 78.3489 }
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
            specializations: ["orthopedics", "gastroenterology", "pulmonology"]
        }
    },
    {
        basicInfo: {
            name: "Care Hospitals Hitech City",
            address: "Old Mumbai Highway, Near Cyber Towers, Hitech City, Hyderabad",
            phoneNumber: "+91-40-6165-6565",
            email: "hitechcity@carehospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4485, longitude: 78.3908 }
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
            specializations: ["cardiology", "neurology", "trauma", "nephrology"]
        }
    },

    // Banjara Hills / Jubilee Hills Zone (5 hospitals)
    {
        basicInfo: {
            name: "Care Hospitals Banjara Hills",
            address: "Road No. 1, Banjara Hills, Hyderabad",
            phoneNumber: "+91-40-6810-6589",
            email: "banjarahills@carehospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4239, longitude: 78.4482 }
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
            specializations: ["cardiology", "trauma", "neurology", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "Rainbow Children's Hospital Banjara Hills",
            address: "Road No. 10, Banjara Hills, Hyderabad",
            phoneNumber: "+91-40-4989-4989",
            email: "banjarahills@rainbowhospitals.in",
            hospitalType: "pediatric",
            city: "Hyderabad",
            location: { latitude: 17.4180, longitude: 78.4479 }
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["pediatrics", "neonatology"]
        }
    },
    {
        basicInfo: {
            name: "Fernandez Hospital Bogulkunta",
            address: "4-1-1230, Bogulkunta, Hyderabad",
            phoneNumber: "+91-40-4780-9999",
            email: "bogulkunta@fernandezhospital.com",
            hospitalType: "specialty",
            city: "Hyderabad",
            location: { latitude: 17.3984, longitude: 78.4829 }
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
            specializations: ["gynecology", "obstetrics", "neonatology"]
        }
    },
    {
        basicInfo: {
            name: "Asian Institute of Gastroenterology",
            address: "6-3-661, Somajiguda, Hyderabad",
            phoneNumber: "+91-40-2337-8888",
            email: "info@aigihyd.com",
            hospitalType: "specialty",
            city: "Hyderabad",
            location: { latitude: 17.4284, longitude: 78.4573 }
        },
        traumaLevel: "level_3",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["gastroenterology", "hepatology"]
        }
    },
    {
        basicInfo: {
            name: "KIMS Hospital Somajiguda",
            address: "1-8-31/1, Minister Road, Secunderabad",
            phoneNumber: "+91-40-4455-5566",
            email: "somajiguda@kimshospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4310, longitude: 78.4630 }
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
            specializations: ["cardiology", "neurology", "trauma", "orthopedics"]
        }
    },

    // Secunderabad Zone (4 hospitals)
    {
        basicInfo: {
            name: "Yashoda Hospitals Secunderabad",
            address: "SP Road, Near Mettuguda, Secunderabad",
            phoneNumber: "+91-40-4475-5055",
            email: "secunderabad@yashodahospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4416, longitude: 78.5013 }
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
            specializations: ["cardiology", "neurology", "trauma", "nephrology"]
        }
    },
    {
        basicInfo: {
            name: "KIMS Hospital Secunderabad",
            address: "1-112, Survey No. 55/E, Kondapur, Secunderabad",
            phoneNumber: "+91-40-4455-1234",
            email: "secunderabad@kimshospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4434, longitude: 78.5023 }
        },
        traumaLevel: "level_1",
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
        }
    },
    {
        basicInfo: {
            name: "Gandhi Hospital",
            address: "Musheerabad, Secunderabad",
            phoneNumber: "+91-40-2760-7777",
            email: "info@gandhihospital.gov.in",
            hospitalType: "government",
            city: "Hyderabad",
            location: { latitude: 17.4462, longitude: 78.4969 }
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: false,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["trauma", "infectious_disease", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "Omni Hospital Kukatpally",
            address: "Road No. 2, Kukatpally, Hyderabad",
            phoneNumber: "+91-40-4488-8888",
            email: "kukatpally@omnihospital.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4849, longitude: 78.4138 }
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
            specializations: ["cardiology", "orthopedics", "gastroenterology"]
        }
    },

    // Ameerpet / Kukatpally Zone (4 hospitals)
    {
        basicInfo: {
            name: "Yashoda Hospitals Malakpet",
            address: "Nalgonda X Roads, Malakpet, Hyderabad",
            phoneNumber: "+91-40-6677-2222",
            email: "malakpet@yashodahospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.3953, longitude: 78.5260 }
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
            specializations: ["cardiology", "trauma", "neurology", "nephrology"]
        }
    },
    {
        basicInfo: {
            name: "MaxCure Hospitals Madhapur",
            address: "Dwarakapuri Colony, Punjagutta, Hyderabad",
            phoneNumber: "+91-40-6677-7777",
            email: "madhapur@maxcurehospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4434, longitude: 78.3915 }
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
            specializations: ["cardiology", "orthopedics", "pulmonology"]
        }
    },
    {
        basicInfo: {
            name: "Citizens Hospital Nallagandla",
            address: "Near Lingampally, Nallagandla, Hyderabad",
            phoneNumber: "+91-40-6662-6666",
            email: "nallagandla@citizenshospital.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4561, longitude: 78.3480 }
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["orthopedics", "gastroenterology", "general_surgery"]
        }
    },
    {
        basicInfo: {
            name: "Apollo Cradle Kondapur",
            address: "Sithaphalmandi, Kondapur, Hyderabad",
            phoneNumber: "+91-40-4466-3366",
            email: "kondapur@apollocradle.com",
            hospitalType: "specialty",
            city: "Hyderabad",
            location: { latitude: 17.4754, longitude: 78.3638 }
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
            specializations: ["gynecology", "obstetrics", "pediatrics", "neonatology"]
        }
    },

    // LB Nagar / Uppal Zone (4 hospitals)
    {
        basicInfo: {
            name: "Sunshine Hospitals LB Nagar",
            address: "Beside Reliance Trends, LB Nagar, Hyderabad",
            phoneNumber: "+91-40-6677-5555",
            email: "lbnagar@sunshinehospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.3501, longitude: 78.5526 }
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
            specializations: ["cardiology", "trauma", "neurology", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "Kamineni Hospitals LB Nagar",
            address: "LB Nagar, Hyderabad",
            phoneNumber: "+91-40-2420-3000",
            email: "lbnagar@kamineihospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.3512, longitude: 78.5534 }
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
            specializations: ["cardiology", "orthopedics", "general_surgery"]
        }
    },
    {
        basicInfo: {
            name: "Star Hospitals Uppal",
            address: "Near ECIL X Roads, Uppal, Hyderabad",
            phoneNumber: "+91-40-4477-4477",
            email: "uppal@starhospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4054, longitude: 78.5584 }
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
            specializations: ["cardiology", "nephrology", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "Global Hospitals Lakdikapul",
            address: "Lakdi-Ka-Pool, Hyderabad",
            phoneNumber: "+91-40-2330-7777",
            email: "lakdikapul@globalhospitalsindia.com",
            hospitalType: "specialty",
            city: "Hyderabad",
            location: { latitude: 17.4011, longitude: 78.4610 }
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["liver_transplant", "multi_organ_transplant", "gastroenterology"]
        }
    },

    // Mehdipatnam / Koti / Abids Zone (3 hospitals)
    {
        basicInfo: {
            name: "NIMS (Nizams Institute of Medical Sciences)",
            address: "Punjagutta, Hyderabad",
            phoneNumber: "+91-40-2348-9000",
            email: "info@nims.edu.in",
            hospitalType: "government",
            city: "Hyderabad",
            location: { latitude: 17.4239, longitude: 78.4490 }
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
            specializations: ["cardiology", "neurology", "trauma", "nephrology", "oncology"]
        }
    },
    {
        basicInfo: {
            name: "Osmania General Hospital",
            address: "Afzal Gunj, Hyderabad",
            phoneNumber: "+91-40-2460-7777",
            email: "info@osmaniahospital.gov.in",
            hospitalType: "government",
            city: "Hyderabad",
            location: { latitude: 17.3730, longitude: 78.4772 }
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: true,
            hasNICU: false,
            hasCathLab: true,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["trauma", "general_surgery", "infectious_disease", "orthopedics"]
        }
    },
    {
        basicInfo: {
            name: "Apollo Hospitals Hyderguda",
            address: "1-10-11/1, Begumpet, Hyderguda, Hyderabad",
            phoneNumber: "+91-40-2378-8888",
            email: "hyderguda@apollohospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4344, longitude: 78.4689 }
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
            specializations: ["cardiology", "neurology", "orthopedics", "trauma", "oncology"]
        }
    },

    // Begumpet / Tarnaka / Miyapur Zone (5 hospitals)
    {
        basicInfo: {
            name: "KIMS Hospital Kondapur",
            address: "Beside Botanical Garden, Kondapur, Hyderabad",
            phoneNumber: "+91-40-4800-8000",
            email: "kondapur@kimshospitals.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4742, longitude: 78.3684 }
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
            specializations: ["cardiology", "neurology", "trauma", "nephrology"]
        }
    },
    {
        basicInfo: {
            name: "Medicover Hospitals Madhapur",
            address: "Behind Cyber Towers, Madhapur, Hyderabad",
            phoneNumber: "+91-40-6810-5555",
            email: "madhapur@medicoverhospitals.in",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4483, longitude: 78.3915 }
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
            specializations: ["cardiology", "orthopedics", "gastroenterology"]
        }
    },
    {
        basicInfo: {
            name: "Aware Gleneagles Global Hospital",
            address: "Lakdikapul, Hyderabad",
            phoneNumber: "+91-40-6633-3333",
            email: "lakdikapul@awaregleneagles.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.4011, longitude: 78.4593 }
        },
        traumaLevel: "level_1",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: true,
            hasCathLab: true,
            hasStrokeCenter: true,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["cardiology", "neurology", "nephrology", "multi_organ_transplant"]
        }
    },
    {
        basicInfo: {
            name: "Mythri Hospital Mehdipatnam",
            address: "6-1-1040/1, Beside Mythri Nagar, Mehdipatnam, Hyderabad",
            phoneNumber: "+91-40-2343-0303",
            email: "mehdipatnam@mythrihospital.com",
            hospitalType: "multi_specialty",
            city: "Hyderabad",
            location: { latitude: 17.3972, longitude: 78.4413 }
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: true,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["orthopedics", "general_surgery", "pulmonology"]
        }
    },
    {
        basicInfo: {
            name: "Omega Hospitals Banjara Hills",
            address: "Road No. 12, Banjara Hills, Hyderabad",
            phoneNumber: "+91-40-3021-1111",
            email: "banjarahills@omegahospitals.com",
            hospitalType: "specialty",
            city: "Hyderabad",
            location: { latitude: 17.4193, longitude: 78.4501 }
        },
        traumaLevel: "level_2",
        capabilities: {
            hasTraumaCenter: false,
            hasICU: true,
            hasBurnUnit: false,
            hasNICU: false,
            hasCathLab: false,
            hasStrokeCenter: false,
            hasEmergencyRoom: true,
            hasHelicopterPad: false,
            specializations: ["oncology", "radiation_oncology", "surgical_oncology"]
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

// =============================================================================
// HYDERABAD AMBULANCES (Multi-City Expansion)
// =============================================================================

const HYDERABAD_AMBULANCES = [
    {
        vehicleNumber: "HYD-AMB-001",
        type: "ALS",
        baseStation: "Apollo Hospitals Jubilee Hills",
        currentLocation: randomHyderabadLocation(8),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-002",
        type: "ALS",
        baseStation: "Yashoda Hospitals Secunderabad",
        currentLocation: randomHyderabadLocation(10),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-003",
        type: "BLS",
        baseStation: "NIMS Hyderabad",
        currentLocation: randomHyderabadLocation(6),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-004",
        type: "ALS",
        baseStation: "Continental Hospitals Gachibowli",
        currentLocation: randomHyderabadLocation(12),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-005",
        type: "BLS",
        baseStation: "Care Hospitals Banjara Hills",
        currentLocation: randomHyderabadLocation(7),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-006",
        type: "ALS",
        baseStation: "AIG Hospitals Gachibowli",
        currentLocation: randomHyderabadLocation(9),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-007",
        type: "BLS",
        baseStation: "Sunshine Hospitals Gachibowli",
        currentLocation: randomHyderabadLocation(5),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-008",
        type: "ALS",
        baseStation: "KIMS Hospital Secunderabad",
        currentLocation: randomHyderabadLocation(11),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-009",
        type: "BLS",
        baseStation: "Gandhi Hospital",
        currentLocation: randomHyderabadLocation(8),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-010",
        type: "ALS",
        baseStation: "Osmania General Hospital",
        currentLocation: randomHyderabadLocation(7),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-011",
        type: "ALS",
        baseStation: "Sunshine Hospitals LB Nagar",
        currentLocation: randomHyderabadLocation(15),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-012",
        type: "BLS",
        baseStation: "Yashoda Hospitals Malakpet",
        currentLocation: randomHyderabadLocation(14),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-013",
        type: "ALS",
        baseStation: "Care Hospitals Hitech City",
        currentLocation: randomHyderabadLocation(6),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-014",
        type: "BLS",
        baseStation: "MaxCure Hospitals Madhapur",
        currentLocation: randomHyderabadLocation(8),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-015",
        type: "ALS",
        baseStation: "KIMS Hospital Kondapur",
        currentLocation: randomHyderabadLocation(10),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-016",
        type: "BLS",
        baseStation: "Global Hospitals Lakdikapul",
        currentLocation: randomHyderabadLocation(9),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-017",
        type: "ALS",
        baseStation: "Apollo Hospitals Hyderguda",
        currentLocation: randomHyderabadLocation(11),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-018",
        type: "ALS",
        baseStation: "Star Hospitals Uppal",
        currentLocation: randomHyderabadLocation(13),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-019",
        type: "BLS",
        baseStation: "Kamineni Hospitals LB Nagar",
        currentLocation: randomHyderabadLocation(16),
        status: "available",
        equipment: ["defibrillator", "oxygen", "first_aid"],
        crew: { paramedics: 1, driver: 1 }
    },
    {
        vehicleNumber: "HYD-AMB-020",
        type: "ALS",
        baseStation: "Aware Gleneagles Global Hospital",
        currentLocation: randomHyderabadLocation(7),
        status: "available",
        equipment: ["ventilator", "defibrillator", "cardiac_monitor", "oxygen"],
        crew: { paramedics: 2, driver: 1 }
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

// =============================================================================
// DEMO USERS FOR RBAC
// =============================================================================

const DEMO_USERS = [
    {
        uid: 'demo-paramedic-001',
        name: 'Raj Kumar',
        email: 'paramedic@ems-demo.com',
        role: 'paramedic',
        organization: 'Bangalore EMS Unit 1',
    },
    {
        uid: 'demo-dispatcher-001',
        name: 'Priya Sharma',
        email: 'dispatcher@ems-demo.com',
        role: 'dispatcher',
        organization: 'Central Command Center',
    },
    {
        uid: 'demo-hospital-admin-001',
        name: 'Dr. Anil Mehta',
        email: 'hospital@ems-demo.com',
        role: 'hospital_admin',
        organization: 'Apollo Hospital Bangalore',
    },
    {
        uid: 'demo-admin-001',
        name: 'System Administrator',
        email: 'admin@ems-demo.com',
        role: 'admin',
        organization: 'EMS Router Platform',
    }
];

async function clearCollection(collectionName) {
    console.log(`🗑️  Clearing ${collectionName} collection...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}`);
}

async function seedUsers() {
    console.log('\n👤 Seeding demo users for RBAC...');

    for (const user of DEMO_USERS) {
        await setDoc(doc(db, 'users', user.uid), {
            ...user,
            createdAt: serverTimestamp()
        });
        console.log(`  ✓ Added ${user.role}: ${user.email}`);
    }

    console.log(`✅ Seeded ${DEMO_USERS.length} demo users`);
}

async function seedBangaloreHospitals() {
    console.log('\n🏥 Seeding Bangalore hospitals with realistic data...');

    for (const hospital of HOSPITALS) {
        // Generate realistic data using Sprint-2 generators
        const realisticData = {
            ...hospital,
            // Override static data with dynamically generated realistic values
            bedAvailability: generateBedAvailability(),
            specialists: generateSpecialists(),
            equipment: generateEquipment(),
            caseAcceptance: generateCaseAcceptance(),
            emergencyReadiness: generateEmergencyReadiness(),
            extendedProfile: generateExtendedProfile(),
            capacityLastUpdated: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'hospitals'), realisticData);
        console.log(`  ✓ Added ${hospital.basicInfo.name} (${docRef.id})`);
        console.log(`    City: ${hospital.basicInfo.city || 'Bangalore'}`);
        console.log(`    Beds: ${realisticData.bedAvailability.total} total, ${realisticData.bedAvailability.available} available`);
        console.log(`    ICU: ${realisticData.bedAvailability.icu.total}/${realisticData.bedAvailability.icu.available}`);
    }

    console.log(`✅ Seeded ${HOSPITALS.length} Bangalore hospitals with realistic capacity data`);
}

async function seedHyderabadHospitals() {
    console.log('\n🏥 Seeding Hyderabad hospitals with realistic data...');

    for (const hospital of HYDERABAD_HOSPITALS) {
        // Generate realistic data using Sprint-2 generators
        const realisticData = {
            ...hospital,
            // Override static data with dynamically generated realistic values
            bedAvailability: generateBedAvailability(),
            specialists: generateSpecialists(),
            equipment: generateEquipment(),
            caseAcceptance: generateCaseAcceptance(),
            emergencyReadiness: generateEmergencyReadiness(),
            extendedProfile: generateExtendedProfile(),
            capacityLastUpdated: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'hospitals'), realisticData);
        console.log(`  ✓ Added ${hospital.basicInfo.name} (${docRef.id})`);
        console.log(`    City: ${hospital.basicInfo.city}`);
        console.log(`    Beds: ${realisticData.bedAvailability.total} total, ${realisticData.bedAvailability.available} available`);
        console.log(`    ICU: ${realisticData.bedAvailability.icu.total}/${realisticData.bedAvailability.icu.available}`);
    }

    console.log(`✅ Seeded ${HYDERABAD_HOSPITALS.length} Hyderabad hospitals with realistic capacity data`);
}

async function seedBangaloreAmbulances() {
    console.log('\n🚑 Seeding Bangalore ambulances...');

    for (const ambulance of AMBULANCES) {
        const docRef = await addDoc(collection(db, 'ambulances'), {
            ...ambulance,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log(`  ✓ Added ${ambulance.vehicleNumber} (${ambulance.type}) - ${docRef.id}`);
    }

    console.log(`✅ Seeded ${AMBULANCES.length} Bangalore ambulances`);
}

async function seedHyderabadAmbulances() {
    console.log('\n🚑 Seeding Hyderabad ambulances...');

    for (const ambulance of HYDERABAD_AMBULANCES) {
        const docRef = await addDoc(collection(db, 'ambulances'), {
            ...ambulance,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log(`  ✓ Added ${ambulance.vehicleNumber} (${ambulance.type}) - ${docRef.id}`);
    }

    console.log(`✅ Seeded ${HYDERABAD_AMBULANCES.length} Hyderabad ambulances`);
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
    console.log('🌍 Multi-City Support: Bangalore + Hyderabad');
    console.log('='.repeat(60));

    try {
        // Clear existing data
        await clearCollection('hospitals');
        await clearCollection('ambulances');
        await clearCollection('emergencyCases');

        // Seed new data
        await seedUsers();  // Phase 2B: RBAC users

        // Seed Bangalore
        await seedBangaloreHospitals();
        await seedBangaloreAmbulances();

        // Seed Hyderabad
        await seedHyderabadHospitals();
        await seedHyderabadAmbulances();

        await seedEmergencyCases();

        console.log('\n✅ Seeding completed successfully!');
        console.log('\nData Summary:');
        console.log(`  👤 ${DEMO_USERS.length} demo users`);
        console.log(`  🏥 ${HOSPITALS.length + HYDERABAD_HOSPITALS.length} total hospitals (${HOSPITALS.length} Bangalore, ${HYDERABAD_HOSPITALS.length} Hyderabad)`);
        console.log(`  🚑 ${AMBULANCES.length + HYDERABAD_AMBULANCES.length} total ambulances (${AMBULANCES.length} Bangalore, ${HYDERABAD_AMBULANCES.length} Hyderabad)`);
        console.log(`  🚨 ${EMERGENCY_CASES.length} emergency cases`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
