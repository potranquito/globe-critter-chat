#!/usr/bin/env python3
"""
Check if parks have ecoregion_id set
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🏞️  Checking Parks-Ecoregion Links\n')
print('=' * 70)

# Check total parks
total = supabase.table('parks').select('*', count='exact', head=True).execute()
print(f'\nTotal parks: {total.count:,}')

# Check how many have ecoregion_id set
with_ecoregion = supabase.table('parks').select('*', count='exact', head=True).filter('ecoregion_id', 'not.is', 'null').execute()
print(f'Parks with ecoregion_id: {with_ecoregion.count:,} ({with_ecoregion.count/total.count*100:.1f}%)')

# Check parks in each ecoregion
print('\n📊 Parks per ecoregion:\n')
ecoregions = supabase.table('ecoregions').select('id, name').execute()

for eco in ecoregions.data:
    parks_count = supabase.table('parks')\
        .select('*', count='exact', head=True)\
        .eq('ecoregion_id', eco['id'])\
        .execute()

    print(f'  {eco["name"]}: {parks_count.count:,} parks')

    # Show a sample park if any exist
    if parks_count.count > 0:
        sample = supabase.table('parks')\
            .select('name, center_lat, center_lng, designation_eng')\
            .eq('ecoregion_id', eco['id'])\
            .limit(1)\
            .execute()
        if sample.data:
            park = sample.data[0]
            print(f'    Sample: {park["name"]} at ({park["center_lat"]:.2f}, {park["center_lng"]:.2f})')

print('\n' + '=' * 70)
print('\n💡 If all counts are 0, parks need to be linked to ecoregions!')
print('   Parks were imported but ecoregion_id was never set.')
print('   We need to spatially link parks to ecoregions based on their location.')
