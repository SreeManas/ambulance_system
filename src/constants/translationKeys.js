// src/constants/translationKeys.js
// Translation Key Mapping Architecture — Phase 11
//
// Purpose: Centralized translation key registry for the EMS platform.
// Each key maps to an English default string.
// The useT hook resolves keys → English text → Google Translate API.
//
// Usage:
//   import { TK } from '../constants/translationKeys';
//   const title = useT(TK.ROUTING_TITLE);

export const TK = {
    // ─── Navigation / Global ───────────────────────────────
    NAV_HOME: "Home",
    NAV_DASHBOARD: "Dashboard",
    NAV_ROUTING: "Routing",
    NAV_HOSPITALS: "Hospitals",
    NAV_AMBULANCES: "Ambulances",
    NAV_COMMAND_CENTER: "Command Center",
    NAV_SETTINGS: "Settings",
    NAV_LOGOUT: "Logout",
    NAV_LOGIN: "Login",
    NAV_PROFILE: "Profile",

    // ─── Routing Dashboard ─────────────────────────────────
    ROUTING_TITLE: "Routing Dashboard",
    ROUTING_GO_TO_HOSPITAL: "Go To Hospital",
    ROUTING_EMERGENCY_CASES: "Emergency Cases",
    ROUTING_TOP_RECOMMENDATION: "Top Recommendation",
    ROUTING_REROUTE: "Reroute",
    ROUTING_ESTIMATED_TIME: "Estimated Time",
    ROUTING_DISTANCE: "Distance",
    ROUTING_HOSPITAL_SCORE: "Hospital Score",
    ROUTING_PATIENT_DETAILS: "Patient Details",
    ROUTING_RECOMMENDED_HOSPITAL: "Recommended Hospital",
    ROUTING_ALTERNATIVE_HOSPITALS: "Alternative Hospitals",
    ROUTING_START_NAVIGATION: "Start Navigation",
    ROUTING_CASE_PRIORITY: "Case Priority",
    ROUTING_ACTIVE_CASES: "Active Cases",

    // ─── Command Center Dashboard ──────────────────────────
    CC_TITLE: "Command Center",
    CC_LIVE_MAP: "Live Map",
    CC_ACTIVE_AMBULANCES: "Active Ambulances",
    CC_PENDING_CASES: "Pending Cases",
    CC_DISPATCH: "Dispatch",
    CC_ASSIGN_AMBULANCE: "Assign Ambulance",
    CC_TOTAL_CASES_TODAY: "Total Cases Today",
    CC_AVERAGE_RESPONSE_TIME: "Average Response Time",
    CC_FLEET_STATUS: "Fleet Status",
    CC_AVAILABLE: "Available",
    CC_ENROUTE: "En Route",
    CC_BUSY: "Busy",
    CC_OFFLINE: "Offline",

    // ─── Hospital Dashboard ────────────────────────────────
    HOSPITAL_TITLE: "Hospital Dashboard",
    HOSPITAL_LIVE_CAPACITY: "Live Capacity",
    HOSPITAL_BED_AVAILABILITY: "Bed Availability",
    HOSPITAL_ICU_BEDS: "ICU Beds",
    HOSPITAL_EMERGENCY_BEDS: "Emergency Beds",
    HOSPITAL_GENERAL_BEDS: "General Beds",
    HOSPITAL_VENTILATORS: "Ventilators",
    HOSPITAL_SPECIALTIES: "Specialties",
    HOSPITAL_CONTACT: "Contact",
    HOSPITAL_ADDRESS: "Address",
    HOSPITAL_STATUS: "Status",
    HOSPITAL_ACCEPTING_PATIENTS: "Accepting Patients",
    HOSPITAL_NOT_ACCEPTING: "Not Accepting",
    HOSPITAL_INCOMING_CASES: "Incoming Cases",
    HOSPITAL_UPDATE_CAPACITY: "Update Capacity",

    // ─── Patient Vitals Form ──────────────────────────────
    PV_PATIENT_INTAKE: "Patient Intake Form",
    PV_SUBMIT_CASE: "Submit Emergency Case",
    PV_PATIENT_ID: "Patient Identification",
    PV_PATIENT_NAME: "Patient Name",
    PV_AGE: "Age",
    PV_GENDER: "Gender",
    PV_PRIMARY_VITALS: "Primary Vitals",
    PV_BLOOD_PRESSURE: "Blood Pressure",
    PV_HEART_RATE: "Heart Rate",
    PV_SPO2: "SpO2",
    PV_TEMPERATURE: "Temperature",
    PV_RESPIRATORY_RATE: "Respiratory Rate",
    PV_CONSCIOUSNESS_LEVEL: "Consciousness Level",
    PV_EMERGENCY_TYPE: "Emergency Type",
    PV_TRANSPORT_PRIORITY: "Transport Priority",
    PV_PARAMEDIC_NOTES: "Paramedic Notes",
    PV_FETCHING_LOCATION: "Fetching location...",
    PV_LOCATION_DETECTED: "Location detected",
    PV_CASE_SUBMITTED: "Case submitted successfully!",
    PV_OFFLINE_QUEUED: "Case queued for submission when online",

    // ─── Dispatcher Override ───────────────────────────────
    DO_OVERRIDE_TITLE: "Manual Override",
    DO_OVERRIDE_AI: "Override AI Recommendation",
    DO_SELECT_HOSPITAL: "Override To:",
    DO_SELECT_REASON: "Override Reason:",
    DO_CONFIRM: "Confirm Override",
    DO_APPLYING: "Applying Override...",
    DO_APPLIED: "Override Applied",
    DO_AUDIT_WARNING: "This override will be recorded in the audit trail",

    // ─── Hospital Explainability ───────────────────────────
    HE_TITLE: "Hospital Recommendation Analysis",
    HE_WHY_RECOMMENDED: "Why This Hospital?",
    HE_SCORING_BREAKDOWN: "Scoring Breakdown",
    HE_DISTANCE_FACTOR: "Distance Factor",
    HE_CAPACITY_FACTOR: "Capacity Factor",
    HE_SPECIALTY_MATCH: "Specialty Match",

    // ─── Common / Shared ──────────────────────────────────
    COMMON_LOADING: "Loading...",
    COMMON_ERROR: "Error",
    COMMON_RETRY: "Retry",
    COMMON_SAVE: "Save",
    COMMON_CANCEL: "Cancel",
    COMMON_CLOSE: "Close",
    COMMON_SUBMIT: "Submit",
    COMMON_CONFIRM: "Confirm",
    COMMON_DELETE: "Delete",
    COMMON_EDIT: "Edit",
    COMMON_SEARCH: "Search",
    COMMON_FILTER: "Filter",
    COMMON_REFRESH: "Refresh",
    COMMON_NO_DATA: "No data available",
    COMMON_ONLINE: "Online",
    COMMON_OFFLINE: "Offline",
    COMMON_SLOW_CONNECTION: "Slow Connection",
    COMMON_SELECT: "Select",
    COMMON_BACK: "Back",
    COMMON_NEXT: "Next",
    COMMON_YES: "Yes",
    COMMON_NO: "No",

    // ─── Status / Priority ────────────────────────────────
    STATUS_CRITICAL: "Critical",
    STATUS_HIGH: "High",
    STATUS_MEDIUM: "Medium",
    STATUS_LOW: "Low",
    STATUS_PENDING: "Pending",
    STATUS_ASSIGNED: "Assigned",
    STATUS_COMPLETED: "Completed",
    STATUS_IN_PROGRESS: "In Progress",
};

