#!/usr/bin/env python3
"""
Link species to ecoregions using radius-based proximity matching
Checks if species sample_points fall within ecoregion's center + radius
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import time
import math

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km using Haversine formula"""
    R = 6371  # Earth radius in km

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return R * c

print('🔗 Linking Species to Ecoregions (Radius-based)\n')
print('=' * 60)

# Get ecoregions
ecoregions = supabase.table('ecoregions').select('*').execute()
print(f'\n📍 Ecoregions: {len(ecoregions.data)}\n')
for eco in ecoregions.data:
    print(f'   • {eco["name"]}: ({eco["center_lat"]:.1f}, {eco["center_lng"]:.1f}), r={eco["radius_km"]}km')

# Clear existing links
print(f'\n🗑️  Clearing existing links...')
supabase.table('species_ecoregions').delete().neq('species_id', '00000000-0000-0000-0000-000000000000').execute()
print('   ✓ Cleared\n')

print('🔄 Processing species...\n')

start_time = time.time()
total_links = 0
processed = 0

BATCH_SIZE = 1000
offset = 0

while True:
    # Fetch batch
    species_batch = supabase.table('species')\
        .select('id, scientific_name, sample_points')\
        .not_.is_('sample_points', 'null')\
        .range(offset, offset + BATCH_SIZE - 1)\
        .execute()

    if not species_batch.data:
        break

    links = []

    for species in species_batch.data:
        sample_points = species.get('sample_points', [])
        if not sample_points or not isinstance(sample_points, list):
            continue

        # Check each sample point against each ecoregion
        for point_data in sample_points:
            lat = point_data.get('lat')
            lng = point_data.get('lng')
            if lat is None or lng is None:
                continue

            # Check against all ecoregions
            for eco in ecoregions.data:
                distance = haversine_distance(
                    lat, lng,
                    eco['center_lat'], eco['center_lng']
                )

                if distance <= eco['radius_km']:
                    # Species found within this ecoregion
                    links.append({
                        'species_id': species['id'],
                        'ecoregion_id': eco['id']
                    })
                    # Don't break - allow species to belong to multiple ecoregions

    # Deduplicate links (species can have multiple points in same ecoregion)
    if links:
        seen = set()
        unique_links = []
        for link in links:
            key = (link['species_id'], link['ecoregion_id'])
            if key not in seen:
                seen.add(key)
                unique_links.append(link)

        # Insert unique links
        if unique_links:
            try:
                supabase.table('species_ecoregions').insert(unique_links).execute()
                total_links += len(unique_links)
            except Exception as e:
                print(f'   ✗ Error inserting batch: {e}')

    processed += len(species_batch.data)
    offset += BATCH_SIZE

    # Progress
    if processed % 5000 == 0:
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        print(f'   Progress: {processed:,} species, {total_links:,} links ({rate:.0f} species/sec)')

duration = time.time() - start_time

print('\n' + '=' * 60)
print('🎉 Linking Complete!\n')
print(f'   Species processed: {processed:,}')
print(f'   Total links created: {total_links:,}')
print(f'   Duration: {duration:.1f} seconds')
print('\n' + '=' * 60)

# Summary by ecoregion
print('\n📊 Species per Ecoregion:\n')
for eco in ecoregions.data:
    count_result = supabase.table('species_ecoregions')\
        .select('*', count='exact', head=True)\
        .eq('ecoregion_id', eco['id'])\
        .execute()
    print(f'   {eco["name"]}: {count_result.count:,} species')

print('\n✅ Done! Ready to test in browser.')
