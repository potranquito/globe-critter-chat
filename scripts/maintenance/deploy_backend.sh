#!/bin/bash

# Backend Deployment Script
# Run this to deploy species classification and bird calls

set -e

echo "🚀 Globe Critter Chat - Backend Deployment"
echo "=========================================="
echo ""

# Step 1: Login
echo "📝 Step 1: Login to Supabase"
echo "You'll be redirected to your browser to authenticate..."
echo ""
npx supabase login

echo ""
echo "✅ Login successful!"
echo ""

# Step 2: Link project
echo "📝 Step 2: Linking to project..."
echo ""
npx supabase link --project-ref iwmbvpdqwekgxegaxrhr --password "Iloveanimals1234!!@"

echo ""
echo "✅ Project linked!"
echo ""

# Step 3: Apply migrations
echo "📝 Step 3: Applying database migrations..."
echo "This will:"
echo "  • Add species classification columns"
echo "  • Classify 180,000+ species"
echo "  • Create bird_calls table"
echo ""
npx supabase db push

echo ""
echo "✅ Migrations applied!"
echo ""

# Step 4: Deploy edge function
echo "📝 Step 4: Deploying bird call edge function..."
echo ""
npx supabase functions deploy fetch-bird-call

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Backend is now fully deployed!"
echo ""
echo "What you got:"
echo "  ✅ Species classifications in database"
echo "  ✅ Bird calls table created"
echo "  ✅ fetch-bird-call edge function deployed"
echo ""
echo "Test it now:"
echo "  1. Restart dev server: npm run dev"
echo "  2. Navigate to a region with birds"
echo "  3. Click on a bird species"
echo "  4. Click the 🔊 speaker icon"
echo "  5. Hear the bird call! 🐦🎵"
echo ""
echo "Try these birds:"
echo "  • Northern Cardinal"
echo "  • American Robin"
echo "  • Blue Jay"
echo "  • Common Loon"
echo ""
