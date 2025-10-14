#!/usr/bin/env python3
"""Link species to ecoregions using spatial matching"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌍 Linking Species to Ecoregions\n')
print('=' * 60)

# First, check if we have ecoregions
ecoregions = supabase.table('ecoregions').select('*').execute()
print(f'\n📍 Found {len(ecoregions.data)} ecoregions:')
for eco in ecoregions.data:
    print(f'   - {eco["name"]} ({eco["center_latitude"]}, {eco["center_longitude"]}, {eco["radius_km"]}km)')

print('\n' + '=' * 60)
print('🔄 Running spatial matching...')
print('   This calls populate_all_species_ecoregion_links()')
print('   It may take 2-3 minutes to process 53K species...\n')

try:
    # Call the SQL function via RPC
    result = supabase.rpc('populate_all_species_ecoregion_links').execute()
    print('✅ Species-ecoregion linking complete!')

except Exception as e:
    print(f'❌ Error calling function: {e}')
    print('\n💡 You need to run these SQL files in Supabase Dashboard:')
    print('   1. link-species-to-ecoregions-working.sql')
    print('   2. run-ecoregion-linking.sql')
    print('\n   Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql')
    exit(1)

# Check results
print('\n' + '=' * 60)
print('📊 Results:\n')

links = supabase.table('species_ecoregions').select('*', count='exact').execute()
print(f'   Total links created: {links.count}')

# Count unique species and ecoregions
unique_check = supabase.rpc('count_unique_links').execute()

# Check Arctic Tundra specifically
arctic_links = supabase.table('species_ecoregions')\
    .select('*, ecoregions!inner(name)')\
    .eq('ecoregions.name', 'Arctic Tundra')\
    .execute()

if arctic_links.data:
    print(f'   Arctic Tundra species: {len(arctic_links.data)}')

print('\n' + '=' * 60)
print('✅ Done! Species are now linked to ecoregions.')
