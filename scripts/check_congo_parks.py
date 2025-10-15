#!/usr/bin/env python3
"""
Check how many parks are in Congo Basin region
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

print('🏞️  Checking Parks in Congo Basin\n')
print('=' * 70)

# Get Congo Basin ecoregion
congo = supabase.table('ecoregions').select('*').eq('name', 'Congo Basin').single().execute()
if not congo.data:
    print('❌ Congo Basin not found!')
    exit(1)

print(f'Congo Basin ecoregion:')
print(f'  Center: ({congo.data["center_lat"]:.4f}, {congo.data["center_lng"]:.4f})')
print(f'  Radius: {congo.data["radius_km"]} km')

# Query parks using same logic as frontend
searchRadiusDegrees = congo.data['radius_km'] / 111

parks_data = supabase.table('parks')\
    .select('id, name, center_lat, center_lng, designation_eng, gis_area_km2, wdpa_id, iucn_category')\
    .gte('center_lat', congo.data['center_lat'] - searchRadiusDegrees)\
    .lte('center_lat', congo.data['center_lat'] + searchRadiusDegrees)\
    .gte('center_lng', congo.data['center_lng'] - searchRadiusDegrees)\
    .lte('center_lng', congo.data['center_lng'] + searchRadiusDegrees)\
    .filter('center_lat', 'not.is', 'null')\
    .filter('center_lng', 'not.is', 'null')\
    .order('gis_area_km2', desc=True)\
    .limit(20)\
    .execute()

print(f'\n📊 Parks in bounding box: {len(parks_data.data)}')

# Filter by actual distance
parks_with_distance = []
for park in parks_data.data:
    distance = haversine_distance(
        congo.data['center_lat'],
        congo.data['center_lng'],
        park['center_lat'],
        park['center_lng']
    )
    if distance <= congo.data['radius_km']:
        parks_with_distance.append({
            **park,
            'distance': distance
        })

parks_with_distance.sort(key=lambda p: p['gis_area_km2'] or 0, reverse=True)

print(f'Parks within {congo.data["radius_km"]}km radius: {len(parks_with_distance)}\n')

# Show all parks
for i, park in enumerate(parks_with_distance[:10], 1):
    print(f'{i}. {park["name"]}')
    print(f'   Distance: {park["distance"]:.1f} km')
    print(f'   Location: ({park["center_lat"]:.4f}, {park["center_lng"]:.4f})')
    area = f'{park["gis_area_km2"]:.0f}' if park["gis_area_km2"] else "Unknown"
    print(f'   Area: {area} km²')
    print(f'   Type: {park["designation_eng"] or park["iucn_category"] or "Unknown"}')
    print()

# Apply spacing algorithm
print('=' * 70)
print('Applying 100km spacing algorithm:\n')

selected_parks = []
MIN_DISTANCE_KM = 100

for park in parks_with_distance:
    if len(selected_parks) >= 3:
        break

    # Check if far enough from already selected
    is_far_enough = all(
        haversine_distance(
            park['center_lat'], park['center_lng'],
            selected['center_lat'], selected['center_lng']
        ) >= MIN_DISTANCE_KM
        for selected in selected_parks
    )

    if is_far_enough or len(selected_parks) == 0:
        selected_parks.append(park)
        print(f'✅ Selected: {park["name"]} ({park["distance"]:.1f}km from center)')

print(f'\n📍 Total selected: {len(selected_parks)} parks')

if len(selected_parks) < 3:
    print(f'\n⚠️  Only {len(selected_parks)} parks selected due to 100km spacing requirement')
    print(f'   Total available parks: {len(parks_with_distance)}')
    print(f'   May need to reduce MIN_DISTANCE_KM or increase search limit')
