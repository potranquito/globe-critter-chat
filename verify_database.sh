#!/bin/bash

# Verification script for Globe Critter Chat database
# This checks if all migrations are applied correctly

echo "🔍 Verifying Globe Critter Chat Database Setup"
echo "================================================"
echo ""

# Database connection from .env
DB_HOST="db.iwmbvpdqwekgxegaxrhr.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASS="Iloveanimals1234!!@"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed."
    echo ""
    echo "Please run these queries manually in the Supabase SQL Editor:"
    echo "https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/editor"
    echo ""
    cat CHECK_DATABASE.sql
    exit 1
fi

echo "✅ psql found, running database checks..."
echo ""

# Function to run query
run_query() {
    local query="$1"
    local description="$2"

    echo "📋 $description"
    echo "---"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query"
    echo ""
}

# 1. Check columns exist
run_query "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'species' AND column_name IN ('species_type', 'ui_group', 'trophic_role', 'is_curated') ORDER BY column_name;" "1. Classification columns"

# 2. Check if species are classified
run_query "SELECT species_type, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage FROM species WHERE species_type IS NOT NULL GROUP BY species_type ORDER BY count DESC;" "2. Species classification distribution"

# 3. Check bird count
run_query "SELECT COUNT(*) as total_birds FROM species WHERE species_type = 'Bird' OR class ILIKE '%aves%';" "3. Total bird species"

# 4. Check bird_calls table
run_query "SELECT COUNT(*) as cached_bird_calls, COUNT(DISTINCT scientific_name) as unique_species FROM bird_calls;" "4. Cached bird calls"

# 5. Sample bird species
run_query "SELECT scientific_name, common_name, class, species_type, ui_group, trophic_role FROM species WHERE common_name ILIKE '%cardinal%' OR common_name ILIKE '%robin%' OR common_name ILIKE '%blue jay%' LIMIT 5;" "5. Sample bird species"

echo "✅ Database verification complete!"
echo ""
echo "Next steps:"
echo "1. ✅ Edge function deployed: fetch-bird-call"
echo "2. 🧪 Test in browser: Open dev server and click on a bird species"
echo "3. 🔊 Look for speaker icon next to 'Ecological Role'"
