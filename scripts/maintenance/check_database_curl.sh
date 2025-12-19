#!/bin/bash

# Check database via Supabase REST API

SUPABASE_URL="https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

echo "🔍 Checking Globe Critter Chat Database"
echo "========================================"
echo ""

echo "1️⃣ Checking classification columns (sample bird)..."
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/species?common_name=ilike.*cardinal*&limit=1&select=scientific_name,common_name,class,species_type,ui_group,trophic_role" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | python3 -m json.tool
echo ""

echo "2️⃣ Checking bird_calls table..."
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/bird_calls?limit=5&select=scientific_name,quality,recordist" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | python3 -m json.tool
echo ""

echo "3️⃣ Testing edge function directly..."
curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/fetch-bird-call" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"scientificName": "Cardinalis cardinalis"}' | python3 -m json.tool
echo ""

echo "✅ Check complete!"
