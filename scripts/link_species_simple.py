#!/usr/bin/env python3
"""
Link species to WWF ecoregions using simple Python-based spatial matching
Checks if species sample_points fall within ecoregion boundaries
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import time
from shapely.geometry import shape, Point
from shapely.wkt import loads as wkt_loads

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔗 Linking Species to WWF Ecoregions (Python-based)\n')
print('=' * 60)

# Get ecoregions with geometries
ecoregions = supabase.table('ecoregions').select('*').execute()
print(f'\n📍 Found {len(ecoregions.data)} ecoregions')

# Parse ecoregion geometries
ecoregion_polygons = {}
for eco in ecoregions.data:
    try:
        geom_wkt = eco['geometry']
        polygon = wkt_loads(geom_wkt)
        ecoregion_polygons[eco['id']] = {
            'name': eco['name'],
            'polygon': polygon
        }
        print(f'   ✓ Loaded: {eco["name"]}')
    except Exception as e:
        print(f'   ✗ Error loading {eco["name"]}: {e}')

print(f'\n🔄 Processing species...')
print(f'   This will check each species\' sample points against ecoregion boundaries')
print(f'   Batch size: 1000 species at a time\n')

# Clear existing links
print('🗑️  Clearing existing links...')
supabase.table('species_ecoregions').delete().neq('species_id', '00000000-0000-0000-0000-000000000000').execute()
print('   ✓ Cleared\n')

start_time = time.time()
total_links = 0
processed = 0

# Process species in batches
BATCH_SIZE = 1000
offset = 0

while True:
    # Fetch batch of species
    species_batch = supabase.table('species')\
        .select('id, scientific_name, sample_points')\
        .not_.is_('sample_points', 'null')\
        .range(offset, offset + BATCH_SIZE - 1)\
        .execute()

    if not species_batch.data:
        break

    print(f'Processing species {offset}-{offset+len(species_batch.data)}...')

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

            point = Point(lng, lat)  # Note: shapely uses (lng, lat)

            # Check against all ecoregions
            for eco_id, eco_data in ecoregion_polygons.items():
                if eco_data['polygon'].contains(point):
                    # Species found in this ecoregion
                    links.append({
                        'species_id': species['id'],
                        'ecoregion_id': eco_id
                    })
                    break  # One match per species is enough

    # Insert links for this batch
    if links:
        try:
            supabase.table('species_ecoregions').insert(links).execute()
            total_links += len(links)
            print(f'   ✓ Created {len(links)} links')
        except Exception as e:
            print(f'   ✗ Error inserting: {e}')

    processed += len(species_batch.data)
    offset += BATCH_SIZE

    # Progress update
    if processed % 5000 == 0:
        elapsed = time.time() - start_time
        print(f'\n   Progress: {processed} species, {total_links} links, {elapsed:.1f}s\n')

duration = time.time() - start_time

print('\n' + '=' * 60)
print('🎉 Linking Complete!\n')
print(f'   Species processed: {processed}')
print(f'   Total links created: {total_links}')
print(f'   Duration: {duration:.1f} seconds')
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
