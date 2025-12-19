import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print("🔍 Testing migration and curated species...\n")

# Test 1: Check if is_curated column exists
print("1️⃣ Checking if is_curated column exists...")
try:
    result = supabase.table('species').select('is_curated').limit(1).execute()
    print("   ✅ is_curated column exists!")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Count curated vs IUCN species
print("\n2️⃣ Counting curated species...")
try:
    curated = supabase.table('species').select('*', count='exact').eq('is_curated', True).execute()
    total = supabase.table('species').select('*', count='exact').execute()
    print(f"   ✅ Curated species: {curated.count}")
    print(f"   📊 Total species: {total.count}")
    print(f"   📈 Curated percentage: {(curated.count / total.count * 100):.1f}%")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check Arctic curated species
print("\n3️⃣ Checking Arctic curated species...")
try:
    # Get Arctic ecoregion ID
    eco_result = supabase.table('ecoregions').select('id').ilike('name', '%arctic%').limit(1).execute()
    if eco_result.data:
        eco_id = eco_result.data[0]['id']
        
        # Try the new RPC function
        species_result = supabase.rpc('get_curated_species_by_ecoregion_balanced', {
            'ecoregion_uuid': eco_id,
            'max_per_class': 5
        }).execute()
        
        if species_result.data:
            print(f"   ✅ Found {len(species_result.data)} curated Arctic species!")
            print(f"   📋 Species:")
            for sp in species_result.data[:10]:
                print(f"      - {sp.get('common_name', 'Unknown')} ({sp.get('class', 'Unknown')})")
        else:
            print("   ⚠️  No species returned from RPC function")
    else:
        print("   ⚠️  Arctic ecoregion not found")
except Exception as e:
    print(f"   ❌ RPC Error: {e}")
    print("   💡 The migration may not have been applied yet")

print("\n" + "="*70)
print("✅ Import script completed successfully!")
print("💡 Next: Apply the migration in Supabase dashboard if RPC failed")
