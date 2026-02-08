# Firebase Setup Guide for EMS Router

## Prerequisites

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firebase Authentication and Firestore Database
3. Get your Firebase configuration values

## Configuration Steps

### 1. Update Environment Variables

Copy the values from your Firebase project settings to your `.env.local` file:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Set Up Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Hospitals collection - read by all authenticated, write by admins
    match /hospitals/{hospitalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Patients collection - authenticated users only
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }
    
    // Ambulances collection - authenticated users only
    match /ambulances/{ambulanceId} {
      allow read, write: if request.auth != null;
    }
    
    // Feedback collection - write by anyone, read by admins
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**For Development/Testing Only:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Not for production!
    }
  }
}
```

### 3. Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google Sign-in
4. Configure authorized domains (localhost, your production domain)

### 4. Create Firestore Collections

The app uses these collections:

| Collection | Purpose |
|------------|---------|
| `hospitals` | Hospital profiles, capacity, specialties |
| `patients` | Patient records and triage data |
| `ambulances` | Ambulance unit status and location |
| `users` | User profiles and roles |
| `feedback` | User feedback submissions |

### 5. Seed Sample Data

Run the seed script to populate test data:

```bash
npm run seed
```

Or manually add a hospital document:

```json
{
  "name": "City General Hospital",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "123 Main Street"
  },
  "specialties": ["trauma", "cardiology", "neurology"],
  "equipment": ["ct_scanner", "mri", "ventilator"],
  "capacity": {
    "totalBeds": 200,
    "availableBeds": 45,
    "icuBeds": 20,
    "availableIcu": 8
  },
  "status": "open",
  "phone": "+91-1234567890"
}
```

### 6. Test the Setup

1. Start the app: `npm run dev`
2. Navigate to http://localhost:5173
3. Create an account or log in
4. Check that hospitals appear on the Routing Dashboard
5. Verify the Command Center shows ambulance data

## Troubleshooting

### Common Issues

**1. "Missing or insufficient permissions" Error**
- Check Firestore security rules are published
- Verify user is authenticated
- Confirm Firebase project ID is correct

**2. "Firebase app not initialized" Error**
- Verify all environment variables are set
- Check `.env.local` file exists and is properly formatted
- Restart the development server after changing env vars

**3. Authentication Not Working**
- Ensure Email/Password sign-in is enabled
- Check authorized domains include localhost
- Verify API key has correct permissions

### Debug Mode

Enable verbose logging in the browser console:
```javascript
localStorage.setItem('firebase:debug', 'true');
```

Check the Console tab in Developer Tools for:
- Authentication state messages
- Firestore connection status
- Specific error details

## Production Deployment

Before deploying to production:

1. **Update Security Rules**: Remove development-only rules
2. **Set Environment Variables**: Configure production Firebase credentials
3. **Enable App Check**: Protect against abuse
4. **Configure Domains**: Add production domains to authorized list
5. **Set Up Backup**: Enable Firestore automatic backups

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
