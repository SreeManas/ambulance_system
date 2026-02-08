# EMS Router - Deployment Guide

## Overview

This guide provides instructions for deploying the EMS Router application to production environments. The application is a React-based web app built with Vite, featuring real-time ambulance routing, hospital capacity tracking, and AI-powered patient triage.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to required API keys
- Deployment platform account (Vercel, Netlify, or Firebase Hosting)

## Environment Configuration

### Required Environment Variables

Create `.env.production` with:

```bash
# ===== REQUIRED =====

# Mapbox GL JS
VITE_MAPBOX_TOKEN=your_production_mapbox_token

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ===== OPTIONAL =====

# Google Translate API (for multi-language)
VITE_GOOGLE_TRANSLATE_KEY=your_google_translate_key

# Production settings
NODE_ENV=production
```

### Getting API Keys

1. **Mapbox Token**: [mapbox.com](https://mapbox.com) → Account → Tokens
2. **Firebase**: [console.firebase.google.com](https://console.firebase.google.com) → Project Settings
3. **Google Translate**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services

## Build Process

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

The build output will be in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   - Link GitHub repo to Vercel
   - Auto-detects React + Vite setup

2. **Environment Variables**
   - Add all variables in Vercel dashboard
   - Settings → Environment Variables

3. **Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Deploy**
   - Automatic deploy on push to main
   - Preview deploys for PRs

### Netlify

1. **Connect Repository**
   - Link GitHub repo in Netlify

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```

3. **Environment Variables**
   - Site Settings → Environment Variables
   - Add all required variables

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Hosting**
   ```bash
   firebase init hosting
   # Select: dist as public directory
   # Select: Yes for SPA rewrite
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Security Checklist

### Before Production

- [ ] Remove development Firestore rules
- [ ] Enable Firebase App Check
- [ ] Configure proper CORS headers
- [ ] Set secure Content Security Policy
- [ ] Enable HTTPS only
- [ ] Rotate all API keys

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hospitals/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    match /patients/{doc} {
      allow read, write: if request.auth != null;
    }
    match /feedback/{doc} {
      allow create: if request.auth != null;
      allow read: if request.auth.token.admin == true;
    }
  }
}
```

## Performance Optimization

### Build Optimizations
- Code splitting enabled by default
- Vendor chunk separation
- Tree shaking for unused imports
- Asset compression

### Runtime Optimizations
- Lazy load non-critical components
- Cache Firestore queries
- Debounce real-time updates
- Optimize Mapbox rendering

## Monitoring

### Recommended Tools
- Vercel Analytics (built-in)
- Firebase Performance Monitoring
- Sentry for error tracking
- Google Analytics for usage

### Key Metrics to Track
- Initial load time (< 3s target)
- Time to interactive (< 5s target)
- Firestore read/write counts
- Authentication success rate
- API error rates

## Troubleshooting

### Common Issues

**1. Map Not Loading**
- Verify Mapbox token is correct
- Check domain restrictions on token
- Confirm HTTPS is enabled

**2. Firebase Errors**
- Verify all config values
- Check Firestore rules
- Confirm domain is authorized

**3. Build Failures**
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Review build logs for specifics

### Debug Mode

For production debugging (temporary):
```bash
NODE_ENV=development npm run build
```

This includes source maps for debugging.

## Rollback Plan

1. Keep previous build artifacts
2. Document deployment versions
3. Use platform rollback features:
   - Vercel: Deployments → Promote previous
   - Netlify: Deploys → Publish deploy
   - Firebase: `firebase hosting:rollback`

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs
3. Verify environment configuration
4. Check Firebase Console for backend issues

---

**Note**: Always test in a staging environment before deploying to production. Enable proper monitoring and alerting for production systems.
