#!/usr/bin/env python3
"""
Check what Arctic parks are in the database
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🧊 Checking Arctic Region Parks\n')
print('=' * 70)

# Query parks in Arctic region (above 60°N)
response = supabase.table('parks')\
    .select('name, center_lat, center_lng, designation_eng, gis_area_km2, marine_area_km2, iso3')\
    .gte('center_lat', 60)\
    .order('gis_area_km2', desc=True)\
    .limit(50)\
    .execute()

parks = response.data
print(f'Found {len(parks)} parks above 60°N\n')

# Count marine vs terrestrial
marine_count = 0
terrestrial_count = 0

for i, park in enumerate(parks[:30], 1):
    marine_pct = 0
    if park.get('marine_area_km2') and park.get('gis_area_km2') and park['gis_area_km2'] > 0:
        marine_pct = (park['marine_area_km2'] / park['gis_area_km2']) * 100
    park_type = '🌊 Marine' if marine_pct > 50 else '🌳 Terrestrial'

    if marine_pct > 50:
        marine_count += 1
    else:
        terrestrial_count += 1

    area = park.get('gis_area_km2') or 0
    print(f'{i:2d}. {park_type} {park["name"]}')
    print(f'    Lat: {park["center_lat"]:.2f}, Lng: {park.get("center_lng", 0):.2f}')
    print(f'    Area: {area:.0f} km², Marine: {marine_pct:.1f}%')
    print(f'    Country: {park.get("iso3", "N/A")}')
    print()

print('\n' + '=' * 70)
print(f'Summary: {marine_count} marine parks, {terrestrial_count} terrestrial parks\n')

print('=' * 70)
print('Searching for specific parks you mentioned:\n')

# Search for specific parks
search_terms = [
    'arctic national wildlife',
    'gates of the arctic',
    'tallurutiup',
    'greenland',
    'svalbard',
    'arctic',
    'wildlife refuge',
    'gates'
]

for term in search_terms:
    response = supabase.table('parks')\
        .select('name, center_lat, center_lng, gis_area_km2, marine_area_km2')\
        .ilike('name', f'%{term}%')\
        .limit(5)\
        .execute()
    if response.data:
        print(f'\n📍 Parks matching "{term}": {len(response.data)} results')
        for park in response.data[:3]:
            marine_pct = 0
            if park.get('marine_area_km2') and park.get('gis_area_km2') and park['gis_area_km2'] > 0:
                marine_pct = (park['marine_area_km2'] / park['gis_area_km2']) * 100
            lat = park.get('center_lat', 'N/A')
            if isinstance(lat, (int, float)):
                lat = f'{lat:.2f}'
            print(f'  - {park["name"]} (Lat: {lat}, Marine: {marine_pct:.1f}%)')
