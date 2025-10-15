#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Get Coral Triangle ecoregion
eco = supabase.table('ecoregions').select('*').ilike('name', '%coral%').execute().data[0]
print(f"🌊 Coral Triangle Ecoregion:")
print(f"   Name: {eco['name']}")
print(f"   Is Marine: {eco.get('is_marine', 'N/A')}")
print(f"   Realm: {eco.get('realm', 'N/A')}")
print(f"   Biome: {eco.get('biome', 'N/A')}")

# Call the function to get species
result = supabase.rpc('get_balanced_ecoregion_species', {
    'p_ecoregion_id': eco['id'],
    'p_species_per_class': 10
}).execute()

print(f"\n📊 Function returned {len(result.data)} species:")
print(f"\n   Breakdown by habitat type:")

marine_count = sum(1 for s in result.data if s.get('is_marine'))
terrestrial_count = sum(1 for s in result.data if s.get('is_terrestrial'))
freshwater_count = sum(1 for s in result.data if s.get('is_freshwater'))

print(f"   - Marine: {marine_count}")
print(f"   - Terrestrial: {terrestrial_count}")
print(f"   - Freshwater: {freshwater_count}")

print(f"\n   Sample species (first 10):")
for i, sp in enumerate(result.data[:10]):
    habitat_flags = []
    if sp.get('is_marine'): habitat_flags.append('🌊 Marine')
    if sp.get('is_terrestrial'): habitat_flags.append('🌲 Terrestrial')
    if sp.get('is_freshwater'): habitat_flags.append('💧 Freshwater')
    habitat_str = ', '.join(habitat_flags) if habitat_flags else '❓ Unknown'
    print(f"   {i+1}. {sp.get('common_name', 'N/A')} - {habitat_str}")

# Now check what's being filtered in the frontend
print(f"\n🔍 Analyzing frontend filtering logic:")
print(f"   Ecoregion is_marine: {eco.get('is_marine')}")
print(f"   Ecoregion is_terrestrial: {eco.get('is_terrestrial')}")

if eco.get('is_marine') and not eco.get('is_terrestrial'):
    print(f"\n   ⚠️  Frontend will apply STRICT MARINE filtering")
    print(f"   Only showing species where is_marine = true")
    filtered = [s for s in result.data if s.get('is_marine')]
    print(f"   Result: {len(filtered)} species pass the filter (from {len(result.data)} total)")
    if len(filtered) == 0:
        print(f"\n   ❌ PROBLEM FOUND: All species have is_marine = false!")
        print(f"   This is why you see 0 species in the UI")
