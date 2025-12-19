#!/bin/bash

# Complete Backend Setup Script
# This script applies both species classification and bird calls features

set -e  # Exit on error

echo "🚀 Globe Critter Chat - Complete Backend Setup"
echo "=============================================="
echo ""

# Check for required commands
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "   Please install PostgreSQL client tools"
    exit 1
fi

# Get database URL from .env
DB_URL=$(grep SUPABASE_DB_URL .env | cut -d '=' -f2-)

if [ -z "$DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL not found in .env file"
  echo ""
  echo "Please add your Supabase database URL to .env:"
  echo "SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
  exit 1
fi

echo "📊 Database connection found"
echo "   URL: ${DB_URL:0:40}..."
echo ""

# Migration 1: Species Classification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 MIGRATION 1: Species Classification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This migration adds:"
echo "  • species_type column (Mammal, Bird, Fish, etc.)"
echo "  • ui_group column (Animals, Birds, Plants & Corals)"
echo "  • trophic_role column (Predator, Herbivore, etc.)"
echo "  • Classification functions"
echo "  • Auto-triggers for new species"
echo ""

read -p "Apply species classification migration? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "⏳ Applying migration..."
  psql "$DB_URL" -f supabase/migrations/20251015000001_add_species_classification.sql

  if [ $? -eq 0 ]; then
    echo "✅ Species classification migration complete!"
    echo ""

    # Show stats
    echo "📊 Classification Results:"
    echo ""
    psql "$DB_URL" -c "
      SELECT
        species_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM species
      WHERE species_type IS NOT NULL
      GROUP BY species_type
      ORDER BY count DESC;
    " 2>/dev/null || echo "   (Stats query skipped)"

    echo ""
  else
    echo "❌ Migration 1 failed"
    exit 1
  fi
else
  echo "⏭️  Skipping species classification migration"
fi

echo ""

# Migration 2: Bird Calls
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐦 MIGRATION 2: Bird Calls Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This migration adds:"
echo "  • bird_calls table for caching Xeno-Canto recordings"
echo "  • Functions for fetching/managing bird calls"
echo "  • Performance indexes"
echo "  • RLS policies"
echo ""

read -p "Apply bird calls migration? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "⏳ Applying migration..."
  psql "$DB_URL" -f supabase/migrations/20251015000002_add_bird_calls.sql

  if [ $? -eq 0 ]; then
    echo "✅ Bird calls migration complete!"
    echo ""

    # Show bird species count
    echo "📊 Bird Species Count:"
    psql "$DB_URL" -c "
      SELECT COUNT(*) as bird_species_count
      FROM species
      WHERE species_type = 'Bird';
    " 2>/dev/null || echo "   (Stats query skipped)"

    echo ""
  else
    echo "❌ Migration 2 failed"
    exit 1
  fi
else
  echo "⏭️  Skipping bird calls migration"
fi

echo ""

# Edge Function Deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☁️  EDGE FUNCTION DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To deploy the fetch-bird-call edge function:"
echo ""
echo "  1. Install Supabase CLI (if not installed):"
echo "     npm install -g supabase"
echo ""
echo "  2. Login to Supabase:"
echo "     supabase login"
echo ""
echo "  3. Link your project:"
echo "     supabase link --project-ref [YOUR_PROJECT_REF]"
echo ""
echo "  4. Deploy the function:"
echo "     supabase functions deploy fetch-bird-call"
echo ""
echo "  OR deploy all functions:"
echo "     supabase functions deploy"
echo ""

read -p "Would you like instructions for manual deployment? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "📋 Manual Deployment Steps:"
  echo ""
  echo "Option A: Using Supabase CLI (Recommended)"
  echo "  $ supabase functions deploy fetch-bird-call"
  echo ""
  echo "Option B: Using Supabase Dashboard"
  echo "  1. Go to: https://supabase.com/dashboard/project/[PROJECT]/functions"
  echo "  2. Click 'New Function'"
  echo "  3. Name: fetch-bird-call"
  echo "  4. Copy contents from: supabase/functions/fetch-bird-call/index.ts"
  echo "  5. Click 'Deploy'"
  echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Your backend is now ready!"
echo ""
echo "What you got:"
echo "  ✅ Species classification (species_type, ui_group, trophic_role)"
echo "  ✅ Bird calls table and caching system"
echo "  ✅ Edge function ready to deploy"
echo ""
echo "Next steps:"
echo "  1. Deploy the fetch-bird-call edge function (see instructions above)"
echo "  2. Restart your dev server: npm run dev"
echo "  3. Test bird calls by clicking the speaker icon on bird species cards"
echo ""
echo "Frontend features already active:"
echo "  • Species type filter (Animals, Birds, Plants & Corals)"
echo "  • Ecological roles on species cards"
echo "  • Bird call player (appears on bird cards after edge function deployed)"
echo ""
echo "🐦 Try it with birds like:"
echo "  • Northern Cardinal (Cardinalis cardinalis)"
echo "  • American Robin (Turdus migratorius)"
echo "  • Blue Jay (Cyanocitta cristata)"
echo ""
