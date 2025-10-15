#!/usr/bin/env python3
"""
Diagnose why Borneo has 0 species linked
Check if IUCN species exist in Borneo region
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

print('🔍 Diagnosing Borneo Species Issue\n')
print('=' * 70)

# 1. Get Borneo ecoregion details
print('\n1️⃣  Borneo Ecoregion Details:')
borneo = supabase.table('ecoregions').select('*').eq('name', 'Borneo').execute()
if borneo.data:
    b = borneo.data[0]
    print(f'   Name: {b["name"]}')
    print(f'   Center: ({b["center_lat"]:.4f}, {b["center_lng"]:.4f})')
    print(f'   Radius: {b["radius_km"]} km')
    borneo_center_lat = b["center_lat"]
    borneo_center_lng = b["center_lng"]
    borneo_radius = b["radius_km"]
else:
    print('   ❌ Borneo ecoregion not found!')
    exit(1)

# 2. Check for species in broad Borneo region (bounding box)
print('\n2️⃣  Species with sample points in Borneo region (0-7°N, 109-119°E):')
print('   Fetching species with sample points...')

species_in_region = []
checked = 0
batch_size = 1000
offset = 0

while True:
    batch = supabase.table('species')\
        .select('id, scientific_name, common_name, sample_points')\
        .not_.is_('sample_points', 'null')\
        .range(offset, offset + batch_size - 1)\
        .execute()

    if not batch.data:
        break

    for species in batch.data:
        sample_points = species.get('sample_points', [])
        if not sample_points or not isinstance(sample_points, list):
            continue

        # Check if any point falls in Borneo bounding box
        for point in sample_points:
            lat = point.get('lat')
            lng = point.get('lng')
            if lat is not None and lng is not None:
                if -5 <= lat <= 10 and 105 <= lng <= 125:
                    species_in_region.append({
                        'id': species['id'],
                        'scientific_name': species['scientific_name'],
                        'common_name': species.get('common_name'),
                        'lat': lat,
                        'lng': lng
                    })
                    break  # Found one point in region, that's enough

    checked += len(batch.data)
    offset += batch_size

    if checked % 10000 == 0:
        print(f'   Checked {checked:,} species, found {len(species_in_region):,} in region...')

print(f'\n   ✅ Found {len(species_in_region):,} species in Borneo region')

# 3. Sample some species
if species_in_region:
    print('\n3️⃣  Sample species in Borneo region:')
    for sp in species_in_region[:10]:
        print(f'   • {sp["scientific_name"]} ({sp["common_name"] or "N/A"}) @ ({sp["lat"]:.2f}, {sp["lng"]:.2f})')

# 4. Calculate distances to Borneo center
print('\n4️⃣  Closest species to Borneo center (0.9°N, 114.2°E):')
distances = []
for sp in species_in_region:
    dist = haversine_distance(sp['lat'], sp['lng'], borneo_center_lat, borneo_center_lng)
    distances.append({
        'species': sp,
        'distance': dist
    })

distances.sort(key=lambda x: x['distance'])

for item in distances[:15]:
    sp = item['species']
    dist = item['distance']
    within_radius = '✅ WITHIN' if dist <= borneo_radius else '❌ OUTSIDE'
    print(f'   {within_radius} {dist:7.1f} km - {sp["scientific_name"]}')

# 5. Count species within different radii
print('\n5️⃣  Species count by distance from Borneo center:')
radii = [500, 1000, 1216, 1500, 2000, 2500, 3000]
for radius in radii:
    count = sum(1 for d in distances if d['distance'] <= radius)
    marker = ' ← CURRENT' if radius == 1216 else ''
    print(f'   Within {radius:4} km: {count:5} species{marker}')

# 6. Recommended action
print('\n' + '=' * 70)
print('📊 DIAGNOSIS SUMMARY:\n')

within_current = sum(1 for d in distances if d['distance'] <= borneo_radius)
within_2000 = sum(1 for d in distances if d['distance'] <= 2000)

print(f'   • Species within current radius ({borneo_radius} km): {within_current}')
print(f'   • Species within 2000 km: {within_2000}')

if within_current == 0:
    print('\n💡 RECOMMENDATION:')
    if within_2000 > 0:
        print(f'   Increase Borneo radius to 2000 km to capture {within_2000} species')
        print('\n   Run this SQL:')
        print('   UPDATE ecoregions SET radius_km = 2000 WHERE name = \'Borneo\';')
        print('   Then re-run: python3 scripts/link_species_radius_based.py')
    else:
        print('   No species found even within 2000 km.')
        print('   Possible issues:')
        print('   - Borneo center coordinates may be incorrect')
        print('   - IUCN data may be sparse for this region')
        print('   - Sample points may use different coordinate format')
else:
    print('\n✅ Species exist within radius - linking script should work!')

print('\n' + '=' * 70)
