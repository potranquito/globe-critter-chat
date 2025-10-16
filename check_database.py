#!/usr/bin/env python3
"""
Check Globe Critter Chat database setup
"""
import os
from supabase import create_client

# Get credentials from environment
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking Globe Critter Chat Database")
print("=" * 50)
print()

# 1. Check if classification columns exist
print("1️⃣ Checking classification columns...")
try:
    result = supabase.table('species').select('species_type, ui_group, trophic_role, is_curated').limit(1).execute()
    print("✅ Classification columns exist!")
    if result.data:
        print(f"   Sample row: {result.data[0]}")
except Exception as e:
    print(f"❌ Error: {e}")
print()

# 2. Check species classification distribution
print("2️⃣ Checking species classification distribution...")
try:
    # Get birds
    birds = supabase.table('species').select('id', count='exact').eq('species_type', 'Bird').execute()
    print(f"   Birds: {birds.count if hasattr(birds, 'count') else 'N/A'}")

    # Get mammals
    mammals = supabase.table('species').select('id', count='exact').eq('species_type', 'Mammal').execute()
    print(f"   Mammals: {mammals.count if hasattr(mammals, 'count') else 'N/A'}")

    # Get species with NULL species_type
    unclassified = supabase.table('species').select('id', count='exact').is_('species_type', 'null').execute()
    print(f"   Unclassified: {unclassified.count if hasattr(unclassified, 'count') else 'N/A'}")
except Exception as e:
    print(f"❌ Error: {e}")
print()

# 3. Check bird_calls table
print("3️⃣ Checking bird_calls table...")
try:
    calls = supabase.table('bird_calls').select('*', count='exact').execute()
    print(f"✅ bird_calls table exists!")
    print(f"   Cached calls: {calls.count if hasattr(calls, 'count') else len(calls.data)}")
except Exception as e:
    print(f"❌ Error: {e}")
print()

# 4. Sample bird species
print("4️⃣ Sample bird species...")
try:
    birds = supabase.table('species').select('scientific_name, common_name, class, species_type, ui_group, trophic_role').ilike('common_name', '%cardinal%').limit(3).execute()
    if birds.data:
        for bird in birds.data:
            print(f"   {bird.get('common_name')} ({bird.get('scientific_name')})")
            print(f"      Class: {bird.get('class')}")
            print(f"      Type: {bird.get('species_type')}")
            print(f"      UI Group: {bird.get('ui_group')}")
            print(f"      Trophic Role: {bird.get('trophic_role')}")
    else:
        print("   No cardinals found")
except Exception as e:
    print(f"❌ Error: {e}")
print()

# 5. Check if get_bird_call function exists
print("5️⃣ Checking database functions...")
try:
    # Try to call the function with a test species
    result = supabase.rpc('get_bird_call', {'p_scientific_name': 'Cardinalis cardinalis'}).execute()
    print(f"✅ get_bird_call function works!")
    print(f"   Result: {result.data}")
except Exception as e:
    print(f"❌ Error calling get_bird_call: {e}")
print()

print("=" * 50)
print("✅ Database check complete!")
print()
print("Next: Check browser console for bird call errors")
