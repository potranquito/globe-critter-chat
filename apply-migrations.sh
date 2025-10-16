#!/bin/bash
# Script to apply database migrations to Supabase
# This requires psql (PostgreSQL client) to be installed

echo "🚀 Applying database migrations to Supabase..."
echo ""
echo "⚠️  This script needs your Supabase database connection string."
echo "You can find it at: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/settings/database"
echo ""
echo "The connection string looks like:"
echo "postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
echo ""

read -p "Enter your Supabase database connection string: " DB_URL

if [ -z "$DB_URL" ]; then
  echo "❌ No connection string provided. Exiting."
  exit 1
fi

echo ""
echo "📋 Applying migrations in order..."
echo ""

# Migration 1: Initial Schema
echo "1️⃣  Applying initial schema..."
psql "$DB_URL" -f supabase/migrations/20251010000001_initial_schema.sql
if [ $? -eq 0 ]; then
  echo "✅ Initial schema applied successfully"
else
  echo "❌ Failed to apply initial schema"
  exit 1
fi

echo ""

# Migration 2: Species Tables
echo "2️⃣  Applying species database schema..."
psql "$DB_URL" -f supabase/migrations/20251012000000_create_species_tables.sql
if [ $? -eq 0 ]; then
  echo "✅ Species tables created successfully"
else
  echo "❌ Failed to create species tables"
  exit 1
fi

echo ""

# Migration 3: Spatial Query Functions
echo "3️⃣  Applying spatial query functions..."
psql "$DB_URL" -f supabase/migrations/20251013000002_add_spatial_query_functions.sql
if [ $? -eq 0 ]; then
  echo "✅ Spatial query functions created successfully"
else
  echo "❌ Failed to create spatial query functions"
  exit 1
fi

echo ""

# Migration 4: RLS Policies
echo "4️⃣  Applying RLS policies..."
psql "$DB_URL" -f supabase/migrations/20251013000003_add_missing_rls_policies.sql
if [ $? -eq 0 ]; then
  echo "✅ RLS policies applied successfully"
else
  echo "❌ Failed to apply RLS policies"
  exit 1
fi

echo ""

# Migration 5: Species-Ecoregion Matching Functions
echo "5️⃣  Applying species-ecoregion matching functions..."
psql "$DB_URL" -f supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql
if [ $? -eq 0 ]; then
  echo "✅ Species-ecoregion matching functions created successfully"
else
  echo "❌ Failed to create matching functions"
  exit 1
fi

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Run the species-ecoregion linking script: python3 scripts/linkSpeciesToEcoregions.py"
echo "2. Update frontend queries to use IUCN data"
echo "3. Refresh your browser and test eco-region species display"
