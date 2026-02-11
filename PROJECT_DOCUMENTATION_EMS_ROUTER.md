# AI-Powered Ambulance Triage & Smart Hospital Routing System

## Complete Technical Documentation — Production Reference

**Version:** 2.0.0  
**Platform:** EMS Decision Intelligence Router  
**Repository:** [SreeManas/ambulance_system](https://github.com/SreeManas/ambulance_system)  
**Stack:** React 19 · Vite 5 · Firebase · Mapbox · Gemini AI · Fast2SMS  
**Last Updated:** February 2026  

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Dashboard Modules](#4-dashboard-modules)
5. [Capability Scoring Engine](#5-capability-scoring-engine)
6. [AI Explainability Layer](#6-ai-explainability-layer)
7. [Dispatcher Override Routing](#7-dispatcher-override-routing)
8. [Real-Time Data Infrastructure](#8-real-time-data-infrastructure)
9. [Communication Systems](#9-communication-systems)
10. [Multilingual Translation System](#10-multilingual-translation-system)
11. [Security Architecture](#11-security-architecture)
12. [Firebase Infrastructure](#12-firebase-infrastructure)
13. [Simulation Engine](#13-simulation-engine)
14. [Responsive UI System](#14-responsive-ui-system)
15. [Error Handling & Hardening](#15-error-handling--hardening)
16. [API Integrations](#16-api-integrations)
17. [AI Copilot (Gemini)](#17-ai-copilot-gemini)
18. [Deployment Architecture](#18-deployment-architecture)
19. [Demo Flow Walkthrough](#19-demo-flow-walkthrough)
20. [Future Scope](#20-future-scope)

---

# 1. Executive Summary

## 1.1 What the Platform Is

The **AI-Powered Ambulance Triage & Smart Hospital Routing System** is a full-stack, real-time decision intelligence platform designed to revolutionize pre-hospital emergency care. It replaces the traditional manual, radio-based ambulance dispatch model with an AI-driven system that automatically evaluates every hospital in a metropolitan network and recommends the optimal destination within seconds of a 108/112 emergency call.

The platform operates as a unified command-and-control interface serving four distinct user roles — **paramedics** in the field, **dispatchers** at the control center, **hospital administrators** managing capacity, and **platform administrators** overseeing the entire network. Each role receives a tailored dashboard with real-time Firestore-powered data, role-specific AI copilot assistance, and multilingual support across 130+ languages.

## 1.2 Why It Exists — The Problem Statement

India's Emergency Medical Services infrastructure faces critical challenges that directly impact patient survival rates:

**The Golden Hour Crisis:** Medical research establishes that trauma patients treated within 60 minutes of injury have significantly higher survival rates. In Indian metropolitan cities, the average ambulance-to-hospital decision takes 8–15 minutes via radio coordination, consuming precious golden hour time. This platform reduces that to under 3 seconds through automated scoring.

**Information Asymmetry:** Paramedics in the field lack visibility into which hospitals have available ICU beds, which specialists are on duty, or which emergency departments are on diversion. They rely on outdated phone calls and institutional memory. This platform provides a live, continuously-updated capability map of every hospital in the network.

**Static Dispatch Models:** Current 108/112 dispatch systems route ambulances to the nearest hospital regardless of that hospital's actual ability to treat the patient's specific condition. A cardiac arrest patient sent to a hospital without a cath lab, or a burn victim sent to a facility without a burn unit, results in secondary transfers that waste golden hour time and increase mortality.

**No Audit Trail:** When dispatchers override routing decisions, there is no systematic record of why, making quality improvement and accountability impossible.

## 1.3 Real-World EMS Impact

| Metric | Before (Manual) | After (This Platform) |
|--------|-----------------|----------------------|
| Hospital selection time | 8–15 minutes | < 3 seconds |
| Scoring factors considered | 1–2 (distance, memory) | 8+ (capability, beds, specialists, equipment, distance, load, freshness, golden hour) |
| Golden hour visibility | None | Real-time countdown with urgency modifier |
| Hospital capacity awareness | Phone calls | Live Firestore dashboards |
| Override accountability | None | Full audit trail with reason logging |
| Language support | Single language | 130+ languages with auto-detection |
| Communication channels | Radio only | SMS + WhatsApp + in-app |

## 1.4 Target Users

- **Paramedics (Field Crews):** Capture patient vitals, receive AI-ranked hospital recommendations, navigate to destination
- **Dispatchers (Control Room):** Monitor fleet, manage case queue, override routing, coordinate multi-ambulance incidents
- **Hospital Administrators:** Update capacity in real-time, manage specialist rosters, toggle diversion status
- **Platform Administrators:** System-wide analytics, configuration, user management, data quality monitoring

## 1.5 Key Objectives

1. **Minimize Time-to-Treatment** by automating hospital selection with multi-factor scoring
2. **Maximize Clinical Match** by routing patients to hospitals with the right specialists, equipment, and capacity
3. **Enable Golden Hour Compliance** through real-time countdown tracking and urgency-weighted scoring
4. **Provide Decision Transparency** through AI explainability panels showing exactly why each hospital was ranked
5. **Support Human Override** with auditable dispatcher override workflows
6. **Ensure Universal Access** through 130+ language translation and mobile-responsive design
7. **Maintain Data Integrity** through offline-first architecture, schema validation, and crash hardening

## 1.6 Innovation Factor

This platform introduces several innovations not found in existing Indian EMS systems:

- **Emergency-Specific Scoring Profiles:** The scoring engine uses different weight matrices for cardiac, trauma, burn, accident, pediatric, and infectious emergencies — a feature not available in any current Indian 108/112 system
- **AI Explainability for Emergency Routing:** Every hospital recommendation comes with a visual breakdown of exactly which factors contributed to its score, enabling paramedics and dispatchers to make informed override decisions
- **Golden Hour Modifier:** A time-decay function that progressively increases the weight of proximity as the golden hour expires, automatically shifting from "best capability" to "nearest capable" as urgency increases
- **Disqualification Filters:** Hospitals that fundamentally cannot treat a case (e.g., no burn unit for burn patients, on diversion, zero beds) are automatically excluded before scoring begins, preventing dangerous mis-routing
- **Role-Aware AI Copilot:** Gemini 2.0 Flash provides contextual assistance tailored to each role, with real-time Firestore data injection so the AI can reference actual hospital capacity, not generic knowledge

---

# 2. System Architecture Overview

## 2.1 High-Level Architecture

The platform follows a **three-tier architecture** with real-time data synchronization:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│  React 19 SPA (Vite 5)                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Paramedic │ │Dispatcher│ │ Hospital │ │  Admin   │           │
│  │Dashboard │ │  Command │ │Dashboard │ │Dashboard │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │             │            │             │                 │
│  ┌────┴─────────────┴────────────┴─────────────┴────┐           │
│  │          Capability Scoring Engine (Client)       │           │
│  │          Geocoding Service (Client)               │           │
│  │          Communication Service (Client)           │           │
│  │          Translation Service (Client)             │           │
│  └──────────────────┬───────────────────────────────┘           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────────┐
        │             │                 │
┌───────▼──────┐ ┌────▼─────┐ ┌────────▼────────┐
│   Firebase   │ │  Gemini  │ │   SMS Proxy     │
│  Firestore   │ │  Server  │ │   Server        │
│  Auth        │ │ :5002    │ │   :5001         │
│  Storage     │ │          │ │                 │
│  Hosting     │ │ Express  │ │   Express       │
└──────────────┘ └──────────┘ └─────────────────┘
     FIREBASE        BACKEND SERVICES TIER
```

## 2.2 Frontend Architecture

**Framework:** React 19 with Vite 5 build tooling  
**Routing:** React Router DOM v6 with role-based route guards  
**State Management:** React Context API (AuthContext, LanguageContext) + local component state  
**Styling:** Tailwind CSS 3 + custom responsive utilities + RTL support  
**Maps:** Mapbox GL JS v3 with OpenStreetMap tile fallback  
**Charts:** Recharts for analytics visualization  
**Icons:** Lucide React icon library  

The frontend is structured as a single-page application with the following component hierarchy:

```
App.jsx
├── AuthProvider (Context)
│   └── LanguageProvider (Context)
│       ├── Nav (Role-aware navigation)
│       ├── LoginForm (Auth gateway)
│       └── ProtectedRoute (RBAC guard)
│           ├── PatientVitalsForm (Paramedic)
│           ├── RoutingDashboard (Paramedic/Dispatcher)
│           ├── HospitalDashboard (Hospital Admin)
│           ├── CommandCenterDashboard (Dispatcher)
│           ├── FeedbackForm (All roles)
│           └── EMSChatAssistant (Floating, all roles)
```

**Key architectural decisions:**

- **Client-side scoring:** The capability scoring engine runs entirely in the browser to eliminate network latency on the critical routing path. Hospital data is fetched once via Firestore snapshot listeners and scored locally in < 50ms
- **Offline-first forms:** PatientVitalsForm uses `localforage` for offline case queuing with automatic sync when connectivity is restored
- **Lazy translation:** UI text is translated on-demand via the `useT` hook, with LRU caching to prevent redundant API calls

## 2.3 Backend Services

The backend consists of two Express.js proxy servers:

### Gemini AI Server (Port 5002)
- **File:** `server/geminiChat.js`
- **Purpose:** Proxies chat requests to Google Gemini 2.0 Flash API
- **Features:** Role-specific system prompts, Firestore context injection, session management, suggested follow-up generation
- **Authentication:** Firebase Admin SDK for server-side Firestore access
- **Modules:** `roleContextBuilder.js`, `systemPrompts.js`, `suggestedPrompts.js`

### SMS Proxy Server (Port 5001)
- **File:** `server/smsServer.js`
- **Purpose:** Proxies SMS requests to Fast2SMS API to keep API keys server-side
- **Features:** Rate limiting (10 SMS/min/IP), Indian phone number formatting, message templates, WhatsApp fallback via Twilio
- **Endpoints:** `/api/sms/send-tracking`, `/api/sms/send-dispatch`, `/api/sms/send-hospital-alert`, `/api/sms/send-whatsapp`

## 2.4 Data Flow — Emergency Case Lifecycle

The complete data flow from emergency call to hospital arrival:

```
1. CASE CREATION (Paramedic)
   PatientVitalsForm → Validate → Get GPS → Upload Photos → Write to Firestore
   Collection: emergencyCases/{caseId}

2. REAL-TIME DETECTION (All Dashboards)
   Firestore onSnapshot listener → New case appears in Command Center queue
   
3. HOSPITAL SCORING (Client-Side)
   Scoring Engine fetches hospitals → Applies emergency profile →
   Calculates: capability + specialist + equipment + bed + distance + load + freshness →
   Applies golden hour modifier → Filters disqualified → Returns ranked list

4. ROUTING DISPLAY (Routing Dashboard)
   Mapbox renders ambulance position → Hospital markers with rank colors →
   Directions API draws route lines → ETA calculation → Golden hour countdown

5. DISPATCH (Dispatcher)
   Dispatcher reviews ranking → Accepts or overrides →
   Override: logs reason to dispatchOverrides/{docId} →
   Dispatch: updates case status, sends SMS alerts

6. COMMUNICATION
   SMS to patient family (tracking link) → SMS to hospital (incoming alert) →
   WhatsApp fallback if SMS fails → Firestore log in communicationLogs

7. NAVIGATION (Paramedic)
   AmbulanceNavigation component → Turn-by-turn from Mapbox Directions →
   Real-time position updates → ETA recalculation

8. HANDOVER (Hospital)
   Hospital admin sees incoming case → Prepares resources →
   Updates bed availability post-admission → Scoring engine reflects new capacity
```

## 2.5 Firebase Infrastructure

| Service | Usage |
|---------|-------|
| **Authentication** | Email/password + Google OAuth sign-in with role storage |
| **Firestore** | Primary database — 8 collections with real-time listeners |
| **Storage** | Patient photo uploads (camera capture) |
| **Hosting** | Production deployment (firebase.json configured) |
| **Security Rules** | RBAC enforcement at database level |

---

# 3. User Roles & Access Control

## 3.1 Role Definitions

The platform implements a **5-role RBAC system** with legacy migration support:

| Role | Code | Description | Default Dashboard |
|------|------|-------------|-------------------|
| **Paramedic** | `paramedic` | Field crew capturing vitals and transporting patients | Patient Intake + Routing |
| **Dispatcher** | `dispatcher` | Control room operator managing fleet and case queue | Command Center |
| **Hospital Admin** | `hospital_admin` | Hospital staff managing capacity and readiness | Hospital Dashboard |
| **Command Center** | `command_center` | Senior operator with network-wide visibility | Command Center |
| **Platform Admin** | `admin` | System administrator with full access | All dashboards |

### Legacy Role Migration

The platform evolved from an earlier disaster management system. Legacy roles are automatically migrated:

```javascript
const ROLE_MIGRATION = {
  citizen: 'paramedic',
  analyst: 'hospital_admin',
  official: 'command_center'
};
```

When a user with a legacy role logs in, `AuthProvider.normalizeRole()` detects the outdated role, maps it to the EMS equivalent, and writes the updated role back to Firestore.

## 3.2 Dashboard Access Matrix

| Dashboard | Paramedic | Dispatcher | Hospital Admin | Command Center | Admin |
|-----------|:---------:|:----------:|:--------------:|:--------------:|:-----:|
| Patient Intake | ✅ | ✅ | — | — | ✅ |
| Routing | ✅ | ✅ | — | — | ✅ |
| Hospital Management | — | — | ✅ | — | ✅ |
| Command Center | — | ✅ | — | ✅ | ✅ |
| Feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Copilot | ✅ | ✅ | ✅ | ✅ | ✅ |

## 3.3 Permission Enforcement Layers

**Layer 1 — Frontend Route Guards (`ProtectedRoute.jsx`):**
```
<ProtectedRoute allowedRoles={['dispatcher', 'command_center', 'admin']}>
  <CommandCenterDashboard />
</ProtectedRoute>
```
The `ProtectedRoute` component reads the current user's role from `AuthContext` and renders either the child component or redirects to the `NotAuthorized` page.

**Layer 2 — UI Conditional Rendering (`PermissionGuard.jsx`):**
Individual UI elements (buttons, panels, form fields) are wrapped in `PermissionGuard` to show/hide based on role. For example, the "Dispatch Override" button in the Routing Dashboard only appears for dispatchers and admins.

**Layer 3 — Firestore Security Rules:**
Database-level enforcement ensures that even if frontend guards are bypassed, unauthorized writes are rejected. All rules reference a `getUserRole()` helper function that reads the user's role document from the `users` collection.

**Layer 4 — Backend API Validation:**
The Gemini server validates the `role` parameter in each chat request and injects role-appropriate system prompts and context data.

## 3.4 Firestore RBAC Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `emergencyCases` | Paramedic, Dispatcher, Admin | Paramedic, Dispatcher, Admin | Dispatcher, Admin | Admin only |
| `hospitals` | All authenticated | All authenticated | All authenticated | Admin only |
| `ambulances` | All authenticated | Admin only | Dispatcher, Admin | Admin only |
| `dispatchOverrides` | All authenticated | Dispatcher, Admin, Command Center | — | — |
| `users` | Self or Admin | Authenticated | Self or Admin | Self or Admin |
| `feedback` | Admin or author | Authenticated | Admin | Admin |
| `communicationLogs` | All authenticated | Authenticated | Admin | Admin |

---

# 4. Dashboard Modules

## 4.1 Patient Intake Dashboard (PatientVitalsForm)

**File:** `src/components/PatientVitalsForm.jsx` (1,123 lines)  
**Role:** Paramedic, Dispatcher, Admin  
**Purpose:** Comprehensive field data collection for emergency cases

### 4.1.1 Form Sections

The intake form is organized into logical clinical sections:

**Section 1 — Patient Identification:**
- Patient Name (optional — emergency patients may be unconscious)
- Age (numeric with validation)
- Gender (Male / Female / Other / Unknown)
- Pregnancy Status (for female patients — affects hospital routing to maternity-capable facilities)

**Section 2 — Primary Vitals:**
- Heart Rate (BPM) — numeric input with range validation
- Blood Pressure (Systolic / Diastolic) — dual numeric input
- SpO2 (Oxygen Saturation %) — critical for respiratory emergencies
- Respiratory Rate — breaths per minute
- Temperature — Celsius/Fahrenheit toggle
- GCS Score (Glasgow Coma Scale) — 3-15 scale for consciousness assessment
- Pain Level — 0-10 numeric scale

**Section 3 — Emergency Classification:**
- Emergency Type — dropdown: Cardiac, Trauma, Burn, Accident, Pediatric, Infectious, Stroke, Industrial, Other
- Acuity Level — 1 (Critical/Red) through 5 (Minor/Green)
- Chief Complaint — free-text description
- Mechanism of Injury — dropdown for trauma cases

**Section 4 — Clinical Assessment:**
- Consciousness Level (Alert / Verbal / Pain / Unresponsive — AVPU scale)
- Airway Status (Clear / Partially Obstructed / Fully Obstructed)
- Breathing Quality (Normal / Labored / Absent)
- Circulation Assessment
- Allergies — free-text
- Current Medications — free-text
- Medical History — free-text

**Section 5 — Interventions Performed:**
- Oxygen Administered (checkbox + flow rate)
- CPR Performed (checkbox + duration)
- IV Fluids Started (checkbox + type)
- Hemorrhage Control (checkbox + method)
- Splinting Applied (checkbox)
- Defibrillator Used (checkbox + number of shocks)

**Section 6 — Transport & Support Requirements:**
- Transport Priority (Immediate / Urgent / Delayed / Expectant)
- Ventilator Support Required (affects hospital matching)
- Oxygen Support Required
- Defibrillator Required
- Spinal Immobilization Required
- Blood Products Needed

**Section 7 — Photo Evidence (Camera Capture):**
- Integrated camera component for wound/scene documentation
- Photo validation (file size, format, dimensions)
- Upload to Firebase Storage with case ID reference
- Support for multiple photos per case

### 4.1.2 Camera Capture System

**File:** `src/components/CameraCapture.jsx` (1,579 lines)

The camera system is a comprehensive media capture component:

- **Browser Compatibility Detection:** Tests for `getUserMedia` API support, checks available video codecs, detects device capabilities (front/back camera)
- **Photo Capture:** Captures frames from the video stream using canvas rendering, supports JPEG/WebP/PNG format selection based on browser capabilities
- **Video Recording:** MediaRecorder API with MP4 priority over WebM for cross-browser playback, 10MB size limit with progress indication
- **Image Optimization:** Auto-selects optimal quality based on format, validates dimensions and file size before submission
- **EXIF Metadata:** Reads and preserves EXIF data from captured images using the `exifreader` library
- **Error Recovery:** Handles camera permission denial, hardware failures, codec incompatibility, and recording errors with user-friendly messages

### 4.1.3 Form Validation

The `validateForm()` function enforces:
- Emergency type must be selected (required)
- Acuity level must be set (required)
- At least one vital sign must be recorded
- Age must be a positive number if provided
- Photo files must pass size and format validation
- GPS coordinates must be obtained before submission

### 4.1.4 Submission Pipeline

```
User clicks "Submit Case"
  → validateForm() checks all required fields
  → getCurrentLocation() fetches GPS via browser Geolocation API
    → If offline: queue case in localforage, show offline notification
    → If online: proceed to submitOnline()
  → submitOnline():
    1. Create Firestore document in emergencyCases collection
    2. Upload photos to Firebase Storage (if any)
    3. Update case document with photo URLs
    4. Reset form
    5. Show success notification
```

### 4.1.5 Offline Support

The form integrates with `offlineSync.js` to handle network failures:
- Failed submissions are stored in IndexedDB via `localforage`
- A background sync check runs periodically
- When connectivity is restored, queued cases are automatically submitted
- Visual indicator shows "Offline: case queued" status

### 4.1.6 Firestore Write Schema

```javascript
{
  emergencyContext: {
    emergencyType: "cardiac",      // Selected type
    chiefComplaint: "Chest pain",  // Free text
    mechanismOfInjury: null        // For trauma cases
  },
  acuityLevel: 1,                  // 1-5 scale
  patientAge: 58,
  patientGender: "male",
  pregnancyStatus: "not_applicable",
  vitals: {
    heartRate: 120,
    bloodPressure: { systolic: 90, diastolic: 60 },
    spo2: 88,
    respiratoryRate: 28,
    temperature: 37.2,
    gcsScore: 12,
    painLevel: 8
  },
  consciousness: "verbal",
  airway: "clear",
  breathing: "labored",
  interventions: {
    oxygenAdministered: true,
    cprPerformed: false,
    ivFluids: true,
    hemorrhageControl: false
  },
  transportRequirements: {
    priority: "immediate",
    ventilatorRequired: false,
    oxygenRequired: true,
    defibrillatorNeeded: false,
    spinalImmobilization: false
  },
  pickupLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: "MG Road, Bangalore"
  },
  photos: ["gs://bucket/cases/caseId/photo1.jpg"],
  status: "active",
  createdBy: "uid_paramedic_001",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4.2 Hospital Capability Dashboard (HospitalDashboard)

**File:** `src/components/HospitalDashboard.jsx` (1,304 lines)  
**Role:** Hospital Admin, Admin  
**Purpose:** Complete hospital registry with CRUD operations and real-time capacity management

### 4.2.1 Features

**Hospital Registration:**
- Full CRUD (Create, Read, Update, Delete) for hospital records
- Real-time Firestore `onSnapshot` listener for instant updates across all connected clients
- Form validation with geo-integrity checks

**Capability Registry:**
- Clinical capabilities: Stroke Center, Emergency Surgery, CT Scan, MRI, Cath Lab, Burn Unit, Neonatal Care, Dialysis, Hyperbaric Chamber, Toxicology Lab
- Case acceptance toggles: Accepts Cardiac, Accepts Trauma, Accepts Pediatric, Accepts Burns, Accepts Infectious, Accepts Obstetric
- Equipment inventory: Ventilators (total/available), Defibrillators, Cardiac Monitors, Portable X-Ray, Ultrasound, Blood Bank Units

**Specialist Roster:**
Each hospital tracks available counts for 10 specialist categories:
- Cardiologist, Neurologist, Trauma Surgeon, Radiologist, Pulmonologist
- Burn Specialist, Orthopedic Surgeon, Anesthesiologist, Emergency Physician, Pediatrician

**Bed Capacity Management:**
Beds are tracked by type with total and available counts:
- ICU beds, General beds, Emergency beds, Trauma beds, Isolation beds, Pediatric beds, Burn beds, Cardiac beds, Maternity beds

### 4.2.2 Geo-Integrity Validation

The `validateGeoLocation()` function ensures:
- Latitude is between -90 and +90 degrees
- Longitude is between -180 and +180 degrees
- Coordinates are not (0, 0) — which would indicate missing data
- Location is within a plausible geographic region for the deployment area

### 4.2.3 Capacity Auto-Normalization Engine

The `normalizeCapacity()` function prevents data integrity issues:
- Available beds cannot exceed total beds for any bed type
- Negative values are clamped to zero
- Missing fields are initialized with safe defaults
- Specialist counts are validated as non-negative integers

### 4.2.4 Schema Defaults

Every hospital record is deep-merged with `defaultHospitalSchema` to prevent undefined field access:

```javascript
const defaultHospitalSchema = {
  basicInfo: { name: '', hospitalType: 'general', traumaLevel: 'none',
               address: '', phone: '', location: { latitude: 0, longitude: 0 } },
  capacity: { bedsByType: {
    icu: { total: 0, available: 0 },
    general: { total: 0, available: 0 },
    emergency: { total: 0, available: 0 },
    // ... (9 bed types total)
  }},
  specialists: { /* 10 specialist types, all defaulting to 0 */ },
  equipment: { /* ventilator, defibrillator, etc. */ },
  capabilities: { specializations: [], hasTraumaCenter: false, hasICU: false },
  caseAcceptance: { acceptsCardiac: true, acceptsTrauma: true, /* ... */ },
  emergencyReadiness: { status: 'accepting', diversionStatus: false, queueLength: 0 },
  extendedProfile: { /* accreditations, certifications, insurance, etc. */ }
};
```

---

## 4.3 Extended Hospital Profile (HospitalExtendedProfileForm)

**File:** `src/components/HospitalExtendedProfileForm.jsx` (33,430 bytes)  
**Purpose:** Detailed hospital metadata beyond core capabilities

### Fields Documented:

- **Accreditations:** NABH, NABL, JCI, ISO certifications with validity dates
- **Trauma Center Certification:** Level I through Level IV with expiry tracking
- **Insurance Partners:** List of accepted insurance providers
- **Emergency Coordinator:** Name, phone, availability hours
- **Special Programs:** Organ transplant, stroke fast-track, STEMI network, poison control
- **Infrastructure:** Helipad availability, 24/7 pharmacy, blood bank type (in-house/external)
- **Medico-Legal Readiness:** Police case handling capability, forensic medicine availability
- **Disaster Preparedness Level:** Basic, Intermediate, Advanced

---

## 4.4 Live Hospital Operations Panel (HospitalLiveOpsPanel)

**File:** `src/components/HospitalLiveOpsPanel.jsx` (20,997 bytes)  
**Purpose:** Real-time operational status updates with slider controls

### Features:

**Interactive Capacity Sliders:**
- ICU bed availability slider (0 to total capacity)
- Emergency bed availability slider
- Ventilator availability counter
- Cardiac monitor counter

**Queue Management:**
- Current ambulance queue length input
- Estimated wait time display
- Queue trend indicator (increasing/decreasing/stable)

**Diversion Toggle:**
- One-click diversion status toggle (Accepting ↔ On Diversion)
- Automatic timestamp recording on status change
- Visual color change: Green (Accepting) → Red (On Diversion)

**Real-Time Firestore Writes:**
Every slider change and toggle triggers an immediate Firestore write to the hospital document. The write includes a `lastUpdatedAt` timestamp used by the scoring engine's freshness penalty system.

**Routing Recompute Trigger:**
When hospital capacity changes propagate through Firestore's `onSnapshot` listener, any open Routing Dashboard automatically re-scores and re-ranks hospitals, ensuring paramedics always see current data.

---

## 4.5 Routing Intelligence Dashboard (RoutingDashboard)

**File:** `src/components/RoutingDashboard.jsx` (1,061 lines)  
**Purpose:** Primary decision interface showing AI-ranked hospitals on an interactive map

### 4.5.1 Map Visualization

**Map Provider:** Mapbox GL JS v3 with OpenStreetMap tile fallback  
**Default Center:** Bangalore (77.5946°E, 12.9716°N)  
**Default Zoom:** Level 11 (city-wide view)

**Marker System:**
- **Ambulance Marker:** Blue pulsing dot at current GPS position
- **Hospital Markers:** Color-coded by rank:
  - Rank 1: Green (#22c55e) — Best match
  - Rank 2: Yellow-Green (#84cc16)
  - Rank 3: Yellow (#eab308)
  - Rank 4–5: Orange gradient
  - Lower ranks: Red gradient (#ef4444)
- **Popup on Click:** Hospital name, score, bed availability, ETA

**Route Lines:**
- Top 3 routes drawn using Mapbox Directions API
- Route 1: Solid green line (recommended)
- Route 2–3: Dashed yellow/orange lines (alternatives)
- Each route annotated with distance (km) and ETA (minutes)

### 4.5.2 Golden Hour Banner

A persistent banner at the top of the routing dashboard shows:
- Time elapsed since case creation
- Golden hour remaining (countdown from 60 minutes)
- Color progression: Green (> 30 min) → Yellow (15–30 min) → Red (< 15 min) → Flashing Red (< 5 min)
- The `getGoldenHourRemaining()` function calculates remaining time and updates every second via `setInterval`

### 4.5.3 Hospital Ranking Panel

A scrollable side panel displays all scored hospitals:
- Rank number with color-coded badge
- Hospital name and type
- Overall score (X/100)
- Key metrics: ICU beds, Emergency beds, ETA
- "Go To Hospital" button that triggers navigation
- Expandable explainability panel (see Section 6)

### 4.5.4 Acuity Label Display

```javascript
const getAcuityLabel = (level) => {
  const labels = {
    1: { text: 'Critical (Red)', color: '#dc2626' },
    2: { text: 'Emergent (Orange)', color: '#ea580c' },
    3: { text: 'Urgent (Yellow)', color: '#ca8a04' },
    4: { text: 'Less Urgent (Green)', color: '#16a34a' },
    5: { text: 'Minor (Blue)', color: '#2563eb' }
  };
  return labels[level] || { text: 'Unknown', color: '#6b7280' };
};
```

---

## 4.6 Turn-by-Turn Navigation (AmbulanceNavigation)

**File:** `src/components/navigation/AmbulanceNavigation.jsx`  
**Purpose:** Driver-optimized navigation interface for paramedics

### Features:
- Full-screen map with current position tracking
- Step-by-step turn instructions from Mapbox Directions API
- Distance and time remaining display
- Route recalculation on deviation
- Mobile-optimized with large touch targets
- Night mode support for low-light driving conditions

---

## 4.7 Command Center Dashboard (CommandCenterDashboard)

**File:** `src/components/CommandCenterDashboard.jsx` (932 lines)  
**Purpose:** Real-time fleet management and dispatch control room

### 4.7.1 Fleet Simulation Engine

The dashboard includes a built-in ambulance simulation for demo purposes:

**Fleet Creation:**
```javascript
function createAmbulanceFleet(center) {
  // Creates 8 ambulances with random positions within 10km of center
  // Each ambulance has: id, type (ALS/BLS), status, position, speed
}
```

**Ambulance States:**
| Status | Label | Color | Icon |
|--------|-------|-------|------|
| `available` | Available | Blue #3b82f6 | 🟦 |
| `dispatched` | Dispatched | Yellow #eab308 | 🟨 |
| `en_route` | En Route | Orange #f97316 | 🟧 |
| `at_scene` | At Scene | Red #ef4444 | 🟥 |
| `transporting` | Transporting | Purple #a855f7 | 🟪 |
| `at_hospital` | At Hospital | Teal #14b8a6 | 🟩 |
| `offline` | Offline | Gray #6b7280 | ⬜ |

**State Machine:**
```
available → dispatched → en_route → at_scene → transporting → at_hospital → available
```

**Position Interpolation:**
Ambulances in transit smoothly animate between waypoints using linear interpolation:
```javascript
function interpolatePosition(start, end, progress) {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress
  ];
}
```

### 4.7.2 Dashboard Panels

**Emergency Queue Panel:**
- Lists all active cases sorted by acuity (Critical first)
- Color-coded acuity badges (Red/Orange/Yellow/Green/Blue)
- Case age display using `formatTimeSince()`
- One-click "Dispatch" button per case

**Fleet Status Panel:**
- Real-time ambulance list with status badges
- Vehicle type indicator (ALS/BLS)
- Current GPS position display
- "Dispatch to Next Case" button per ambulance

**Hospital Load Board:**
- All hospitals with current bed availability
- ICU, Emergency, General bed counts
- Diversion status indicator
- Load percentage bars with color coding:
  - Green: < 70% capacity
  - Yellow: 70–90% capacity
  - Red: > 90% capacity

**Map Panel:**
- Full interactive map with all ambulance positions
- Hospital markers with load indicators
- Active case markers with acuity colors
- Real-time ambulance movement animation

---

# 5. Capability Scoring Engine

**File:** `src/services/capabilityScoringEngine.js` (993 lines)  
**Purpose:** Multi-factor hospital ranking algorithm with emergency-specific profiles

## 5.1 Architecture

The scoring engine is the intellectual core of the platform. It evaluates every hospital against a specific emergency case using 8 scoring dimensions, applies emergency-type-specific weight profiles, and produces a ranked list with full explainability data.

**Design Principle:** The engine runs entirely client-side (in the browser) to eliminate network latency on the critical path. Hospital data is pre-loaded via Firestore snapshot listeners and scored in < 50ms.

## 5.2 Scoring Dimensions

| Dimension | Max Score | Description |
|-----------|-----------|-------------|
| Capability | 30 | Clinical capabilities matching the emergency type |
| Specialist | 25 | Relevant specialists available on-duty |
| Equipment | 25 | Critical equipment availability (ventilators, defibrillators) |
| Bed | 20 | Available beds in relevant categories |
| Distance | 20 | Proximity from pickup location (Haversine formula) |
| Load | 15 | Current emergency department load |
| Freshness | 10 | Data recency penalty (stale data reduces confidence) |
| Trauma Level | 30 | Trauma center certification level bonus |

**Final Score Formula:**
```
FinalScore = (Σ DimensionScores) × GoldenHourModifier
```

## 5.3 Emergency-Specific Scoring Profiles

The engine defines unique weight and evaluation profiles for 7 emergency types:

### Cardiac Profile
```javascript
cardiac: {
  caseAcceptance: 'acceptsCardiac',
  specialists: ['cardiologist'],
  specialistWeights: { cardiologist: 1.5 },
  capabilities: ['strokeCenter', 'emergencySurgery'],
  capabilityScores: { strokeCenter: 30, emergencySurgery: 15 },
  equipment: ['defibrillator'],
  equipmentScores: { defibrillator: { present: 25, absent: -30 } },
  bedTypes: ['cardiac', 'icu', 'emergency'],
  criticalBeds: ['cardiac', 'icu'],
  traumaLevelBonus: false
}
```

### Trauma Profile
```javascript
trauma: {
  specialists: ['traumaSurgeon'],
  specialistWeights: { traumaSurgeon: 1.5 },
  capabilities: ['emergencySurgery'],
  equipment: ['ventilator'],
  bedTypes: ['traumaBeds', 'icu', 'emergency'],
  criticalBeds: ['traumaBeds', 'icu'],
  traumaLevelBonus: true,
  traumaLevelScores: { level_1: 30, level_2: 18, level_3: 8, none: 0 }
}
```

### Burn Profile
```javascript
burn: {
  specialists: ['burnSpecialist'],
  specialistWeights: { burnSpecialist: 2.5 },  // Highest weight — burn specialists are rare
  capabilities: ['emergencySurgery'],
  equipment: ['ventilator'],
  equipmentScores: { ventilator: { present: 15, absent: -20 } },
  bedTypes: ['icu', 'emergency'],
  criticalBeds: ['icu']
}
```

Additional profiles exist for: **Accident**, **Pediatric**, **Infectious**, and **General** emergencies.

## 5.4 Golden Hour Modifier

The golden hour modifier is a time-decay function that shifts scoring weight from "best capability" toward "nearest capable" as the golden hour expires:

```javascript
function calculateGoldenHourModifier(emergencyCase) {
  const caseAge = (Date.now() - emergencyCase.createdAt) / 60000; // minutes
  
  if (caseAge < 15) return 1.0;      // Full capability weight
  if (caseAge < 30) return 1.1;      // Slight distance boost
  if (caseAge < 45) return 1.25;     // Moderate distance boost
  if (caseAge < 55) return 1.5;      // Strong distance boost
  return 2.0;                         // Critical: nearest capable hospital
}
```

**Effect:** A hospital 5km away with a score of 70 would normally rank below a hospital 15km away with a score of 85. But at 50 minutes into the golden hour, the distance component gets boosted so heavily that the closer hospital may rank higher — because reaching it faster is now more important than having marginally better capabilities.

## 5.5 Disqualification Filters

Before scoring, hospitals are checked against hard disqualification criteria:

```javascript
function checkDisqualification(hospital, emergencyCase, profile) {
  // 1. Hospital on diversion → DISQUALIFIED
  if (hospital.emergencyReadiness?.diversionStatus) 
    return { disqualified: true, reason: 'Hospital is on diversion' };
  
  // 2. Case acceptance flag is false → DISQUALIFIED
  if (profile.caseAcceptance && !hospital.caseAcceptance?.[profile.caseAcceptance])
    return { disqualified: true, reason: 'Does not accept this emergency type' };
  
  // 3. Zero beds in ALL critical bed types → DISQUALIFIED
  if (profile.criticalBeds.every(type => safeNum(hospital.beds?.[type]?.available) === 0))
    return { disqualified: true, reason: 'No beds available in critical categories' };
  
  return { disqualified: false };
}
```

## 5.6 Distance Calculation

Uses the **Haversine formula** for accurate great-circle distance:

```javascript
function calculateDistanceKm(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat/2)**2 + 
            Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

**ETA Estimation:**
```javascript
function estimateETA(distanceKm) {
  // Assumes average ambulance speed of 40 km/h in urban areas
  return Math.round((distanceKm / 40) * 60); // Returns minutes
}
```

## 5.7 Data Normalization

The `normalizeHospital()` function (100+ lines) ensures safe field access across varying Firestore data shapes:

- Handles both flat (`hospital.icuBeds`) and nested (`hospital.capacity.bedsByType.icu.available`) schemas
- Converts specialist data from multiple formats: plain numbers, `{count, available}` objects, and arrays
- Applies defaults for all 50+ fields to prevent NaN propagation
- Uses `safeNum()` helper that handles: number, `{available, count}`, undefined, null, NaN

## 5.8 Debug Scoring

In development mode (`localhost`), the engine outputs detailed score breakdowns to the console:

```
[SCORING] Sakra World Hospital:
  Capability: 28/30 (weight: 1.0)
  Specialist: 22/25 (weight: 1.5 — cardiologist)
  Equipment:  25/25 (defibrillator present)
  Bed:        16/20 (8 ICU, 12 cardiac available)
  Distance:   15/20 (7.2 km, ETA 11 min)
  Load:       12/15 (moderate load)
  Freshness:  9/10  (updated 3 minutes ago)
  Trauma:     18/30 (Level 2)
  ──────────────────
  Raw Score:  145
  Golden Hour Modifier: 1.0
  Final Score: 87/100 (normalized)
```

---

# 6. AI Explainability Layer

**File:** `src/components/HospitalExplainabilityPanel.jsx` (363 lines)  
**Purpose:** Transparent visualization of WHY each hospital received its ranking score

## 6.1 Design Philosophy

In life-critical EMS routing, black-box AI recommendations are unacceptable. Paramedics and dispatchers need to understand and trust the system's recommendation before acting on it. The explainability panel provides a complete breakdown of every scoring factor for every hospital in the ranked list.

## 6.2 Factor Configuration

Each scoring dimension is displayed as a labeled progress bar with an icon, color, and human-readable description:

| Factor | Icon | Color | Description |
|--------|------|-------|-------------|
| Capability | Shield | Blue #2563eb | Stroke center, cardiac cath lab, burn unit match |
| Specialist | Users | Purple #7c3aed | On-duty specialist match for emergency type |
| Equipment | Cpu | Amber #d97706 | Ventilators, defibrillators, monitors |
| Bed Availability | BedDouble | Emerald #059669 | ICU, trauma, cardiac, emergency beds |
| ER Load | Activity | Rose #e11d48 | Current emergency department congestion |
| Distance | Navigation | Cyan #0891b2 | Distance from pickup location (Haversine) |

## 6.3 Factor Bar Component

Each factor is rendered as a `FactorBar` component that displays:
- Factor icon and label
- Current score vs. maximum possible score (e.g., "22/25")
- Weight multiplier badge (e.g., "×1.5" for high-priority factors)
- Animated progress bar with color fill proportional to score percentage
- Hover tooltip with detailed description

## 6.4 Golden Hour Badge

A prominent badge shows golden hour status:
- **Green:** > 30 minutes remaining — "Golden Hour Safe"
- **Yellow:** 15–30 minutes — "Golden Hour Warning"
- **Red:** < 15 minutes — "Golden Hour Critical"
- **Flashing Red:** < 5 minutes — "GOLDEN HOUR EXPIRED"

The badge also shows the exact minutes remaining and the golden hour modifier currently being applied to scores.

## 6.5 Reason Tags

Plain-English explanation tags appear below the score breakdown:
- "✅ Has active cath lab — critical for cardiac cases"
- "✅ 3 cardiologists on duty"
- "⚠️ Only 2 ICU beds remaining"
- "❌ No burn unit — not suitable for burn patients"
- "🕐 Data updated 3 minutes ago — high confidence"

## 6.6 Compact vs. Expanded Mode

The panel supports two display modes:
- **Compact:** Shows the overall score, top 3 factors, and a "Show Details" toggle. Used in the routing dashboard's hospital list.
- **Expanded:** Full factor breakdown, golden hour badge, reason tags, and raw score data. Used when a user clicks to expand a hospital card.

---

# 7. Dispatcher Override Routing

**File:** `src/components/DispatcherOverridePanel.jsx` (309 lines)  
**Purpose:** Structured workflow for manual hospital routing overrides with audit trail

## 7.1 Why Overrides Exist

While the AI scoring engine provides data-driven recommendations, dispatchers may have real-time intelligence that the system doesn't — a phone call confirming a specialist is available, insider knowledge about road closures, or a direct request from the receiving hospital. The override system respects human judgment while maintaining accountability.

## 7.2 Override Workflow

```
1. Dispatcher reviews AI-recommended hospital (Rank #1)
2. Dispatcher clicks "Override Routing" button (visible only to dispatcher/admin roles)
3. Override panel slides open with:
   a. Current recommended hospital display
   b. Dropdown to select alternative hospital (from all scored hospitals)
   c. Reason selection (predefined categories + free text)
   d. Confirmation button
4. On confirmation:
   a. Override document written to Firestore dispatchOverrides collection
   b. Case document updated with new target hospital
   c. Routing dashboard redraws with new destination
   d. Override logged with timestamp, dispatcher ID, original and new hospital
```

## 7.3 Predefined Override Reasons

| ID | Label | Icon |
|----|-------|------|
| `closer_available` | Closer Hospital Now Available | 🏥 |
| `patient_request` | Patient/Family Preference | 👨‍👩‍👧 |
| `specialist_available` | Specialist Confirmed Available | 👨‍⚕️ |
| `capacity_confirmed` | Capacity Confirmed by Phone | ✅ |
| `road_closure` | Road Closure / Obstruction | 🚧 |
| `diversion_update` | Hospital Diversion Status Changed | 🔄 |
| `other` | Other (specify) | 📝 |

## 7.4 Audit Trail Schema

```javascript
// Firestore: dispatchOverrides/{docId}
{
  caseId: "case_001",
  originalHospital: {
    id: "hosp_sakra",
    name: "Sakra World Hospital",
    score: 87
  },
  overrideHospital: {
    id: "hosp_manipal",
    name: "Manipal Hospital",
    score: 72
  },
  reason: "specialist_available",
  reasonText: "Confirmed cardiac surgeon available at Manipal",
  overriddenBy: "uid_dispatcher_001",
  dispatcherEmail: "dispatcher@ems.org",
  timestamp: Timestamp,
  role: "dispatcher"
}
```

## 7.5 Permission Guard

The override panel is wrapped in a permission check:
- Only `dispatcher`, `command_center`, and `admin` roles can see the override button
- The `canOverride` prop is computed from the user's role
- Firestore security rules enforce that only these roles can write to `dispatchOverrides`

---

# 8. Real-Time Data Infrastructure

## 8.1 Firestore Snapshot Listeners

The platform uses Firestore's `onSnapshot` for real-time data synchronization across all connected clients:

**Hospital Dashboard:** Listens to the `hospitals` collection. Any change (bed update, diversion toggle, new hospital) instantly propagates to all open dashboards.

**Routing Dashboard:** Listens to the `hospitals` collection. When hospital capacity changes, the scoring engine automatically re-scores and re-ranks all hospitals without user action.

**Command Center:** Listens to `emergencyCases`, `ambulances`, and `hospitals` collections simultaneously. New cases appear in the queue instantly, ambulance status changes reflect on the map immediately.

## 8.2 Debounced Re-Scoring

To prevent excessive computation during rapid updates (e.g., a hospital admin adjusting multiple bed sliders), the routing dashboard debounces re-scoring:
- First change: immediate re-score (ensures responsiveness)
- Subsequent changes within 500ms window: queued and batched
- After 500ms of no changes: final re-score with latest data

## 8.3 Data Freshness Tracking

Every hospital document includes a `lastUpdatedAt` timestamp. The scoring engine applies a freshness penalty:

| Data Age | Freshness Score | Description |
|----------|----------------|-------------|
| < 5 minutes | 10/10 | Fresh — high confidence |
| 5–15 minutes | 8/10 | Recent — good confidence |
| 15–30 minutes | 5/10 | Aging — moderate confidence |
| 30–60 minutes | 3/10 | Stale — low confidence |
| > 60 minutes | 0/10 | Very stale — unreliable |

This ensures that hospitals that actively maintain their data are favored over those with outdated information.

## 8.4 Auto Reranking Triggers

Hospital re-ranking occurs automatically when:
1. A Firestore snapshot delivers updated hospital data
2. The golden hour timer crosses a threshold (15, 30, 45, 55 minutes)
3. The user changes the emergency type or acuity level
4. A dispatcher override reassigns the case
5. The ambulance position changes significantly (> 1km)

---

# 9. Communication Systems

## 9.1 Architecture Overview

**File (Service):** `src/services/communicationService.js` (241 lines)  
**File (Server):** `server/smsServer.js` (434 lines)  
**File (Frontend Client):** `src/services/smsService.js` (3,116 bytes)

Communication flows through a secure, multi-channel pipeline:

```
Frontend (communicationService.js)
  → SMS Proxy Server (smsServer.js on :5001)
    → Fast2SMS API (Indian SMS gateway)
    → Twilio API (WhatsApp fallback)
  → Firestore (communicationLogs collection)
```

## 9.2 SMS Engine

### 9.2.1 Message Templates

**Tracking Link SMS (to patient family):**
```
🚑 EMS AMBULANCE TRACKING
━━━━━━━━━━━━━━━━━━━
📍 Track your ambulance live:
{trackingLink}

🏥 Hospital: {hospitalName}
📞 Hospital Contact: {hospitalPhone}
⏱ ETA: {etaMinutes} min
📋 Case ID: {caseId}

Stay calm. Help is on the way.
━━━━━━━━━━━━━━━━━━━
EMS Router Platform
```

**Dispatch Confirmation SMS (to ambulance crew):**
```
🚨 DISPATCH ALERT
━━━━━━━━━━━━━━━━━━━
📋 Case: {caseId}
🚑 Unit: {ambulanceId}
📍 Respond immediately to dispatch location.

Confirm receipt. Stay safe.
━━━━━━━━━━━━━━━━━━━
EMS Dispatch System
```

**Hospital Alert SMS (to receiving hospital):**
```
🏥 INCOMING PATIENT ALERT
━━━━━━━━━━━━━━━━━━━
⚠️ Emergency: {emergencyType}
⏱ ETA: {etaMinutes} min
Please prepare receiving team.

━━━━━━━━━━━━━━━━━━━
EMS Router Platform
```

### 9.2.2 Rate Limiting

The SMS proxy implements in-memory rate limiting:
- **Window:** 60 seconds
- **Max requests:** 10 per IP per window
- **Response on limit:** HTTP 429 with retry-after header

### 9.2.3 Phone Number Formatting

The `formatIndianNumber()` function handles multiple input formats:
- `+91XXXXXXXXXX` → `XXXXXXXXXX` (strips country code)
- `91XXXXXXXXXX` → `XXXXXXXXXX`
- `0XXXXXXXXXX` → `XXXXXXXXXX` (strips leading zero)
- `XXXXXXXXXX` → `XXXXXXXXXX` (already formatted)
- Validates: exactly 10 digits, starts with 6/7/8/9 (Indian mobile)

### 9.2.4 Fast2SMS Integration

```javascript
async function sendFast2SMS(numbers, message) {
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': process.env.FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      route: 'q',           // Quick transactional route
      message: sanitizeMessage(message),
      language: 'english',
      numbers: numbers       // Comma-separated Indian numbers
    })
  });
}
```

## 9.3 WhatsApp Fallback

When SMS delivery fails, the system automatically attempts WhatsApp delivery via Twilio:

```
SMS Send Attempt
  → Success → Log to Firestore → Done
  → Failure → Retry once
    → Success → Log to Firestore → Done
    → Failure → Trigger WhatsApp fallback
      → If Twilio configured → Send via Twilio WhatsApp API
      → Else → Log mock delivery → Alert dispatcher
```

### Twilio WhatsApp Configuration:
```javascript
// Environment variables required:
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER  // e.g., whatsapp:+14155238886
```

## 9.4 Communication Logging

Every SMS/WhatsApp attempt is logged to Firestore for audit:

```javascript
// Firestore: communicationLogs/{logId}
{
  type: 'sms',           // 'sms' | 'whatsapp'
  channel: 'dispatch',    // 'dispatch' | 'tracking' | 'hospital_alert'
  recipient: '+91XXXXXXXXXX',
  message: '...',
  status: 'delivered',    // 'delivered' | 'failed' | 'queued'
  provider: 'fast2sms',   // 'fast2sms' | 'twilio'
  caseId: 'case_001',
  sentBy: 'uid_dispatcher_001',
  sentAt: Timestamp,
  deliveryStatus: { /* provider-specific response */ },
  retryCount: 0,
  fallbackTriggered: false
}
```

---

# 10. Multilingual Translation System

**Files:** `src/context/LanguageContext.jsx`, `src/utils/translateService.js`, `src/constants/languages.js`, `src/hooks/useT.js`, `src/components/LanguageSwitcher.jsx`

## 10.1 Architecture

The translation system provides real-time UI translation for 130+ languages using a layered architecture:

```
LanguageContext (React Context)
  ├── Language State (persisted to localStorage)
  ├── translateUI() — single text translation
  ├── translateUIBatch() — bulk translation
  ├── preloadUI() — cache warming
  └── isRTL — right-to-left detection

translateService.js (Translation Engine)
  ├── Google Translate API (primary)
  ├── LRU Cache (in-memory, 500 entries)
  ├── Batch optimization (groups requests)
  └── Debounce layer (prevents API flood)

useT Hook (Component Integration)
  ├── Accepts text array
  ├── Returns translated array
  ├── Auto-translates on language change
  └── Shows loading state
```

## 10.2 Language Support

The `languages.js` file defines 130+ supported languages with metadata:

```javascript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  // ... 125+ more languages
];
```

**RTL Language Detection:**
```javascript
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ckb', 'dv', 'yi'];
export function isRTL(langCode) {
  return RTL_LANGUAGES.includes(langCode);
}
```

## 10.3 Language Persistence

User language preference is persisted across sessions:
1. On language change → `localStorage.setItem('ems_language', lang)`
2. On page load → check localStorage → check browser `navigator.language` → fallback to English
3. RTL layout is applied/removed via `document.documentElement.dir` attribute and `.rtl-active` CSS class

## 10.4 Translation Caching

The `translateService.js` implements a multi-tier caching strategy:
- **Tier 1:** In-memory LRU cache (500 entries, keyed by `text:targetLang`)
- **Tier 2:** Batch deduplication (identical texts in the same batch are translated once)
- **Tier 3:** Preload warming (components declare their text keys upfront via `preloadTranslations()`)

## 10.5 The `useT` Hook

Components integrate translation via the `useT` hook:

```javascript
// Usage in a component:
const labels = useT([
  'Patient Intake Form',
  'Submit Case',
  'Cancel'
]);

// Returns: ['रोगी प्रवेश फॉर्म', 'मामला जमा करें', 'रद्द करें'] (Hindi)
```

**Behavior:**
- Returns original texts immediately (no loading flash)
- Triggers async translation on mount and language change
- Updates in-place when translations arrive
- Skips translation if language is English

## 10.6 RTL CSS Support

**File:** `src/styles/rtl.css` (206 lines)

Provides directional overrides for RTL languages:
- Flex direction reversal
- Text alignment swapping
- Margin/padding mirror
- Icon position adjustment
- Navigation arrow inversion

---

# 11. Security Architecture

## 11.1 Authentication Security

**Provider:** Firebase Authentication  
**Methods:** Email/Password + Google OAuth 2.0  

**Session Handling:**
- Firebase manages session tokens automatically
- `onAuthStateChanged` listener detects login/logout events
- Tokens are refreshed automatically before expiry
- Logout clears all local state and redirects to login

**Google OAuth Configuration:**
- Custom parameters: `prompt: 'select_account'` (forces account selection)
- Error handling for: popup blocked, popup closed, unauthorized domain
- Automatic user document creation on first Google sign-in

## 11.2 Firestore Security Rules

**File:** `firestore.rules` (136 lines)

All database access is governed by server-side security rules that cannot be bypassed from the client. Rules are structured as:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Role resolution function
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Role check helpers
    function isAdmin() { return request.auth != null && getUserRole() == 'admin'; }
    function isDispatcher() { return request.auth != null && getUserRole() == 'dispatcher'; }
    function isParamedic() { return request.auth != null && getUserRole() == 'paramedic'; }
    function isHospitalAdmin() { return request.auth != null && getUserRole() == 'hospital_admin'; }
    function isAuthenticated() { return request.auth != null; }
    
    // Collection-level rules...
  }
}
```

## 11.3 Storage Security Rules

**File:** `storage.rules` (37 lines)

Firebase Storage rules control access to uploaded patient photos:
- Only authenticated users can upload files
- File size limits enforced (e.g., 10MB max per upload)
- Content type validation (images only)
- Path-based access control (users can only access their own uploads)

## 11.4 API Key Protection

| Key | Storage | Access |
|-----|---------|--------|
| Firebase Config | `.env.local` (gitignored) | Client-side (public, restricted by domain) |
| Gemini API Key | `server/.env` (gitignored) | Server-side only |
| Fast2SMS API Key | `server/.env` (gitignored) | Server-side only |
| Twilio Credentials | `server/.env` (gitignored) | Server-side only |
| Firebase Admin SDK | `server/serviceAccountKey.json` (gitignored) | Server-side only |
| Mapbox Token | `.env.local` (gitignored) | Client-side (restricted by domain) |
| Google Geocoding Key | `.env.local` (gitignored) | Client-side (restricted by referrer) |

## 11.5 Medical Data Considerations

While not yet HIPAA-certified, the platform implements privacy best practices:
- Patient names are **optional** — cases can be created without identifying information
- Photo uploads are stored in Firebase Storage with authenticated access only
- Communication logs do not store message content beyond what's needed for audit
- Firestore rules prevent unauthorized users from reading patient case data
- The AI copilot's context injection only provides aggregated hospital data, never individual patient records in API responses

---

# 12. Firebase Infrastructure

## 12.1 Collections Schema

### emergencyCases
**Purpose:** All active and completed emergency cases  
**Primary Users:** Paramedics (create), Dispatchers (read/update)  

| Field | Type | Description |
|-------|------|-------------|
| `emergencyContext.emergencyType` | string | cardiac, trauma, burn, accident, etc. |
| `emergencyContext.chiefComplaint` | string | Free-text description |
| `acuityLevel` | number | 1 (Critical) to 5 (Minor) |
| `patientAge` | number | Patient age |
| `patientGender` | string | male, female, other, unknown |
| `vitals` | map | Heart rate, BP, SpO2, temp, GCS, etc. |
| `pickupLocation` | map | `{latitude, longitude, address}` |
| `status` | string | active, dispatched, transporting, completed |
| `assignedAmbulance` | string | Ambulance ID |
| `targetHospital` | string | Hospital ID |
| `photos` | array | Firebase Storage URLs |
| `createdBy` | string | User UID |
| `createdAt` | timestamp | Case creation time |

### hospitals
**Purpose:** Complete hospital registry with capabilities, capacity, and readiness  
**Primary Users:** Hospital Admins (CRUD), Scoring Engine (read)

| Field | Type | Description |
|-------|------|-------------|
| `basicInfo.name` | string | Hospital name |
| `basicInfo.hospitalType` | string | general, trauma_center, cardiac, etc. |
| `basicInfo.location` | map | `{latitude, longitude}` |
| `basicInfo.phoneNumber` | string | Contact number |
| `traumaLevel` | string | level_1, level_2, level_3, none |
| `capacity.bedsByType` | map | `{icu: {total, available}, general: {...}, ...}` |
| `specialists` | map | `{cardiologist: 3, traumaSurgeon: 2, ...}` |
| `equipment` | map | `{ventilator: {total, available}, ...}` |
| `capabilities` | map | `{strokeCenter: true, cathLab: true, ...}` |
| `caseAcceptance` | map | `{acceptsCardiac: true, acceptsBurns: false, ...}` |
| `emergencyReadiness` | map | `{status, diversionStatus, queueLength}` |
| `extendedProfile` | map | Accreditations, certifications, programs |
| `lastUpdatedAt` | timestamp | Used for freshness scoring |

### ambulances
**Purpose:** Fleet vehicles with status and position  
**Primary Users:** Dispatchers (update), Command Center (read)

| Field | Type | Description |
|-------|------|-------------|
| `vehicleNumber` | string | Registration number |
| `type` | string | ALS (Advanced Life Support) or BLS (Basic Life Support) |
| `status` | string | available, dispatched, en_route, at_scene, transporting, at_hospital, offline |
| `position` | map | `{latitude, longitude}` |
| `crewMembers` | array | Names of paramedics on board |
| `currentCaseId` | string | Active case assignment |

### dispatchOverrides
**Purpose:** Audit trail for manual routing overrides  
**Primary Users:** Dispatchers (create), Admins (read)

### users
**Purpose:** User profiles with role assignments  
**Primary Users:** Auth system (create/read), Admins (manage)

### communicationLogs
**Purpose:** SMS and WhatsApp delivery records  
**Primary Users:** System (create), Admins (read/audit)

### feedback
**Purpose:** User feedback and issue reports  
**Primary Users:** All users (create), Admins (read)

---

# 13. Simulation Engine

**Location:** Built into `CommandCenterDashboard.jsx`  
**Purpose:** Demo-ready ambulance fleet simulation for presentations without live GPS

## 13.1 Fleet Creation

```javascript
function createAmbulanceFleet(center) {
  // Creates 8 ambulances within 10km of city center
  // ALS units: KA-01-EMR-001 through 004
  // BLS units: KA-01-EMR-005 through 008
  // Random initial positions using polar coordinate distribution
}
```

**Position Distribution:** Uses polar coordinates with random angle and radius to distribute ambulances. The radius is square-rooted to create uniform area distribution (prevents clustering near center).

## 13.2 State Machine

Each simulated ambulance progresses through a lifecycle:

```
available → dispatched (3s) → en_route (8s) → at_scene (5s) → transporting (10s) → at_hospital (5s) → available
```

The `getNextStatus()` function defines transition rules, ensuring ambulances cycle through realistic states during simulation.

## 13.3 Position Interpolation

For ambulances in `en_route` or `transporting` status, positions are interpolated between waypoints:

```javascript
function interpolatePosition(start, end, progress) {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress
  ];
}
```

This creates smooth movement animation on the command center map.

## 13.4 Speed Multipliers

Ambulance movement speeds vary by status:
- `en_route`: 60 km/h equivalent (emergency speed)
- `transporting`: 40 km/h (patient-safe speed)
- Other statuses: Stationary

---

# 14. Responsive UI System

**Files:** `src/styles/responsiveUtils.css` (405 lines), `src/styles/rtl.css` (206 lines), `src/components/shared/` (6 components)

## 14.1 Breakpoint System

```css
/* Mobile-first responsive breakpoints */
@media (max-width: 480px)  { /* Small phone */ }
@media (max-width: 768px)  { /* Tablet portrait */ }
@media (max-width: 1024px) { /* Tablet landscape */ }
@media (max-width: 1280px) { /* Small desktop */ }
@media (min-width: 1281px) { /* Large desktop */ }
```

## 14.2 Mobile Components

| Component | File | Purpose |
|-----------|------|---------|
| `MobileCaseCard` | `shared/MobileCaseCard.jsx` | Compact case display for small screens |
| `MobileFleetCard` | `shared/MobileFleetCard.jsx` | Ambulance status card for mobile |
| `MobileHospitalCard` | `shared/MobileHospitalCard.jsx` | Hospital capacity overview for mobile |
| `MobileDrawer` | `shared/MobileDrawer.jsx` | Slide-up panel replacing sidebars on mobile |
| `MobileActionBar` | `shared/MobileActionBar.jsx` | Bottom action bar with touch-optimized buttons |
| `NetworkStatusBanner` | `shared/NetworkStatusBanner.jsx` | Offline detection banner |

## 14.3 Map Resizing

**Hook:** `src/hooks/useMapResize.js`

Handles dynamic map viewport adjustment when panels open/close:
- Listens for window resize events and sidebar toggle events
- Triggers `map.resize()` after a debounced delay
- Recalculates bounds to fit all markers in the visible viewport

## 14.4 Network Status Detection

The `NetworkStatusBanner` component monitors `navigator.onLine` and displays a persistent banner when the user loses connectivity:
- **Online:** Banner hidden
- **Offline:** Red banner: "⚠️ You are offline. Some features may not work."
- **Reconnected:** Green banner: "✅ Back online!" (auto-hides after 3 seconds)

---

# 15. Error Handling & Hardening

## 15.1 NaN Score Prevention

The scoring engine is hardened with multiple layers of NaN prevention:

```javascript
function safeNum(value, fallback = 0) {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'object' && value !== null) {
    return safeNum(value.available ?? value.count ?? value.total, fallback);
  }
  return fallback;
}

function safeScore(score, min = 0, max = 100) {
  const num = Number(score);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}
```

Every intermediate calculation passes through these guards.

## 15.2 Schema Guards

The `normalizeHospital()` function (100+ lines) applies defaults for every possible field:
- Missing `capacity.bedsByType.icu` → `{ total: 0, available: 0 }`
- Missing `specialists` → all 10 specialist types default to 0
- Missing `equipment` → all equipment types default to `{ total: 0, available: 0 }`
- Missing `emergencyReadiness` → `{ status: 'unknown', diversionStatus: false }`

The `normalizeSpecialists()` function handles 4 different data formats:
1. `undefined/null` → default object with all zeros
2. Plain number: `{ cardiologist: 3 }` → `3`
3. Nested object: `{ cardiologist: { available: 2, count: 3 } }` → `2`
4. Legacy array: `['cardiologist', 'neurologist']` → `{ cardiologist: 1, neurologist: 1 }`

## 15.3 Error Boundaries

**File:** `src/components/AppErrorBoundary.jsx` (3,341 bytes)

React error boundary wrapping the entire application:
- Catches render errors in any child component
- Displays a recovery UI with error details
- Provides "Try Again" button that resets component state
- Logs errors to console with stack traces
- Prevents white-screen crashes in production

**File:** `src/components/HospitalDashboard.jsx` — Internal `ErrorBoundary` class

Hospital dashboard has its own error boundary to isolate hospital data parsing errors:
- Catches errors from malformed Firestore data
- Shows inline error card instead of crashing the entire page
- Includes `componentDidCatch` for error logging

## 15.4 Capacity Auto-Normalization

When hospital data is loaded from Firestore, the `normalizeCapacity()` function ensures data integrity:
- Available beds clamped to ≤ total beds
- Negative values → 0
- Non-numeric values → 0
- Missing bed types → `{ total: 0, available: 0 }`

---

# 16. API Integrations

## 16.1 Mapbox GL JS

**Purpose:** Interactive maps for routing, command center, and navigation  
**Version:** v3.6.0  
**Token:** `VITE_MAPBOX_TOKEN` (environment variable)

**Usage Points:**
- Routing Dashboard: Route visualization, hospital markers, ambulance tracking
- Command Center: Fleet tracking map with ambulance icons
- Navigation Component: Turn-by-turn driver display

**Directions API:**
```
GET https://api.mapbox.com/directions/v5/mapbox/driving/{coords}
?access_token={token}
&geometries=geojson
&overview=full
&steps=true
```

## 16.2 Google Geocoding API

**File:** `src/services/geocodingService.js` (294 lines)  
**Purpose:** Place name ↔ coordinate conversion  
**Fallback:** OpenCage API when Google quota exhausted

**Features:**
- Forward geocoding: Place name → coordinates
- Reverse geocoding: Coordinates → place name
- Response caching with TTL (5 minutes)
- Confidence scoring from geocoding results
- Browser geolocation API integration for current position

## 16.3 Fast2SMS API

**Purpose:** SMS delivery for Indian mobile numbers  
**Server:** `server/smsServer.js` (port 5001)  
**Route:** Quick transactional (`route: 'q'`)  
**Endpoints:** Send tracking, dispatch, hospital alert, WhatsApp fallback

## 16.4 Google Translate API

**Purpose:** Real-time UI translation  
**File:** `src/utils/translateService.js`  
**Protocol:** Google Translate free API endpoint  
**Caching:** In-memory LRU cache (500 entries)

## 16.5 Google Gemini AI

**Purpose:** Role-aware AI copilot  
**Model:** Gemini 2.0 Flash  
**Server:** `server/geminiChat.js` (port 5002)  
**SDK:** `@google/generative-ai`

---

# 17. AI Copilot (Gemini)

**Files:** `server/geminiChat.js`, `server/roleContextBuilder.js`, `server/systemPrompts.js`, `server/suggestedPrompts.js`, `src/components/ai/EMSChatAssistant.jsx`, `src/services/geminiService.js`

## 17.1 Architecture

The AI Copilot provides a role-aware chat assistant that augments every user's workflow with contextual intelligence:

```
User Types Question in Chat Widget
  → Frontend sends { message, role, contextIds, sessionId }
  → Express Server (port 5002) receives request
  → roleContextBuilder.js fetches relevant Firestore data based on role
  → systemPrompts.js provides role-specific personality
  → Gemini 2.0 Flash generates response with context
  → suggestedPrompts.js generates follow-up questions
  → Response returned to frontend
```

## 17.2 Role-Specific System Prompts

Each role receives a tailored system prompt that defines the AI's personality:

| Role | AI Persona | Capabilities |
|------|-----------|-------------|
| **Paramedic** | EMS Triage Copilot | Hospital recommendations, treatment priorities, golden hour advice |
| **Dispatcher** | Dispatch Intelligence Copilot | Fleet optimization, coverage gaps, case prioritization |
| **Hospital Admin** | Hospital Operations Copilot | Capacity summaries, incoming alerts, bed allocation |
| **Command Center** | Network Intelligence Copilot | System-wide metrics, trend analysis, resource reallocation |
| **Admin** | Platform Administrator Assistant | System analytics, configuration advice, data quality |

## 17.3 Context Data Injection

The `roleContextBuilder.js` fetches real-time Firestore data tailored to each role:

**Paramedic Context:**
- Assigned case details (emergency type, acuity, vitals, location)
- Top 5 nearby hospitals with bed counts, specialists, capabilities

**Dispatcher Context:**
- Summary of all active cases (count by acuity, emergency types)
- Fleet status (total, available, en route, at scene, offline)
- Hospital load (beds available, diversion status, trauma levels)

**Hospital Admin Context:**
- All hospitals' capacity data (up to 20 hospitals)
- Bed counts by type, specialist availability, equipment status
- Emergency readiness and diversion status

## 17.4 Explainability Integration

When routing/scoring context is available, an explainability instruction is appended to the system prompt:

```
EXPLAINABILITY MODE:
When explaining hospital routing decisions, use scoring engine data:
- Cite exact scores: "Hospital scored 87/100 overall"
- Explain factor contributions: "Capability score: 25/30, Distance: 18/20"
- Mention specific resources: "8 ICU beds, 3 trauma surgeons on duty"
- Reference golden hour: "42 minutes remaining, ETA is 12 minutes"
- Note disqualification reasons if applicable
Always ground explanations in actual data — never fabricate.
```

## 17.5 Chat Widget UI

**File:** `src/components/ai/EMSChatAssistant.jsx` (633 lines)

The AI Copilot appears as a floating chat widget:
- **Collapsed state:** Floating button in bottom-right corner with role-specific icon
- **Expanded state:** Full chat panel with message history, input field, and suggested prompts
- **Role badge:** Visual indicator of the current user's role
- **Suggested prompts:** 4 role-specific questions that update based on conversation context
- **Context indicator:** Shows what data the AI currently has access to (e.g., "3 hospitals loaded", "Active case data")
- **Loading states:** Typing indicator while Gemini generates response

---

# 18. Deployment Architecture

## 18.1 Firebase Hosting

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

The SPA is deployed to Firebase Hosting with catch-all rewrite for client-side routing.

## 18.2 Environment Variables

**Frontend (`.env.local`):**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_MAPBOX_TOKEN=...
VITE_GOOGLE_GEOCODING_API_KEY=...
VITE_OPENCAGE_API_KEY=...
```

**Backend (`server/.env`):**
```
GEMINI_API_KEY=...
GEMINI_PORT=5002
FAST2SMS_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
```

## 18.3 Build Pipeline

```bash
# Development
npm run dev          # Vite dev server (HMR)
npm run gemini-server  # Gemini AI proxy
npm run sms-server     # SMS proxy

# Production
npm run build        # Vite production build + Terser minification
firebase deploy      # Deploy to Firebase Hosting
```

## 18.4 Seed Data

```bash
npm run seed:firestore   # Populates 10 hospitals, 8 ambulances, 5 cases
```

The seed script (`scripts/seedFirestore.js`, 1,040 lines) generates realistic test data centered on Bangalore, including randomized bed availability, specialist counts, equipment, and emergency readiness.

---

# 19. Demo Flow Walkthrough

## Step-by-Step Demonstration Script

### Step 1 — Authentication
1. Open the application at `http://localhost:5173`
2. Click "Register" tab
3. Enter email, password, select role: **Hospital Admin**
4. Click "Register" → redirected to Hospital Dashboard

### Step 2 — Register a Hospital
1. Click "Add Hospital" button
2. Fill in: Name = "City General Hospital", Type = "General"
3. Set Trauma Level = "Level 2"
4. Set location coordinates (Bangalore: 12.9716, 77.5946)
5. Toggle capabilities: Emergency Surgery ✅, CT Scan ✅
6. Set bed availability: ICU = 10 total / 6 available
7. Add specialists: Trauma Surgeon = 2, Emergency Physician = 3
8. Click "Save" → Hospital appears in list with real-time Firestore write

### Step 3 — Update Live Capacity
1. Open the "Live Ops" tab for the hospital
2. Drag ICU slider from 6 to 4 (simulating admissions)
3. Toggle diversion to "ON" temporarily
4. Observe: Routing Dashboard (if open in another tab) immediately re-ranks this hospital

### Step 4 — Create an Emergency Case
1. Log out → Register as **Paramedic**
2. Open "Patient Intake" dashboard
3. Select Emergency Type: **Cardiac**
4. Set Acuity: **1 (Critical)**
5. Enter vitals: HR=120, BP=90/60, SpO2=88%
6. Chief Complaint: "Chest pain, diaphoresis"
7. Capture photo of scene (optional)
8. Click "Submit Case" → GPS auto-detected → Case written to Firestore

### Step 5 — View AI-Powered Routing
1. Navigate to "Routing" dashboard
2. The scoring engine automatically evaluates all hospitals
3. Observe ranked hospital list with scores (e.g., 87, 72, 65...)
4. Click on Rank #1 hospital → Explainability panel expands
5. Review factor breakdown: Capability 28/30, Specialist 22/25, etc.
6. See golden hour countdown bar at the top

### Step 6 — Dispatcher Override
1. Log out → Register as **Dispatcher**
2. Open Command Center → see the new case in the queue
3. Navigate to Routing Dashboard
4. Click "Override Routing" button
5. Select alternative hospital from dropdown
6. Choose reason: "Specialist Confirmed Available"
7. Add note: "Confirmed cath lab availability via phone"
8. Click "Confirm Override" → Audit trail created in Firestore

### Step 7 — Communication
1. From the routing page or command center, click "Send Tracking SMS"
2. Enter patient family phone number
3. SMS sent with tracking link, hospital name, and ETA
4. Hospital alert SMS sent to receiving facility

### Step 8 — AI Copilot Interaction
1. Click the floating chat icon (bottom-right)
2. As Paramedic, ask: "Which hospital for my cardiac patient?"
3. AI responds with specific recommendation citing bed counts and specialists
4. As Dispatcher, ask: "What's the fleet status?"
5. AI provides fleet breakdown from live Firestore data

### Step 9 — Multilingual Demo
1. Click language dropdown (top navigation)
2. Switch from English to Hindi (हिन्दी)
3. Entire UI translates to Hindi in real-time
4. Switch to Tamil (தமிழ்) → translates to Tamil
5. Show that all dashboards, buttons, labels translate

---

# 20. Future Scope

## 20.1 Machine Learning Enhancements
- **Survival Prediction Model:** Train on historical case data to predict patient survival probability based on hospital choice, ETA, and acuity
- **Demand Forecasting:** Predict emergency case volume by time, day, and season to optimize fleet pre-positioning
- **Auto-Acuity Detection:** Computer vision model to estimate acuity from patient photos (wound severity, consciousness assessment)

## 20.2 IoT & Hardware Integration
- **Ambulance Telematics:** Real-time GPS tracking via OBD-II devices instead of browser geolocation
- **Vital Sign Monitors:** Direct integration with ambulance cardiac monitors for automatic vitals capture
- **Traffic Signal Preemption:** Interface with smart traffic systems to give ambulances green corridors

## 20.3 Healthcare System Integration
- **EHR Integration:** Pull patient medical history from hospital EHR systems for better routing (e.g., route diabetic patients to facilities with endocrinologists)
- **Insurance Verification:** Real-time insurance coverage check against hospital network
- **Blood Bank Network:** Cross-hospital blood availability pooling for trauma cases

## 20.4 Advanced Operations
- **Drone Medicine Delivery:** Coordinate drone-based delivery of critical supplies (blood, anti-venom) to ambulance en route
- **Multi-City Federation:** Connect EMS networks across cities for inter-city transfers and resource sharing
- **AI Dispatch Automation:** Fully autonomous dispatch with human-in-the-loop oversight for edge cases

## 20.5 Analytics & Compliance
- **Real-Time Dashboards:** Grafana-style KPI dashboards for EMS leadership
- **HIPAA Compliance:** Full audit logging, encryption at rest, and access control for US deployment
- **Performance Benchmarking:** Golden hour compliance rates, average response times, hospital match accuracy

---

# Appendix A — Technology Stack Reference

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Frontend Framework | React | 19.0.0 | UI component library |
| Build Tool | Vite | 5.4.8 | Dev server + production bundling |
| Routing | React Router DOM | 6.26.2 | Client-side navigation |
| Styling | Tailwind CSS | 3.4.13 | Utility-first CSS framework |
| Maps | Mapbox GL JS | 3.6.0 | Interactive maps |
| Charts | Recharts | 2.12.7 | Data visualization |
| Icons | Lucide React | 0.441.0 | Icon library |
| Firebase | Firebase JS SDK | 11.0.2 | Auth, Firestore, Storage |
| Firebase Admin | firebase-admin | 13.6.1 | Server-side Firestore access |
| HTTP Client | Axios | 1.7.7 | API requests |
| Server | Express | 5.2.1 | Backend proxy servers |
| AI | Google Gemini | 2.0 Flash | AI copilot |
| Offline Storage | Localforage | 1.10.0 | IndexedDB wrapper |
| Image Metadata | Exifreader | 4.32.0 | EXIF data extraction |
| Virtualization | react-window | 1.8.10 | Large list optimization |
| Compression | vite-plugin-compression | 0.5.1 | Gzip/Brotli build output |

---

# Appendix B — File Structure

```
sihproject/
├── server/
│   ├── geminiChat.js           # Gemini AI proxy server (:5002)
│   ├── roleContextBuilder.js   # Firestore context injection
│   ├── systemPrompts.js        # Role-specific AI prompts
│   ├── suggestedPrompts.js     # Follow-up question generator
│   ├── smsServer.js            # SMS proxy server (:5001)
│   ├── .env                    # Server secrets (gitignored)
│   └── serviceAccountKey.json  # Firebase Admin (gitignored)
├── scripts/
│   └── seedFirestore.js        # Test data generator (1,040 lines)
├── src/
│   ├── App.jsx                 # Root component with routing
│   ├── main.jsx                # Application entry point
│   ├── index.css               # Global styles
│   ├── components/
│   │   ├── PatientVitalsForm.jsx         # Patient intake (1,123 lines)
│   │   ├── CameraCapture.jsx             # Photo/video capture (1,579 lines)
│   │   ├── RoutingDashboard.jsx          # AI routing viz (1,061 lines)
│   │   ├── CommandCenterDashboard.jsx    # Fleet control (932 lines)
│   │   ├── HospitalDashboard.jsx         # Hospital CRUD (1,304 lines)
│   │   ├── HospitalExplainabilityPanel.jsx # Score explainability
│   │   ├── HospitalExtendedProfileForm.jsx # Extended profiles
│   │   ├── HospitalLiveOpsPanel.jsx      # Real-time capacity
│   │   ├── HospitalProfileTab.jsx        # Profile tab container
│   │   ├── HospitalProfileView.jsx       # Read-only profile view
│   │   ├── RealTimeHospitalCapability.jsx # Live capability display
│   │   ├── DispatcherOverridePanel.jsx   # Manual override workflow
│   │   ├── RoutingStatusBanner.jsx       # System status alerts
│   │   ├── LanguageSwitcher.jsx          # Language dropdown
│   │   ├── BotpressChatbot.jsx           # Legacy chatbot
│   │   ├── FeedbackForm.jsx              # User feedback
│   │   ├── EmergencyContacts.jsx         # Emergency numbers
│   │   ├── AppErrorBoundary.jsx          # Global error boundary
│   │   ├── ai/
│   │   │   └── EMSChatAssistant.jsx      # AI Copilot chat widget
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx          # Auth context + RBAC
│   │   │   ├── LoginForm.jsx             # Login/Register UI
│   │   │   ├── ProtectedRoute.jsx        # Route guard
│   │   │   ├── PermissionGuard.jsx       # UI element guard
│   │   │   └── NotAuthorized.jsx         # 403 page
│   │   ├── navigation/
│   │   │   └── AmbulanceNavigation.jsx   # Turn-by-turn nav
│   │   ├── shared/
│   │   │   ├── MobileCaseCard.jsx
│   │   │   ├── MobileFleetCard.jsx
│   │   │   ├── MobileHospitalCard.jsx
│   │   │   ├── MobileDrawer.jsx
│   │   │   ├── MobileActionBar.jsx
│   │   │   └── NetworkStatusBanner.jsx
│   │   └── tracking/
│   │       └── AmbulanceTrackingViewer.jsx
│   ├── services/
│   │   ├── capabilityScoringEngine.js    # Hospital ranking (993 lines)
│   │   ├── communicationService.js       # SMS/WhatsApp client
│   │   ├── geminiService.js              # AI Copilot API client
│   │   ├── geocodingService.js           # Place ↔ coordinates
│   │   ├── smsService.js                 # SMS API helpers
│   │   └── storageService.js             # Firebase Storage
│   ├── context/
│   │   └── LanguageContext.jsx           # i18n state management
│   ├── hooks/
│   │   ├── useT.js                       # Translation hook
│   │   └── useMapResize.js              # Map viewport management
│   ├── constants/
│   │   ├── languages.js                  # 130+ language definitions
│   │   └── translationKeys.js            # Preload key registry
│   ├── styles/
│   │   ├── responsiveUtils.css           # Responsive breakpoints
│   │   └── rtl.css                       # Right-to-left support
│   └── utils/
│       ├── translateService.js           # Google Translate wrapper
│       └── offlineSync.js               # Offline case queuing
├── firestore.rules                       # Database security rules
├── storage.rules                         # File storage security
├── firebase.json                         # Firebase config
├── .firebaserc                           # Firebase project alias
├── package.json                          # Dependencies
└── vite.config.js                        # Build configuration
```

---

# Appendix C — Line Count Summary

| Module | Lines | Description |
|--------|-------|-------------|
| CameraCapture.jsx | 1,579 | Photo/video capture system |
| HospitalDashboard.jsx | 1,304 | Hospital CRUD + management |
| PatientVitalsForm.jsx | 1,123 | Patient intake form |
| RoutingDashboard.jsx | 1,061 | Route visualization |
| seedFirestore.js | 1,040 | Test data generation |
| capabilityScoringEngine.js | 993 | Hospital ranking algorithm |
| CommandCenterDashboard.jsx | 932 | Fleet command center |
| EMSChatAssistant.jsx | 633 | AI Copilot widget |
| smsServer.js | 434 | SMS proxy server |
| HospitalExplainabilityPanel.jsx | 363 | Score explainability |
| responsiveUtils.css | 405 | Mobile responsive styles |
| **Total Platform** | **~15,000+** | **Complete codebase** |

---

**Document prepared for hackathon evaluation, academic review, technical audit, and product demonstration.**

**© 2026 EMS Router Platform — AI-Powered Ambulance Triage & Smart Hospital Routing System**
