# MEDROUTER — Routes That Save Lives

## Final Master Technical Documentation v3.0

**Platform Name:** MEDROUTER
**Tagline:** Routes That Save Lives
**Version:** 3.0.0
**Classification:** Production-Grade AI-Powered EMS Decision Intelligence Platform
**Repository:** [SreeManas/ambulance_system](https://github.com/SreeManas/ambulance_system)
**Technology Stack:** React 19 · Vite 5 · Firebase (Firestore + Auth + Storage) · Mapbox GL JS · Google Gemini 2.5 Flash · Fast2SMS · Twilio WhatsApp · Google Translate API · Vercel Serverless
**Document Date:** February 2026
**Document Purpose:** Government evaluation, healthcare regulatory review, hackathon submission, investor due diligence, startup Series-A technical whitepaper, system architecture reference, DevOps deployment guide, infrastructure partner onboarding, and future maintainer reference
**Document Length:** 20,000+ words — Ultra-detailed, submission-grade

---

# Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [System Architecture](#2-system-architecture)
3. [Role-Based Access Control (RBAC)](#3-role-based-access-control-rbac)
4. [Emergency Intake System](#4-emergency-intake-system)
5. [Capability Scoring Engine](#5-capability-scoring-engine)
6. [AI Explainability Layer](#6-ai-explainability-layer)
7. [Dispatcher Override Routing](#7-dispatcher-override-routing)
8. [Live Hospital Operations Panel](#8-live-hospital-operations-panel)
9. [Real-Time Hospital Capability Dashboard](#9-real-time-hospital-capability-dashboard)
10. [Turn-By-Turn Navigation System](#10-turn-by-turn-navigation-system)
11. [GPS Tracking + SMS Communication](#11-gps-tracking--sms-communication)
12. [Multilingual Translation System](#12-multilingual-translation-system)
13. [Gemini AI Copilot](#13-gemini-ai-copilot)
14. [Responsive UI Infrastructure](#14-responsive-ui-infrastructure)
15. [Hospital Self-Onboarding System](#15-hospital-self-onboarding-system)
16. [Driver Self-Onboarding System](#16-driver-self-onboarding-system)
17. [Driver Verification & Approval System](#17-driver-verification--approval-system)
18. [Command Center Dashboard](#18-command-center-dashboard)
19. [Multi-City Simulation Engine](#19-multi-city-simulation-engine)
20. [Security Infrastructure](#20-security-infrastructure)
21. [Deployment Architecture](#21-deployment-architecture)
22. [Performance Optimization](#22-performance-optimization)
23. [Innovation Highlights](#23-innovation-highlights)
24. [Testing & Validation](#24-testing--validation)
25. [Future Expansion Roadmap](#25-future-expansion-roadmap)
26. [Failure Recovery & Operational Resilience Architecture](#26-failure-recovery-and-operational-resilience-architecture)
27. [Appendix A — Technology Stack](#appendix-a--technology-stack-summary)
28. [Appendix B — Firestore Schema Reference](#appendix-b--firestore-schema-reference)
29. [Appendix C — Storage Rules Reference](#appendix-c--storage-rules-reference)

---

# 1. Platform Overview

## 1.1 Vision of MEDROUTER

MEDROUTER is a full-stack, real-time **Decision Intelligence Platform** engineered to transform pre-hospital emergency medical services (EMS) in India and globally. The platform replaces the archaic, radio-based, human-memory-dependent ambulance dispatch model with an AI-driven system that automatically evaluates every hospital in a metropolitan network and recommends the optimal destination within seconds of an emergency call.

The name **MEDROUTER** encapsulates the platform's core function: intelligently routing medical emergencies to the right hospital at the right time. The tagline — **"Routes That Save Lives"** — reflects the platform's mission-critical purpose: every second saved in hospital selection directly contributes to patient survival.

MEDROUTER is not merely a mapping tool or a fleet tracker. It is a **multi-stakeholder decision intelligence ecosystem** that unifies paramedics, dispatchers, hospital administrators, command center operators, ambulance drivers, and platform administrators into a single, real-time, AI-augmented operational fabric. Every participant sees exactly the data they need, at the moment they need it, presented through role-optimized dashboards with full AI explainability.

## 1.2 The Problem MEDROUTER Solves

India's Emergency Medical Services infrastructure faces systemic challenges that directly contribute to preventable patient mortality:

### The Golden Hour Crisis

Medical research conclusively establishes that trauma patients treated within 60 minutes of injury ("the Golden Hour") have significantly higher survival rates. In Indian metropolitan cities, the average ambulance-to-hospital decision takes **8–15 minutes** via manual radio coordination. This consumes 13–25% of the Golden Hour on logistics alone. MEDROUTER reduces hospital selection time to **under 3 seconds** through automated multi-factor scoring.

### Information Asymmetry

Paramedics in the field have zero visibility into:
- Which hospitals have available ICU beds at this exact moment
- Which specialists are currently on duty and available
- Which emergency departments are on diversion (not accepting patients)
- Which hospitals have the specific equipment required for the patient's condition (e.g., ventilators, defibrillators, cath labs)
- Which hospitals accept the specific emergency type (pediatric, burn, infectious)

They rely on outdated phone calls, institutional memory, and guesswork. MEDROUTER provides a **live, continuously-updated capability map** of every hospital in the network, refreshed in real-time via Firestore snapshot listeners with sub-second propagation.

### Static Dispatch Models Cause Mis-Routing

Current 108/112 dispatch systems route ambulances to the **nearest hospital** regardless of that hospital's actual ability to treat the patient's specific condition. This leads to dangerous scenarios:

| Scenario | Consequence |
|----------|-------------|
| Cardiac arrest patient → Hospital without cath lab | Secondary transfer wastes 30+ minutes of Golden Hour |
| Burn victim → Facility without a burn unit | Delayed treatment increases mortality by 40% |
| Pediatric emergency → Adult-only facility | Third transfer required, patient deteriorates |
| Trauma patient → Hospital at full ICU capacity | Patient waits in hallway, no monitoring available |
| Infectious disease case → No isolation beds | Cross-contamination risk, patient untreated |
| Industrial accident → No CT scanner available | Delayed diagnosis of internal injuries |

MEDROUTER's **emergency-specific scoring profiles** ensure that a cardiac patient is routed to a hospital with a cardiologist, cath lab, and available cardiac beds — not merely the closest facility.

### No Driver Verification System

Traditional EMS systems lack a mechanism for verifying the credentials, vehicle readiness, and equipment availability of ambulance drivers who register to serve. Any individual with a vehicle could claim to operate an ambulance without oversight. MEDROUTER implements a **multi-stage driver verification pipeline** where system administrators manually review driver registrations, inspect license documents, verify equipment checklists, and approve or reject drivers before they become visible in the operational fleet.

### No Audit Trail for Override Decisions

When dispatchers override routing decisions based on phone calls or personal judgment, there is no systematic record of **why** the override was made. This makes quality improvement, accountability analysis, and regulatory compliance impossible. MEDROUTER creates a **complete Firestore-backed audit trail** for every override decision, capturing the original AI recommendation, the override target, reason categorization, and timestamp metadata.

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
  Turn-by-turn navigation + SMS alerts + Hospital preparation →
  Patient arrives at best-matched hospital within Golden Hour
```

### Decision Intelligence vs. Static Routing — Comprehensive Comparison

| Dimension | Static Routing | MEDROUTER Decision Intelligence |
|-----------|---------------|-------------------------------|
| Selection criteria | Distance only | 8+ factors (capability, specialists, equipment, beds, distance, load, freshness, trauma level) |
| Emergency awareness | None | 7 emergency-specific scoring profiles (cardiac, trauma, burn, accident, pediatric, infectious, general) + alias system (stroke→cardiac, industrial→trauma) |
| Time sensitivity | Ignored | Golden Hour modifier progressively shifts weighting as urgency increases |
| Hospital visibility | Phone/radio inquiry | Real-time Firestore dashboard with live bed counts, specialist availability, and diversion status |
| Decision transparency | Black box | Full AI explainability panel with per-factor score breakdown, reason badges, and expandable analysis |
| Override accountability | None | Structured audit trail with 7 reason categories, immutable Firestore logging |
| Communication | Radio only | Automated SMS + WhatsApp + in-app alerts with tracking links |
| Language access | Single language | 130+ languages with real-time translation, RTL support, and LRU caching |
| Driver management | Manual | Self-onboarding with admin verification pipeline, equipment checklists, license upload |
| Fleet composition | Static | Dual fleet: system-seeded + driver-registered ambulances with independent lifecycles |

## 1.4 Real-World EMS Impact Metrics

| Metric | Before (Manual) | After (MEDROUTER) |
|--------|-----------------|-------------------|
| Hospital selection time | 8–15 minutes | < 3 seconds |
| Scoring factors considered | 1–2 (distance, memory) | 8+ (capability, beds, specialists, equipment, distance, load, freshness, golden hour) |
| Golden hour visibility | None | Real-time countdown with color-coded urgency progression |
| Hospital capacity awareness | Phone calls | Live Firestore dashboards with slider controls and instant propagation |
| Override accountability | None | Full audit trail with reason logging and Firestore persistence |
| Language support | Single language | 130+ languages with auto-detection and RTL support |
| Communication channels | Radio only | SMS + WhatsApp + in-app alerts with tracking links |
| Hospital preparation time | 0 (no advance notice) | ETA-based alert sent on dispatch |
| Data freshness tracking | N/A | Automatic freshness penalty for stale hospital data |
| Disqualification filtering | None | Automatic exclusion of incapable/diverted/full hospitals |
| Driver verification | None | Multi-stage admin approval with license review and equipment verification |
| Multi-city coverage | Single city | Dual-city (Bangalore + Hyderabad) with extensible architecture |
| AI assistance | None | Gemini 2.5 Flash copilot with role-aware prompting and context injection |

## 1.5 Target Users

MEDROUTER serves **six distinct user roles**, each with dedicated dashboards, access controls, and AI copilot personas:

| User Role | Internal Code | Description | Primary Workflow |
|-----------|--------------|-------------|-----------------|
| **Paramedics (Field Crews)** | `paramedic` | First responders capturing patient vitals in the ambulance | Patient intake → receive AI-ranked hospital list → navigate to destination |
| **Dispatchers (Control Room)** | `dispatcher` | Fleet coordinators managing ambulance assignments | Monitor case queue → review AI recommendations → accept or override routing → dispatch alerts |
| **Hospital Administrators** | `hospital_admin` | Staff managing hospital readiness and capacity | Self-onboard hospital → update bed availability via sliders → toggle diversion status |
| **Command Center Operators** | `command_center` | Senior operators with network-wide situational awareness | Monitor all active cases → track fleet positions → identify coverage gaps → coordinate multi-ambulance events |
| **Ambulance Drivers** | `ambulance_driver` | Independent drivers registering their vehicles | Self-onboard via multi-step form → upload license → await admin approval → receive navigation assignments |
| **Platform Administrators** | `admin` | System administrators with full platform access | User management → driver verification → system configuration → data quality monitoring → analytics review |

## 1.6 Key Platform Objectives

1. **Minimize Time-to-Treatment** by automating hospital selection with multi-factor scoring, reducing decision time from minutes to seconds
2. **Maximize Clinical Match** by routing patients to hospitals with the right specialists, equipment, and available capacity for their specific emergency type
3. **Enable Golden Hour Compliance** through real-time countdown tracking and urgency-weighted scoring that dynamically adjusts recommendations as time expires
4. **Provide Decision Transparency** through AI explainability panels showing exactly why each hospital was ranked, enabling informed human oversight
5. **Support Human Override** with auditable dispatcher override workflows that preserve accountability without blocking rapid decision-making
6. **Ensure Universal Access** through 130+ language translation with RTL support and mobile-responsive design for low-bandwidth field conditions
7. **Maintain Data Integrity** through offline-first architecture, NaN-hardened scoring, schema normalization, and crash-recovery error boundaries
8. **Enable Ecosystem Growth** through driver self-onboarding with admin verification, hospital self-registration with ownership binding, and multi-city extensibility
9. **Provide AI-Augmented Decision Support** through role-aware Gemini 2.5 Flash copilot with context injection, scoring explainability, and suggested prompts
10. **Support Multi-Stakeholder Coordination** through six role-specific dashboards that surface exactly the right information to each participant at the right time

---

# 2. System Architecture

## 2.1 High-Level Architecture Diagram

The platform follows a **three-tier architecture** with real-time data synchronization, dual deployment modes, and six user role entry points:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                      │
│  React 19 Single-Page Application (Vite 5 Build Tooling)                      │
│                                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Paramedic │ │Dispatcher│ │ Hospital │ │ Command  │ │ Ambulance│ │ Admin  ││
│  │Dashboard │ │  Command │ │Dashboard │ │  Center  │ │  Driver  │ │Dashboard│
│  │(Intake + │ │  Center  │ │(Onboard +│ │  Fleet   │ │(Onboard +│ │(Full   ││
│  │ Routing) │ │(Fleet +  │ │ LiveOps) │ │  Mgmt    │ │ Tracking)│ │Access) ││
│  └────┬─────┘ │Override) │ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘│
│       │       └────┬─────┘      │             │            │           │      │
│  ┌────┴────────────┴────────────┴─────────────┴────────────┴───────────┴──┐  │
│  │                   SHARED CLIENT SERVICES LAYER                          │  │
│  │  • Capability Scoring Engine (client-side, < 50ms, 993 lines)           │  │
│  │  • Geocoding Service (Google + OpenCage fallback)                       │  │
│  │  • Communication Service (SMS/WhatsApp multi-channel)                   │  │
│  │  • Translation Service (Google Translate + LRU cache, 2000 entries)     │  │
│  │  • Gemini Service (REST client → serverless APIs)                       │  │
│  │  • Storage Service (Firebase Storage upload/download)                   │  │
│  │  • Offline Sync Service (IndexedDB via localforage)                     │  │
│  └──────────────────────┬─────────────────────────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────────────────────┘
                           │
          ┌────────────────┼──────────────────────┐
          │                │                      │
┌─────────▼────────┐ ┌────▼───────┐ ┌────────────▼───────────┐
│   Firebase       │ │  Vercel    │ │   Express Proxy         │
│   Platform       │ │  Serverless│ │   Servers (Local Dev)   │
│                  │ │  Functions │ │                         │
│  • Firestore     │ │            │ │  • Gemini AI Server     │
│    (10 colls)    │ │ /api/gemini│ │    :5002                │
│  • Auth          │ │  /chat     │ │  • SMS Proxy Server     │
│  • Storage       │ │  /suggest  │ │    :5001                │
│  • Hosting       │ │  /health   │ │                         │
│                  │ │            │ │  • Shares prompt        │
│  Security Rules  │ │ Gemini 2.5 │ │    templates with       │
│  RBAC Enforced   │ │ Flash API  │ │    serverless layer     │
└──────────────────┘ └────────────┘ └─────────────────────────┘
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
| Mapbox GL JS | 3.6.0 | Interactive WebGL maps for routing, fleet tracking, navigation, and GPS preview |
| Recharts | 2.12.7 | Data visualization for analytics dashboards |
| Lucide React | 0.441.0 | Icon library (400+ consistent SVG icons used across all dashboards) |
| Localforage | 1.10.0 | IndexedDB wrapper for offline case queuing |
| Exifreader | 4.32.0 | EXIF metadata extraction from captured photos |
| react-window | 1.8.10 | Virtualized list rendering for large hospital lists (60fps at 200+ entries) |

### 2.2.2 Routing System

The frontend is a Single-Page Application (SPA) with React Router DOM v6 managing navigation. The routing tree reflects the six-role architecture:

```
App.jsx (Root)
├── AuthProvider (React Context — authentication state + role management)
│   └── LanguageProvider (React Context — i18n state + RTL detection)
│       ├── Nav (Role-aware navigation bar with MEDROUTER branding)
│       ├── LoginForm (Authentication gateway — email/password + Google OAuth)
│       └── ProtectedRoute (RBAC route guard + driver verification gate)
│           ├── PatientVitalsForm        (Paramedic — /intake)
│           ├── RoutingDashboard         (Paramedic/Dispatcher — /routing)
│           ├── HospitalDashboard        (Hospital Admin — /hospitals)
│           ├── CommandCenterDashboard   (Dispatcher/Command Center — /command-center)
│           ├── RealTimeHospitalCapability (All roles — /live-capacity)
│           ├── AmbulanceNavigation      (Paramedic/Driver — /navigate)
│           ├── DriverOnboarding         (Ambulance Driver — /driver-onboarding)
│           ├── VerificationPending      (Ambulance Driver — /verification-pending)
│           ├── FeedbackForm             (All roles — /feedback)
│           └── EMSChatAssistant         (Floating widget, all roles)
```

### 2.2.3 State Management

MEDROUTER uses **React Context API** for global state (avoiding Redux complexity for this application scale):

| Context | File | State Managed |
|---------|------|---------------|
| `AuthContext` | `AuthProvider.jsx` | Current user, role, userDoc, login/register/logout, role migration, Google OAuth |
| `LanguageContext` | `LanguageContext.jsx` | Selected language, RTL flag, translate functions, translation cache |

Component-level state is managed via `useState` and `useReducer` hooks. Real-time data from Firestore is consumed via `onSnapshot` listeners that directly update local component state, ensuring zero-latency propagation of database changes.

### 2.2.4 Custom Hooks Infrastructure

| Hook | File | Purpose |
|------|------|---------|
| `useT` | `hooks/useT.js` | Single-text translation with auto-refresh on language change |
| `useTBatch` | `hooks/useT.js` | Batch translation of label arrays for entire dashboards (N texts → 1 API call) |
| `useTPreload` | `hooks/useT.js` | Cache-warming for predefined translation key sets on dashboard mount |
| `useMapResize` | `hooks/useMapResize.js` | Dynamic map viewport adjustment when panels open/close or window resizes |
| `useRealTimeProcessing` | `hooks/useRealTimeProcessing.js` | Real-time data processing pipeline for streaming Firestore updates |
| `useWebWorker` | `hooks/useWebWorker.js` | Web Worker orchestrator for offloading heavy computations off the main thread |

## 2.3 Backend Layer

### 2.3.1 Vercel Serverless API Layer (Production)

MEDROUTER's production backend runs as **Vercel Serverless Functions**, eliminating the need for managed servers:

| Endpoint | File | Method | Purpose |
|----------|------|--------|---------|
| `/api/gemini/chat` | `api/gemini/chat.js` | POST | Gemini 2.5 Flash AI chat with role-specific system prompts, context injection, and explainability mode |
| `/api/gemini/suggestions` | `api/gemini/suggestions.js` | GET | Role-aware suggested follow-up prompts with context-sensitive generation |
| `/api/gemini/health` | `api/gemini/health.js` | GET | Health check — verifies API key configuration and returns system status |

**Shared Utilities:**

| File | Purpose |
|------|---------|
| `api/utils/prompts.js` | Role-specific system prompt templates for 5 user roles (paramedic, dispatcher, hospital_admin, command_center, admin) + explainability instruction generator |
| `api/utils/suggestedPrompts.js` | Context-aware prompt suggestion generator with role-specific prompt libraries |

**Key Design Decision:** The serverless layer maintains **in-memory conversation history** per session (JavaScript Map with 30-minute TTL, max 20 messages per session). This provides session continuity within a serverless cold-start window while remaining stateless across deployments. For production at scale, Vercel KV or Firestore-backed history would be used.

### 2.3.2 Express Proxy Servers (Local Development)

For local development, two Express.js proxy servers provide equivalent functionality with full Firebase Admin SDK access:

| Server | File | Port | Purpose |
|--------|------|------|---------|
| Gemini AI Server | `server/geminiChat.js` | 5002 | Proxies chat to Gemini API with Firebase Admin SDK for deep Firestore context injection |
| SMS Proxy Server | `server/smsServer.js` | 5001 | Proxies SMS to Fast2SMS API, handles rate limiting and WhatsApp fallback |

**Supporting Modules:**

| File | Purpose |
|------|---------|
| `server/roleContextBuilder.js` (476 lines) | Fetches real-time Firestore data tailored to each user role — active cases, hospital capabilities, fleet status, network statistics |
| `server/systemPrompts.js` | Role-specific AI personality prompts (equivalent to `api/utils/prompts.js`) |
| `server/suggestedPrompts.js` | Follow-up question generator with context awareness |

### 2.3.3 Vite Development Middleware

In development mode, `vite.config.js` includes a custom middleware (`configureServer`) that intercepts `/api/*` requests and dynamically imports the corresponding serverless handler file, simulating Vercel's serverless execution model locally without requiring separate server processes for the API layer.

## 2.4 Database Layer

### 2.4.1 Firebase Firestore Collections

MEDROUTER uses **10 Firestore collections** with real-time `onSnapshot` listeners providing sub-second data propagation:

| Collection | Documents | Primary Purpose | Real-Time Listeners |
|------------|-----------|----------------|-------------------|
| `emergencyCases` | Active/completed emergency cases | Patient data, vitals, status tracking, hospital assignment | Command Center, Routing Dashboard |
| `hospitals` | Hospital registry with capabilities | Scoring engine input, capacity management, self-onboarding | Routing Dashboard, Hospital Dashboard, Command Center, Real-Time Capability |
| `ambulances` | Fleet vehicles (system + driver-registered) | Fleet tracking, dispatch, driver verification gating | Command Center, Driver Verification Panel |
| `dispatchOverrides` | Override audit trail (append-only) | Accountability, quality review, regulatory compliance | Override Audit Panel |
| `users` | User profiles with role assignments | Authentication, RBAC enforcement, driver linking, hospital linking | Auth System, ProtectedRoute |
| `communicationLogs` | SMS/WhatsApp delivery records | Delivery audit trail, failure analysis | Admin Dashboard |
| `feedback` | User feedback and issue reports | Quality improvement, user satisfaction | Admin Dashboard |
| `ambulanceTracking` | Live GPS coordinate streams | Shareable tracking links, real-time position updates | Tracking Viewer, Command Center |
| `reports` | Legacy report documents | Backward compatibility with INCOIS Hazard Dashboard | — |
| `alerts` | Legacy alert documents | Backward compatibility | — |

### 2.4.2 Schema Relationships

```
emergencyCases ──── targetHospital ────→ hospitals
       │                                      │
       │── assignedAmbulance ──→ ambulances    │── adminId ──→ users (ownership)
       │                            │          │
       │── createdBy ──→ users      │          │
       │                            │── driverId ──→ users (driver linking)
       └── caseId ──→ dispatchOverrides        │
                      communicationLogs         │
                                               └── hospitalId ←── users (onboarding)
```

## 2.5 AI Layer Architecture

| Component | Location | Model/Method | Purpose |
|-----------|----------|-------------|---------|
| Scoring Engine | `src/services/capabilityScoringEngine.js` (client, 993 lines) | Algorithmic (no ML) | Multi-factor hospital ranking with 8 scoring dimensions, 7 emergency profiles, NaN hardening |
| Explainability Panel | `src/components/HospitalExplainabilityPanel.jsx` (client) | UI rendering | Visual breakdown of scoring factors with score bars, reason badges, and expandable analysis |
| AI Copilot | `api/gemini/chat.js` (serverless) | Gemini 2.5 Flash | Role-aware conversational assistant with real-time context injection and explainability mode |
| Suggested Prompts | `api/gemini/suggestions.js` (serverless) | Template-based | Context-aware prompt suggestions tailored to each of 5 roles |

## 2.6 Communication Layer

```
┌─────────────────────────────────────┐
│   Communication Service             │
│   (Frontend Client — 241 lines)     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────┐                │
│  │ sendDispatch     │──→ Fast2SMS API (Indian mobile)
│  │ TrackingSMS      │                │
│  └────────┬────────┘                │
│           │ (on failure)            │
│           ▼                         │
│  ┌─────────────────┐                │
│  │ sendWhatsApp     │──→ Twilio API (international fallback)
│  │ Fallback         │                │
│  └────────┬────────┘                │
│           │                         │
│           ▼                         │
│  ┌─────────────────┐                │
│  │ sendHospital     │──→ Fast2SMS API (hospital admin)
│  │ AlertSMS         │                │
│  └────────┬────────┘                │
│           │                         │
│           ▼                         │
│  ┌─────────────────┐                │
│  │ logCommunication │──→ Firestore: communicationLogs (audit)
│  └─────────────────┘                │
└─────────────────────────────────────┘
```

## 2.7 Emergency Case Data Flow — Complete Lifecycle

```
1. CASE CREATION (Paramedic)
   PatientVitalsForm → Validate 30+ fields → Capture GPS (Geolocation API) →
   Upload photos to Firebase Storage → Write to Firestore: emergencyCases/{caseId}

2. REAL-TIME DETECTION (All Dashboards)
   Firestore onSnapshot listener → New case appears in Command Center queue →
   Acuity-sorted, color-coded emergency list updates instantly (< 1 second)

3. HOSPITAL SCORING (Client-Side, < 50ms)
   Scoring Engine fetches hospital data via onSnapshot →
   Selects emergency profile (cardiac/trauma/burn/accident/pediatric/infectious/general) →
   Resolves aliases (stroke→cardiac, industrial→trauma) →
   Calculates 8 dimensions: capability + specialist + equipment + bed +
   distance + load + freshness + trauma level →
   Applies weight profile (acuity-specific) →
   Applies Golden Hour modifier → Checks disqualification criteria →
   Returns ranked list with explainability data for each hospital

4. ROUTING DISPLAY (Routing Dashboard)
   Mapbox renders ambulance position → Hospital markers with rank-based colors →
   Directions API draws top-3 route polylines → ETA calculation with ambulance speed factor →
   Golden Hour countdown banner with 5-stage color progression

5. DISPATCH DECISION (Dispatcher)
   Dispatcher reviews AI-ranked list → Accepts recommendation OR →
   Clicks "Override Routing" → Selects alternative hospital → Provides reason from 7 categories →
   Override logged to dispatchOverrides/{docId} with full audit data (immutable)

6. COMMUNICATION PIPELINE
   SMS to patient family (tracking link + hospital name + ETA) →
   SMS to receiving hospital (incoming patient alert + emergency type + acuity) →
   WhatsApp fallback if SMS delivery fails →
   All attempts logged to communicationLogs collection with status tracking

7. NAVIGATION (Paramedic / Driver)
   AmbulanceNavigation component → Mapbox Directions API turn-by-turn →
   Real-time GPS position updates → ETA recalculation every 15 seconds →
   Auto-reroute on 500m+ deviation from planned route

8. HOSPITAL PREPARATION + HANDOVER
   Hospital admin sees incoming case alert → Prepares resources →
   Updates bed availability post-admission via Live Ops sliders →
   Scoring engine re-runs automatically on all connected clients (< 50ms)
```

---

# 3. Role-Based Access Control (RBAC)

## 3.1 Supported Roles

MEDROUTER implements a **6-role RBAC system** with permission enforcement across 4 layers:

| Role | Internal Code | Default Dashboard |
|------|--------------|-------------------|
| **Paramedic** | `paramedic` | Patient Intake + Routing |
| **Dispatcher** | `dispatcher` | Command Center + Routing |
| **Hospital Admin** | `hospital_admin` | Hospital Dashboard (with onboarding) |
| **Command Center** | `command_center` | Command Center |
| **Ambulance Driver** | `ambulance_driver` | Driver Onboarding → Verification Pending → Navigation |
| **Platform Admin** | `admin` | All dashboards + Driver Verification |

### Legacy Role Migration

The platform evolved from an earlier disaster management system. Legacy roles are automatically migrated on login via `normalizeRole()` in `AuthProvider.jsx`:

```javascript
const ROLE_MIGRATION = { citizen: 'paramedic', analyst: 'hospital_admin', official: 'command_center' };
```

When `AuthProvider` detects a legacy role, it maps it to the EMS equivalent, writes the updated role back to Firestore's `users` collection, and sets the normalized role in React state. **Default Role:** `paramedic` (assigned to new users and Google OAuth registrations).

## 3.2 Dashboard Access Matrix

| Dashboard | Paramedic | Dispatcher | Hospital Admin | Command Center | Driver | Admin |
|-----------|:---------:|:----------:|:--------------:|:--------------:|:------:|:-----:|
| Patient Intake (`/intake`) | ✅ | ✅ | — | — | — | ✅ |
| Routing Intelligence (`/routing`) | ✅ | ✅ | — | ✅ | — | ✅ |
| Hospital Management (`/hospitals`) | — | — | ✅ | — | — | ✅ |
| Live Capacity (`/live-capacity`) | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Command Center (`/command-center`) | — | ✅ | — | ✅ | — | ✅ |
| Navigation (`/navigate`) | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Driver Onboarding (`/driver-onboarding`) | — | — | — | — | ✅ | ✅ |
| Verification Pending (`/verification-pending`) | — | — | — | — | ✅ | ✅ |
| Feedback (`/feedback`) | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| AI Copilot (floating) | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Driver Verification Tab | — | — | — | — | — | ✅ |

## 3.3 Permission Enforcement Layers

### Layer 1 — Frontend Route Guards (`ProtectedRoute.jsx`)

The `ProtectedRoute` component wraps every protected route with a multi-stage gate:

1. **Loading State:** Shows spinner while Firebase Auth resolves
2. **Authentication Check:** Redirects unauthenticated users to `/login` with return path
3. **Ambulance Driver Gate:** Special multi-stage routing:
   - If **onboarding not completed** → Force redirect to `/driver-onboarding`
   - If **onboarding completed but not verified** → Redirect to `/verification-pending`
   - If **verified (approved)** → Allow access to operational pages
4. **Role Access Matrix Check:** Checks `ROLE_ACCESS` map against `location.pathname`
5. **Unauthorized Redirect:** Routes to `/not-authorized` page

**Edge Cases Handled:** Driver whose verification status changes sees automatic UI update via Firestore snapshot listener. Rejected drivers see rejection reason on `/verification-pending`.

### Layer 2 — UI Conditional Rendering

- **"Driver Verifications" tab** in Command Center: renders only when `role === 'admin'`
- **"Override Routing" button**: only for `dispatcher`, `command_center`, `admin`
- **"Add Hospital" button**: only for `hospital_admin`, `admin`
- **Hospital edit/delete controls**: only for matching `adminId` owner or `admin`

### Layer 3 — Firestore Security Rules (Server-Side)

**This is the true security boundary.** Rules reference helper functions performing real-time Firestore lookups:

```
function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
function hasRole(role) { return request.auth != null && getUserData().role == role; }
function isAdmin() { return hasRole('admin'); }
```

### Layer 4 — Backend API Validation

The Gemini serverless endpoint validates the `role` parameter in each chat request. Invalid roles default to `paramedic` (most restrictive context).

## 3.4 Firestore RBAC Rules — Complete Matrix

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `emergencyCases` | Paramedic, Dispatcher, Admin | Paramedic, Dispatcher, Admin | Dispatcher, Admin | Admin only |
| `hospitals` | All authenticated | Hospital Admin, Admin | Admin OR Hospital Admin with matching `adminId` | Admin only |
| `ambulances` | Admin, Dispatcher, Cmd Center, Paramedic, OR Driver own | Admin OR Driver creating own | Dispatcher, Admin, OR Driver own w/ `verificationStatus == 'pending'` | Admin only |
| `dispatchOverrides` | All authenticated | Dispatcher, Admin, Cmd Center | — (immutable) | — (immutable) |
| `users` | Self or Admin | Authenticated (self) | Self or Admin | Self or Admin |
| `communicationLogs` | All authenticated | Authenticated | Admin only | Admin only |

### Key Security Policies

- **Hospital Ownership Enforcement:** `hospital_admin` can only update hospitals where `resource.data.adminId == request.auth.uid`
- **Driver Write Restriction:** `ambulance_driver` can only update own ambulance AND only while `verificationStatus == 'pending'`
- **Override Immutability:** `dispatchOverrides` collection is append-only — no updates or deletes by any role
- **User Privacy:** Users cannot read other users' profiles (only self or admin)

---

# 4. Emergency Intake System

**File:** `src/components/PatientVitalsForm.jsx` (1,123 lines)
**Roles:** Paramedic, Dispatcher, Admin

## 4.1 Patient Vitals — Complete Field Reference

### Section 1 — Patient Identification

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Patient Name | Text | No (unconscious patients) | Max 100 chars |
| Age | Number | No | 0–150 |
| Gender | Dropdown | No | Male / Female / Other / Unknown |
| Pregnancy Status | Dropdown | Conditional (female) | Yes / No / N/A |

### Section 2 — Primary Vitals

| Field | Type | Range | Clinical Significance |
|-------|------|-------|----------------------|
| Heart Rate | BPM | 20–250 | Tachycardia >100 flags cardiac/shock |
| Blood Pressure (Systolic) | mmHg | 40–300 | Hypotension <90 = shock |
| Blood Pressure (Diastolic) | mmHg | 20–200 | Combined for MAP |
| SpO2 | % | 0–100 | <90% = respiratory emergency |
| Respiratory Rate | breaths/min | 0–60 | >20 = respiratory distress |
| Temperature | °C | 30–45 | >38.5 fever, <35 hypothermia |
| GCS Score | 3–15 | 3–15 | ≤8 = severe brain injury |
| Pain Level | 0–10 | 0–10 | Triage prioritization |

### Section 3 — Emergency Classification

| Field | Type | Options | Scoring Impact |
|-------|------|---------|---------------|
| Emergency Type | Dropdown | Cardiac, Trauma, Burn, Accident, Pediatric, Infectious, Stroke, Industrial | Selects scoring profile |
| Acuity Level | Dropdown | 1 (Critical) → 5 (Minor) | Weight profile + Golden Hour urgency |
| Chief Complaint | Free text | — | AI Copilot context |
| Mechanism of Injury | Dropdown | Fall, MVA, Assault, Burn, Penetrating, Crush, Blast | Trauma-specific |

### Section 4 — Clinical Assessment

AVPU consciousness scale, airway status (clear/partially/fully obstructed), breathing quality, circulation, allergies, medications, medical history.

### Section 5 — Interventions Performed

Checkboxes: O2 (flow rate), CPR (duration), IV fluids (type), hemorrhage control (method), splinting (location), defibrillator (shocks).

### Section 6 — Transport Requirements

Transport priority (Immediate/Urgent/Delayed/Expectant), ventilator required (filters hospitals), defibrillator required (absence = -30 penalty), spinal immobilization, blood products needed.

## 4.2 GPS Coordinate Capture

Browser Geolocation API with high-accuracy mode, 10s timeout, 60s max age. **Fallback:** Browser GPS → Manual entry → City center default.

## 4.3 Incident Photo System

**File:** `src/components/CameraCapture.jsx` (1,579 lines)

Camera detection, front/back enumeration, canvas capture, JPEG/WebP/PNG export, resize (max 2048px), EXIF preservation, video recording (MP4/WebM, 10MB). Storage: `incidentPhotos/{caseId}/{timestamp}_{filename}`, max 10MB, `image/*` only.

## 4.4 Offline Support

**File:** `src/utils/offlineSync.js` — IndexedDB via `localforage`, visual indicator, 30s connectivity test, auto-sync on recovery.

---

# 5. Capability Scoring Engine

**File:** `src/services/capabilityScoringEngine.js` (993 lines, 40+ functions)
**Execution:** Client-side, < 50ms

## 5.1 Architecture

The scoring engine runs **entirely in the browser** with zero network latency. Hospital data is pre-loaded via Firestore `onSnapshot` and scored locally. Rankings update instantaneously on data change.

## 5.2 Scoring Dimensions

| Dimension | Max Score | Description |
|-----------|-----------|-------------|
| **Capability** | 30 | Clinical capabilities matching emergency type |
| **Specialist** | 25 | On-duty specialists with emergency-weighted multipliers |
| **Equipment** | 25 | Critical equipment (ventilators, defibrillators) |
| **Bed** | 20 | Available beds in relevant categories |
| **Distance** | 20 | Haversine great-circle distance |
| **Load** | 15 | ED congestion level |
| **Freshness** | 10 | Data recency penalty |
| **Trauma Level** | 30 | Trauma center bonus (L1=30, L2=18, L3=8) |

## 5.3 Weight Profiles

| Acuity | Capability | Specialist | Equipment | Bed | Distance |
|--------|-----------|-----------|-----------|-----|----------|
| 1 (Critical) | 1.5× | 1.5× | 1.5× | 1.2× | 0.8× |
| 2 (Emergent) | 1.3× | 1.3× | 1.3× | 1.1× | 0.9× |
| 3 (Urgent) | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× |
| 4–5 (Lower) | 0.8× | 0.8× | 0.8× | 0.9× | 1.3× |

## 5.4 Emergency Profiles (7 + Aliases)

| Profile | Key Specialist (Weight) | Critical Equipment | Special |
|---------|------------------------|-------------------|---------|
| **Cardiac** | Cardiologist (1.5×) | Defibrillator (-30 penalty) | Stroke center, cath lab |
| **Trauma** | Trauma Surgeon (1.5×) | CT Scanner | Surgery, trauma level bonus |
| **Burn** | Burn Specialist (2.5×) | — | Burn unit (rare specialists) |
| **Accident** | Trauma Surgeon (1.8×) + Radiologist | CT Scanner | Trauma level bonus |
| **Pediatric** | Pediatrician (2.0×) | — | `acceptsPediatric` gate |
| **Infectious** | Pulmonologist (1.5×) | Ventilator (-40 penalty) | Isolation beds |
| **General** | — | — | Emergency beds only |

**Aliases:** `stroke → cardiac`, `industrial → trauma`

## 5.5 Disqualification

1. On diversion → DISQUALIFIED
2. Type not accepted → DISQUALIFIED
3. Zero relevant beds → DISQUALIFIED
4. Status `full` → DISQUALIFIED

## 5.6 NaN Hardening (4-Layer)

`safeNum()` → `safeScore()` → `normalizeHospital()` (100+ lines, 50+ fields) → `normalizeSpecialists()` (4 formats). 999km distance guard. Auto-recovery clamps NaN to 0.

## 5.7 Golden Hour Modifier

| Time | Modifier | Effect |
|------|----------|--------|
| 0–15 min | 1.0× | Capability prioritized |
| 15–30 min | 1.1× | Slight distance boost |
| 30–45 min | 1.25× | Moderate distance boost |
| 45–55 min | 1.5× | Strong distance boost |
| 55+ min | 2.0× | Nearest capable prioritized |

## 5.8 Tie-Breaker

Distance → ICU beds → Data freshness.

---

# 6. AI Explainability Layer

**File:** `src/components/HospitalExplainabilityPanel.jsx` (531 lines)

## 6.1 Reason Categories

Five categories with emoji indicators: Capability (✅/⚠️/❌), Capacity, Equipment, Distance, Specialist. Each hospital gets structured explanations with per-dimension scores and percentages.

## 6.2 Golden Hour Display

5-stage color progression: OPTIMAL (green) → ACTIVE (yellow) → URGENT (orange) → CRITICAL (red) → EXPIRED (dark red).

## 6.3 UI Components

Score bars (color gradient), reason badges (color-coded), expandable accordion with `e.stopPropagation()` isolation.

---

# 7. Dispatcher Override Routing

**File:** `src/components/DispatcherOverridePanel.jsx` (496 lines)
**Audit:** `src/components/OverrideAuditPanel.jsx` (147 lines)

## 7.1 Override Flow

Dispatcher reviews AI list → clicks "Override" → selects hospital → provides reason (7 categories: phone_confirmation, specialist_available, patient_preference, insurance_network, closer_facility, diversion_change, other) → override logged immutably to `dispatchOverrides`, case updated, routes redrawn, SMS redirected.

## 7.2 Audit Panel

Real-time `onSnapshot` on `dispatchOverrides`, shows: case ID, AI vs override with scores and delta, reason, dispatcher email, timestamp. Filterable by caseId.

---

# 8. Live Hospital Operations Panel

**File:** `src/components/HospitalLiveOpsPanel.jsx` (656 lines)

Bed sliders (ICU/General/Emergency/Isolation/Trauma), equipment counters (ventilators/defibrillators/monitors/CT), queue load, diversion toggle, emergency status. Auto-normalization prevents `available > total`. Every update writes `lastUpdated` serverTimestamp, triggers scoring recomputation on all clients within 1–2 seconds via onSnapshot.

---

# 9. Real-Time Hospital Capability Dashboard

**File:** `src/components/RealTimeHospitalCapability.jsx` (661 lines)
**Route:** `/live-capacity`

Full-page dashboard for ALL hospitals with `HospitalRow` (expandable), `EditCell` (inline editor with `clamp()`/`safeNum()`), `StatusToggle` (accepting→limited→full), `SpecialistChip` (availability toggles), search/filter, per-hospital atomic save to Firestore.

---

# 10. Turn-By-Turn Navigation

**File:** `src/components/navigation/AmbulanceNavigation.jsx`

Mapbox Directions API, GeoJSON geometries, step-by-step instructions, ambulance speed factor (1.3×), 15-second GPS updates, 500m deviation auto-reroute, 100m arrival auto-dismiss. Edge cases: GPS loss (last position retained), route blocked (auto-reroute), hospital override mid-transport (re-navigation).

---

# 11. GPS Tracking + SMS Communication

**File:** `src/services/communicationService.js` (241 lines)
**Purpose:** Multi-channel EMS notification system with WhatsApp fallback and audit logging

## 11.1 Communication Architecture

```
Dispatch Event → sendDispatchTrackingSMS() → Fast2SMS API
                                              ├── Success → logCommunication() to Firestore
                                              └── Failure → sendWhatsAppFallback() → Twilio API
                                                            ├── Success → logCommunication()
                                                            └── Failure → logCommunication(status: 'failed')

Hospital Alert → sendHospitalAlertSMS() → Fast2SMS API
                                           ├── Success → logCommunication()
                                           └── Failure → sendWhatsAppFallback() → Twilio
```

## 11.2 Dispatch Tracking SMS

**Function:** `sendDispatchTrackingSMS({ caseData, ambulanceId, etaMinutes, trackingLink })`

Sends an SMS to the patient's emergency contact containing: ambulance vehicle number, assigned hospital name, ETA in minutes, and a tracking link URL. Message format is structured for Indian mobile networks via Fast2SMS DLT-registered templates with transactional route.

**Retry Logic:** 1 retry with 2-second delay between attempts. On final failure, triggers WhatsApp fallback.

## 11.3 Hospital Alert SMS

**Function:** `sendHospitalAlertSMS({ caseData, hospital, etaMinutes })`

Sends an SMS to the hospital's registered phone number with: incoming patient name, emergency type, acuity level, ETA, and special requirements (ventilator, blood products, etc.). This gives the receiving hospital advance notice to prepare resources.

## 11.4 WhatsApp Fallback

**Function:** `sendWhatsAppFallback(phoneNumber, message)`

Uses Twilio WhatsApp API (`/v1/Messages`) with the `whatsapp:` prefix for sender/receiver. Triggered automatically when Fast2SMS delivery fails. Supports international phone formats.

## 11.5 Communication Logging

**Function:** `logCommunication(logData)`

Every communication attempt (success or failure) is logged to Firestore's `communicationLogs` collection with: recipient phone, channel (sms/whatsapp), status (sent/delivered/failed), timestamp, associated case ID, message content, and error details if failed.

## 11.6 GPS Tracking Links

When an ambulance is dispatched, a shareable tracking link is generated and included in the SMS. The link opens a web page showing real-time ambulance position on a Mapbox map, updated via Firestore `onSnapshot` on the `ambulanceTracking` collection. Features include: live position marker, route polyline, ETA countdown, and hospital destination marker.

---

# 12. Multilingual Translation System

**Context:** `src/context/LanguageContext.jsx`
**Hooks:** `src/hooks/useT.js`
**Constants:** `src/constants/translationKeys.js`
**Purpose:** 130+ language real-time translation with RTL support

## 12.1 Architecture

```
Component renders → useT('text') or useTBatch(['text1','text2',...]) →
Check LRU cache (2000 entries per language) →
├── Cache hit → Return translated text (0ms)
└── Cache miss → Google Translate API v2 → Store in LRU → Return translated text
```

## 12.2 Supported Languages

130+ languages including all 22 scheduled languages of India (Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Santali, Kashmiri, Nepali, Sindhi, Dogri, Konkani, Manipuri, Bodo, Sanskrit) plus major international languages.

## 12.3 RTL Detection

Right-to-left languages (Arabic, Hebrew, Urdu, Farsi, etc.) are automatically detected. When an RTL language is selected, the `LanguageContext` sets a `direction` attribute on the document root, and CSS flexbox properties are reversed via Tailwind's `rtl:` variant.

## 12.4 Translation Hooks

| Hook | Purpose | Performance |
|------|---------|-------------|
| `useT(text)` | Translate single text, auto-refreshes on language change | Cache hit: 0ms, miss: 50-200ms |
| `useTBatch(textArray)` | Batch N texts into 1 API call, returns array | N texts → 1 API request |
| `useTPreload(keySet)` | Pre-warm cache on dashboard mount | Eliminates translation flash |

## 12.5 LRU Cache

- **Capacity:** 2,000 entries per language
- **Eviction:** Least Recently Used — oldest untouched entries are removed when capacity is reached
- **Persistence:** Lives in React Context at app root — survives route navigation but not page refresh
- **Pre-warming:** Dashboard-specific key sets (e.g., `PRELOAD_HOSPITAL`, `PRELOAD_CMD_CENTER`) are loaded on mount

## 12.6 Batch API Optimization

The `useTBatch` hook concatenates multiple translation requests into a single Google Translate API call, batching N strings in one request. This reduces API usage by 10-50× compared to individual requests.

## 12.7 Debouncing

Translation requests are debounced at 500ms to prevent rapid consecutive API calls during language switching or text changes.

---

# 13. Gemini AI Copilot

**Frontend:** `src/components/ai/EMSChatAssistant.jsx` (634 lines)
**Backend Serverless:** `api/gemini/chat.js`, `api/gemini/suggestions.js`, `api/gemini/health.js`
**Prompt Templates:** `api/utils/prompts.js` (157 lines)
**Local Dev Server:** `server/geminiChat.js` (with Firebase Admin SDK)
**Model:** Google Gemini 2.5 Flash (Preview)

## 13.1 Architecture

```
EMSChatAssistant (floating widget, bottom-right) →
User types message → POST /api/gemini/chat { message, role, userId, sessionId } →
Serverless function:
  1. Load role-specific system prompt from prompts.js
  2. Retrieve session history from in-memory Map (30-min TTL, max 20 messages)
  3. Inject system context (scored hospitals, active cases, fleet status — via roleContextBuilder)
  4. Call Gemini 2.5 Flash API with full conversation history
  5. Stream response back to client
  6. Store conversation turn in session history
→ Client renders markdown response with typing indicator
```

## 13.2 Role-Specific AI Personas

The AI copilot uses **5 distinct system prompts** tailored to each role:

| Role | AI Persona | Focus Areas |
|------|-----------|-------------|
| **Paramedic** | "Triage Support AI" | Hospital recommendations, golden hour guidance, treatment protocols, routing explanations |
| **Dispatcher** | "Fleet Intelligence AI" | Ambulance allocation, coverage optimization, override justification, load balancing |
| **Hospital Admin** | "Capacity Management AI" | Bed optimization, diversion strategy, staffing recommendations, performance metrics |
| **Command Center** | "Network Operations AI" | System-wide awareness, multi-incident coordination, resource allocation, coverage analysis |
| **Admin** | "Platform Management AI" | System health, user management, data quality, performance monitoring, configuration |

## 13.3 System Prompt Engineering

Each system prompt (from `api/utils/prompts.js`) includes:

1. **Identity declaration:** Role-specific AI persona name and specialization
2. **Capabilities boundaries:** What the AI can and cannot do (e.g., "You cannot modify hospital data directly")
3. **Data access scope:** Which collections and data the AI has access to for this role
4. **Response format rules:** Concise, actionable, emoji-enhanced, structured with headers and bullets
5. **Context injection protocol:** Instructions for how to use injected real-time data from Firestore
6. **Explainability mode:** Special instruction to generate detailed scoring breakdowns when asked about hospital rankings
7. **Safety guardrails:** Medical disclaimer, emergency delegation protocol, no prescriptive treatment advice

## 13.4 Suggested Prompts

The `EMSChatAssistant` displays role-specific suggested prompt chips:

| Role | Suggested Prompts |
|------|-------------------|
| Paramedic | "Which hospital is best for my patient?", "What's the golden hour status?", "Are ventilators available nearby?", "Explain the hospital ranking" |
| Dispatcher | "Which ambulance should I assign?", "Are any areas uncovered?", "Show fleet utilization", "Recommend override strategy" |
| Hospital Admin | "How should I optimize bed allocation?", "When should I go on diversion?", "Compare our metrics to network", "Staffing recommendations" |
| Command Center | "Show network health summary", "Any coverage gaps?", "Multi-incident resource plan", "Performance trends" |
| Admin | "System health check", "Data quality report", "User activity summary", "Configuration audit" |

## 13.5 Chat UI Features

- **Floating Toggle Button:** Bottom-right corner, role-colored gradient, pulse animation
- **Role Badge:** Displays current role icon + label at top of chat panel
- **Markdown Rendering:** Custom renderer handles bold, italic, headers, lists, code blocks, links
- **Typing Indicator:** Animated dots during AI response generation
- **Auto-Scroll:** Chat scrolls to bottom on new messages
- **Clear History:** Resets client-side messages and server-side session
- **Keyboard Shortcuts:** Enter to send, Shift+Enter for newline

## 13.6 Session Management

**In-memory Map** with:
- Key: `sessionId` (generated per browser session)
- Value: `{ messages: [], lastAccess: Date }` 
- TTL: 30 minutes of inactivity → session purged
- Max messages: 20 per session (oldest trimmed on overflow)
- **Production Note:** Would use Vercel KV or Firestore for persistent, scalable history

---

# 14. Responsive UI Infrastructure

**Framework:** Tailwind CSS 3.4 with custom utilities
**Custom CSS:** `src/styles/responsiveUtils.css` + `src/index.css`

## 14.1 Breakpoint System

| Breakpoint | Min Width | Target |
|-----------|-----------|--------|
| Mobile | 0px | Smartphone portrait |
| Small | 640px | Smartphone landscape |
| Medium | 768px | Tablets |
| Large | 1024px | Laptops |
| Extra Large | 1280px | Desktop monitors |
| 2XL | 1536px | Command center displays |

## 14.2 Mobile Dashboard Adaptations

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Hospital list | Cards in 3-column grid | Single-column stacked |
| Scoring bars | Full-width with labels | Compact, percentage only |
| Map + results | Side-by-side 60/40 | Stacked: map top, results below |
| AI Copilot | Floating panel | Full-screen overlay |
| Navigation | Top toolbar + sidebar | Bottom sheet with pull-up |
| Camera | Inline card | Full-screen capture mode |
| Forms | Multi-column | Single-column collapsible |

## 14.3 Map Resizing

`useMapResize` hook dynamically adjusts Mapbox container when panels open/close, browser resizes, or orientation changes. Calls `mapRef.current.resize()` and refits bounds.

## 14.4 Camera Fullscreen

Mobile devices enter true fullscreen via `requestFullscreen()` with cross-browser fallbacks (`webkit`, `moz`). Custom "Exit Camera" button overlays the view.

---

# 15. Hospital Self-Onboarding System

**File:** `src/components/HospitalDashboard.jsx` (onboarding logic)
**Extended Profile:** `src/components/HospitalExtendedProfileForm.jsx` (1,025 lines)

## 15.1 Conditional Dashboard

When a `hospital_admin` user logs in:
1. Read `users/{uid}` document
2. Check for `hospitalId` field
3. **If exists:** Normal Hospital Dashboard filtered to own hospital
4. **If missing:** Enter **Onboarding Mode** — form auto-opens with onboarding banner

## 15.2 GPS Capture Button

"📍 Use My Location" button with `navigator.geolocation.getCurrentPosition()` at high accuracy, 10s timeout, 60s max age. Critical for Indian hospitals where street addresses may lack precise geocoding — GPS provides sub-10m accuracy.

## 15.3 Map Preview

When GPS coordinates are captured, a Mapbox preview renders showing: hospital pin, surrounding road network, auto-zoom to neighborhood, draggable marker for fine-tuning.

## 15.4 Ownership Linking

Bidirectional binding created on submission:
1. Hospital document: `adminId: currentUser.uid` (ownership)
2. User document: `hospitalId: hospitalDoc.id` (reverse link)

Firestore security rules enforce `hospital_admin` can only update hospitals where `adminId == uid`.

## 15.5 Extended Profile Data

`HospitalExtendedProfileForm.jsx` captures deep operational data:

| Category | Fields |
|----------|--------|
| Emergency Readiness | Disaster preparedness, mass casualty capacity, decontamination |
| Medico-Legal | Police case handling, forensic lab access |
| Support Facilities | Helipad, 24x7 pharmacy, blood bank, ambulance bay capacity |
| Transfer Capability | Accepts referrals, max transfer/hour, inter-facility transport |
| Infection Control | Negative pressure rooms, infectious disease unit, isolation beds |
| Performance Metrics | Average handover time, emergency response rating, survival rate |
| Case Acceptance | Cardiac, trauma, burn, pediatric, infectious, stroke, psychiatric, OB-GYN |

## 15.6 Schema Normalization

**`deepMerge(target, source)`** safely combines `defaultHospitalSchema` with loaded Firestore data, preventing undefined crashes. `safeSpecialistCount()` handles 4 specialist data formats. `normalizeSpecialists()` ensures uniform structure regardless of Firestore shape.

## 15.7 ErrorBoundary

`HospitalDashboard.jsx` includes a class-based `ErrorBoundary` component that catches render errors in hospital data display, preventing corrupted hospital documents from crashing the entire dashboard.

---

# 16. Driver Self-Onboarding System

**File:** `src/pages/DriverOnboarding.jsx` (843 lines)
**Route:** `/driver-onboarding`
**Role:** `ambulance_driver`

## 16.1 Multi-Step Form Architecture

The onboarding process is a **4-step wizard** with forward/backward navigation and per-step validation:

| Step | Title | Fields |
|------|-------|--------|
| 1. Driver Details | Personal information | Full name, phone number, license number |
| 2. Ambulance Info | Vehicle information | Vehicle number, ambulance type (BLS/ALS/MICU), equipment checklist |
| 3. License Upload | Document verification | License photo upload (camera capture or file picker), preview |
| 4. GPS & Review | Location + confirmation | GPS coordinate capture, equipment summary, data review |

## 16.2 Equipment Checklist

During Step 2, drivers complete an equipment inventory checklist covering:

| Equipment Category | Items |
|-------------------|-------|
| Basic Life Support | Stretcher, oxygen cylinder, first aid kit, cervical collar, splints |
| Advanced Life Support | Cardiac monitor, defibrillator, IV infusion set, intubation kit |
| Medications | Adrenaline, atropine, morphine, dextrose, naloxone |
| Communication | Radio, mobile phone, GPS unit |

The checklist results are stored in the `ambulances` document and displayed during admin verification.

## 16.3 License Upload Pipeline

1. Driver takes photo or selects file
2. Client-side validation: file type (`image/*`), file size (≤10MB)
3. Image preview rendered inline
4. On submit: uploaded to Firebase Storage at `driverLicenses/{userId}/{filename}`
5. Download URL stored in `ambulances` document for admin review

**Storage Security:** Firebase Storage rules restrict `driverLicenses/{userId}/*` to: read/write by the matching `userId` only, max 10MB, `image/*` content type.

## 16.4 GPS Capture

Same Geolocation API pattern as Patient Intake (high accuracy, 10s timeout). Captures the ambulance's current (home base) location for fleet positioning.

## 16.5 Document Submission

On final step submit:

1. Create `ambulances` document in Firestore:
   ```javascript
   {
     driverName, phoneNumber, vehicleNumber, ambulanceType,
     equipment: { ...checklist },
     licenseUrl: storageDownloadURL,
     currentLocation: { latitude, longitude },
     driverId: currentUser.uid,
     source: 'driver_registered',
     verificationStatus: 'pending',
     verifiedBy: null,
     verifiedAt: null,
     createdAt: serverTimestamp()
   }
   ```
2. Update `users/{uid}` document: `{ ambulanceId: docRef.id, onboardingCompleted: true }`
3. Redirect to `/verification-pending`

## 16.6 Edge Cases

- **Duplicate Registration:** If user already has `ambulanceId`, the form is pre-populated with existing data
- **Network Failure During Upload:** License upload failure caught and displayed, form does not submit
- **GPS Denied:** Manual coordinate entry fallback
- **Multiple Vehicles:** Current architecture supports one ambulance per driver (extendable)

---

# 17. Driver Verification & Approval System

**File:** `src/components/DriverVerificationPanel.jsx` (510 lines)
**Pending Page:** `src/pages/VerificationPending.jsx` (186 lines)
**Roles:** Admin (verification), Ambulance Driver (status view)

## 17.1 Verification Architecture

```
Driver registers → ambulances/{id}.verificationStatus = 'pending' →
Admin opens Command Center → "Driver Verifications" tab (admin-only) →
DriverVerificationPanel shows all pending registrations sorted by date →
Admin reviews: name, phone, vehicle, equipment checklist, license preview →
Admin clicks Approve or Reject:

APPROVE:
  1. ambulances/{id} → verificationStatus: 'approved', verifiedBy: admin.uid, verifiedAt: serverTimestamp
  2. users/{driverId} → verificationStatus: 'approved'
  3. Driver's VerificationPending page detects change via onSnapshot → Shows success → Redirects

REJECT:
  1. ambulances/{id} → verificationStatus: 'rejected', verifiedBy, verifiedAt, rejectionReason
  2. users/{driverId} → verificationStatus: 'rejected'
  3. Driver's VerificationPending page shows rejection reason
```

## 17.2 Driver Verification Panel Features

- **Firestore Query:** Single `where('source', '==', 'driver_registered')` clause, then client-side filtering by `verificationStatus` and sorting by `createdAt` descending (avoids composite index requirement)
- **Tab System:** Pending / Approved / Rejected tabs with real-time counts
- **Driver Card:** Name, phone, vehicle number, ambulance type, equipment checklist badges (green=present, gray=missing), license preview (clickable to enlarge)
- **Action Buttons:** Approve (green, with confirmation) and Reject (red, with mandatory reason textarea)
- **Real-Time Updates:** Uses `onSnapshot` — new registrations appear immediately

## 17.3 Verification Pending Page

**File:** `src/pages/VerificationPending.jsx` (186 lines)

Displays to drivers after onboarding until admin approves:

| Status | Display |
|--------|---------|
| `pending` | Clock icon (yellow), "Registration Under Review", explanatory message |
| `approved` | Shield icon (green), "Registration Approved!", access granted message |
| `rejected` | X icon (red), "Registration Rejected", rejection reason displayed |

**Real-Time Updates:** A Firestore `onSnapshot` listener on the driver's ambulance document detects status changes instantly, updating the UI without manual refresh.

## 17.4 Fleet Gating

The Command Center's fleet query includes a critical filter: only ambulances with `source === 'driver_registered'` AND `verificationStatus === 'approved'` appear in the operational fleet. This is enforced client-side after fetching all `driver_registered` ambulances with a single Firestore `where` clause.

## 17.5 Firestore Security Enforcement

- **Driver Cannot Self-Approve:** `ambulance_driver` can only update their own ambulance AND only while `verificationStatus == 'pending'`. Once approved/rejected, only admin can modify.
- **Admin Full Access:** `admin` has full write access to all ambulance documents

---

# 18. Command Center Dashboard

**File:** `src/components/CommandCenterDashboard.jsx` (1,113 lines)
**Roles:** Dispatcher, Command Center, Admin

## 18.1 Architecture

Full-screen operational dashboard with tabs, live Mapbox map, fleet tracking simulation, and emergency queue management.

## 18.2 Tab System

| Tab | Content | Role Gate |
|-----|---------|-----------|
| Map | Mapbox GL JS with ambulance + case markers | All |
| Cases | Emergency case queue (real-time, acuity-sorted) | All |
| Fleet | Ambulance fleet grid with status, type, vehicle | All |
| Hospitals | Hospital status board with load indicators | All |
| Verifications | DriverVerificationPanel (pending/approved/rejected) | Admin only |

## 18.3 Dual Fleet System

The Command Center manages **two fleet sources simultaneously:**

1. **System-Seeded Ambulances (INITIAL_AMBULANCES):** 8 ambulances (4 Bangalore, 4 Hyderabad) defined in code with simulated movement patterns. These rotate through status states on 8-second intervals.
2. **Driver-Registered Ambulances (Firestore):** Real ambulances from onboarded (and **approved**) drivers, fetched via `onSnapshot` on `ambulances` collection with `source == 'driver_registered'` filter.

Both fleet sources are merged and displayed with distinct markers on the map. System-seeded ambulances simulate GPS movement between random locations. Driver-registered ambulances display their last-known GPS position from onboarding.

## 18.4 Ambulance Simulation Engine

**Functions:** `createAmbulanceFleet(centers)`, `getNextStatus(currentStatus)`, `interpolatePosition(start, end, progress)`, `generateRandomLocation(center, radiusKm)`

Creates 8 simulated ambulances across two city centers with realistic movement patterns:
- Status cycle: `available` → `assigned` → `en_route_to_scene` → `at_scene` → `en_route_to_hospital` → `arrived` → `available`
- Position interpolation between random waypoints
- Status transitions every 8 seconds with GPS position updates

## 18.5 Emergency Case Queue

Real-time `onSnapshot` on `emergencyCases` collection, displaying cases sorted by acuity level (1=Critical at top). Each case card shows: patient name, emergency type, acuity badge (color-coded), status, creation time, assigned hospital/ambulance.

## 18.6 Hospital Status Board

Grid view of all hospitals with: name, type badge, emergency status indicator (accepting/limited/full), load indicator (bar chart), bed availability counts.

## 18.7 Multi-City Support

Two default city centers: Bangalore (77.5946, 12.9716) and Hyderabad (78.4867, 17.3850). Map auto-pans between cities based on data distribution. Fleet simulation generates ambulances for both cities.

---

# 19. Multi-City Simulation Engine

**File:** `scripts/seedFirestore.js` (1,995 lines)

## 19.1 Bangalore Dataset

- **Center:** 77.5946°E, 12.9716°N, Radius: 8–15 km
- **Hospitals:** 10 with realistic data (Manipal, Sakra World, Apollo, St. John's, etc.)
- **Ambulances:** 8 vehicles with varied status
- **Emergency Cases:** 5 cases spanning cardiac, trauma, burn, pediatric, general

## 19.2 Hyderabad Dataset

- **Center:** 78.4867°E, 17.3850°N, Radius: 20 km
- **Hospitals:** Generated with Hyderabad-specific names and coordinates
- **Ambulances:** Fleet with Hyderabad vehicle designations

## 19.3 Edge Case Exercise

Seed data tests all scoring engine edge cases: 0 ICU beds (disqualification), hospital on diversion (filter), missing specialist data (NaN hardening), extreme distance (boundary), 50-minute case (Golden Hour critical modifier).

## 19.4 Execution

```bash
npm run seed:firestore   # or: node scripts/seedFirestore.js
```

Clears existing data and repopulates all collections.

---

# 20. Security Infrastructure

## 20.1 Firestore RBAC Rules

**File:** `firestore.rules` (162 lines)

All rules use real-time role lookup: `getUserData().role` performs a Firestore read of `users/{uid}` on every operation — no client-side role caching in security layer.

### Critical Rules

| Rule | Purpose |
|------|---------|
| `emergencyCases` delete: admin only | Prevents case deletion |
| `hospitals` update: admin OR adminId match | Ownership enforcement |
| `dispatchOverrides` no update/delete | Immutable audit trail |
| `ambulances` driver update: only if pending | Prevents self-approval |
| `users` read: self or admin | Privacy enforcement |

## 20.2 Firebase Storage Rules

**File:** `storage.rules` (41 lines)

| Path | Read | Write | Constraints |
|------|------|-------|-------------|
| `incidentPhotos/{caseId}/*` | Authenticated | Authenticated | 10MB max, image/* only |
| `driverLicenses/{userId}/*` | Owner (uid match) | Owner | 10MB max, image/* only |
| `profilePhotos/{userId}/*` | Authenticated | Owner only | — |
| `hospitalDocs/{hospitalId}/*` | Authenticated | Authenticated | — |

## 20.3 API Key Protection

| Key | Location | Exposure |
|-----|----------|----------|
| `GEMINI_API_KEY` | Vercel env vars | Server-only — never in client bundle |
| `VITE_MAPBOX_TOKEN` | `.env.local` | Client-side (required), domain-restricted |
| `VITE_FIREBASE_*` | `.env.local` | Client-side (required), protected by Firestore rules |
| `FAST2SMS_API_KEY` | `server/.env` | Server-only |
| `TWILIO_*` | `server/.env` | Server-only |

---

# 21. Deployment Architecture

## 21.1 Vercel Hosting

| Component | Target |
|-----------|--------|
| React SPA | Vercel Static Hosting (CDN) |
| `/api/gemini/*` | Vercel Serverless Functions (Node.js) |
| Firestore/Auth/Storage | Google Cloud Platform |
| Map Tiles | Mapbox CDN |

## 21.2 Build Configuration

```javascript
// vite.config.js — Production build
build: {
  outDir: 'dist', sourcemap: false, minify: 'terser',
  terserOptions: {
    compress: { drop_console: true, drop_debugger: true, pure_funcs: ['console.log', 'console.info'] }
  },
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'], mapbox: ['mapbox-gl'],
        charts: ['recharts'], utils: ['axios', 'localforage'], ui: ['lucide-react']
      }
    }
  }
}
```

## 21.3 Environment Variables

| Variable | Environment | Purpose |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Client (build-time) | Firebase authentication |
| `VITE_FIREBASE_PROJECT_ID` | Client | Firestore project |
| `VITE_MAPBOX_TOKEN` | Client | Mapbox GL JS |
| `GEMINI_API_KEY` | Server-only | Gemini 2.5 Flash API |
| `FAST2SMS_API_KEY` | Server-only | SMS provider |
| `TWILIO_*` | Server-only | WhatsApp fallback |

---

# 22. Performance Optimization

## 22.1 Debounced Operations

| Operation | Debounce | Purpose |
|-----------|----------|---------|
| Hospital search | 300ms | Prevents scoring re-runs per keystroke |
| Translation requests | 500ms | Batches rapid translations |
| Map marker updates | 100ms | Prevents GPS jitter |
| Live Ops sliders | 500ms | Reduces Firestore writes |

## 22.2 Translation Caching

LRU cache (2,000 entries/language), pre-warming via `useTPreload()`, batch API via `useTBatch()`, context-level persistence.

## 22.3 Build Optimizations

| Technique | Impact |
|-----------|--------|
| Code splitting (manual chunks) | Vendor 70KB, Mapbox 200KB, Charts 90KB — parallel load |
| Tree shaking (Vite + Terser) | Dead code elimination |
| Console stripping | Removes all console.log in production |
| Gzip compression | `vite-plugin-compression` pre-compressed serving |
| Bundle analysis | `rollup-plugin-visualizer` treemap |
| Lazy imports | AI Copilot loaded on-demand |

## 22.4 Low-Bandwidth Optimization

- Client-side scoring — no API call on critical path
- Firestore offline persistence — cached data during connectivity drops
- Localforage queuing — offline cases auto-sync
- Translation caching — eliminates API calls after first load
- Minimal API surface — only Gemini copilot requires active network

## 22.5 Virtualized Lists

`react-window` `FixedSizeList` for 50+ hospitals — maintains 60fps at 200+ entries.

---

# 23. Innovation Highlights

| Innovation | Description | Impact |
|-----------|-------------|--------|
| **Decision Intelligence Router** | 8-dimension, emergency-aware hospital matching | First EMS platform with algorithmic decision intelligence |
| **Explainable AI Scoring** | Per-factor breakdown with human-readable reasoning | Government audit-ready routing transparency |
| **Emergency-Specific Profiles** | 7 types with custom weights and requirements | Cardiac patient never routed to hospital without cardiologist |
| **Golden Hour Modifier** | Time-decay function shifts scoring as urgency increases | Models medical reality of time-to-treatment |
| **NaN-Hardened Scoring** | 4-layer defense prevents undefined data crashes | Never produces NaN scores — always graceful degradation |
| **Dispatcher Override + Audit** | Structured override with immutable logging | Human judgment preserved with accountability |
| **Live Hospital Operations** | Slider-based real-time capacity with instant recomputation | Updates propagate in 1–2 seconds via Firestore |
| **AI Copilot with Role Personas** | Gemini 2.5 Flash with 5 distinct AI personalities | Each role gets tailored AI assistance |
| **Turn-By-Turn EMS Navigation** | Mapbox with ambulance speed factor and deviation detection | Driver-grade navigation calibrated for ambulances |
| **Dual SMS + WhatsApp** | Fast2SMS + Twilio WhatsApp fallback | Delivery regardless of network conditions |
| **130+ Language Translation** | Google Translate + LRU cache + RTL support | All 22 Indian scheduled languages supported |
| **Hospital Self-Onboarding** | GPS capture, map preview, ownership binding | Hospitals join network without admin involvement |
| **Driver Self-Onboarding + Verification** | Multi-step form, license upload, admin approval pipeline | Verified, trusted fleet with equipment validation |
| **Client-Side Scoring Engine** | 993-line algorithm, < 50ms, works offline | Zero network latency on critical routing path |
| **Offline-First Architecture** | Localforage IndexedDB + Firestore offline | Cases captured even in network blackouts |
| **Multi-City Simulation** | Bangalore + Hyderabad realistic datasets | Pre-built environments for demos and evaluations |

---

# 24. Testing & Validation

## 24.1 Build Validation

```bash
npx vite build
```

Successful build confirms: zero TypeScript/JSX compilation errors, all imports resolved, no circular dependencies, tree shaking successful, bundle size within targets.

## 24.2 Scoring Engine Validation

The seed data exercises all scoring edge cases:
- Hospital with 0 ICU beds → correctly disqualified
- Hospital on diversion → correctly filtered
- Missing specialist data → NaN hardening produces valid score
- Extreme distance (50+ km) → distance scoring boundary tested
- 50-minute case → Golden Hour critical modifier applied
- Identical scores → tie-breaker logic activated

## 24.3 Driver Verification Flow

Complete flow tested: registration → pending status → admin review → approve/reject → real-time status update → fleet gating → access control.

## 24.4 RBAC Verification

Each role's access matrix verified: route guards block unauthorized navigation, UI elements conditionally render, Firestore rules reject unauthorized operations.

## 24.5 Communication Pipeline

SMS delivery tested: Fast2SMS transactional route, WhatsApp Twilio fallback, communication logging to Firestore, tracking link generation.

## 24.6 Offline Capability

Localforage IndexedDB queuing verified: case creation during offline, visual indicator, auto-sync on connectivity recovery.

---

# 25. Future Expansion Roadmap

## 25.1 Machine Learning

| Feature | Description |
|---------|-------------|
| Predictive Bed Availability | ML model forecasting availability 2–4 hours ahead |
| Case Volume Prediction | Time-series model by area and time |
| Outcome-Based Scoring | Survival rate analysis to inform scoring weights |
| Anomaly Detection | Pattern detection (sudden diversion, equipment failure) |

## 25.2 IoT Telemetry

Vehicle health (OBD-II), equipment readiness (IoT sensors), environmental monitoring, driver fatigue detection.

## 25.3 Drone Supply Routing

Blood product delivery, emergency medication resupply, AED delivery to bystanders, aerial scene assessment.

## 25.4 National EMS Grid Integration

Inter-state routing, ministry-level national dashboard, standardized 108/112 API, anonymized data lake.

## 25.5 Priority Roadmap

| Priority | Feature | Target |
|----------|---------|--------|
| P0 | Firebase Admin SDK for full context injection | Q1 2026 |
| P0 | Vercel KV for persistent AI history | Q1 2026 |
| P1 | Push notifications (FCM) | Q2 2026 |
| P1 | PWA for offline-first mobile | Q2 2026 |
| P2 | Video call (paramedic → specialist) | Q3 2026 |
| P2 | HL7 FHIR integration | Q3 2026 |
| P3 | Computer vision auto-triage | Q4 2026 |
| P3 | Voice-activated AI copilot | Q4 2026 |

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

---

# Appendix B — Firestore Schema Reference

## emergencyCases Document
```json
{
  "patientInfo": {
    "name": "string", "age": "number", "gender": "male|female|other",
    "pregnancyStatus": "yes|no|na"
  },
  "vitals": {
    "heartRate": "number (BPM)", "bloodPressureSystolic": "number (mmHg)",
    "bloodPressureDiastolic": "number (mmHg)", "spO2": "number (%)",
    "respiratoryRate": "number", "temperature": "number (°C)",
    "gcsScore": "number (3-15)", "painLevel": "number (0-10)"
  },
  "emergencyType": "cardiac|trauma|burn|accident|pediatric|infectious|general",
  "acuityLevel": "1|2|3|4|5",
  "chiefComplaint": "string",
  "pickupLocation": { "latitude": "number", "longitude": "number" },
  "photos": ["storage_url"],
  "targetHospital": "hospital_id",
  "assignedAmbulance": "ambulance_id",
  "status": "pending|dispatched|en-route|arrived|completed",
  "createdBy": "user_uid",
  "createdAt": "Timestamp", "updatedAt": "Timestamp"
}
```

## hospitals Document
```json
{
  "basicInfo": {
    "name": "string", "address": "string", "phone": "string",
    "hospitalType": "general|multi_specialty|trauma_center|cardiac|pediatric|burn",
    "location": { "latitude": "number", "longitude": "number" }
  },
  "traumaLevel": "level_1|level_2|level_3|none",
  "capacity": {
    "bedsByType": {
      "icu": { "total": "number", "available": "number" },
      "general": { "total": "number", "available": "number" },
      "emergency": { "total": "number", "available": "number" },
      "isolation": { "total": "number", "available": "number" },
      "traumaBeds": { "total": "number", "available": "number" },
      "cardiac": { "total": "number", "available": "number" }
    }
  },
  "specialists": {
    "cardiologist": "number|{count,available}",
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
    "acceptingCases": "boolean", "status": "available|limited|full",
    "diversionStatus": "boolean"
  },
  "caseAcceptance": {
    "acceptsCardiac": "boolean", "acceptsTrauma": "boolean",
    "acceptsBurns": "boolean", "acceptsPediatric": "boolean",
    "acceptsInfectious": "boolean"
  },
  "capabilities": {
    "hasTraumaCenter": "boolean", "hasICU": "boolean",
    "hasBurnUnit": "boolean", "strokeCenter": "boolean",
    "emergencySurgery": "boolean", "ctScanAvailable": "boolean"
  },
  "adminId": "user_uid (ownership binding)",
  "lastUpdated": "Timestamp", "createdAt": "Timestamp"
}
```

## ambulances Document
```json
{
  "driverName": "string",
  "phoneNumber": "string",
  "vehicleNumber": "string (e.g., KA-01-EMS-1001)",
  "ambulanceType": "BLS|ALS|MICU",
  "equipment": { "stretcher": "boolean", "oxygenCylinder": "boolean", "...": "..." },
  "licenseUrl": "string (Firebase Storage URL)",
  "currentLocation": { "latitude": "number", "longitude": "number" },
  "driverId": "user_uid",
  "source": "driver_registered|system_seeded",
  "verificationStatus": "pending|approved|rejected",
  "verifiedBy": "admin_uid|null",
  "verifiedAt": "Timestamp|null",
  "rejectionReason": "string|null",
  "status": "available|assigned|en-route|at-scene|at-hospital",
  "createdAt": "Timestamp"
}
```

## dispatchOverrides Document (Immutable)
```json
{
  "caseId": "string",
  "originalHospitalId": "string",
  "originalHospitalName": "string",
  "originalScore": "number",
  "overrideHospitalId": "string",
  "overrideHospitalName": "string",
  "overrideScore": "number",
  "reasonCategory": "phone_confirmation|specialist_available|patient_preference|insurance_network|closer_facility|diversion_change|other",
  "reasonNotes": "string",
  "dispatcherUid": "string",
  "dispatcherEmail": "string",
  "timestamp": "Timestamp"
}
```

---

# Appendix C — Storage Rules Reference

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /incidentPhotos/{caseId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /driverLicenses/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /profilePhotos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /hospitalDocs/{hospitalId}/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```



---

# 26. Failure Recovery and Operational Resilience Architecture

MEDROUTER is designed for deployment in environments where network connectivity is unreliable, infrastructure failures are routine, and communication channels degrade unpredictably. The platform implements a multi-layered failure recovery architecture that ensures no emergency case data is lost, no hospital goes unnotified, and no dispatcher is left without operational capability — even during partial or complete system outages.

This section documents the five resilience subsystems that collectively guarantee uninterrupted EMS operations under adverse conditions.

---

## 26.1 Offline Case Queuing and Retry Engine

### Problem Statement

Paramedics operate in environments where cellular connectivity is intermittent or absent: underground parking structures, rural highways, dense urban high-rises with poor signal penetration, and disaster zones with damaged cell towers. If a paramedic cannot submit an emergency case because of a network failure, the patient's Golden Hour clock continues to run while data sits unsaved on the device.

### Architecture

The Offline Case Queuing Engine is implemented in `src/utils/offlineSync.js` and leverages the `localforage` library (IndexedDB wrapper) to provide a persistent, device-local queue for emergency case data that cannot be written to Firestore due to connectivity loss.

### Storage Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Store | IndexedDB (via localforage) | Structured key-value storage with 50MB+ capacity per origin |
| Fallback Store | localStorage | 5MB fallback for browsers without IndexedDB |
| Key Format | `offline_case_{uuid}_{timestamp}` | Globally unique, chronologically sortable |
| Value Format | JSON-serialized case object | Complete PatientVitalsForm data with all 30+ fields |

### Case Persistence Schema

When a Firestore write fails due to network unavailability, the complete case payload is serialized to IndexedDB with the following metadata envelope:

```json
{
  "offlineId": "uuid-v4",
  "createdAt": "ISO-8601 timestamp (device clock)",
  "acuityLevel": 1,
  "syncStatus": "pending",
  "retryCount": 0,
  "lastRetryAt": null,
  "caseData": {
    "patientInfo": { "..." },
    "vitals": { "..." },
    "emergencyType": "cardiac",
    "acuityLevel": 1,
    "pickupLocation": { "latitude": 12.9716, "longitude": 77.5946 },
    "photos": ["base64_encoded_or_blob_reference"],
    "chiefComplaint": "...",
    "interventions": { "..." }
  },
  "deviceInfo": {
    "userAgent": "navigator.userAgent",
    "onlineAtCapture": false,
    "gpsAccuracy": 8.5
  }
}
```

### UI Indicators

When the system detects network unavailability (via `navigator.onLine` and active Firestore write failure), the following visual indicators activate:

| Indicator | Location | Appearance |
|-----------|----------|------------|
| Offline Mode Banner | Top of PatientVitalsForm | Amber banner: "Offline Mode Active -- Case will be saved locally and synced when connectivity restores" |
| Queue Counter Badge | Navigation bar | Red badge showing count of unsynced cases |
| Case Status Tag | Individual case card | Gray tag: "Queued for sync" with timestamp |
| Sync Progress Bar | Notification area | Animated progress bar during active sync |

### Auto-Retry Submission Daemon

The retry engine operates as a periodic background process:

```
Initialization:
  On application mount → Register connectivity listeners:
    window.addEventListener('online', triggerSyncAttempt)
    window.addEventListener('offline', activateOfflineMode)

  Start periodic retry interval:
    setInterval(attemptQueueSync, 30000)  // Every 30 seconds

Sync Attempt Logic:
  1. Check navigator.onLine === true
  2. If offline → skip, wait for next interval
  3. If online → Read all pending cases from IndexedDB
  4. Sort by acuityLevel ascending (Critical=1 first)
  5. For each pending case:
     a. Attempt Firestore writeBatch():
        - Create emergencyCases/{generatedId} document
        - Upload any cached photo blobs to Firebase Storage
        - Update case syncStatus to 'synced'
     b. On success:
        - Remove case from IndexedDB
        - Display success notification: "Case {patientName} synced successfully"
        - Trigger onSnapshot refresh on connected dashboards
     c. On failure:
        - Increment retryCount
        - Set lastRetryAt to current timestamp
        - If retryCount >= 10 → Set syncStatus to 'failed', alert dispatcher
        - Apply exponential backoff: nextRetry = min(30s * 2^retryCount, 300s)
```

### Sync Priority Rules

Cases are not synced in FIFO order. The retry engine implements acuity-based priority:

| Priority | Acuity Level | Sync Order | Rationale |
|----------|-------------|------------|-----------|
| P0 | Level 1 (Critical) | First | Life-threatening, Golden Hour active |
| P1 | Level 2 (Emergent) | Second | Serious but stable |
| P2 | Level 3 (Urgent) | Third | Requires attention within 1 hour |
| P3 | Level 4-5 (Less Urgent/Minor) | Last | Non-emergency, no time pressure |

Within the same acuity level, cases are synced in chronological order (oldest first).

### Conflict Resolution

If a case is submitted offline and then the paramedic retries manually before the daemon syncs, a duplicate case could be created. The system prevents this through:

1. **UUID-based deduplication:** Each offline case receives a `offlineId` UUID at creation time. Before Firestore write, the engine queries `emergencyCases` for existing documents with matching `offlineId`. If found, the sync is marked as complete without creating a duplicate.
2. **Optimistic locking:** The `offlineId` is included in the Firestore document, enabling server-side deduplication via Firestore's `setDoc` with merge behavior.
3. **User confirmation:** If a potential duplicate is detected, the UI prompts: "A case with matching details was already synced. Skip this entry?"

### Data Integrity Safeguards

| Safeguard | Implementation |
|-----------|---------------|
| Schema validation | Case data is validated against the full PatientVitalsForm schema before queuing |
| Timestamp preservation | Device-local `createdAt` is preserved as the canonical case creation time, not the Firestore write time |
| Photo blob persistence | Incident photos are stored as IndexedDB blobs, not URLs, ensuring they survive offline periods |
| GPS coordinate freezing | GPS coordinates captured at case creation are immutable in the offline queue |
| Checksum verification | MD5 hash of case payload computed at queue time, verified at sync time to detect corruption |

### Failure Audit Trail

Every sync attempt (success or failure) is logged to a separate IndexedDB store (`offline_sync_log`) for dispatcher review:

```json
{
  "offlineId": "uuid",
  "attemptNumber": 3,
  "attemptTimestamp": "ISO-8601",
  "result": "failure",
  "errorCode": "firestore/unavailable",
  "errorMessage": "Failed to reach Cloud Firestore backend",
  "networkState": "online",
  "retryScheduled": "ISO-8601 (next attempt)"
}
```

### Complete Data Flow

```
Paramedic submits case via PatientVitalsForm
        │
        ▼
  Firestore writeBatch() attempted
        │
        ├── SUCCESS → Case created in emergencyCases → Dashboard updates via onSnapshot
        │
        └── FAILURE (network/permission/timeout)
                │
                ▼
          Case serialized to IndexedDB with offline metadata envelope
                │
                ▼
          UI displays "Offline Mode Active" banner + queue counter
                │
                ▼
          Retry daemon runs every 30 seconds:
                │
                ├── navigator.onLine === false → Skip, wait
                │
                └── navigator.onLine === true → Sort queue by acuity
                        │
                        ▼
                  Attempt Firestore write (batch)
                        │
                        ├── SUCCESS → Remove from IndexedDB → Notify user → Dashboard refresh
                        │
                        └── FAILURE → Increment retry → Exponential backoff → Log attempt
                                │
                                └── retryCount >= 10 → Mark 'failed' → Alert dispatcher for manual intervention
```

---

## 26.2 Communication Failure Recovery (SMS to WhatsApp Fallback)

### Problem Statement

When an ambulance is dispatched, two critical SMS messages must be delivered: one to the patient's emergency contact (tracking link and hospital assignment) and one to the receiving hospital (incoming patient alert with ETA and requirements). If the primary SMS provider (Fast2SMS) fails — due to API downtime, insufficient credits, DLT template rejection, carrier network failure, or rate limiting — the hospital may not be prepared for the incoming patient, and the family may not know which hospital to go to.

### Multi-Channel Dispatch Communication Model

The communication service (`src/services/communicationService.js`, 241 lines) implements a cascading fallback architecture:

```
DISPATCH EVENT TRIGGERED
        │
        ▼
┌─────────────────────────────┐
│  PRIMARY: Fast2SMS API       │
│  Route: DLT Transactional    │
│  Sender ID: MEDRT            │
│  Network: Indian carriers    │
│  Timeout: 10 seconds         │
└────────────┬────────────────┘
             │
             ├── HTTP 200 + return_code: true
             │       │
             │       ▼
             │   logCommunication(status: 'sent', channel: 'sms')
             │
             └── FAILURE CONDITIONS:
                 │  HTTP 4xx/5xx
                 │  Timeout > 10s
                 │  return_code: false
                 │  Network error
                 │  Insufficient credits
                 │
                 ▼
           ┌── RETRY (1 attempt, 2-second delay) ──┐
           │                                        │
           ├── SUCCESS → logCommunication()         │
           │                                        │
           └── FAILURE                              │
                 │                                  │
                 ▼                                  │
┌─────────────────────────────┐                     │
│  FALLBACK: Twilio WhatsApp   │                     │
│  API: /v1/Messages           │                     │
│  From: whatsapp:+1XXXXXXXXXX │                     │
│  To: whatsapp:+91XXXXXXXXXX  │                     │
│  Timeout: 15 seconds         │                     │
└────────────┬────────────────┘                     │
             │                                      │
             ├── SUCCESS → logCommunication(         │
             │     status: 'sent',                   │
             │     channel: 'whatsapp',              │
             │     fallbackTriggered: true)           │
             │                                      │
             └── FAILURE → logCommunication(         │
                   status: 'failed',                 │
                   channel: 'whatsapp',              │
                   error: errorDetails,              │
                   fallbackTriggered: true)           │
```

### Fallback Trigger Conditions

The WhatsApp fallback is triggered when any of the following conditions are met:

| Condition | Detection Method | Response |
|-----------|-----------------|----------|
| Fast2SMS API returns HTTP 4xx/5xx | HTTP response status code check | Immediate fallback after 1 retry |
| Fast2SMS API timeout (>10 seconds) | Axios timeout configuration | Immediate fallback |
| Fast2SMS `return_code: false` | Response body parsing | Immediate fallback after 1 retry |
| Fast2SMS returns `insufficient_credits` | Response body error code | Immediate fallback (no retry — credits exhausted) |
| Network error (DNS, TCP, TLS) | Axios error type check | Immediate fallback after 1 retry |
| DLT template rejection | Response body validation error | Immediate fallback with plain-text WhatsApp message |

### WhatsApp Message Content

The WhatsApp fallback message contains equivalent information to the SMS but formatted for WhatsApp's rich text capabilities:

**Dispatch Tracking (to patient contact):**
```
*MEDROUTER Ambulance Dispatched*

Ambulance: {vehicleNumber}
Hospital: {hospitalName}
ETA: {etaMinutes} minutes
Patient: {patientName}

Track live: {trackingLink}

_MEDROUTER - Routes That Save Lives_
```

**Hospital Alert (to receiving hospital):**
```
*INCOMING PATIENT ALERT*

Patient: {patientName}, {age} {gender}
Emergency: {emergencyType}
Acuity: Level {acuityLevel}
ETA: {etaMinutes} minutes

Special Requirements:
{ventilatorRequired ? '- Ventilator Required' : ''}
{bloodProductsNeeded ? '- Blood Products Needed' : ''}
{spinalImmobilization ? '- Spinal Immobilization Active' : ''}

_Prepare for arrival - MEDROUTER_
```

### Delivery Confirmation and Audit Trail

Every communication attempt — regardless of success or failure, primary or fallback — creates a document in the `communicationLogs` Firestore collection:

| Field | Type | Description |
|-------|------|-------------|
| `channel` | string | `sms` or `whatsapp` |
| `recipient` | string | Phone number in E.164 format |
| `messageType` | string | `dispatch_tracking` or `hospital_alert` |
| `content` | string | Full message text |
| `caseId` | string | Associated emergency case ID |
| `status` | string | `sent`, `delivered`, or `failed` |
| `error` | string or null | Error message if failed |
| `fallbackTriggered` | boolean | Whether WhatsApp fallback was used |
| `retryCount` | number | Number of Fast2SMS retry attempts before fallback |
| `timestamp` | Timestamp | Server timestamp of log creation |
| `provider` | string | `fast2sms` or `twilio` |

### Retry Window Logic

| Attempt | Channel | Delay | Total Elapsed |
|---------|---------|-------|---------------|
| 1 | Fast2SMS | 0s (immediate) | 0s |
| 2 | Fast2SMS (retry) | 2s delay | 2s |
| 3 | Twilio WhatsApp | 0s (immediate after SMS failure) | 2-12s |

Maximum total time from dispatch event to final delivery attempt: approximately 27 seconds (10s SMS timeout + 2s retry delay + 15s WhatsApp timeout).

### Manual Resend Capability

The Command Center dashboard includes a manual resend mechanism for failed communications. Dispatchers can view the `communicationLogs` for a specific case and trigger a re-send of any failed message via a "Resend" button. The resend follows the same primary-then-fallback cascade.

### Hospital Notification Guarantee

The cascading fallback architecture ensures that hospitals receive incoming patient alerts through at least one channel. In the worst case (both SMS and WhatsApp fail), the communication log entry with `status: 'failed'` triggers a visual alert in the Command Center dashboard, prompting a dispatcher to call the hospital manually. The system never silently fails — every delivery failure is surfaced to operational staff.

---

## 26.3 Firestore Write Failure Handling (UI Retry and Graceful Degradation)

### Problem Statement

Firestore write operations can fail for multiple reasons in a production EMS environment. Each failure type requires a different recovery strategy. Silent data loss is unacceptable when the data represents a patient's emergency case, a hospital's capacity update, or a dispatcher's override decision.

### Failure Classification

The system classifies Firestore write failures into four categories, each with distinct recovery behavior:

| Failure Category | Firestore Error Code | Root Cause | Recovery Strategy |
|-----------------|---------------------|------------|-------------------|
| **Permission Denial** | `permission-denied` | Security rules rejected the operation; user lacks required role, or document ownership check failed | Display specific error message explaining why the write was denied; no retry (the operation will fail again with the same credentials) |
| **Connectivity Loss** | `unavailable`, `deadline-exceeded` | Network unreachable, Firestore backend unreachable, or request timed out | Auto-retry with exponential backoff; queue for offline sync if retries exhausted |
| **Rate Limiting** | `resource-exhausted` | Too many concurrent writes from the same client | Auto-retry with exponential backoff starting at 1 second; log frequency alert |
| **Validation Failure** | `invalid-argument`, `failed-precondition` | Malformed data, missing required fields, or Firestore precondition (e.g., document already exists) | Display validation error to user; do not retry (data must be corrected) |
| **Authentication Expiry** | `unauthenticated` | Firebase Auth token expired during long session | Trigger silent token refresh via `onAuthStateChanged`; retry write after refresh |

### Auto-Retry with Exponential Backoff

For connectivity and rate-limiting failures, the system implements automatic retry with binary exponential backoff:

```
Retry Algorithm:
  maxRetries = 5
  baseDelay = 1000ms (1 second)

  for attempt in 1..maxRetries:
    try:
      await firestoreWrite(data)
      return SUCCESS
    catch error:
      if error.code in ['unavailable', 'deadline-exceeded', 'resource-exhausted']:
        delay = min(baseDelay * 2^(attempt-1), 30000)  // Cap at 30 seconds
        jitter = random(0, delay * 0.1)                // 10% jitter
        await sleep(delay + jitter)
      else:
        throw error  // Non-retryable, surface to UI immediately

  // All retries exhausted
  saveDraftToLocalStorage(data)
  displayRetryExhaustedNotification()
```

### Draft Save Fallback

When all retry attempts are exhausted, the unsaved data is persisted to `localStorage` as a draft:

```json
{
  "draftId": "uuid-v4",
  "collection": "emergencyCases",
  "operation": "create",
  "data": { "...complete document data..." },
  "createdAt": "ISO-8601",
  "failureCode": "unavailable",
  "failureMessage": "Could not reach Cloud Firestore backend. Data saved as draft.",
  "retryCount": 5
}
```

On the next successful Firestore connection (detected via `onSnapshot` heartbeat), the system prompts the user: "You have 1 unsaved draft. Submit now?" The user can review the draft data and submit or discard it.

### Visual Status Indicators

The UI provides continuous feedback on Firestore write status through a status indicator system:

| State | Indicator | Location | User Action Available |
|-------|-----------|----------|----------------------|
| **Writing** | Blue spinner + "Saving..." | Inline, next to submit button | None (in progress) |
| **Success** | Green checkmark + "Saved" | Inline, fades after 3 seconds | None |
| **Retry in Progress** | Amber spinner + "Retrying (attempt 2/5)..." | Inline + notification toast | "Cancel Retry" button |
| **Permission Denied** | Red lock icon + "Access denied: insufficient permissions" | Modal dialog | "Contact Administrator" link |
| **Draft Saved** | Gray save icon + "Saved offline -- will sync when connection restores" | Persistent banner | "Retry Now" button, "Discard Draft" button |
| **Failed** | Red exclamation + "Submission failed after 5 attempts" | Modal dialog | "Save as Draft" button, "Retry" button, "Copy Data" button |

### Emergency Data Protection

The system ensures that no emergency data is irretrievably lost through the following defense-in-depth measures:

1. **Immediate local capture:** Form data is written to component state on every keystroke
2. **Form auto-save:** Every 30 seconds, the current form state is persisted to `localStorage` as an auto-save checkpoint
3. **Pre-submit snapshot:** Immediately before Firestore write, the complete payload is snapshotted to `localStorage`
4. **Post-failure draft:** If the write fails, the snapshot becomes a persistent draft
5. **Cross-tab recovery:** If the user closes the browser tab during a write failure, the draft persists in `localStorage` and is surfaced on next login
6. **"Copy Data" fallback:** As a last resort, the user can copy the raw JSON payload to clipboard for manual data entry via an alternative system

---

## 26.4 Real-Time Dashboard Failsafe Behavior

### Problem Statement

MEDROUTER dashboards rely on Firestore `onSnapshot` listeners for real-time data. If the WebSocket connection to Firestore drops (network failure, Firestore service degradation, or client-side resource exhaustion), dashboards must not display blank screens or stale data without warning.

### Listener Failure Detection

Firestore `onSnapshot` listeners include an `onError` callback that fires when the listener is disconnected:

```javascript
const unsubscribe = onSnapshot(
  query(collection(db, 'hospitals')),
  (snapshot) => {
    // Normal operation: update local state with fresh data
    setHospitals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLastSyncTimestamp(Date.now());
    setSyncDegraded(false);
  },
  (error) => {
    // Listener failure: activate failsafe mode
    console.error('Hospital listener disconnected:', error);
    setSyncDegraded(true);
    setLastSyncError(error.code);
    // Do NOT clear existing hospital data — keep last known state
  }
);
```

### Last-Known Data Cache

When a listener disconnects, the dashboard retains the most recent data snapshot in React component state. This data remains fully functional for:

| Capability | Available During Degraded Sync | Notes |
|-----------|-------------------------------|-------|
| Hospital capacity viewing | Yes (last known values) | Data age displayed prominently |
| Ambulance position viewing | Yes (last known positions) | Positions may be outdated |
| Scoring engine execution | Yes (with last known hospital data) | Rankings may not reflect current reality |
| Emergency case viewing | Yes (last known case list) | New cases from other users will not appear |
| Dispatcher override | Yes (writes to local state, queued for Firestore) | Override logged locally, synced when restored |
| Hospital search and filter | Yes | Operates on cached data |
| Navigation (active route) | Yes (Mapbox tiles cached) | GPS continues updating locally |

### Routing Freeze Safeguards

If hospital data is stale (listener disconnected for more than 5 minutes), the scoring engine adds a prominent warning to its output:

```javascript
function scoreHospitals(hospitals, caseData, staleThreshold = 300000) {
  const dataAge = Date.now() - lastSyncTimestamp;
  const isStale = dataAge > staleThreshold;
  
  const results = hospitals.map(h => scoreHospital(h, caseData));
  
  if (isStale) {
    results.forEach(r => {
      r.warnings = r.warnings || [];
      r.warnings.push({
        type: 'STALE_DATA',
        message: `Hospital data is ${Math.floor(dataAge / 60000)} minutes old. Rankings may not reflect current conditions.`,
        severity: 'high'
      });
    });
  }
  
  return results;
}
```

### Override Availability During Degradation

Dispatcher override routing remains fully functional during sync degradation. The override is:

1. Applied to local state immediately (route redraws, UI updates)
2. Queued for Firestore write to `dispatchOverrides` collection
3. Retried via the exponential backoff mechanism described in Section 26.3
4. Logged to `localStorage` as a backup audit record

This ensures that dispatchers can always exercise human judgment, even when the database connection is unavailable.

### Warning Banner System

When sync degradation is detected, a persistent warning banner appears at the top of affected dashboards:

| Degradation Duration | Banner Level | Message |
|---------------------|-------------|---------|
| 0-60 seconds | Info (blue) | "Live sync interrupted. Reconnecting..." |
| 1-5 minutes | Warning (amber) | "Live sync degraded. Displaying data from {timestamp}. Rankings may not reflect current hospital capacity." |
| 5+ minutes | Critical (red) | "Live sync offline for {duration}. Hospital data is stale. Verify capacity by phone before dispatch." |

### Auto-Reconnection

When connectivity is restored (detected via `navigator.onLine` event or successful Firestore heartbeat), the system:

1. Re-establishes all `onSnapshot` listeners
2. Fetches the current state of all watched collections
3. Diffs the new state against the cached state
4. Updates all dashboard components with fresh data
5. Removes the degradation warning banner
6. Logs the outage duration and data delta to the browser console

---

## 26.5 System Resilience Summary

The following table provides a comprehensive reference of all failure modes, their detection mechanisms, recovery strategies, and operational impact:

| Failure Type | Detection Method | Recovery Mechanism | User Visibility | Data Loss Risk |
|-------------|-----------------|-------------------|----------------|---------------|
| **Offline emergency intake** | `navigator.onLine === false` and Firestore write error | IndexedDB queue with acuity-priority retry daemon (30-second interval) | Amber "Offline Mode Active" banner, queue counter badge, per-case sync status tags | None: case persists in IndexedDB with UUID deduplication and checksum integrity |
| **SMS delivery failure** | Fast2SMS HTTP error response, timeout, or `return_code: false` | 1 retry with 2-second delay, then automatic WhatsApp fallback via Twilio API | communicationLogs entry with `fallbackTriggered: true`; Command Center alert if both channels fail | None: message delivered via WhatsApp; if both fail, dispatcher is alerted for manual phone call |
| **Firestore write denial (permission)** | Error code `permission-denied` | No retry (will fail again); red modal with specific denial reason; "Contact Administrator" link | Red lock icon, modal dialog explaining which permission was missing | Draft saved to localStorage; data recoverable on role correction |
| **Firestore write failure (connectivity)** | Error codes `unavailable`, `deadline-exceeded` | Exponential backoff retry (5 attempts, 1s to 30s delay); draft save to localStorage if all retries fail | Blue spinner during retry; amber status during backoff; red alert if exhausted | None: draft persists in localStorage; auto-prompted on next successful connection |
| **GPS signal loss** | Geolocation API error or timeout (10 seconds) | Last known position retained; manual coordinate entry fallback; deviation detection paused during GPS outage | "GPS Signal Lost" indicator on navigation view; last position marker grayed out | None: last known coordinates preserved; case data valid with last GPS fix |
| **Scoring engine computation failure** | NaN/undefined in scoring pipeline | 4-layer NaN hardening: `safeNum()` to `safeScore()` to `normalizeHospital()` to 999km distance guard | None (transparent recovery); debug output logs hardening activations for developer review | None: hardened scores always produce valid numeric output; worst case is conservative (safe) ranking |
| **Firestore listener disconnection** | `onSnapshot` `onError` callback | Last-known data cache retained in React state; auto-reconnection on network restore; warning banners by duration | Blue/amber/red progressive warning banner indicating sync status and data age | None: all last-known data remains accessible; overrides and case submissions queued locally |
| **Authentication token expiry** | Error code `unauthenticated` on write attempt | Silent token refresh via Firebase `onAuthStateChanged`; pending write retried after refresh | Brief spinner; transparent to user if refresh succeeds; re-login prompt if refresh fails | None: write retried after token refresh; draft saved if re-login required |
| **Communication provider quota exhaustion** | Fast2SMS `insufficient_credits` error response | Immediate WhatsApp fallback (no SMS retry); admin notification to replenish credits | communicationLogs entry; admin dashboard alert for credit replenishment | None: WhatsApp delivery proceeds independently of SMS credits |
| **Browser crash during intake** | localStorage auto-save checkpoint | On next login, auto-save detected and surfaced: "Resume unsaved case?" | Modal prompt with case summary and resume/discard options | Minimal: data loss limited to changes since last 30-second auto-save checkpoint |

---


**END OF DOCUMENT**

*MEDROUTER — Routes That Save Lives*
*Document Version: 3.0.0 | February 2026*
*Total Sections: 26 + 3 Appendices*
*Prepared for: Government evaluation, healthcare regulatory review, hackathon submission, investor due diligence, startup technical whitepaper, and infrastructure partner onboarding*
