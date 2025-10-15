#!/usr/bin/env python3
"""
Diagnose why Coral Triangle species lookup is failing
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(url, key)

print("🔍 Diagnosing Coral Triangle species issue...\n")

# 1. Check if Coral Triangle ecoregion exists
print("1️⃣ Looking for Coral Triangle ecoregion...")
result = supabase.table('ecoregions').select('*').ilike('name', '%coral%').execute()
if result.data:
    ecoregion = result.data[0]
    print(f"   ✅ Found: {ecoregion['name']} (ID: {ecoregion['id']})")
    ecoregion_id = ecoregion['id']
else:
    print("   ❌ Coral Triangle not found in ecoregions table")
    exit(1)

# 2. Check if species_ecoregions table exists and has links
print(f"\n2️⃣ Checking species_ecoregions table for {ecoregion['name']}...")
try:
    result = supabase.table('species_ecoregions').select('species_id').eq('ecoregion_id', ecoregion_id).limit(5).execute()
    print(f"   ✅ Found {len(result.data)} species links (showing first 5)")
    if len(result.data) == 0:
        print("   ⚠️  No species are linked to this ecoregion!")
        print("   💡 You need to run the species linking script")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 3. Check if the function exists
print(f"\n3️⃣ Testing get_balanced_ecoregion_species function...")
try:
    result = supabase.rpc('get_balanced_ecoregion_species', {
        'p_ecoregion_id': ecoregion_id,
        'p_species_per_class': 3
    }).execute()
    print(f"   ✅ Function returned {len(result.data)} species")
    if len(result.data) > 0:
        print(f"   📋 Sample species:")
        for sp in result.data[:3]:
            print(f"      - {sp.get('common_name', 'N/A')} ({sp.get('scientific_name', 'N/A')})")
except Exception as e:
    print(f"   ❌ Function failed: {e}")
    print(f"   💡 The function might not exist or there's a permissions issue")

# 4. Check total species in database
print(f"\n4️⃣ Checking total species in database...")
try:
    result = supabase.table('species').select('id', count='exact').limit(1).execute()
    print(f"   ✅ Total species in database: {result.count}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("📊 DIAGNOSIS SUMMARY:")
print("="*60)

if len(result.data) == 0:
    print("❌ ISSUE: No species are linked to Coral Triangle ecoregion")
    print("   Solution: Run the species linking script:")
    print("   python scripts/link_species_to_ecoregions.py")
else:
    print("✅ Species are linked to Coral Triangle")
    print("   If you still see errors, check:")
    print("   1. Database function permissions (RLS policies)")
    print("   2. Supabase migrations are applied")
