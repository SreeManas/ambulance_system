# Debugging Gemini 400 Errors on Vercel

## After Deployment

Once the new code is deployed (in ~1-2 minutes), follow these steps to debug:

### Step 1: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `ambulance-system`
3. Click **Deployments** → Select the latest deployment
4. Click **Functions** tab → Click on `/api/gemini/chat`
5. You'll see detailed logs showing:
   ```
   Parsed body: { "message": "...", "role": "..." }
   API key configured: Yes
   User role: hospital_admin
   Gemini request prepared: { model: "gemini-2.5-flash", ... }
   Calling Gemini API: ...
   Gemini response status: 400  ← THIS IS THE KEY
   ```

### Step 2: Look for Specific Errors

The logs will now show **exactly** what went wrong:

#### If you see:
```
Invalid body type: undefined
```
**Problem:** Request body not being sent  
**Fix:** Check frontend is sending message correctly

#### If you see:
```
Validation failed: Invalid message
```
**Problem:** Message is empty or wrong type  
**Fix:** Check frontend sends `{ message: "text", role: "paramedic" }`

#### If you see:
```
GEMINI_API_KEY not configured
```
**Problem:** Environment variable not set  
**Fix:** Add `GEMINI_API_KEY` in Vercel → Settings → Environment Variables

#### If you see:
```
Gemini API returned 400
details: "GenerateContentRequest.model: unexpected model name format"
```
**Problem:** Model name is wrong  
**Fix:** We're using `gemini-2.5-flash` which should be correct. If not, try `gemini-2.0-flash-exp`

#### If you see:
```
Gemini response status: 400
details: "API key not valid"
```
**Problem:** Invalid API key  
**Fix:** Get a new API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## Quick Test Commands

### Test the health endpoint:
```bash
curl https://your-app.vercel.app/api/gemini/health
```

Expected:
```json
{
  "status": "ok",
  "model": "gemini-2.5-flash",
  "configured": true,
  "serverless": true
}
```

### Test the chat endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/gemini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What hospitals are available?",
    "role": "paramedic",
    "contextIds": {},
    "sessionId": null
  }'
```

---

## Common Fixes

### Fix 1: Wrong Model Name
If logs show model name error, try these in order:
1. `gemini-2.5-flash` (current)
2. `gemini-2.0-flash-exp`
3. `gemini-1.5-flash`

### Fix 2: API Key Issues
1. Get new key: https://makersuite.google.com/app/apikey
2. Add to Vercel: Dashboard → Project → Settings → Environment Variables
3. Key name: `GEMINI_API_KEY` (no VITE_ prefix)
4. Redeploy: `git commit --allow-empty -m "trigger redeploy" && git push`

### Fix 3: Request Format
The detailed logs will show the exact request being sent to Gemini. If there's a format issue, the logs will reveal it.

---

## Next Steps

1. **Wait for deployment** (~1-2 minutes)
2. **Check Vercel logs** as described above
3. **Share the error details** from the logs if still having issues

The comprehensive logging will tell us **exactly** what's wrong! 🔍
