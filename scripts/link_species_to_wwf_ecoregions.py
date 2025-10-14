#!/usr/bin/env python3
"""
Link species to WWF ecoregions using spatial matching
Checks if species sample_points fall within ecoregion polygon boundaries
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import time

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔗 Linking Species to WWF Ecoregions\n')
print('=' * 60)

# Get ecoregions
ecoregions = supabase.table('ecoregions').select('*').execute()
print(f'\n📍 Found {len(ecoregions.data)} ecoregions to process\n')

# Clear existing links
print('🗑️  Clearing existing species-ecoregion links...')
supabase.table('species_ecoregions').delete().neq('species_id', '00000000-0000-0000-0000-000000000000').execute()
print('   ✓ Cleared\n')

print('🔄 Starting spatial matching...')
print('   This will check if species sample_points fall within ecoregion polygons')
print('   Processing 53K species × 6 ecoregions = ~318K spatial checks')
print('   Estimated time: 3-5 minutes\n')

start_time = time.time()
total_links = 0

for idx, ecoregion in enumerate(ecoregions.data, 1):
    eco_name = ecoregion['name']
    eco_id = ecoregion['id']

    print(f'[{idx}/{len(ecoregions.data)}] {eco_name}')
    print(f'   Querying species within polygon...')

    try:
        # Use PostGIS spatial query via RPC function
        # This SQL finds species where any sample_point is within the ecoregion geometry
        result = supabase.rpc('match_species_to_ecoregion', {
            'target_ecoregion_id': eco_id
        }).execute()

        if result.data:
            species_matched = len(result.data)
            print(f'   ✓ Matched {species_matched} species')

            # Insert links into junction table
            links = [{'species_id': sp['species_id'], 'ecoregion_id': eco_id}
                     for sp in result.data]

            # Batch insert
            BATCH_SIZE = 500
            for i in range(0, len(links), BATCH_SIZE):
                batch = links[i:i+BATCH_SIZE]
                supabase.table('species_ecoregions').insert(batch).execute()

            total_links += species_matched
            print(f'   ✓ Created {species_matched} links')
        else:
            print(f'   ⚠️  No species matched')

    except Exception as e:
        print(f'   ✗ Error: {e}')
        print('\n💡 The SQL function may not exist. Need to run migration first.')
        print('   See: supabase/migrations/*species_ecoregion_matching_functions.sql')
        sys.exit(1)

    print()

duration = time.time() - start_time

print('=' * 60)
print('🎉 Linking Complete!\n')
print(f'   Total links created: {total_links}')
print(f'   Duration: {duration:.1f} seconds')
print(f'   Average: {total_links/len(ecoregions.data):.0f} species per ecoregion')
print('\n' + '=' * 60)

# Summary by ecoregion
print('\n📊 Species per Ecoregion:\n')
for ecoregion in ecoregions.data:
    count_result = supabase.table('species_ecoregions')\
        .select('*', count='exact', head=True)\
        .eq('ecoregion_id', ecoregion['id'])\
        .execute()
    print(f'   {ecoregion["name"]}: {count_result.count} species')

print('\n✅ Ready to test in browser!')
