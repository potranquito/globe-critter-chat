#!/usr/bin/env python3
"""
Check if parks table has data
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🏞️  Checking parks table status...\n")

# Check parks count
parks_count = supabase.from_('parks').select('*', count='exact').execute().count or 0

print(f"📊 Parks in database: {parks_count}")

if parks_count > 0:
    # Sample parks
    parks = supabase.from_('parks').select('name, country, center_lat, center_lng').limit(10).execute()
    print("\n📍 Sample parks:")
    for park in parks.data:
        print(f"  - {park['name']} ({park.get('country', 'Unknown')})")

    # Count parks by country
    print("\n🌍 Parks by region (approximation):")
    # Check for tropical parks (Amazon, Congo, Borneo, Madagascar)
    tropical = supabase.from_('parks').select('*', count='exact').gte('center_lat', -30).lte('center_lat', 30).execute().count or 0
    arctic = supabase.from_('parks').select('*', count='exact').gte('center_lat', 60).execute().count or 0

    print(f"  Tropical region (±30°): {tropical} parks")
    print(f"  Arctic region (>60°N): {arctic} parks")
else:
    print("\n⚠️  Parks table is EMPTY!")
    print("\nYou need to import parks data. Options:")
    print("1. Import from Protected Planet API")
    print("2. Import from existing parks backup CSV (if you have one)")
    print("3. Run a parks import script")

print("\n" + "=" * 70)
