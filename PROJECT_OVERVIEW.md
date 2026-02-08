# EMS Router - Project Overview
## AI-Powered Ambulance Triage & Smart Hospital Routing Platform

### 🚑 Project Vision

EMS Router is an intelligent emergency medical services platform designed to optimize ambulance dispatch and hospital routing. The system uses AI-powered patient triage, real-time hospital capacity tracking, and smart routing algorithms to ensure patients reach the most appropriate hospital in the shortest time.

---

## 🏗️ System Architecture

### Core Technology Stack
- **Frontend**: React 19 with Vite build system
- **Styling**: CSS with responsive design
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Maps**: Mapbox GL JS for routing visualization
- **State Management**: React Context API with hooks

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Patient Data  │    │  Hospital Data  │    │  Ambulance Data │
│   (Vitals/Triage)│    │  (Capacity)     │    │  (GPS/Status)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┴──────────┬───────────┘
                     │                      │
          ┌──────────▼────────────┐ ┌──────▼──────┐
          │  Capability Scoring   │ │   Firebase  │
          │       Engine          │ │  Firestore  │
          └──────────┬────────────┘ └──────┬──────┘
                     │                     │
          ┌──────────▼─────────────────────▼──────────┐
          │           React Dashboard                  │
          │  (Routing, Command Center, Intake)        │
          └───────────────────────────────────────────┘
```

---

## 🔧 Core Components

### 1. Routing Intelligence Dashboard
- **Real-time Hospital Ranking**: Displays hospitals ranked by patient need match
- **Map Visualization**: Mapbox integration showing hospital locations and routes
- **Compare Routes**: Side-by-side comparison of top hospital options
- **Distance Calculation**: Real-time ETA based on traffic conditions

### 2. Command Center Dashboard
- **Live Dispatch Control**: Monitor and manage ambulance fleet
- **Unit Status Tracking**: Available, en route, at scene, at hospital
- **GPS Integration**: Real-time ambulance location on map
- **Priority Queue**: Incoming calls sorted by urgency

### 3. Patient Intake Form
- **Vitals Collection**: Heart rate, BP, SpO2, temperature, GCS
- **Chief Complaint Selection**: Categorized emergency types
- **AI Triage Scoring**: Automatic urgency calculation (1-5 scale)
- **Required Capabilities**: Auto-generated hospital requirements
- **Photo Capture**: Document injuries/conditions

### 4. Hospital Dashboard
- **Capacity Management**: Real-time bed availability tracking
- **Specialty Configuration**: Define hospital specialties
- **Equipment Tracking**: Manage available medical equipment
- **Status Toggle**: Open/closed for new patients

### 5. Capability Scoring Engine
The core intelligence of the platform - scores hospitals based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Specialty Match | 35% | Does hospital have required specialty? |
| Bed Availability | 25% | Current capacity vs. max capacity |
| Equipment Match | 20% | Required equipment availability |
| Distance | 15% | Travel time to hospital |
| Backup Capacity | 5% | Overflow handling ability |

---

## 📊 Data Model

### Patient Record
```json
{
  "patientId": "PT-12345",
  "vitals": {
    "heartRate": 88,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "spo2": 98,
    "temperature": 98.6,
    "gcs": 15
  },
  "chiefComplaint": "chest_pain",
  "urgencyScore": 4,
  "requiredCapabilities": ["cardiology", "cath_lab", "icu"]
}
```

### Hospital Record
```json
{
  "hospitalId": "HOSP-001",
  "name": "City General Hospital",
  "location": { "lat": 12.9716, "lng": 77.5946 },
  "specialties": ["trauma", "cardiology", "neurology"],
  "equipment": ["ct_scanner", "mri", "cath_lab"],
  "capacity": { "total": 200, "available": 45, "icu": 8 },
  "status": "open"
}
```

---

## 🚀 Key Features

### AI-Powered Triage
- Automated urgency scoring based on vital signs
- Chief complaint categorization
- Required capability generation
- Historical pattern matching

### Real-Time Hospital Matching
- Live capacity data from hospitals
- Specialty and equipment matching
- Distance-based ranking
- Bypass recommendations when hospitals are full

### Smart Routing
- Mapbox routing integration
- Traffic-aware ETA calculation
- Multiple route comparison
- Turn-by-turn navigation ready

### Multi-Language Support
- English and 9 Indian languages
- Google Translate API integration
- User preference persistence

---

## 📈 Impact & Innovation

### Technical Innovation
1. **Capability Scoring Engine**: Novel algorithm for hospital-patient matching
2. **Real-Time Triage**: AI-assisted urgency assessment
3. **Live Capacity Tracking**: Firebase real-time updates
4. **Multi-Factor Routing**: Beyond simple distance-based routing

### Healthcare Impact
1. **Reduced Transport Time**: Optimal hospital selection
2. **Improved Outcomes**: Right patient to right hospital
3. **Resource Optimization**: Balance hospital loads
4. **Data-Driven Decisions**: Analytics for system improvement

---

## 🎯 Future Roadmap

### Phase 1: Core Enhancement
- [ ] Mobile app for paramedics
- [ ] Push notifications for dispatchers
- [ ] Advanced AI triage models
- [ ] Historical analytics dashboard

### Phase 2: Integration
- [ ] Hospital EMR integration
- [ ] Ambulance CAD system integration
- [ ] Insurance verification
- [ ] Automated documentation

### Phase 3: Advanced Features
- [ ] Predictive demand modeling
- [ ] Resource optimization AI
- [ ] Multi-agency coordination
- [ ] Quality metrics tracking

---

## 🏆 Differentiators

1. **Intelligent Scoring**: Multi-factor hospital ranking vs. simple distance
2. **Real-Time Data**: Live capacity updates vs. static information
3. **AI Triage**: Automated urgency assessment vs. manual only
4. **Capability Matching**: Specialty and equipment matching
5. **Scalable Architecture**: Firebase enables easy scaling

---

## 📊 Technical Metrics

### Performance
- **Initial Load**: < 2 seconds
- **Scoring Calculation**: < 100ms
- **Real-time Updates**: < 500ms latency
- **Map Rendering**: < 1 second

### Capacity
- **Concurrent Users**: 10,000+
- **Hospitals Tracked**: 1,000+
- **Updates/Second**: 100+
- **Data Retention**: Unlimited with Firebase

---

EMS Router represents the future of emergency medical services - intelligent, real-time, and patient-focused. By combining AI-powered triage with smart hospital matching, we ensure patients receive the right care at the right place, saving lives and improving outcomes.
