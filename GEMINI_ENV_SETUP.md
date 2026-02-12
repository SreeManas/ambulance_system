# GEMINI_API_KEY Environment Variable Setup

## Local Development (.env.local)

Add to your `.env.local` file:

```env
# Gemini AI Copilot (Server-Side Only - DO NOT use VITE_ prefix)
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> **Important:** Do NOT prefix with `VITE_` — this key must stay server-side only.

---

## Vercel Production Deployment

### Step 1: Navigate to Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** → **Environment Variables**

### Step 2: Add GEMINI_API_KEY

- **Key:** `GEMINI_API_KEY`
- **Value:** Your actual Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Environment:** Select **Production**, **Preview**, and **Development**

### Step 3: Redeploy

After adding the environment variable, trigger a new deployment:

```bash
git commit --allow-empty -m "Force redeploy for env vars"
git push
```

---

## Verifying Setup

### Local (Development)

```bash
# Test health endpoint
curl http://localhost:5173/api/gemini/health

# Expected output:
{
  "status": "ok",
  "model": "gemini-2.5-flash",
  "configured": true,  // ← Should be true if GEMINI_API_KEY is set
  "serverless": true
}
```

### Production (Vercel)

```bash
# Test health endpoint on your deployed URL
curl https://your-app.vercel.app/api/gemini/health

# Expected output:
{
  "status": "ok",
  "model": "gemini-2.5-flash",
  "configured": true,  // ← Should be true if env var is set
  "serverless": true
}
```

---

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and add it to your environment variables

---

## Security Best Practices

✅ **DO:**
- Keep `GEMINI_API_KEY` in `.env.local` (gitignored)
- Use server-side env vars (no `VITE_` prefix)
- Add to Vercel via dashboard (encrypted at rest)

❌ **DON'T:**
- Commit API keys to git
- Expose via `VITE_` prefix (will be bundled in client code)
- Share keys publicly
