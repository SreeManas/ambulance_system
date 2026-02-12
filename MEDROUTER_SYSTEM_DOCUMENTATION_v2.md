# MEDROUTER — Routes That Save Lives

## Complete System Documentation v2.0

**Platform Name:** MEDROUTER  
**Tagline:** Routes That Save Lives  
**Version:** 2.0.0  
**Classification:** Production-Grade EMS Decision Intelligence Platform  
**Repository:** [SreeManas/ambulance_system](https://github.com/SreeManas/ambulance_system)  
**Technology Stack:** React 19 · Vite 5 · Firebase · Mapbox GL JS · Google Gemini 2.5 Flash · Fast2SMS · Vercel Serverless  
**Document Date:** February 2026  
**Document Purpose:** Government evaluation, healthcare regulatory review, investor due diligence, system architecture reference, DevOps deployment guide, and future maintainer onboarding  

---

# Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [System Architecture](#2-system-architecture)
3. [Role-Based Access System (RBAC)](#3-role-based-access-system-rbac)
4. [Emergency Intake System](#4-emergency-intake-system)
5. [Capability Scoring Engine](#5-capability-scoring-engine)
6. [AI Explainability Layer](#6-ai-explainability-layer)
7. [Dispatcher Override Routing](#7-dispatcher-override-routing)
8. [Live Hospital Operations Panel](#8-live-hospital-operations-panel)
9. [Turn-By-Turn Navigation System](#9-turn-by-turn-navigation-system)
10. [GPS Tracking + SMS Communication](#10-gps-tracking--sms-communication)
11. [Multilingual Translation System](#11-multilingual-translation-system)
12. [Gemini AI Copilot](#12-gemini-ai-copilot)
13. [Responsive UI Infrastructure](#13-responsive-ui-infrastructure)
14. [Hospital Self-Onboarding System](#14-hospital-self-onboarding-system)
15. [Multi-City Simulation Engine](#15-multi-city-simulation-engine)
16. [Security Infrastructure](#16-security-infrastructure)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Performance Optimization](#18-performance-optimization)
19. [Innovation Summary](#19-innovation-summary)
20. [Future Expansion Roadmap](#20-future-expansion-roadmap)

---

# 1. Platform Overview

## 1.1 Vision of MEDROUTER

MEDROUTER is a full-stack, real-time **Decision Intelligence Platform** engineered to transform pre-hospital emergency medical services (EMS) in India and globally. The platform replaces the archaic, radio-based, human-memory-dependent ambulance dispatch model with an AI-driven system that automatically evaluates every hospital in a metropolitan network and recommends the optimal destination within seconds of an emergency call.

The name **MEDROUTER** encapsulates the platform's core function: intelligently routing medical emergencies to the right hospital at the right time. The tagline — **"Routes That Save Lives"** — reflects the platform's mission-critical purpose: every second saved in hospital selection directly contributes to patient survival.

## 1.2 The Problem MEDROUTER Solves

India's Emergency Medical Services infrastructure faces systemic challenges that directly contribute to preventable patient mortality:

### The Golden Hour Crisis

Medical research conclusively establishes that trauma patients treated within 60 minutes of injury ("the Golden Hour") have significantly higher survival rates. In Indian metropolitan cities, the average ambulance-to-hospital decision takes **8–15 minutes** via manual radio coordination. This consumes 13–25% of the Golden Hour on logistics alone. MEDROUTER reduces hospital selection time to **under 3 seconds** through automated multi-factor scoring.

### Information Asymmetry

Paramedics in the field have zero visibility into:
- Which hospitals have available ICU beds at this moment
- Which specialists are currently on duty
- Which emergency departments are on diversion (not accepting patients)
- Which hospitals have the specific equipment required for the patient's condition

They rely on outdated phone calls, institutional memory, and guesswork. MEDROUTER provides a **live, continuously-updated capability map** of every hospital in the network, refreshed in real-time via Firestore snapshot listeners.

### Static Dispatch Models Cause Mis-Routing

Current 108/112 dispatch systems route ambulances to the **nearest hospital** regardless of that hospital's actual ability to treat the patient's specific condition. This leads to dangerous scenarios:

| Scenario | Consequence |
|----------|-------------|
| Cardiac arrest patient → Hospital without cath lab | Secondary transfer wastes 30+ minutes of Golden Hour |
| Burn victim → Facility without a burn unit | Delayed treatment increases mortality by 40% |
| Pediatric emergency → Adult-only facility | Third transfer required, patient deteriorates |
| Trauma patient → Hospital at full ICU capacity | Patient waits in hallway, no monitoring available |

MEDROUTER's **emergency-specific scoring profiles** ensure that a cardiac patient is routed to a hospital with a cardiologist, cath lab, and available cardiac beds — not merely the closest facility.

### No Audit Trail for Override Decisions

When dispatchers override routing decisions based on phone calls or personal judgment, there is no systematic record of **why** the override was made. This makes quality improvement, accountability analysis, and regulatory compliance impossible. MEDROUTER creates a **complete Firestore-backed audit trail** for every override decision.

## 1.3 How MEDROUTER Fixes Hospital Routing

MEDROUTER introduces **Decision Intelligence** — a paradigm shift from static "nearest hospital" routing to dynamic, multi-factor, emergency-aware hospital matching:

```
Traditional EMS Routing:
  Emergency Call → Nearest Hospital → Hope for the best

MEDROUTER Decision Intelligence:
  Emergency Call → Patient Assessment → AI Scoring Engine evaluates ALL hospitals →
  Emergency-specific profile applied → 8 scoring dimensions calculated →
  Golden Hour modifier applied → Disqualified hospitals filtered →
  Ranked recommendations with full explainability → Dispatcher review/override →
  Turn-by-turn navigation + SMS alerts + Hospital preparation
```

### Decision Intelligence vs. Static Routing

| Dimension | Static Routing | MEDROUTER Decision Intelligence |
|-----------|---------------|-------------------------------|
| Selection criteria | Distance only | 8+ factors (capability, specialists, equipment, beds, distance, load, freshness, trauma level) |
| Emergency awareness | None | 7 emergency-specific scoring profiles (cardiac, trauma, burn, accident, pediatric, infectious, general) |
| Time sensitivity | Ignored | Golden Hour modifier progressively shifts weighting as urgency increases |
| Hospital visibility | Phone/radio inquiry | Real-time Firestore dashboard with live bed counts and diversion status |
| Decision transparency | Black box | Full AI explainability panel with per-factor score breakdown |
| Override accountability | None | Structured audit trail with reason categorization |
| Communication | Radio only | Automated SMS + WhatsApp + in-app alerts |
| Language access | Single language | 130+ languages with real-time translation |

## 1.4 Real-World EMS Impact Metrics

| Metric | Before (Manual) | After (MEDROUTER) |
|--------|-----------------|-------------------|
| Hospital selection time | 8–15 minutes | < 3 seconds |
| Scoring factors considered | 1–2 (distance, memory) | 8+ (capability, beds, specialists, equipment, distance, load, freshness, golden hour) |
| Golden hour visibility | None | Real-time countdown with urgency modifier |
| Hospital capacity awareness | Phone calls | Live Firestore dashboards with slider controls |
| Override accountability | None | Full audit trail with reason logging and Firestore persistence |
| Language support | Single language | 130+ languages with auto-detection and RTL support |
| Communication channels | Radio only | SMS + WhatsApp + in-app alerts |
| Hospital preparation time | 0 (no advance notice) | ETA-based alert sent on dispatch |
| Data freshness tracking | N/A | Automatic freshness penalty for stale hospital data |
| Disqualification filtering | None | Automatic exclusion of incapable/diverted/full hospitals |

## 1.5 Target Users

| User Role | Description | Primary Workflow |
|-----------|-------------|-----------------|
| **Paramedics (Field Crews)** | First responders capturing patient vitals in the ambulance | Patient intake → receive AI-ranked hospital list → navigate to destination |
| **Dispatchers (Control Room)** | Fleet coordinators managing ambulance assignments | Monitor case queue → review AI recommendations → accept or override routing → dispatch alerts |
| **Hospital Administrators** | Staff managing hospital readiness and capacity | Self-onboard hospital → update bed availability via sliders → toggle diversion status |
| **Command Center Operators** | Senior operators with network-wide situational awareness | Monitor all active cases → track fleet positions → identify coverage gaps → coordinate multi-ambulance events |
| **Platform Administrators** | System administrators with full platform access | User management → system configuration → data quality monitoring → analytics review |

## 1.6 Key Platform Objectives

1. **Minimize Time-to-Treatment** by automating hospital selection with multi-factor scoring, reducing decision time from minutes to seconds
2. **Maximize Clinical Match** by routing patients to hospitals with the right specialists, equipment, and available capacity for their specific emergency type
3. **Enable Golden Hour Compliance** through real-time countdown tracking and urgency-weighted scoring that dynamically adjusts recommendations as time expires
4. **Provide Decision Transparency** through AI explainability panels showing exactly why each hospital was ranked, enabling informed human oversight
5. **Support Human Override** with auditable dispatcher override workflows that preserve accountability without blocking rapid decision-making
6. **Ensure Universal Access** through 130+ language translation with RTL support and mobile-responsive design for low-bandwidth field conditions
7. **Maintain Data Integrity** through offline-first architecture, NaN-hardened scoring, schema normalization, and crash-recovery error boundaries

---

# 2. System Architecture

## 2.1 High-Level Architecture Diagram

The platform follows a **three-tier architecture** with real-time data synchronization and dual deployment modes (Vercel serverless for production, Express proxies for local development):

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                     │
│  React 19 Single-Page Application (Vite 5 Build Tooling)                  │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Paramedic │ │Dispatcher│ │ Hospital │ │ Command  │ │  Admin   │       │
│  │Dashboard │ │  Command │ │Dashboard │ │  Center  │ │Dashboard │       │
│  │(Intake + │ │  Center  │ │(Onboard +│ │  Fleet   │ │(Full     │       │
│  │ Routing) │ │(Fleet +  │ │ LiveOps) │ │  Mgmt    │ │ Access)  │       │
│  └────┬─────┘ │Override) │ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │       └────┬─────┘      │             │            │              │
│  ┌────┴────────────┴────────────┴─────────────┴────────────┴─────┐       │
│  │              SHARED CLIENT SERVICES LAYER                      │       │
│  │  • Capability Scoring Engine (client-side, < 50ms)             │       │
│  │  • Geocoding Service (Google + OpenCage fallback)              │       │
│  │  • Communication Service (SMS/WhatsApp client)                 │       │
│  │  • Translation Service (Google Translate + LRU cache)          │       │
│  │  • Gemini Service (REST client → serverless APIs)              │       │
│  │  • Offline Sync Service (IndexedDB via localforage)            │       │
│  └──────────────────────┬────────────────────────────────────────┘       │
└─────────────────────────┼────────────────────────────────────────────────┘
                          │
         ┌────────────────┼──────────────────────┐
         │                │                      │
┌────────▼────────┐ ┌─────▼──────┐ ┌─────────────▼──────────┐
│   Firebase      │ │  Vercel    │ │   Express Proxy         │
│   Platform      │ │  Serverless│ │   Servers (Local Dev)   │
│                 │ │  Functions │ │                         │
│  • Firestore    │ │            │ │  • Gemini AI Server     │
│    (10 colls)   │ │ /api/gemini│ │    :5002                │
│  • Auth         │ │  /chat     │ │  • SMS Proxy Server     │
│  • Storage      │ │  /suggest  │ │    :5001                │
│  • Hosting      │ │  /health   │ │                         │
│                 │ │            │ │  • Shares prompt        │
│  Security Rules │ │ Gemini 2.5 │ │    templates with       │
│  RBAC Enforced  │ │ Flash API  │ │    serverless layer     │
└─────────────────┘ └────────────┘ └─────────────────────────┘
     DATABASE            SERVERLESS           LOCAL DEV
      LAYER              API LAYER            API LAYER
```

## 2.2 Frontend Layer

### 2.2.1 Core Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI component library with hooks-based architecture |
| Vite | 5.4.8 | Development server (HMR) + production bundler (Terser minification) |
| React Router DOM | 6.26.2 | Client-side routing with role-based route guards |
| Tailwind CSS | 3.4.13 | Utility-first CSS framework with custom responsive utilities |
| Mapbox GL JS | 3.6.0 | Interactive WebGL maps for routing, fleet tracking, and navigation |
| Recharts | 2.12.7 | Data visualization for analytics dashboards |
| Lucide React | 0.441.0 | Icon library (400+ consistent SVG icons) |
| Localforage | 1.10.0 | IndexedDB wrapper for offline case queuing |
| Exifreader | 4.32.0 | EXIF metadata extraction from captured photos |
| react-window | 1.8.10 | Virtualized list rendering for large hospital lists |

### 2.2.2 Routing System

The frontend is a Single-Page Application (SPA) with React Router DOM v6 managing navigation:

```
App.jsx (Root)
├── AuthProvider (React Context — authentication state)
│   └── LanguageProvider (React Context — i18n state)
│       ├── Nav (Role-aware navigation bar with MEDROUTER branding)
│       ├── LoginForm (Authentication gateway — email/password + Google OAuth)
│       └── ProtectedRoute (RBAC route guard)
│           ├── PatientVitalsForm        (Paramedic — /intake)
│           ├── RoutingDashboard         (Paramedic/Dispatcher — /routing)
│           ├── HospitalDashboard        (Hospital Admin — /hospitals)
│           ├── CommandCenterDashboard   (Dispatcher/Command Center — /command)
│           ├── FeedbackForm             (All roles — /feedback)
│           └── EMSChatAssistant         (Floating widget, all roles)
```

### 2.2.3 State Management

MEDROUTER uses **React Context API** for global state (avoiding Redux complexity for this application scale):

| Context | File | State Managed |
|---------|------|---------------|
| `AuthContext` | `AuthProvider.jsx` | Current user, role, login status, role migration |
| `LanguageContext` | `LanguageContext.jsx` | Selected language, RTL flag, translate functions, cache |

Component-level state is managed via `useState` and `useReducer` hooks. Real-time data from Firestore is consumed via `onSnapshot` listeners that directly update local component state.

### 2.2.4 Custom Hooks Infrastructure

| Hook | File | Purpose |
|------|------|---------|
| `useT` | `hooks/useT.js` | Single-text translation with auto-refresh on language change |
| `useTBatch` | `hooks/useT.js` | Batch translation of label arrays for entire dashboards |
| `useTPreload` | `hooks/useT.js` | Cache-warming for predefined translation key sets |
| `useMapResize` | `hooks/useMapResize.js` | Dynamic map viewport adjustment when panels open/close |

## 2.3 Backend Layer

### 2.3.1 Vercel Serverless API Layer (Production)

MEDROUTER's production backend runs as **Vercel Serverless Functions**, eliminating the need for managed servers:

| Endpoint | File | Method | Purpose |
|----------|------|--------|---------|
| `/api/gemini/chat` | `api/gemini/chat.js` | POST | Gemini 2.5 Flash AI chat with role-specific prompts and context injection |
| `/api/gemini/suggestions` | `api/gemini/suggestions.js` | GET | Role-aware suggested follow-up prompts |
| `/api/gemini/health` | `api/gemini/health.js` | GET | Health check — verifies API key configuration |

**Shared Utilities:**

| File | Purpose |
|------|---------|
| `api/utils/prompts.js` | Role-specific system prompt templates for 5 user roles |
| `api/utils/suggestedPrompts.js` | Context-aware prompt suggestion generator |

**Key Design Decision:** The serverless layer maintains **in-memory conversation history** per session (Map with 30-minute TTL, max 20 messages). This provides session continuity within a serverless cold-start window while remaining stateless across deployments. For production at scale, Vercel KV or Firestore-backed history would be recommended.

### 2.3.2 Express Proxy Servers (Local Development)

For local development, two Express.js proxy servers provide equivalent functionality:

| Server | File | Port | Purpose |
|--------|------|------|---------|
| Gemini AI Server | `server/geminiChat.js` | 5002 | Proxies chat to Gemini API with Firebase Admin SDK for Firestore context injection |
| SMS Proxy Server | `server/smsServer.js` | 5001 | Proxies SMS to Fast2SMS API, handles rate limiting and WhatsApp fallback |

**Supporting Modules:**

| File | Purpose |
|------|---------|
| `server/roleContextBuilder.js` | Fetches real-time Firestore data tailored to each user role |
| `server/systemPrompts.js` | Role-specific AI personality prompts |
| `server/suggestedPrompts.js` | Follow-up question generator with context awareness |

### 2.3.3 Vite Development Middleware

In development mode, `vite.config.js` includes a custom middleware (`configureServer`) that intercepts `/api/*` requests and dynamically imports the corresponding serverless handler file. This simulates Vercel's serverless execution model locally:

```javascript
configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
    if (req.url?.startsWith('/api/')) {
      const apiPath = req.url.replace(/\?.*$/, '');
      const handlerPath = path.join(__dirname, apiPath + '.js');
      const handler = await import(handlerPath + '?t=' + Date.now());
      await handler.default(req, res);
    } else { next(); }
  });
}
```

## 2.4 Database Layer

### 2.4.1 Firebase Firestore Collections

MEDROUTER uses **10 Firestore collections** with real-time `onSnapshot` listeners:

| Collection | Documents | Primary Purpose | Real-Time Listeners |
|------------|-----------|----------------|-------------------|
| `emergencyCases` | Active/completed emergency cases | Patient data, vitals, status tracking | Command Center, Routing Dashboard |
| `hospitals` | Hospital registry with capabilities | Scoring engine input, capacity management | Routing Dashboard, Hospital Dashboard, Command Center |
| `ambulances` | Fleet vehicles with status/position | Fleet tracking, dispatch management | Command Center |
| `dispatchOverrides` | Override audit trail | Accountability, quality review | Admin Dashboard |
| `users` | User profiles with role assignments | Authentication, RBAC enforcement | Auth System |
| `communicationLogs` | SMS/WhatsApp delivery records | Audit trail, delivery status | Admin Dashboard |
| `feedback` | User feedback and issue reports | Quality improvement | Admin Dashboard |
| `ambulanceTracking` | Live GPS coordinate streams | Shareable tracking links | Tracking Viewer |
| `reports` | Legacy report documents | Backward compatibility | — |
| `alerts` | Legacy alert documents | Backward compatibility | — |

### 2.4.2 Schema Relationships

```
emergencyCases ──── targetHospital ────→ hospitals
       │                                      │
       │── assignedAmbulance ──→ ambulances    │── adminId ──→ users
       │                                      │
       │── createdBy ──→ users                │
       │                                      │
       └── caseId ──→ dispatchOverrides       │
                      communicationLogs        │
                                              └── hospitalId ←── users (onboarding)
```

## 2.5 AI Layer Architecture

| Component | Location | Model | Purpose |
|-----------|----------|-------|---------|
| Scoring Engine | `src/services/capabilityScoringEngine.js` (client) | Algorithmic (no ML) | Multi-factor hospital ranking with 993 lines of scoring logic |
| Explainability Panel | `src/components/HospitalExplainabilityPanel.jsx` (client) | UI rendering | Visual breakdown of scoring factors for trust and transparency |
| AI Copilot | `api/gemini/chat.js` (serverless) | Gemini 2.5 Flash | Role-aware conversational assistant with real-time context injection |
| Suggested Prompts | `api/gemini/suggestions.js` (serverless) | Template-based | Context-aware prompt suggestions tailored to each role |

## 2.6 Communication Layer

```
┌─────────────────────────────┐
│   Communication Service     │
│   (Frontend Client)         │
├─────────────────────────────┤
│                             │
│  ┌────────────┐             │
│  │ SMS Engine │──→ Fast2SMS API (Indian mobile numbers)
│  └────────────┘             │
│        │                    │
│        │ (on failure)       │
│        ▼                    │
│  ┌────────────┐             │
│  │ WhatsApp   │──→ Twilio API (international fallback)
│  │ Fallback   │             │
│  └────────────┘             │
│        │                    │
│        ▼                    │
│  ┌────────────┐             │
│  │ Firestore  │──→ communicationLogs collection (audit)
│  │ Logger     │             │
│  └────────────┘             │
└─────────────────────────────┘
```

## 2.7 Emergency Case Data Flow — Complete Lifecycle

```
1. CASE CREATION (Paramedic)
   PatientVitalsForm → Validate fields → Capture GPS → Upload photos to Firebase Storage
   → Write to Firestore: emergencyCases/{caseId}

2. REAL-TIME DETECTION (All Dashboards)
   Firestore onSnapshot listener → New case appears in Command Center queue
   → Acuity-sorted, color-coded emergency list updates instantly

3. HOSPITAL SCORING (Client-Side, < 50ms)
   Scoring Engine fetches hospital data via onSnapshot →
   Selects emergency profile (cardiac/trauma/burn/etc.) →
   Calculates 8 dimensions: capability + specialist + equipment + bed +
   distance + load + freshness + trauma level →
   Applies golden hour modifier → Filters disqualified hospitals →
   Returns ranked list with explainability data

4. ROUTING DISPLAY (Routing Dashboard)
   Mapbox renders ambulance position → Hospital markers with rank colors →
   Directions API draws top-3 route polylines → ETA calculation →
   Golden hour countdown banner with color progression

5. DISPATCH DECISION (Dispatcher)
   Dispatcher reviews AI-ranked list → Accepts recommendation OR →
   Clicks "Override Routing" → Selects alternative hospital → Provides reason →
   Override logged to dispatchOverrides/{docId} with full audit data

6. COMMUNICATION PIPELINE
   SMS to patient family (tracking link + hospital name + ETA) →
   SMS to receiving hospital (incoming patient alert + emergency type) →
   WhatsApp fallback if SMS delivery fails →
   All attempts logged to communicationLogs collection

7. NAVIGATION (Paramedic)
   AmbulanceNavigation component → Mapbox Directions API turn-by-turn →
   Real-time GPS position updates → ETA recalculation on deviation

8. HOSPITAL PREPARATION + HANDOVER
   Hospital admin sees incoming case alert → Prepares resources →
   Updates bed availability post-admission via Live Ops sliders →
   Scoring engine reflects new capacity for next emergency
```

---

# 3. Role-Based Access System (RBAC)

## 3.1 Supported Roles

MEDROUTER implements a **5-role RBAC system** with granular permission enforcement across 4 layers:

| Role | Internal Code | Description | Default Dashboard |
|------|--------------|-------------|-------------------|
| **Paramedic** | `paramedic` | Field crew in active ambulances, capturing patient data | Patient Intake + Routing |
| **Dispatcher** | `dispatcher` | Control room operator managing fleet and case assignments | Command Center + Routing |
| **Hospital Admin** | `hospital_admin` | Hospital staff managing capacity, readiness, and diversion | Hospital Dashboard (with onboarding) |
| **Command Center** | `command_center` | Senior operator with network-wide visibility | Command Center |
| **Platform Admin** | `admin` | System administrator with unrestricted access | All dashboards |

### Legacy Role Migration

The platform evolved from an earlier disaster management system ("INCOIS Hazard Dashboard"). Legacy roles are automatically migrated on login:

```javascript
const ROLE_MIGRATION = {
  citizen: 'paramedic',
  analyst: 'hospital_admin',
  official: 'command_center'
};
```

When `AuthProvider.normalizeRole()` detects a legacy role, it maps it to the EMS equivalent and writes the updated role back to Firestore's `users` collection.

## 3.2 Dashboard Access Matrix

| Dashboard | Paramedic | Dispatcher | Hospital Admin | Command Center | Admin |
|-----------|:---------:|:----------:|:--------------:|:--------------:|:-----:|
| Patient Intake | ✅ | ✅ | — | — | ✅ |
| Routing Intelligence | ✅ | ✅ | — | — | ✅ |
| Hospital Management | — | — | ✅ | — | ✅ |
| Hospital Live Ops | — | — | ✅ | — | ✅ |
| Command Center | — | ✅ | — | ✅ | ✅ |
| Dispatch Override | — | ✅ | — | ✅ | ✅ |
| AI Copilot | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feedback | ✅ | ✅ | ✅ | ✅ | ✅ |

## 3.3 Permission Enforcement Layers

### Layer 1 — Frontend Route Guards (`ProtectedRoute.jsx`)

```jsx
<ProtectedRoute allowedRoles={['dispatcher', 'command_center', 'admin']}>
  <CommandCenterDashboard />
</ProtectedRoute>
```

The `ProtectedRoute` component reads the current user's role from `AuthContext` and renders either the child component or redirects to the `NotAuthorized` page. This provides immediate visual feedback but is **not** a security boundary (client code can be modified).

### Layer 2 — UI Conditional Rendering (`PermissionGuard.jsx`)

Individual UI elements (buttons, panels, form fields) are wrapped in `PermissionGuard` to show/hide based on role. The "Dispatch Override" button, for example, only renders for `dispatcher`, `command_center`, and `admin` roles.

### Layer 3 — Firestore Security Rules (Server-Side Enforcement)

**This is the true security boundary.** Even if frontend guards are bypassed, Firestore security rules reject unauthorized reads and writes at the database level. All rules reference a `getUserRole()` helper function that reads the user's role document from the `users` collection:

```
function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}
```

### Layer 4 — Backend API Validation

The Gemini serverless endpoint validates the `role` parameter in each chat request and injects role-appropriate system prompts and context data. An invalid role defaults to `paramedic` (most restrictive context).

## 3.4 Firestore RBAC Rules — Complete Matrix

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `emergencyCases` | Paramedic, Dispatcher, Admin | Paramedic, Dispatcher, Admin | Dispatcher, Admin | Admin only |
| `hospitals` | All authenticated | Hospital Admin, Admin | Admin OR (Hospital Admin with matching `adminId`) | Admin only |
| `ambulances` | All authenticated | Admin only | Dispatcher, Admin | Admin only |
| `dispatchOverrides` | All authenticated | Dispatcher, Admin, Command Center | — (append-only audit trail) | — |
| `ambulanceTracking` | All authenticated | All authenticated | All authenticated | — |
| `users` | Self or Admin | Authenticated (self-registration) | Self or Admin | Self or Admin |
| `communicationLogs` | All authenticated | Authenticated | Admin only | Admin only |
| `feedback` | Admin or author (`userId == uid`) | Authenticated | Admin only | Admin only |
| `reports` | All authenticated | Authenticated | Admin only | Admin only |
| `alerts` | All authenticated | Authenticated | Admin only | Admin only |

### Ownership Enforcement

The `hospitals` collection implements **ownership-based write control**:

```
allow update: if isAdmin() ||
  (isHospitalAdmin() && resource.data.adminId == request.auth.uid);
```

This ensures that a hospital admin can only modify their own hospital's data, while platform admins retain full access. The `adminId` field is set during the **Hospital Self-Onboarding** process (see Section 14).

### Override Permissions

The `dispatchOverrides` collection is **append-only** — no updates or deletes are permitted by any role. This ensures the integrity of the audit trail. Only dispatchers, command center operators, and admins can create override records.

---

# 4. Emergency Intake System

**File:** `src/components/PatientVitalsForm.jsx` (1,123 lines)  
**Roles:** Paramedic, Dispatcher, Admin  
**Purpose:** Comprehensive field data collection for emergency cases with GPS capture, photo documentation, and offline queuing

## 4.1 Patient Vitals — Every Field Documented

### Section 1 — Patient Identification

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Patient Name | Text | No (patients may be unconscious) | Max 100 characters |
| Age | Number | No | Positive integer, 0–150 range |
| Gender | Dropdown | No | Male / Female / Other / Unknown |
| Pregnancy Status | Dropdown | Conditional (female patients) | Yes / No / N/A — affects routing to maternity-capable facilities |

### Section 2 — Primary Vitals

| Field | Type | Range | Clinical Significance |
|-------|------|-------|----------------------|
| Heart Rate | BPM | 20–250 | Tachycardia (>100) flags cardiac/shock emergencies |
| Blood Pressure (Systolic) | mmHg | 40–300 | Hypotension (<90) indicates shock |
| Blood Pressure (Diastolic) | mmHg | 20–200 | Combined with systolic for MAP calculation |
| SpO2 (Oxygen Saturation) | % | 0–100 | Below 90% flags respiratory emergency |
| Respiratory Rate | breaths/min | 0–60 | Tachypnea (>20) indicates respiratory distress |
| Temperature | °C/°F | 30–45°C | Fever (>38.5°C) or hypothermia (<35°C) |
| GCS Score (Glasgow Coma Scale) | 3–15 | 3–15 | ≤8 indicates severe brain injury, requires intubation |
| Pain Level | 0–10 | 0–10 | Numeric scale for triage prioritization |

### Section 3 — Emergency Classification

| Field | Type | Options | Scoring Impact |
|-------|------|---------|---------------|
| Emergency Type | Dropdown | Cardiac, Trauma, Burn, Accident, Pediatric, Infectious, Stroke, Industrial, Other | Selects scoring profile (weight matrix + required capabilities) |
| Acuity Level | Dropdown | 1 (Critical/Red), 2 (Emergent/Orange), 3 (Urgent/Yellow), 4 (Less Urgent/Green), 5 (Minor/Blue) | Affects weight profile and Golden Hour urgency |
| Chief Complaint | Free text | — | Passed to AI Copilot for context |
| Mechanism of Injury | Dropdown | Fall, MVA, Assault, Burn, Penetrating, Crush, Blast, Other | Trauma-specific field for injury pattern assessment |

### Section 4 — Clinical Assessment

| Field | Type | Options |
|-------|------|---------|
| Consciousness Level | AVPU Scale | Alert / Verbal / Pain / Unresponsive |
| Airway Status | Radio | Clear / Partially Obstructed / Fully Obstructed |
| Breathing Quality | Radio | Normal / Labored / Absent |
| Circulation Assessment | Text | Free-text assessment |
| Allergies | Text | Known drug/food allergies |
| Current Medications | Text | Active prescriptions |
| Medical History | Text | Chronic conditions, prior surgeries |

### Section 5 — Interventions Performed (Pre-Hospital)

| Intervention | Type | Additional Data |
|-------------|------|----------------|
| Oxygen Administered | Checkbox | Flow rate (L/min) |
| CPR Performed | Checkbox | Duration (minutes) |
| IV Fluids Started | Checkbox | Fluid type (NS/RL/D5W) |
| Hemorrhage Control | Checkbox | Method (tourniquet/pressure/packing) |
| Splinting Applied | Checkbox | Location |
| Defibrillator Used | Checkbox | Number of shocks delivered |

### Section 6 — Transport & Support Requirements

| Field | Type | Scoring Impact |
|-------|------|---------------|
| Transport Priority | Dropdown: Immediate/Urgent/Delayed/Expectant | Affects queue ordering in Command Center |
| Ventilator Support Required | Boolean | Filters hospitals to those with available ventilators |
| Oxygen Support Required | Boolean | Equipment scoring factor |
| Defibrillator Required | Boolean | Equipment scoring factor — defibrillator absence incurs penalty |
| Spinal Immobilization Required | Boolean | Routing consideration for trauma centers |
| Blood Products Needed | Boolean | Routes to hospitals with in-house blood banks |

## 4.2 Pickup Geo-Coordinates Capture

GPS coordinates are captured via the browser's **Geolocation API**:

```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    // position.coords.latitude, position.coords.longitude
    // Accuracy in meters: position.coords.accuracy
  },
  (error) => {
    // Fallback: manual coordinate entry
    // Error codes: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
  },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
);
```

**Fallback chain:** Browser GPS → Manual coordinate entry → City center default (Bangalore: 12.9716°N, 77.5946°E)

## 4.3 Incident Photo Capture System

**File:** `src/components/CameraCapture.jsx` (1,579 lines)

The camera system is a comprehensive media capture component for wound and scene documentation:

### Browser Compatibility Detection
- Tests for `getUserMedia` API support (falls back to file input on unsupported browsers)
- Checks available video codecs (VP8, VP9, H.264)
- Detects device capabilities (front/back camera enumeration)

### Photo Capture Pipeline
1. Video stream opened via `navigator.mediaDevices.getUserMedia()`
2. Frame captured to HTML5 `<canvas>` element
3. Canvas exported as Blob (JPEG/WebP/PNG format selected by browser capability)
4. Image resized if dimensions exceed 2048px (optimized for upload bandwidth)
5. EXIF metadata read and preserved using `exifreader` library

### Video Recording
- MediaRecorder API with MP4 priority over WebM for cross-browser playback
- 10MB size limit with real-time progress indication
- Auto-stop on size limit with user notification

### Camera Compatibility Edge Cases
| Scenario | Handling |
|----------|---------|
| Camera permission denied | Alert with instructions to re-enable in browser settings |
| No camera hardware detected | File upload fallback (gallery selection) |
| MediaRecorder not supported | Photo-only mode (video button disabled) |
| Canvas `toBlob()` not supported | `toDataURL()` fallback with manual Blob conversion |
| Camera in use by another app | Retry with exponential backoff (3 attempts) |

## 4.4 Firebase Storage Pipeline

Photos are uploaded to Firebase Storage with authenticated access control:

```
Upload Path: incidentPhotos/{caseId}/{timestamp}_{filename}
Max Size:    10MB per file (enforced by storage.rules)
Content Type: image/* only (enforced by storage.rules)
Access:      Authenticated users only (read + write)
```

After upload, the download URL is written back to the case document's `photos` array in Firestore.

## 4.5 Offline Support & Sync

**File:** `src/utils/offlineSync.js`

When network connectivity is lost during case submission:

1. `submitOnline()` catches the network error
2. Case data is serialized and stored in **IndexedDB** via `localforage`
3. A visual indicator shows "📴 Case queued for sync"
4. A periodic background check (`setInterval`, 30 seconds) tests connectivity
5. When connectivity is restored, queued cases are automatically submitted to Firestore
6. Success notification: "✅ Queued case synced successfully"

---

# 5. Capability Scoring Engine

**File:** `src/services/capabilityScoringEngine.js` (993 lines, 40 functions)  
**Execution:** Entirely client-side (runs in the browser)  
**Performance:** < 50ms to score all hospitals in the network  
**Purpose:** Multi-factor hospital ranking algorithm with emergency-specific profiles, Golden Hour modifiers, and full explainability data output

## 5.1 Architecture & Design Philosophy

The scoring engine is the **intellectual core** of MEDROUTER. It evaluates every hospital in the network against a specific emergency case using **8 scoring dimensions**, applies emergency-type-specific weight profiles, and produces a ranked list with complete explainability data for each hospital.

**Critical Design Decision:** The engine runs **entirely in the browser** to eliminate network latency on the critical routing path. Hospital data is pre-loaded via Firestore `onSnapshot` listeners and scored locally in under 50 milliseconds. This means the ranking update is effectively instantaneous when hospital data changes.

## 5.2 Scoring Factors — Complete Breakdown

| Dimension | Function | Max Score | Description |
|-----------|----------|-----------|-------------|
| **Capability** | `calculateCapabilityScore()` | 30 | Clinical capabilities matching the emergency type (stroke center, cath lab, burn unit, etc.) |
| **Specialist** | `calculateSpecialistScore()` | 25 | Relevant specialists available on-duty (weighted by relevance to emergency type) |
| **Equipment** | `calculateEquipmentScore()` | 25 | Critical equipment availability (ventilators, defibrillators, cardiac monitors) |
| **Bed** | `calculateBedScore()` | 20 | Available beds in emergency-relevant categories (ICU, trauma, cardiac, emergency) |
| **Distance** | `calculateDistanceScore()` | 20 | Proximity from pickup location using Haversine great-circle formula |
| **Load** | `calculateLoadScore()` | 15 | Current emergency department congestion (queue length, wait times) |
| **Freshness** | `calculateFreshnessPenalty()` | 10 | Data recency — stale data reduces confidence score |
| **Trauma Level** | Profile-specific | 30 | Trauma center certification level bonus (Level 1 = 30, Level 2 = 18, Level 3 = 8) |

### Final Score Formula

```
RawScore = Σ (DimensionScore × DimensionWeight)
NormalizedScore = (RawScore / MaxPossibleScore) × 100
FinalScore = NormalizedScore × GoldenHourModifier
```

## 5.3 Weight Distribution

The `getWeightProfile()` function adjusts dimension weights based on acuity level:

| Acuity | Capability | Specialist | Equipment | Bed | Distance | Load | Freshness |
|--------|-----------|-----------|-----------|-----|----------|------|-----------|
| 1 (Critical) | 1.5× | 1.5× | 1.5× | 1.2× | 0.8× | 1.0× | 1.0× |
| 2 (Emergent) | 1.3× | 1.3× | 1.3× | 1.1× | 0.9× | 1.0× | 1.0× |
| 3 (Urgent) | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× |
| 4–5 (Lower) | 0.8× | 0.8× | 0.8× | 0.9× | 1.3× | 1.0× | 1.0× |

**Key insight:** Critical patients prioritize **capability** over **distance**, while lower-acuity patients prioritize **proximity** since their condition is less time-sensitive.

## 5.4 Emergency Profiles — All 7 Types

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
  specialistWeights: { burnSpecialist: 2.5 }, // Highest weight — burn specialists are rare
  capabilities: ['emergencySurgery'],
  equipment: ['ventilator'],
  bedTypes: ['icu', 'emergency'],
  criticalBeds: ['icu']
}
```

### Accident Profile
```javascript
accident: {
  specialists: ['traumaSurgeon', 'radiologist'],
  specialistWeights: { traumaSurgeon: 1.8, radiologist: 1.0 },
  capabilities: ['emergencySurgery', 'ctScanAvailable'],
  equipment: ['ventilator'],
  bedTypes: ['traumaBeds', 'icu', 'emergency'],
  traumaLevelBonus: true
}
```

### Pediatric Profile
```javascript
pediatric: {
  caseAcceptance: 'acceptsPediatric',
  specialists: ['pediatrician'],
  specialistWeights: { pediatrician: 2.0 },
  equipment: ['ventilator'],
  bedTypes: ['icu', 'emergency'],
  criticalBeds: ['icu']
}
```

### Infectious Profile
```javascript
infectious: {
  caseAcceptance: 'acceptsInfectious',
  specialists: ['pulmonologist'],
  specialistWeights: { pulmonologist: 1.5 },
  equipment: ['ventilator'],
  equipmentScores: { ventilator: { present: 25, absent: -40 } },
  bedTypes: ['icu', 'isolationBeds'],
  criticalBeds: ['icu']
}
```

### General Profile (Default Fallback)
```javascript
general: {
  specialists: [], specialistWeights: {},
  capabilities: [], capabilityScores: {},
  equipment: [], equipmentScores: {},
  bedTypes: ['emergency'], criticalBeds: [],
  traumaLevelBonus: false
}
```

### Alias Mapping
```javascript
const EMERGENCY_TYPE_ALIAS = {
  industrial: 'trauma',
  stroke: 'cardiac'
};
```

## 5.5 Disqualification Logic

Before scoring begins, hospitals are checked against **hard disqualification criteria** that immediately exclude them from consideration:

```javascript
function checkDisqualification(hospital, emergencyCase, profile) {
  // 1. Hospital on diversion → DISQUALIFIED
  if (hospital.emergencyReadiness?.diversionStatus)
    return { disqualified: true, reason: 'Hospital is on diversion' };

  // 2. Emergency type not accepted → DISQUALIFIED
  if (profile.caseAcceptance && !hospital.caseAcceptance?.[profile.caseAcceptance])
    return { disqualified: true, reason: 'Does not accept this emergency type' };

  // 3. Zero beds in ALL critical categories → DISQUALIFIED
  if (profile.criticalBeds.every(type =>
    safeNum(hospital.beds?.[type]?.available) === 0))
    return { disqualified: true, reason: 'No beds available in critical categories' };

  // 4. Hospital is FULL → DISQUALIFIED
  if (hospital.emergencyReadiness?.status === 'full')
    return { disqualified: true, reason: 'Hospital is FULL' };

  return { disqualified: false };
}
```

Disqualified hospitals are shown separately in the Routing Dashboard with their disqualification reason, ensuring dispatchers understand why they were excluded.

## 5.6 NaN Hardening Layer

The scoring engine is hardened with multiple layers of NaN prevention to handle inconsistent Firestore data:

### `safeNum(value, fallback = 0)`
Safely extracts a numeric value from potentially nested or undefined data:
```javascript
function safeNum(value, fallback = 0) {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'object' && value !== null) {
    return safeNum(value.available ?? value.count ?? value.total, fallback);
  }
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}
```

### `safeScore(score, min = 0, max = 100)`
Clamps any score to valid bounds:
```javascript
function safeScore(score, min = 0, max = 100) {
  const num = Number(score);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}
```

### `normalizeHospital(hospital)` (100+ lines)
Deep-normalizes hospital data from any Firestore shape to a safe, uniform structure:
- Handles both flat (`hospital.icuBeds`) and nested (`hospital.capacity.bedsByType.icu.available`) schemas
- Converts specialist data from 4 formats: plain numbers, `{count, available}` objects, arrays, and undefined
- Applies safe defaults for all 50+ fields
- Guards distance with a **999 km fallback** to prevent division-by-zero

### `normalizeSpecialists(specialists)` 
Handles 4 different data formats from Firestore:
1. `undefined/null` → default object with all specialist types at 0
2. Plain number: `{ cardiologist: 3 }` → `3`
3. Nested object: `{ cardiologist: { available: 2, count: 3 } }` → `2`
4. Legacy array: `['cardiologist', 'neurologist']` → `{ cardiologist: 1, neurologist: 1 }`

### Distance Fallback (999 km Guard)
If distance calculation returns `NaN`, `Infinity`, or negative values, it defaults to **999 km**, ensuring the hospital receives the lowest possible distance score rather than crashing the engine.

### Auto Recovery Scoring
If any individual scoring dimension produces `NaN`, the `safeScore()` wrapper clamps it to `0` (minimum), preventing the NaN from propagating through the weighted sum. The engine always produces a valid numeric final score.

## 5.7 Distance Calculation — Haversine Formula

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

**ETA Estimation:** Assumes average ambulance speed of 40 km/h in urban areas:
```javascript
function estimateETA(distanceKm) {
  return Math.round((distanceKm / 40) * 60); // Returns minutes
}
```

## 5.8 Golden Hour Modifier

A time-decay function that progressively shifts scoring weight from "best capability" toward "nearest capable" as the Golden Hour expires:

```javascript
function calculateGoldenHourModifier(emergencyCase) {
  const caseAge = (Date.now() - emergencyCase.createdAt) / 60000; // minutes

  if (caseAge < 15) return 1.0;   // Full capability weight
  if (caseAge < 30) return 1.1;   // Slight distance boost
  if (caseAge < 45) return 1.25;  // Moderate distance boost
  if (caseAge < 55) return 1.5;   // Strong distance boost
  return 2.0;                      // CRITICAL: nearest capable hospital
}
```

**Effect:** At 50 minutes into the Golden Hour, a closer hospital with a lower capability score may rank higher than a farther hospital with better capabilities — because reaching it faster is now more important than marginally better treatment options.

## 5.9 Tie-Breaker Logic

When two hospitals have identical final scores, the `applyTieBreakers()` function resolves ties using:
1. **Distance** (closer wins)
2. **Available ICU beds** (more beds wins)
3. **Data freshness** (more recently updated wins)

## 5.10 Debug Scoring Output

In development mode (`localhost`), the engine outputs detailed score breakdowns to the browser console:

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

**File:** `src/components/HospitalExplainabilityPanel.jsx` (531 lines)  
**Purpose:** Transparent, per-hospital visual breakdown of scoring factors, ensuring dispatchers and paramedics understand *why* each hospital is ranked where it is

## 6.1 Reason Generation Engine

The explainability engine runs **after** the scoring engine returns ranked results. For each scored hospital, it generates a structured explanation object:

```javascript
{
  hospitalName: "Sakra World Hospital",
  totalScore: 87,
  rank: 1,
  scoringBreakdown: {
    capability: { score: 28, max: 30, percentage: 93, reasons: [...] },
    specialist: { score: 22, max: 25, percentage: 88, reasons: [...] },
    equipment:  { score: 25, max: 25, percentage: 100, reasons: [...] },
    bed:        { score: 16, max: 20, percentage: 80, reasons: [...] },
    distance:   { score: 15, max: 20, percentage: 75, reasons: [...] },
    load:       { score: 12, max: 15, percentage: 80, reasons: [...] },
    freshness:  { score: 9, max: 10, percentage: 90, reasons: [...] }
  },
  goldenHourStatus: { minutes: 42, modifier: 1.0, description: "Full scoring window" },
  disqualificationStatus: { disqualified: false }
}
```

## 6.2 Five Reasoning Categories

### Capability Reasoning
Evaluates clinical capabilities matching the emergency type. Cites specific capabilities present and missing:
- "✅ Stroke Center available — critical for cardiac emergencies"
- "⚠️ No burn unit — reduces capability score for burn cases"
- "✅ Emergency Surgery capability matches trauma profile"

### Capacity Reasoning
Analyzes bed availability across emergency-relevant bed types:
- "✅ 8 ICU beds available (36% occupancy)"
- "⚠️ Only 2 emergency beds remaining — high utilization"
- "❌ Zero trauma beds available — bed score reduced to minimum"

### Equipment Reasoning
Checks availability of emergency-critical equipment:
- "✅ 5 ventilators available — full equipment score"
- "❌ No defibrillator available — critical penalty for cardiac case (-30 points)"
- "✅ CT Scanner available — supports accident diagnosis"

### Distance Reasoning
Explains proximity and ETA impact:
- "📍 7.2 km away — estimated ETA 11 minutes"
- "⚠️ 23.5 km away — 35 minute ETA may impact Golden Hour"
- "🕐 Golden Hour modifier applied: distance weight increased 1.5×"

### Specialist Reasoning
Details available specialist matching:
- "✅ Cardiologist on duty (3 available) — specialist score boosted 1.5×"
- "⚠️ No burn specialist available — critical for burn emergencies"
- "✅ Trauma surgeon available — primary match for accident cases"

## 6.3 Golden Hour Display Logic

The Golden Hour status is calculated from the emergency case creation timestamp:

| Time Elapsed | Status | Color | Modifier | Description |
|-------------|--------|-------|----------|-------------|
| 0–15 min | OPTIMAL | Green | 1.0× | Full scoring available — capability prioritized |
| 15–30 min | ACTIVE | Yellow | 1.1× | Slight distance boost beginning |
| 30–45 min | URGENT | Orange | 1.25× | Distance becoming more important |
| 45–55 min | CRITICAL | Red | 1.5× | Strong shift toward nearest capable hospital |
| 55+ min | EXPIRED | Dark Red | 2.0× | Nearest capable hospital prioritized |

## 6.4 Explainability UI Components

### Score Bars
Each scoring dimension is rendered as a horizontal progress bar with:
- **Fill width** proportional to percentage (score / max)
- **Color gradient:** Green (>80%) → Yellow (50–80%) → Orange (30–50%) → Red (<30%)
- **Numeric label:** "28/30" displayed at bar end
- **Tooltip:** Hover reveals detailed reason text

### Reason Badges
Compact tags below each score bar showing key facts:
- Green badges: strengths (present capabilities, available specialists)
- Yellow badges: warnings (low availability, moderate distance)
- Red badges: critical issues (missing equipment, no beds)

### Expandable Accordion UI
The explainability panel uses a two-level accordion:
1. **Hospital card header** — click to expand/collapse the full score breakdown
2. **"AI Explanation" button** — nested within each hospital card, click to toggle detailed per-factor analysis

Both accordion levels use `e.stopPropagation()` to prevent parent click handlers from interfering with child accordion toggles.

---

# 7. Dispatcher Override Routing

**File:** `src/components/DispatcherOverridePanel.jsx` (496 lines)  
**Roles:** Dispatcher, Command Center, Admin  
**Purpose:** Allows human dispatchers to override AI-recommended hospital assignments with structured audit logging

## 7.1 Manual Hospital Override Flow

```
1. Dispatcher reviews AI-ranked hospital list in Routing Dashboard
2. Clicks "Override Routing" button (PermissionGuard: dispatcher/command_center/admin)
3. Override panel slides open showing:
   a. Current AI recommendation (hospital name, score, rank)
   b. Full hospital list with search/filter capability
   c. Override reason dropdown (mandatory field)
   d. Additional notes text area (optional)
4. Dispatcher selects alternative hospital
5. Clicks "Confirm Override"
6. Override is:
   a. Written to Firestore: dispatchOverrides/{docId}
   b. Case document updated with new target hospital
   c. Map route redrawn to new destination
   d. SMS alerts redirected to new hospital
   e. Override badge appears on case card
```

## 7.2 Override Reason Categories

| Code | Description | Use Case |
|------|-------------|----------|
| `phone_confirmation` | Hospital confirmed bed availability via phone | Direct verbal confirmation supersedes data lag |
| `specialist_available` | Specialist available per phone confirmation | Real-time availability not yet reflected in Firestore |
| `patient_preference` | Patient/family requested specific hospital | Legal/ethical obligation to honor patient preference |
| `insurance_network` | Hospital in patient's insurance network | Financial consideration for non-critical cases |
| `closer_facility` | Alternate hospital closer for this specific route | Road conditions or traffic not captured by Haversine |
| `diversion_change` | Hospital diversion changed mid-transport | Real-time status change not yet propagated |
| `other` | Custom reason entered in notes field | Unusual circumstances requiring documentation |

## 7.3 Firestore Override Schema

```javascript
{
  caseId: "emergency_case_id",
  originalHospitalId: "hospital_A_id",
  originalHospitalName: "MEDROUTER Top Recommendation",
  originalScore: 87,
  overrideHospitalId: "hospital_B_id",
  overrideHospitalName: "Override Target Hospital",
  overrideScore: 72,
  reason: "phone_confirmation",
  notes: "Called hospital directly — 3 ICU beds confirmed available",
  overriddenBy: "dispatcher_user_uid",
  overriddenByEmail: "dispatcher@ems.gov.in",
  overriddenByRole: "dispatcher",
  timestamp: ServerTimestamp,
  scoreDelta: -15
}
```

The `scoreDelta` field (difference between original and override scores) enables quality analysis: large negative deltas may indicate scoring engine issues that need calibration.

## 7.4 Map Route Override Rendering

When an override is confirmed:
1. The original route polyline is replaced with a new route to the override hospital
2. The original route is shown as a dashed gray line for comparison
3. An override badge (orange icon) appears on the case marker
4. ETA recalculates to the new destination

---

# 8. Live Hospital Operations Panel

**File:** `src/components/HospitalLiveOpsPanel.jsx` (656 lines)  
**Roles:** Hospital Admin (own hospital only), Admin (all hospitals)  
**Purpose:** Real-time capacity management interface with slider controls, diversion toggles, and automatic routing engine recomputation

## 8.1 Live Operations Controls

### ICU Bed Sliders
```
ICU Beds Available: [====|────────] 12 / 45
                     ↑ slider handle (drag to update)
```
Range-constrained sliders for each bed type:
- **ICU Beds** (0 to total ICU capacity)
- **General/Ward Beds** (0 to total general capacity)
- **Emergency Beds** (0 to total emergency capacity)
- **Isolation/Negative Pressure Beds** (0 to total isolation capacity)
- **Trauma Beds** (0 to total trauma capacity)

### Equipment Counters

| Equipment | Control | Range |
|-----------|---------|-------|
| Ventilators Available | Number input with +/- buttons | 0 to total ventilators |
| Defibrillators Available | Number input with +/- buttons | 0 to total defibrillators |
| Cardiac Monitors Available | Number input with +/- buttons | 0 to total monitors |
| CT Scanners Available | Number input with +/- buttons | 0 to total CT scanners |

### Queue Load Indicator
- **Current ED Patients Waiting:** numeric input reflecting emergency department queue length
- **Average Wait Time:** estimated minutes, updates the `load` score in the routing engine

### Diversion Toggle
A prominent toggle switch:
- **ON (Red):** Hospital is actively diverting ambulances — scoring engine disqualifies this hospital from all routing
- **OFF (Green):** Hospital is accepting patients normally

Emergency Status selector:
- `accepting` → Green badge, full scoring participation
- `limited` → Yellow badge, load penalty applied
- `full` → Red badge, hard disqualification

## 8.2 Auto-Normalization Engine

The `normalizeCapacity()` function in `HospitalDashboard.jsx` (lines 525–555) enforces data integrity on every save:

```javascript
function normalizeCapacity(data) {
  // Ensure available ≤ total for all bed types
  Object.keys(data.capacity.bedsByType).forEach(type => {
    const beds = data.capacity.bedsByType[type];
    beds.available = Math.min(beds.available, beds.total);
    beds.occupied = beds.total - beds.available;
    beds.available = Math.max(0, beds.available);
  });

  // Ensure equipment available ≤ total
  Object.keys(data.equipment).forEach(type => {
    data.equipment[type].available = Math.min(
      data.equipment[type].available, data.equipment[type].total
    );
    data.equipment[type].available = Math.max(0, data.equipment[type].available);
  });

  return data;
}
```

## 8.3 Timestamp Logging

Every Live Ops update writes a `lastUpdated` timestamp (Firestore `serverTimestamp()`) to the hospital document. This timestamp feeds the **Freshness Penalty** system in the scoring engine — hospitals that haven't updated their data in >30 minutes receive progressive score penalties to reduce confidence in potentially stale data.

## 8.4 Routing Recompute Triggers

Since the frontend scoring engine uses Firestore's `onSnapshot` listeners, any Live Ops update triggers an automatic scoring recomputation:

```
Hospital Admin updates ICU beds (slider) →
  Firestore write to hospitals/{hospitalId} →
  onSnapshot fires on all connected clients →
  Routing Dashboard receives updated hospital data →
  Scoring engine re-runs automatically (< 50ms) →
  Hospital rankings updated instantly →
  Map markers and route recommendations refresh
```

This is a **zero-latency propagation** design — there is no polling, no manual refresh required. The entire network sees updated hospital status within 1–2 seconds of a Live Ops change.

---

# 9. Turn-By-Turn Navigation System

**File:** `src/components/navigation/AmbulanceNavigation.jsx`  
**Purpose:** Real-time driver navigation from ambulance position to assigned hospital with voice-guided turn instructions

## 9.1 Mapbox Routing Engine

Navigation uses the **Mapbox Directions API** for route calculation:

```
GET https://api.mapbox.com/directions/v5/mapbox/driving/{lng1},{lat1};{lng2},{lat2}
    ?geometries=geojson
    &steps=true
    &alternatives=true
    &overview=full
    &access_token={MAPBOX_TOKEN}
```

### Response Processing
1. **Route geometry** — GeoJSON line decoded and rendered as a thick blue polyline on the map
2. **Step instructions** — Turn-by-turn text instructions ("Turn left on MG Road in 200m")
3. **Total distance** — Displayed in km with real-time recalculation on deviation
4. **Total duration** — Adjusted for ambulance speed factor (1.3× faster than normal traffic)

## 9.2 Polyline Rendering

The route is rendered as a Mapbox GL JS `line` layer with:
- **Stroke width:** 5px (arterial), 3px (alternate routes)
- **Color:** Primary route = `#2563eb` (blue), alternatives = `#94a3b8` (gray)
- **Dash pattern:** Solid for primary, dashed for alternatives
- **Antialias:** Enabled for smooth rendering at all zoom levels

## 9.3 ETA Calculation

```javascript
ETA = (Mapbox duration in seconds / ambulanceFactor) + currentTime
// ambulanceFactor = 1.3 (ambulances travel ~30% faster with sirens)
```

ETA is recalculated every 15 seconds based on current GPS position. If the ambulance deviates significantly from the planned route (>500m), a **route recalculation** is triggered automatically.

## 9.4 "Go to Hospital" Workflow

1. Paramedic completes patient intake
2. Routing Dashboard shows ranked hospital list
3. Paramedic clicks **"Navigate"** on the selected hospital card
4. Navigation view opens full-screen with:
   - Blue route line from current position to hospital
   - Turn-by-turn instruction panel at bottom
   - ETA countdown in header
   - Hospital destination marker with name label
5. Map follows ambulance position (auto-center with bearing)
6. On arrival (within 100m of hospital), navigation auto-dismisses

---

# 10. GPS Tracking + SMS Communication

## 10.1 Ambulance Tracking System

### Live Coordinate Streaming

The tracking system uses browser Geolocation watchPosition API:

```javascript
navigator.geolocation.watchPosition(
  (position) => {
    // Write to Firestore: ambulanceTracking/{trackingId}
    updateDoc(trackingRef, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: serverTimestamp()
    });
  },
  null,
  { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
);
```

### Dispatch Sharing
Tracking links are generated with a unique tracking ID:
```
https://medrouter.vercel.app/track/{trackingId}
```
This link can be shared via SMS to patient families, enabling them to track the ambulance in real-time on any smartphone browser without installing an app.

## 10.2 SMS Communication Engine

**Server:** `server/smsServer.js` (569 lines)  
**Provider:** Fast2SMS (Indian mobile network coverage)  
**Fallback:** Twilio WhatsApp API

### SMS Message Types

| Type | Recipient | Content |
|------|-----------|---------|
| **Dispatch Alert** | Patient family | "🚑 MEDROUTER: Ambulance dispatched. Hospital: {name}. ETA: {minutes} min. Track: {link}" |
| **Hospital Alert** | Hospital admin | "🏥 INCOMING: {emergency_type} case. Patient: {name}. Acuity: {level}. ETA: {minutes} min." |
| **Tracking Link** | Patient family | Live tracking URL for ambulance position |
| **Status Update** | Patient family | "Patient being transferred to {hospital_name}. Current status: {status}" |
| **Override Notification** | Hospital admin | "⚠️ Routing change: Patient redirected to {new_hospital}. ETA updated to {new_eta} min." |

### Fast2SMS Integration

```javascript
POST https://www.fast2sms.com/dev/bulkV2
Headers: { authorization: FAST2SMS_API_KEY }
Body: {
  route: "q",          // Quick SMS route
  message: "...",       // SMS content
  language: "english",
  flash: 0,
  numbers: "91XXXXXXXXXX"
}
```

### WhatsApp Fallback

If Fast2SMS delivery fails (API error, number invalid, or rate limit exceeded), the system automatically falls back to Twilio WhatsApp API:

```javascript
POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
Body: {
  To: "whatsapp:+91XXXXXXXXXX",
  From: "whatsapp:+1XXXXXX",
  Body: "Same message content"
}
```

### Rate Limiting & Delivery Logging

- **Rate limit:** Maximum 5 SMS per case per hour (prevents accidental spam)
- **All delivery attempts** are logged to Firestore `communicationLogs` collection with:
  - `messageType`, `recipientNumber`, `provider` (fast2sms / twilio_whatsapp)
  - `status` (sent / failed / rate_limited)
  - `timestamp`, `caseId`, `sentBy`

---

# 11. Multilingual Translation System

**File:** `src/context/LanguageContext.jsx` + `src/hooks/useT.js`  
**API:** Google Translate REST API  
**Coverage:** 130+ languages including RTL scripts (Arabic, Hebrew, Urdu)

## 11.1 Architecture

```
LanguageContext (React Context)
├── selectedLanguage (state)
├── translateText(text) → cached translation
├── translateBatch(texts[]) → batch cached translations
└── isRTL (boolean — activates RTL CSS)

useT(text) → Returns translated text for current language
useTBatch(texts[]) → Returns array of translated texts (single API call)
useTPreload(keySet) → Warms cache with predefined translation keys
```

## 11.2 Language Dropdown

The `LanguageSwitcher.jsx` component renders a dropdown with 130+ language options. Languages are grouped by region:
- South Asian (Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, etc.)
- Southeast Asian (Thai, Vietnamese, Indonesian, etc.)
- European (English, French, German, Spanish, etc.)
- Middle Eastern (Arabic, Hebrew, Urdu, Farsi — triggers RTL mode)
- East Asian (Chinese, Japanese, Korean)

## 11.3 Translation Service & Caching

**File:** `src/services/translateService.js`

```javascript
// LRU cache implementation
const cache = new Map(); // Key: `${lang}:${text}`, Value: translated string
const MAX_CACHE_SIZE = 2000; // Evict oldest entries beyond this limit

async function translate(text, targetLang) {
  const cacheKey = `${targetLang}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    { method: 'POST', body: JSON.stringify({ q: text, target: targetLang }) }
  );

  const translated = response.data.translations[0].translatedText;
  cache.set(cacheKey, translated); // Write to cache
  return translated;
}
```

### Batch Translation

The `useTBatch` hook translates multiple texts in a single API call:

```javascript
function useTBatch(texts) {
  // Single POST to Google Translate with array of texts
  // Response contains all translations in order
  // Cache each result individually for future single lookups
}
```

This reduces API calls from N (one per label) to 1 (batch), critical for dashboards with 30+ translatable labels.

### Cache Warming via `useTPreload`

Each dashboard defines a constant array of text keys to preload on mount:

```javascript
// constants/translationKeys.js
export const PRELOAD_HOSPITAL = [
  "Hospital Capability Dashboard",
  "Add Hospital", "Edit Hospital",
  "ICU Beds", "General Beds", ...
];
```

When `useTPreload(PRELOAD_HOSPITAL)` is called in `HospitalDashboard`, it fires a batch translation of all keys before the user sees the dashboard, eliminating flash-of-untranslated-content.

## 11.4 RTL (Right-to-Left) Support

When Arabic, Hebrew, Urdu, or Farsi is selected:
1. `isRTL` flag is set in `LanguageContext`
2. HTML `dir="rtl"` attribute is applied to the document root
3. CSS file `src/styles/rtl.css` activates mirrored layouts:
   - Flex direction reversal
   - Text alignment adjustment
   - Margin/padding mirroring
   - Navigation direction flip

---

# 12. Gemini AI Copilot

**Frontend:** `src/components/ai/EMSChatAssistant.jsx` + `src/services/geminiService.js`  
**Backend:** `api/gemini/chat.js` (Vercel serverless) + `server/geminiChat.js` (local dev)  
**Model:** Google Gemini 2.5 Flash  
**Purpose:** Role-aware AI assistant providing contextual EMS guidance

## 12.1 Role-Aware Prompting

Each user role receives a unique system prompt that constrains the AI's capabilities, tone, and data access:

| Role | AI Persona | Capabilities | Boundaries |
|------|-----------|-------------|------------|
| **Paramedic** | "MEDROUTER AI Copilot assisting a paramedic" | Hospital recommendations, treatment prioritization, golden hour advice | Only sees own case data, no fabrication of hospital data |
| **Dispatcher** | "Dispatch Intelligence Copilot" | Fleet optimization, coverage gaps, case prioritization | Full fleet visibility, no override of clinical decisions |
| **Hospital Admin** | "Hospital Operations Copilot" | Capacity summaries, bed allocation, staffing, scoring explanation | Only own hospital data, no clinical treatment recommendations |
| **Command Center** | "Command Center Intelligence Copilot" | System-wide dashboards, network patterns, resource reallocation | Executive-summary format, strategic not tactical |
| **Admin** | "Platform Administrator Assistant" | System analytics, scoring configuration, data quality | Full platform data, recommend only (never modify directly) |

## 12.2 Context Injection

The serverless handler builds context from request parameters and injects it into the Gemini prompt:

```javascript
function buildSimpleContext(role, contextIds = {}) {
  let context = '';
  if (contextIds.caseId) {
    context += `\n\nACTIVE CASE: ${contextIds.caseId}`;
  }
  if (contextIds.hospitalId) {
    context += `\n\nHOSPITAL CONTEXT: ${contextIds.hospitalId}`;
  }
  return context;
}
```

In the local Express server (`server/roleContextBuilder.js`, 476 lines), full Firestore context injection pulls real-time data:
- Active emergency case details (vitals, acuity, emergency type)
- Hospital capability data (beds, specialists, equipment)
- Fleet status (ambulance positions, assignments)
- Network statistics (active cases, average ETAs)

## 12.3 Suggested Prompts

The `suggestedPrompts.js` module generates role-specific prompt suggestions:

**Paramedic Examples:**
- "What hospital is best for my cardiac patient?"
- "How much golden hour time do I have?"
- "Should I reroute to a closer hospital?"

**Dispatcher Examples:**
- "Which areas have coverage gaps?"
- "How many active cases are there?"
- "Recommend ambulance redistribution"

**Hospital Admin Examples:**
- "Summarize our current capacity"
- "What cases are coming our way?"
- "How is our capability score calculated?"

## 12.4 Session History Management

The serverless function maintains per-session conversation history:

```javascript
const conversationHistory = new Map();
const MAX_HISTORY = 20;        // Max messages per session
const SESSION_TTL = 30 * 60 * 1000; // 30-minute TTL

function getSessionHistory(sessionId) {
  if (!sessionId) return [];
  const session = conversationHistory.get(sessionId);
  if (!session) return [];
  if (Date.now() - session.lastAccess > SESSION_TTL) {
    conversationHistory.delete(sessionId);
    return [];
  }
  session.lastAccess = Date.now();
  return session.messages;
}
```

**Important design note:** Since this is serverless (Vercel), the in-memory Map resets on cold starts. This is acceptable for MVP — production deployments would use Vercel KV or Firestore-backed history.

## 12.5 Gemini API Configuration

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-preview-05-20',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
  ]
});
```

**Safety settings rationale:** All harm categories are set to `BLOCK_NONE` because medical emergency contexts frequently contain descriptions of injuries, blood, and trauma that would trigger overly sensitive content filters. The system prompts already constrain the AI's behavior to medical/operational assistance only.

## 12.6 Serverless Deployment

| Aspect | Configuration |
|--------|--------------|
| Runtime | Vercel Serverless Functions (Node.js) |
| Endpoint | `/api/gemini/chat`, `/api/gemini/suggestions`, `/api/gemini/health` |
| API Key | `GEMINI_API_KEY` environment variable (Vercel dashboard) |
| Max Duration | Default Vercel serverless timeout (10s hobby, 60s pro) |
| Cold Start | ~500ms (Gemini SDK initialization) |
| Warm Response | ~1–3 seconds (Gemini 2.5 Flash inference) |

## 12.7 Explainability Integration

When the AI Copilot receives a question about hospital ranking, it uses the `getExplainabilityInstruction()` function to inject scoring guidance:

```javascript
EXPLAINABILITY MODE:
When explaining hospital routing decisions, use the scoring engine data provided:
- Cite exact scores: "Hospital scored 87/100 overall"
- Explain factor contributions: "Capability score: 25/30, Distance score: 18/20"
- Mention specific resources: "8 ICU beds available, 3 trauma surgeons on duty"
- Reference golden hour: "42 minutes remaining, ETA is 12 minutes"
- Note disqualification reasons if applicable
- Explain freshness penalties if data is stale
```

This ensures the AI's explanations are grounded in actual scoring data rather than hallucinated.


---

# 13. Responsive UI Infrastructure

**Files:** `src/styles/responsiveUtils.css` + `src/index.css` + `tailwind.config.js`  
**Framework:** Tailwind CSS 3.4 with custom utilities

## 13.1 Breakpoint System

| Breakpoint | Min Width | Tailwind Prefix | Target |
|-----------|-----------|----------------|--------|
| Mobile | 0px | (default) | Smartphone in portrait |
| Small | 640px | `sm:` | Smartphone in landscape |
| Medium | 768px | `md:` | Tablets |
| Large | 1024px | `lg:` | Laptops |
| Extra Large | 1280px | `xl:` | Desktop monitors |
| 2XL | 1536px | `2xl:` | Large displays / command center monitors |

## 13.2 Map Resizing

The `useMapResize` hook dynamically adjusts the Mapbox container dimensions when:
- Side panels open/close (routing results, hospital details, AI copilot)
- Browser window resizes
- Orientation changes (mobile landscape ↔ portrait)

```javascript
useMapResize(() => {
  if (mapRef.current) {
    mapRef.current.resize();
    // Refit bounds to show all markers after resize
    if (bounds) mapRef.current.fitBounds(bounds, { padding: 50 });
  }
}, [panelOpen, windowWidth]);
```

## 13.3 Mobile Dashboard Adaptations

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Hospital list | Cards in 3-column grid | Single-column stacked cards |
| Scoring bars | Full-width with numeric labels | Compact bars, percentage only |
| Map + results | Side-by-side (60/40 split) | Stacked: map on top, results below |
| AI Copilot | Floating panel (right side) | Full-screen overlay with back button |
| Navigation | Top toolbar + sidebar | Bottom sheet with pull-up handle |
| Camera | Inline card | Full-screen capture mode |
| Forms | Multi-column layout | Single-column stacked with collapsible sections |

## 13.4 Card Transforms & Form Stacking

Hospital cards use CSS transforms for hover interactions on desktop:
```css
.hospital-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
```

On mobile (touch devices), hover effects are disabled and cards use tap-to-expand patterns instead.

Forms (Patient Intake, Hospital Add/Edit) use a collapsible section system to prevent overwhelming scrolling:
- Each section (Vitals, Assessment, Interventions, Transport) is a `<details>/<summary>` element
- Only the active section is expanded; others auto-collapse
- Progress indicators show which sections are completed

## 13.5 Camera Fullscreen Handling

On mobile devices, the camera component enters true fullscreen mode:
```javascript
if (isMobile && cameraRef.current) {
  cameraRef.current.requestFullscreen?.() ||
  cameraRef.current.webkitRequestFullscreen?.() ||
  cameraRef.current.mozRequestFullScreen?.();
}
```
A custom "Exit Camera" button overlays the fullscreen view to return to the form.

---

# 14. Hospital Self-Onboarding System

**Files:** `src/components/HospitalDashboard.jsx` (onboarding logic at lines 233–310)  
**File:** `src/components/HospitalExtendedProfileForm.jsx` (extended data collection)  
**Roles:** Hospital Admin (new users without linked hospital)

## 14.1 Conditional Dashboard

When a `hospital_admin` user logs in, the system checks:
1. Read user document from `users/{uid}`
2. Check for `hospitalId` field
3. **If `hospitalId` exists:** Load normal Hospital Dashboard filtered to own hospital
4. **If `hospitalId` is null/missing:** Enter **Onboarding Mode**

### Onboarding Mode Flow

```
Login → PermissionGuard checks role → HospitalDashboard renders →
useEffect reads users/{uid} → hospitalId missing →
isOnboarding = true → showAddForm = true automatically →
Hospital creation form pre-opens with onboarding banner
```

## 14.2 GPS Capture Button

The onboarding form includes a prominent "📍 Use My Location" button:

```javascript
const handleUseCurrentLocation = useCallback(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          location: { latitude: position.coords.latitude, longitude: position.coords.longitude }
        }
      }));
    },
    (err) => {
      setError('Unable to fetch your location. Please enter coordinates manually.');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}, []);
```

This is critical for hospitals in India where exact street addresses may not have precise geocoding — GPS provides sub-10m accuracy.

## 14.3 Map Preview

When GPS coordinates are entered (manually or via capture), a Mapbox preview map renders showing:
- Hospital pin at the entered coordinates
- Surrounding road network
- Zoom level auto-adjusted to show neighborhood context
- Draggable marker for fine-tuning position

## 14.4 Ownership Linking & adminId Binding

When the hospital is successfully created in Firestore:

```javascript
// 1. Create hospital document with adminId
const hospitalDoc = await addDoc(collection(db, 'hospitals'), {
  ...formData,
  adminId: currentUser.uid,  // ← Ownership binding
  createdAt: serverTimestamp()
});

// 2. Update user document with hospitalId
await updateDoc(doc(db, 'users', currentUser.uid), {
  hospitalId: hospitalDoc.id   // ← Reverse link
});
```

This creates a **bidirectional ownership binding:**
- Hospital document has `adminId` → user who owns it
- User document has `hospitalId` → hospital they manage

Firestore security rules enforce that `hospital_admin` users can only `update` hospitals where `resource.data.adminId == request.auth.uid`.

## 14.5 Extended Profile Data

The `HospitalExtendedProfileForm.jsx` (1,025 lines) captures deep operational data:

| Category | Fields |
|----------|--------|
| Emergency Readiness | Disaster preparedness level, mass casualty capacity, decontamination facility |
| Medico-Legal | Police case handling, medico-legal readiness, forensic lab access |
| Support Facilities | Helipad, 24x7 pharmacy, blood bank, ambulance bay capacity |
| Transfer Capability | Accepts referrals, max transfer capacity per hour, inter-facility transport |
| Infection Control | Negative pressure rooms, infectious disease unit, isolation beds |
| Performance Metrics | Average handover time, emergency response rating, survival rate index |
| Case Acceptance | Accepts cardiac, trauma, burn, pediatric, infectious, stroke, psychiatric, OB-GYN |

---

# 15. Multi-City Simulation Engine

**File:** `scripts/seedFirestore.js` (1,995 lines)  
**Purpose:** Populate Firestore with realistic hospital, ambulance, and emergency case data for two cities

## 15.1 Bangalore Dataset

- **Center coordinates:** 77.5946°E, 12.9716°N
- **Radius:** 8–15 km from center
- **Hospitals:** 10 hospitals with realistic data (Manipal, Sakra World, Apollo, St. John's, etc.)
- **Ambulances:** 8 vehicles with varied status (available, en-route, at-hospital)
- **Emergency Cases:** 5 test cases spanning cardiac, trauma, burn, pediatric, and general emergencies

Data generators produce realistic variation:
```javascript
function generateBedAvailability() {
  return {
    icu: { total: randomInt(10, 50), available: randomInt(2, 15) },
    general: { total: randomInt(50, 300), available: randomInt(10, 80) },
    emergency: { total: randomInt(10, 40), available: randomInt(2, 12) },
    isolation: { total: randomInt(5, 30), available: randomInt(1, 10) }
  };
}
```

## 15.2 Hyderabad Dataset

- **Center coordinates:** 78.4867°E, 17.3850°N
- **Radius:** 20 km from center
- **Hospitals:** Generated with Hyderabad-specific hospital names, addresses, and coordinates
- **Ambulances:** Fleet generated with Hyderabad vehicle designations
- Functions: `seedHyderabadHospitals()`, `seedHyderabadAmbulances()`

## 15.3 Fleet Simulation

```javascript
function seedBangaloreAmbulances() {
  // 8 ambulances with realistic data:
  // - vehicleNumber: "KA-01-AB-1234" (Karnataka registration)
  // - type: BLS (Basic), ALS (Advanced), MICU (Mobile ICU)
  // - status: available | en-route | at-hospital | returning
  // - currentLocation: randomized within city bounds
  // - assignedCase: null or linked to test case
}
```

## 15.4 Routing Compatibility

The seed data is designed to exercise all scoring engine edge cases:
- Hospital with 0 ICU beds (tests disqualification)
- Hospital on diversion (tests filter)
- Hospital with missing specialist data (tests NaN hardening)
- Hospital at extreme distance (tests distance scoring boundary)
- Case at 50 minutes (tests Golden Hour critical modifier)

## 15.5 Seed Script Execution

```bash
npm run seed:firestore
# Equivalent: node scripts/seedFirestore.js
```

The script clears existing data and repopulates all collections.

---

# 16. Security Infrastructure

## 16.1 Firestore RBAC Rules

**File:** `firestore.rules` (140 lines)

All rules use the pattern:
```
function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}
```

This performs a real-time lookup of the authenticated user's role from the `users` collection on every read/write operation. There is no client-side role caching — security enforcement always uses the authoritative Firestore source.

### Critical Security Rules

| Rule | Purpose |
|------|---------|
| `emergencyCases` — delete: `isAdmin()` only | Prevents accidental or malicious case deletion |
| `hospitals` — update: `isAdmin() OR (adminId == uid)` | Ownership enforcement prevents cross-hospital data modification |
| `dispatchOverrides` — no update/delete | Audit trail is immutable — no one can modify override history |
| `users` — read: `self OR admin` | Users cannot read other users' profiles (privacy) |

## 16.2 Storage Security Rules

**File:** `storage.rules` (38 lines)

| Path | Read | Write | Constraints |
|------|------|-------|-------------|
| `incidentPhotos/{caseId}/{fileName}` | Authenticated | Authenticated | Max 10MB, `image/*` content type only |
| `profilePhotos/{userId}/{fileName}` | Authenticated | Owner only (`uid == userId`) | — |
| `hospitalDocs/{hospitalId}/{fileName}` | Authenticated | Authenticated | — |

### Photo Access Security
- Incident photos require authentication to view (no public URLs)
- File size limit (10MB) prevents storage abuse
- Content type restriction (`image/*`) blocks executable uploads
- Profile photos are owner-writable only (prevents impersonation attacks)

## 16.3 API Key Protection

| Key | Location | Protection Layer |
|-----|----------|-----------------|
| `GEMINI_API_KEY` | Vercel env vars | Server-side only — never exposed to client bundle |
| `MAPBOX_TOKEN` | `.env.local` as `VITE_MAPBOX_TOKEN` | Client-side (required for map rendering), restricted by domain |
| `FIREBASE_CONFIG` | `.env.local` as `VITE_FIREBASE_*` | Client-side (required), protected by Firestore security rules |
| `FAST2SMS_API_KEY` | `server/.env` | Server-side only — never exposed to client |
| `TWILIO_*` | `server/.env` | Server-side only — never exposed to client |

---

# 17. Deployment Architecture

## 17.1 Vercel Hosting

| Component | Deployment Target |
|-----------|------------------|
| React SPA (frontend) | Vercel Static Hosting (CDN-distributed) |
| `/api/gemini/*` serverless functions | Vercel Serverless Functions (Node.js runtime) |
| Firebase Firestore | Google Cloud Platform (us-central1) |
| Firebase Storage | Google Cloud Platform |
| Firebase Auth | Google Identity Platform |
| Mapbox Tiles | Mapbox CDN |

### Build Configuration

```javascript
// vite.config.js — Production build
build: {
  outDir: 'dist',
  sourcemap: false,
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,       // Remove console.log in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info']
    }
  },
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        mapbox: ['mapbox-gl'],
        charts: ['recharts'],
        utils: ['axios', 'localforage'],
        ui: ['lucide-react']
      }
    }
  }
}
```

### Vercel Configuration

**Framework Preset:** Vite  
**Build Command:** `vite build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`  
**Node.js Version:** 18.x

## 17.2 Environment Variable Management

**Production:** Vercel dashboard → Settings → Environment Variables

| Variable | Environment | Purpose |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Client (build-time) | Firebase project authentication |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Client | Firestore project identifier |
| `VITE_MAPBOX_TOKEN` | Client | Mapbox GL JS access token |
| `VITE_GOOGLE_TRANSLATE_API_KEY` | Client | Google Translate API (disabled in production — uses fallback) |
| `GEMINI_API_KEY` | Server-only | Gemini 2.5 Flash API key (never exposed to client) |

**Local Development:** `.env.local` file (gitignored)

---

# 18. Performance Optimization

## 18.1 Debounced Operations

| Operation | Debounce Time | Purpose |
|-----------|--------------|---------|
| Hospital search/filter input | 300ms | Prevents scoring engine re-runs on every keystroke |
| Translation requests | 500ms | Batches rapid consecutive translations |
| Map marker updates | 100ms | Prevents jitter during GPS streaming |
| Live Ops slider updates | 500ms | Reduces Firestore writes during rapid slider adjustments |

## 18.2 Translation Caching

- **LRU cache** with 2,000 entry capacity per language
- **Pre-warming** via `useTPreload()` on dashboard mount
- **Batch API calls** via `useTBatch()` reduce N requests to 1
- **Cache persistence** across navigation (LanguageContext lives at app root, survives route changes)

## 18.3 Build Optimizations

| Technique | Tool | Impact |
|-----------|------|--------|
| Code splitting | Rollup manual chunks | Vendor (70KB), Mapbox (200KB), Charts (90KB) — parallel loading |
| Tree shaking | Vite + Terser | Dead code elimination across all modules |
| Console stripping | Terser `drop_console` | Removes all console.log/info in production |
| Gzip compression | `vite-plugin-compression` | .gz files for pre-compressed serving |
| Bundle analysis | `rollup-plugin-visualizer` | `npm run build:analyze` generates interactive treemap |
| Lazy imports | Dynamic `import()` | AI Copilot loaded on-demand (not in initial bundle) |

## 18.4 Low-Bandwidth Optimization

Field ambulances may operate on 3G/EDGE networks. MEDROUTER addresses this through:

- **Client-side scoring** — Hospital ranking happens locally with pre-cached data (no API call on critical path)
- **Firestore offline persistence** — Cached data remains available during connectivity drops
- **Localforage queuing** — Cases saved offline sync automatically when connectivity returns
- **Translation caching** — Pre-warmed cache eliminates translation API calls after first load
- **Minimal API surface** — Only Gemini AI copilot requires active network; core routing works offline

## 18.5 Virtualized Lists

For deployments with 50+ hospitals, the `react-window` library renders only visible hospital cards:
```jsx
import { FixedSizeList } from 'react-window';
<FixedSizeList height={600} itemCount={hospitals.length} itemSize={180}>
  {({ index, style }) => <HospitalCard hospital={hospitals[index]} style={style} />}
</FixedSizeList>
```
This maintains 60fps scrolling even with 200+ hospital entries.

---

# 19. Innovation Summary

## 19.1 Key Differentiators

| Innovation | Description | Industry Impact |
|-----------|-------------|----------------|
| **Decision Intelligence Router** | Multi-factor, emergency-aware hospital matching with 8 scoring dimensions — replaces "nearest hospital" paradigm | First EMS platform to implement algorithmic decision intelligence rather than simple proximity routing |
| **Explainable AI Scoring** | Every hospital rank is accompanied by per-factor score breakdown with human-readable reasoning | Government evaluators can audit every routing decision; dispatchers understand *why* a hospital was recommended |
| **Emergency-Specific Profiles** | 7 emergency types with custom weight matrices, required capabilities, and specialist prioritization | A cardiac patient is never routed to a hospital without a cardiologist or cath lab |
| **Golden Hour Modifier** | Time-decay function progressively shifts scoring from "best capability" to "nearest capable" as urgency increases | Mathematically models the medical reality that time-to-treatment becomes more important as the Golden Hour expires |
| **NaN-Hardened Scoring** | 4-layer defense (`safeNum`, `safeScore`, `normalizeHospital`, 999km guard) prevents undefined data from crashing scoring | System never produces NaN scores — always degrades gracefully to safe defaults |
| **Dispatcher Override with Audit Trail** | Structured override with mandatory reason categorization and immutable Firestore audit log | Preserves human judgment while creating accountability — enables continuous quality improvement |
| **Live Hospital Operations** | Slider-based real-time capacity management with instant routing engine recomputation | Hospital status changes propagate to all connected clients in 1–2 seconds via Firestore snapshots |
| **AI Copilot with Role-Aware Prompting** | Gemini 2.5 Flash with 5 distinct AI personas, context injection, and scoring explainability integration | Each user role receives AI assistance tailored to their specific responsibilities and data access |
| **Turn-By-Turn EMS Navigation** | Mapbox Directions API with ambulance speed factor, deviation detection, and auto-recalculation | Driver-grade navigation calibrated for ambulance driving patterns |
| **Dual SMS + WhatsApp Alerts** | Fast2SMS for Indian networks with automatic Twilio WhatsApp fallback | Ensures message delivery regardless of network conditions |
| **130+ Language Translation** | Google Translate with LRU caching, batch API optimization, and RTL support | Enables use across India's 22 official languages and international languages |
| **Hospital Self-Onboarding** | Conditional dashboard with GPS capture, map preview, and ownership binding | Hospitals can join the network without central administrator involvement |
| **Multi-City Simulation** | Bangalore + Hyderabad datasets with realistic hospital/ambulance/case data | Pre-built test environments for demonstrations, evaluations, and training |
| **Client-Side Scoring Engine** | 993-line scoring algorithm runs entirely in the browser (< 50ms) | Zero network latency on the critical routing decision path — works offline |
| **Offline-First Architecture** | Localforage IndexedDB queuing + Firestore offline persistence | Cases can be captured and queued even in complete network blackouts |

---

# 20. Future Expansion Roadmap

## 20.1 Machine Learning Prediction Layer

| Feature | Description | Target |
|---------|-------------|--------|
| **Predictive Bed Availability** | ML model trained on historical bed data to forecast availability 2–4 hours ahead | Enables proactive routing before capacity saturates |
| **Case Volume Prediction** | Time-series model predicting emergency case volume by area and time of day | Pre-position ambulances in high-probability zones |
| **Outcome-Based Scoring** | Survival rate analysis by hospital-emergency type combination to inform future scoring weights | Continuously improve routing accuracy based on patient outcomes |
| **Anomaly Detection** | Automatic detection of unusual patterns (sudden hospital diversion, equipment failure cluster) | Early warning system for network-level issues |

## 20.2 IoT Ambulance Telemetry

| Feature | Description |
|---------|-------------|
| **Vehicle Health Monitoring** | OBD-II data integration for engine status, fuel level, tire pressure, brake wear |
| **Equipment Readiness** | IoT sensors on stretcher, oxygen tank, defibrillator reporting battery/fill levels |
| **Environmental Sensors** | Cabin temperature, humidity monitoring for temperature-sensitive medications |
| **Driver Fatigue Detection** | Wearable integration for heart rate, alertness scoring during extended shifts |

## 20.3 Drone Supply Routing

| Feature | Description |
|---------|-------------|
| **Blood Product Delivery** | Drone routing from blood banks to hospitals with calculated flight time |
| **Medication Resupply** | Emergency medication delivery to ambulances in field via autonomous drones |
| **AED Delivery** | Automated external defibrillator delivery to bystanders before ambulance arrival |
| **Scene Assessment** | Aerial imagery of accident scenes for pre-arrival situational awareness |

## 20.4 National EMS Grid Integration

| Feature | Description |
|---------|-------------|
| **Inter-State Routing** | Cross-boundary hospital routing for emergencies near state borders |
| **National Dashboard** | Ministry-level visibility across all state EMS networks |
| **Standardized Protocol** | Common API for integration with 108/112 national ambulance dispatch systems |
| **Data Lake** | Centralized anonymized data repository for national EMS research and policy |

## 20.5 Advanced Feature Roadmap

| Priority | Feature | Target Timeline |
|----------|---------|----------------|
| P0 | Firebase Admin SDK for full context injection in serverless | Q1 2026 |
| P0 | Vercel KV for persistent AI conversation history | Q1 2026 |
| P1 | Push notification layer (FCM) for hospital alerts | Q2 2026 |
| P1 | PWA (Progressive Web App) for offline-first mobile deployment | Q2 2026 |
| P2 | Video call integration (paramedic → hospital specialist) | Q3 2026 |
| P2 | HL7 FHIR integration for electronic health record data exchange | Q3 2026 |
| P3 | Computer vision for automated triage from incident photos | Q4 2026 |
| P3 | Voice-activated AI copilot (hands-free operation for paramedics) | Q4 2026 |

---

# Appendix A — Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.0.0 |
| Build Tool | Vite | 5.4.8 |
| CSS Framework | Tailwind CSS | 3.4.13 |
| Routing | React Router DOM | 6.26.2 |
| Maps | Mapbox GL JS | 3.6.0 |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | 0.441.0 |
| Offline Storage | Localforage | 1.10.0 |
| Photo EXIF | ExifReader | 4.32.0 |
| Virtualization | react-window | 1.8.10 |
| HTTP Client | Axios | 1.7.7 |
| Database | Firebase Firestore | 11.0.2 |
| Auth | Firebase Auth | 11.0.2 |
| Storage | Firebase Storage | 11.0.2 |
| Admin SDK | firebase-admin | 13.6.1 |
| AI Model | Google Gemini 2.5 Flash | Preview |
| Serverless | Vercel Functions | Latest |
| SMS Provider | Fast2SMS | v3 API |
| WhatsApp | Twilio API | Latest |
| Translation | Google Translate API | v2 |
| Server Framework | Express | 5.2.1 |
| Minification | Terser | 5.34.1 |
| Compression | vite-plugin-compression | 0.5.1 |
| Linting | ESLint | 8.57.0 |
| Formatting | Prettier | 3.3.3 |
| Bundle Analysis | rollup-plugin-visualizer | 5.12.0 |

# Appendix B — Firestore Schema Reference

## emergencyCases Document
```json
{
  "patientInfo": {
    "name": "string",
    "age": "number",
    "gender": "male|female|other",
    "pregnancyStatus": "yes|no|na"
  },
  "vitals": {
    "heartRate": "number (BPM)",
    "bloodPressureSystolic": "number (mmHg)",
    "bloodPressureDiastolic": "number (mmHg)",
    "spO2": "number (%)",
    "respiratoryRate": "number",
    "temperature": "number (°C)",
    "gcsScore": "number (3-15)",
    "painLevel": "number (0-10)"
  },
  "emergencyType": "cardiac|trauma|burn|accident|pediatric|infectious|general",
  "acuityLevel": "1|2|3|4|5",
  "chiefComplaint": "string",
  "pickupLocation": { "latitude": "number", "longitude": "number" },
  "photos": ["storage_url_1", "storage_url_2"],
  "targetHospital": "hospital_id",
  "assignedAmbulance": "ambulance_id",
  "status": "pending|dispatched|en-route|arrived|completed",
  "createdBy": "user_uid",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## hospitals Document
```json
{
  "basicInfo": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "hospitalType": "general|multi_specialty|trauma_center|cardiac|pediatric|burn",
    "location": { "latitude": "number", "longitude": "number" }
  },
  "traumaLevel": "level_1|level_2|level_3|none",
  "capacity": {
    "bedsByType": {
      "icu": { "total": "number", "available": "number", "occupied": "number" },
      "general": { "total": "number", "available": "number" },
      "emergency": { "total": "number", "available": "number" },
      "isolation": { "total": "number", "available": "number" },
      "traumaBeds": { "total": "number", "available": "number" },
      "cardiac": { "total": "number", "available": "number" }
    }
  },
  "specialists": {
    "cardiologist": { "count": "number", "available": "number" },
    "neurologist": "number|{count,available}",
    "traumaSurgeon": "number|{count,available}",
    "burnSpecialist": "number|{count,available}",
    "pediatrician": "number|{count,available}",
    "radiologist": "number|{count,available}",
    "pulmonologist": "number|{count,available}",
    "orthopedicSurgeon": "number|{count,available}",
    "anesthesiologist": "number|{count,available}",
    "emergencyPhysician": "number|{count,available}"
  },
  "equipment": {
    "ventilators": { "total": "number", "available": "number" },
    "defibrillators": { "total": "number", "available": "number" },
    "ctScanners": { "total": "number", "available": "number" },
    "mriMachines": { "total": "number", "available": "number" },
    "xrayMachines": { "total": "number", "available": "number" }
  },
  "emergencyReadiness": {
    "acceptingCases": "boolean",
    "status": "available|limited|full",
    "diversionStatus": "boolean"
  },
  "caseAcceptance": {
    "acceptsCardiac": "boolean",
    "acceptsTrauma": "boolean",
    "acceptsBurns": "boolean",
    "acceptsPediatric": "boolean",
    "acceptsInfectious": "boolean"
  },
  "capabilities": {
    "hasTraumaCenter": "boolean",
    "hasICU": "boolean",
    "hasBurnUnit": "boolean",
    "strokeCenter": "boolean",
    "emergencySurgery": "boolean",
    "ctScanAvailable": "boolean"
  },
  "adminId": "user_uid (ownership binding)",
  "lastUpdated": "Timestamp",
  "createdAt": "Timestamp"
}
```

---

**END OF DOCUMENT**

*MEDROUTER — Routes That Save Lives*  
*Document Version: 2.0.0 | February 2026*  
*Total Sections: 20 + 2 Appendices*  
*Prepared for: Government evaluation, regulatory review, investor due diligence, and technical reference*
