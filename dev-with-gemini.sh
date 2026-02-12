#!/bin/bash
# Quick start script for local development with Gemini support

echo "🚀 Starting EMS Router with Gemini AI Copilot..."
echo ""
echo "Checking Vercel CLI..."

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""
echo "📦 Checking environment variables..."

if ! grep -q "GEMINI_API_KEY" .env.local 2>/dev/null; then
    echo "⚠️  GEMINI_API_KEY not found in .env.local"
    echo ""
    echo "Add it now:"
    echo "  echo 'GEMINI_API_KEY=your_key_here' >> .env.local"
    echo ""
fi

echo ""
echo "🌐 Starting Vercel dev server..."
echo "   URL: http://localhost:3000"
echo ""
echo "✨ Gemini AI Copilot will be available!"
echo ""

vercel dev
