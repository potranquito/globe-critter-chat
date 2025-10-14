#!/usr/bin/env python3
"""
Check current ecoregion realm/habitat data
Identify which are marine vs terrestrial
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌍 Checking Ecoregion Habitat Types\n')
print('=' * 70)

ecoregions = supabase.table('ecoregions').select('*').execute()

print(f'\nTotal ecoregions: {len(ecoregions.data)}\n')

for eco in ecoregions.data:
    print(f'📍 {eco["name"]}')
    print(f'   Realm: {eco.get("realm")}')
    print(f'   Biome: {eco.get("biome")}')
    print(f'   Center: ({eco["center_lat"]:.2f}, {eco["center_lng"]:.2f})')
    print(f'   Radius: {eco["radius_km"]} km')

    # Check species count and sample them
    count = supabase.table('species_ecoregions')\
        .select('*', count='exact', head=True)\
        .eq('ecoregion_id', eco['id'])\
        .execute()

    print(f'   Species count: {count.count:,}')

    # Sample a few species to see their habitat types
    sample = supabase.table('species_ecoregions')\
        .select('species(scientific_name, class, is_marine, is_terrestrial, is_freshwater)')\
        .eq('ecoregion_id', eco['id'])\
        .limit(10)\
        .execute()

    if sample.data:
        marine_count = sum(1 for s in sample.data if s['species'].get('is_marine'))
        terrestrial_count = sum(1 for s in sample.data if s['species'].get('is_terrestrial'))
        freshwater_count = sum(1 for s in sample.data if s['species'].get('is_freshwater'))

        print(f'   Sample (first 10 species):')
        print(f'     Marine: {marine_count}/10')
        print(f'     Terrestrial: {terrestrial_count}/10')
        print(f'     Freshwater: {freshwater_count}/10')

        print(f'   Examples:')
        for s in sample.data[:3]:
            sp = s['species']
            habitats = []
            if sp.get('is_marine'): habitats.append('marine')
            if sp.get('is_terrestrial'): habitats.append('terrestrial')
            if sp.get('is_freshwater'): habitats.append('freshwater')
            print(f'     • {sp["scientific_name"]} ({sp.get("class")}) - {", ".join(habitats) if habitats else "unknown"}')

    print()

print('=' * 70)
print('\n💡 RECOMMENDATIONS:\n')
print('1. Coral Triangle should prioritize marine species (is_marine=true)')
print('2. Borneo should prioritize terrestrial species (is_terrestrial=true)')
print('3. Amazon/Congo should include both terrestrial and freshwater species')
print('4. Update linking script to add habitat-based confidence scores')
print('\nThis will help show the most relevant species for each ecoregion!')
