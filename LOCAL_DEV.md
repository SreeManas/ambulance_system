# Local Development Instructions

## Testing Gemini AI Copilot Locally

> **IMPORTANT:** The Gemini copilot uses Vercel serverless functions in `/api`. These **do NOT work** with `npm run dev` (Vite). You MUST use `vercel dev`.

---

## Setup (One-Time)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link your project (if not already linked)

```bash
vercel link
```

---

## Running the Dev Server

### For Full App Testing (with Gemini Copilot)

```bash
vercel dev
```

- **URL:** `http://localhost:3000`
- **API routes work:** ✅ Yes (`/api/gemini/*` endpoints work)
- **Hot reload:** ✅ Yes
- **Use case:** Testing Gemini AI copilot integration

### For UI Development Only (no Gemini)

```bash
npm run dev
```

- **URL:** `http://localhost:5173`
- **API routes work:** ❌ No (will get 404 errors for `/api/*`)
- **Hot reload:** ✅ Yes (faster than Vercel)
- **Use case:** Frontend UI changes that don't need Gemini

---

## Troubleshooting

### "Server returned 404" Error

If you see this error, it means the API routes aren't being handled:

**Solutions:**
1. **Restart dev server:**
   ```bash
   # Stop current dev server (Ctrl+C)
   npm run dev
   ```

2. **Use Vercel Dev instead:**
   ```bash
   vercel dev
   ```

3. **Check environment variable:**
   - Ensure `GEMINI_API_KEY` is in `.env.local`
   - Restart dev server after adding env vars

### Check API Health

Test if the API is working:

```bash
# Health check
curl http://localhost:5173/api/gemini/health

# OR with Vercel Dev
curl http://localhost:3000/api/gemini/health

# Expected output:
{
  "status": "ok",
  "model": "gemini-2.5-flash",
  "configured": true,
  "serverless": true
}
```

---

## Environment Setup

Make sure your `.env.local` has:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

> **Important:** No `VITE_` prefix! This is server-side only.

---

## Production Deployment

When deploying to Vercel:
1. Add `GEMINI_API_KEY` in Vercel Dashboard
2. Push to git
3. Vercel auto-deploys

The `/api/*` endpoints work automatically in production!
