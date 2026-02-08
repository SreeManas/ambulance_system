# EMS Router - AI-Powered Ambulance Triage & Smart Hospital Routing

An intelligent emergency medical services (EMS) platform that optimizes ambulance dispatch and hospital routing using AI-powered patient triage, real-time hospital capacity tracking, and smart routing algorithms.

## 🚑 Features

- **Routing Intelligence Dashboard** - Real-time ambulance routing with hospital ranking
- **Command Center** - Live dispatch control with unit status and GPS tracking
- **Patient Intake Form** - AI-assisted triage with vitals collection and urgency assessment
- **Hospital Dashboard** - Capacity management and specialty/capability tracking
- **Capability Scoring Engine** - Smart hospital scoring based on patient needs and hospital capabilities

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: CSS with responsive design
- **Backend**: Firebase (Firestore + Authentication)
- **Maps**: Mapbox GL JS for routing visualization
- **State Management**: React Context API

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:

```env
# Mapbox (Required for maps)
VITE_MAPBOX_TOKEN=your_mapbox_token

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Seed the Database (Optional)
```bash
npm run seed
```
This populates Firestore with sample hospitals for testing.

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── RoutingDashboard.jsx      # Main routing interface
│   ├── CommandCenterDashboard.jsx # Dispatch control center
│   ├── PatientVitalsForm.jsx     # Patient intake & triage
│   ├── HospitalDashboard.jsx     # Hospital capacity management
│   ├── FeedbackForm.jsx          # User feedback collection
│   └── auth/                     # Authentication components
├── services/
│   ├── capabilityScoringEngine.js # Hospital ranking algorithm
│   ├── geocodingService.js       # Location services
│   └── storageService.js         # Firebase storage wrapper
├── hooks/
│   ├── useT.js                   # Translation hook
│   └── useRealTimeProcessing.js  # Real-time data hook
└── utils/
    ├── offlineSync.js            # Offline data handling
    └── translateService.js       # Multi-language support
```

## Core Workflows

### Patient Triage Flow
1. Paramedic enters patient vitals in intake form
2. AI calculates urgency score (1-5 scale)
3. System queries nearby hospitals
4. Scoring engine ranks hospitals by capability match
5. Top recommendations displayed on routing dashboard

### Hospital Scoring Algorithm
The capability scoring engine evaluates hospitals using:
- **Specialty Match** (35%) - Does hospital have required specialty?
- **Bed Availability** (25%) - Current capacity status
- **Equipment Match** (20%) - Required equipment availability
- **Distance** (15%) - Travel time to hospital
- **Backup Capacity** (5%) - Overflow handling ability

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `hospitals` | Hospital profiles, capabilities, and capacity |
| `ambulances` | Ambulance unit status and location |
| `patients` | Patient records and triage data |
| `feedback` | User feedback submissions |
| `users` | User profiles and roles |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run seed` | Seed database with sample data |
| `npm run lint` | Run ESLint |

## Authentication

The app uses Firebase Authentication with role-based access:
- **Paramedic** - Patient intake, routing access
- **Dispatcher** - Command center access
- **Hospital Admin** - Hospital dashboard access
- **Admin** - Full system access

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## License

MIT License - see LICENSE file for details.
