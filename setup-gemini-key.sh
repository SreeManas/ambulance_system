#!/bin/bash
# Quick setup script for Gemini API key

echo "══════════════════════════════════════════════════"
echo "  Gemini AI Copilot - API Key Setup"
echo "══════════════════════════════════════════════════"
echo ""

# Check if key already exists
if grep -q "^GEMINI_API_KEY=" .env.local 2>/dev/null; then
    echo "✅ GEMINI_API_KEY already exists in .env.local"
    exit 0
fi

echo "📋 Steps to get your Gemini API key:"
echo ""
echo "1. Visit: https://makersuite.google.com/app/apikey"
echo "   (or https://aistudio.google.com/apikey)"
echo ""
echo "2. Click 'Create API Key'"
echo ""
echo "3. Copy the key"
echo ""
echo "4. Paste it below"
echo ""
echo "══════════════════════════════════════════════════"
echo ""

read -p "Enter your Gemini API key: " api_key

if [ -z "$api_key" ]; then
    echo "❌ No key entered. Exiting."
    exit 1
fi

# Add to .env.local
echo "" >> .env.local
echo "# Gemini AI Copilot (Server-Side Only - DO NOT use VITE_ prefix)" >> .env.local
echo "GEMINI_API_KEY=$api_key" >> .env.local

echo ""
echo "✅ Added GEMINI_API_KEY to .env.local"
echo ""
echo "══════════════════════════════════════════════════"
echo "  Next Steps:"
echo "══════════════════════════════════════════════════"
echo ""
echo "FOR LOCAL TESTING:"
echo "  1. Run: vercel dev"
echo "  2. Test at: http://localhost:3000"
echo ""
echo "FOR PRODUCTION (Vercel):"
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Settings → Environment Variables"
echo "  4. Add: GEMINI_API_KEY = $api_key"
echo "  5. Deploy: git push"
echo ""
echo "✅ Setup complete!"