// Preload arrays for batch pre-translation on dashboard mount
export const PRELOAD_ROUTING = [
    TK.ROUTING_TITLE,
    TK.ROUTING_GO_TO_HOSPITAL,
    TK.ROUTING_EMERGENCY_CASES,
    TK.ROUTING_TOP_RECOMMENDATION,
    TK.ROUTING_REROUTE,
    TK.ROUTING_ESTIMATED_TIME,
    TK.ROUTING_DISTANCE,
    TK.ROUTING_HOSPITAL_SCORE,
    TK.ROUTING_PATIENT_DETAILS,
    TK.ROUTING_RECOMMENDED_HOSPITAL,
    TK.ROUTING_ALTERNATIVE_HOSPITALS,
    TK.ROUTING_START_NAVIGATION,
];

export const PRELOAD_COMMAND_CENTER = [
    TK.CC_TITLE,
    TK.CC_LIVE_MAP,
    TK.CC_ACTIVE_AMBULANCES,
    TK.CC_PENDING_CASES,
    TK.CC_DISPATCH,
    TK.CC_ASSIGN_AMBULANCE,
    TK.CC_TOTAL_CASES_TODAY,
    TK.CC_AVERAGE_RESPONSE_TIME,
    TK.CC_FLEET_STATUS,
    TK.CC_AVAILABLE,
    TK.CC_ENROUTE,
    TK.CC_BUSY,
    TK.CC_OFFLINE,
];

export const PRELOAD_HOSPITAL = [
    TK.HOSPITAL_TITLE,
    TK.HOSPITAL_LIVE_CAPACITY,
    TK.HOSPITAL_BED_AVAILABILITY,
    TK.HOSPITAL_ICU_BEDS,
    TK.HOSPITAL_EMERGENCY_BEDS,
    TK.HOSPITAL_GENERAL_BEDS,
    TK.HOSPITAL_VENTILATORS,
    TK.HOSPITAL_SPECIALTIES,
    TK.HOSPITAL_ACCEPTING_PATIENTS,
    TK.HOSPITAL_INCOMING_CASES,
    TK.HOSPITAL_UPDATE_CAPACITY,
];

export default TK;
