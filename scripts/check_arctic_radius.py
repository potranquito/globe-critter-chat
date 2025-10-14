#!/usr/bin/env python3
"""Check what parks are within Arctic Terrestrial ecoregion radius"""

import os
import sys
import math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

# Arctic Terrestrial center
arctic_lat = 66.23064445586458
arctic_lng = -17.250505134135906
arctic_radius = 3000

print('🧊 Checking Parks within Arctic Terrestrial Ecoregion\n')
print('=' * 70)
print(f'Center: ({arctic_lat:.2f}, {arctic_lng:.2f})')
print(f'Radius: {arctic_radius} km\n')

# Get all parks above 60°N
response = supabase.table('parks')\
    .select('name, center_lat, center_lng, gis_area_km2, marine_area_km2, iso3')\
    .gte('center_lat', 60)\
    .limit(200)\
    .execute()

parks = response.data
print(f'Found {len(parks)} parks above 60°N\n')

# Filter by distance and calculate marine %
within_radius = []
for park in parks:
    if park.get('center_lat') and park.get('center_lng'):
        distance = haversine_distance(
            arctic_lat, arctic_lng,
            park['center_lat'], park['center_lng']
        )

        if distance <= arctic_radius:
            marine_pct = 0
            if park.get('marine_area_km2') and park.get('gis_area_km2') and park['gis_area_km2'] > 0:
                marine_pct = (park['marine_area_km2'] / park['gis_area_km2']) * 100

            within_radius.append({
                'name': park['name'],
                'lat': park['center_lat'],
                'lng': park['center_lng'],
                'distance': distance,
                'area': park.get('gis_area_km2', 0) or 0,
                'marine_pct': marine_pct,
                'country': park.get('iso3', 'N/A')
            })

# Sort by area
within_radius.sort(key=lambda x: x['area'], reverse=True)

print(f'Parks within {arctic_radius}km radius: {len(within_radius)}\n')
print('=' * 70)

# Separate marine and terrestrial
terrestrial = [p for p in within_radius if p['marine_pct'] <= 50 and p['area'] > 100]
marine = [p for p in within_radius if p['marine_pct'] > 50 and p['area'] > 100]

print(f'\n🌳 TERRESTRIAL PARKS (area > 100 km²): {len(terrestrial)}\n')
for i, park in enumerate(terrestrial[:10], 1):
    print(f'{i:2d}. {park["name"]}')
    print(f'    Distance: {park["distance"]:.0f} km from center')
    print(f'    Location: ({park["lat"]:.2f}, {park["lng"]:.2f})')
    print(f'    Area: {park["area"]:.0f} km², Marine: {park["marine_pct"]:.1f}%')
    print(f'    Country: {park["country"]}')
    print()

print(f'\n🌊 MARINE PARKS (area > 100 km²): {len(marine)}\n')
for i, park in enumerate(marine[:10], 1):
    print(f'{i:2d}. {park["name"]}')
    print(f'    Distance: {park["distance"]:.0f} km from center')
    print(f'    Location: ({park["lat"]:.2f}, {park["lng"]:.2f})')
    print(f'    Area: {park["area"]:.0f} km², Marine: {park["marine_pct"]:.1f}%')
    print(f'    Country: {park["country"]}')
    print()
