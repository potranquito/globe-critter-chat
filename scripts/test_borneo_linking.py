#!/usr/bin/env python3
"""
Test if Borneo linking works with a small sample
Debug why the full linking script found 0 species
"""

import os
from dotenv import load_dotenv
from supabase import create_client
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

print('🧪 Testing Borneo Linking Logic\n')
print('=' * 70)

# Get Borneo ecoregion
borneo = supabase.table('ecoregions').select('*').eq('name', 'Borneo').execute()
if not borneo.data:
    print('❌ Borneo not found!')
    exit(1)

b = borneo.data[0]
print(f'Borneo: ({b["center_lat"]}, {b["center_lng"]}), radius={b["radius_km"]}km\n')

# Test with a few known species
test_species_names = [
    'Hylobates abbotti',
    'Meristogenys poecilus',
    'Philautus hosii',
    'Ichthyophis monochrous',
]

print('Testing with known Borneo species:\n')

for name in test_species_names:
    species = supabase.table('species')\
        .select('id, scientific_name, sample_points')\
        .eq('scientific_name', name)\
        .limit(1)\
        .execute()

    if not species.data:
        print(f'  ❌ {name}: Not found in database')
        continue

    sp = species.data[0]
    sample_points = sp.get('sample_points', [])

    print(f'  📍 {name}:')
    print(f'     sample_points type: {type(sample_points)}')
    print(f'     sample_points value: {sample_points if isinstance(sample_points, list) else "NOT A LIST"}')

    if not sample_points or not isinstance(sample_points, list):
        print(f'     ❌ No valid sample_points')
        continue

    print(f'     Points: {len(sample_points)}')

    # Check each point
    matched = False
    for i, point in enumerate(sample_points):
        lat = point.get('lat')
        lng = point.get('lng')
        if lat is None or lng is None:
            print(f'       Point {i}: INVALID (lat={lat}, lng={lng})')
            continue

        distance = haversine_distance(lat, lng, b['center_lat'], b['center_lng'])
        within = distance <= b['radius_km']
        status = '✅ MATCH' if within else '❌ TOO FAR'

        print(f'       Point {i}: ({lat}, {lng}) → {distance:.1f}km {status}')

        if within:
            matched = True

    if matched:
        print(f'     ✅ Would be linked to Borneo')
    else:
        print(f'     ❌ Would NOT be linked')

    # Check if already linked
    existing = supabase.table('species_ecoregions')\
        .select('*')\
        .eq('species_id', sp['id'])\
        .eq('ecoregion_id', b['id'])\
        .execute()

    if existing.data:
        print(f'     ℹ️  Already linked in database')
    else:
        print(f'     ⚠️  NOT linked in database')

    print()

# Now run the linking logic on a small batch
print('\n' + '=' * 70)
print('Running linking logic on first 1000 species with sample points:\n')

species_batch = supabase.table('species')\
    .select('id, scientific_name, sample_points')\
    .not_.is_('sample_points', 'null')\
    .range(0, 999)\
    .execute()

print(f'Fetched {len(species_batch.data)} species')

matched_count = 0
for species in species_batch.data:
    sample_points = species.get('sample_points', [])
    if not sample_points or not isinstance(sample_points, list):
        continue

    for point in sample_points:
        lat = point.get('lat')
        lng = point.get('lng')
        if lat is None or lng is None:
            continue

        distance = haversine_distance(lat, lng, b['center_lat'], b['center_lng'])
        if distance <= b['radius_km']:
            matched_count += 1
            break  # One match per species

print(f'Found {matched_count} species within Borneo radius in first 1000\n')

# Check current links for Borneo
print('=' * 70)
print('Current Borneo links in database:\n')

links = supabase.table('species_ecoregions')\
    .select('*, species(scientific_name)')\
    .eq('ecoregion_id', b['id'])\
    .limit(10)\
    .execute()

if links.data:
    print(f'Found {len(links.data)} links (showing first 10):')
    for link in links.data:
        print(f'  • {link["species"]["scientific_name"]}')
else:
    print('❌ NO LINKS FOUND')

# Count total links
count_result = supabase.table('species_ecoregions')\
    .select('*', count='exact', head=True)\
    .eq('ecoregion_id', b['id'])\
    .execute()

print(f'\nTotal Borneo links: {count_result.count}')

print('\n' + '=' * 70)
