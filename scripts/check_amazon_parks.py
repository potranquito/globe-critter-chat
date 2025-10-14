#!/usr/bin/env python3
"""Check Amazon parks in database"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌳 Checking Amazon Region Parks\n')
print('=' * 70)

# Search with same query as frontend
search_terms = ['jaú', 'jau', 'manu', 'yasuni', 'yasuní', 'amazon', 'nacional', 'reserva', 'parque', 'national park']

# Build OR query like frontend does
or_query = ','.join([f'name.ilike.%{term}%' for term in search_terms])

response = supabase.table('parks')\
    .select('name, center_lat, center_lng, gis_area_km2, iso3')\
    .or_(or_query)\
    .gte('center_lat', -15)\
    .lte('center_lat', 5)\
    .gte('center_lng', -80)\
    .lte('center_lng', -45)\
    .order('gis_area_km2', desc=True)\
    .limit(50)\
    .execute()

parks = response.data
print(f'Found {len(parks)} Amazon parks\n')

# Look for specific parks
target_parks = ['manu', 'jau', 'jaú', 'yasuni', 'yasuní']
found_targets = []

for i, park in enumerate(parks[:20], 1):
    area = park.get('gis_area_km2') or 0
    park_name_lower = park['name'].lower()

    is_target = False
    for target in target_parks:
        if target in park_name_lower:
            is_target = True
            found_targets.append(park['name'])
            break

    marker = '⭐' if is_target else '  '
    print(f'{marker} {i:2d}. {park["name"]}')
    print(f'       Lat: {park.get("center_lat", "N/A"):.2f}, Lng: {park.get("center_lng", "N/A"):.2f}')
    print(f'       Area: {area:.0f} km², Country: {park.get("iso3", "N/A")}')
    print()

print('\n' + '=' * 70)
print(f'Target parks found: {len(found_targets)}')
if found_targets:
    for target in found_targets:
        print(f'  ✅ {target}')
else:
    print('  ❌ None of the target parks (Manu, Jaú, Yasuni) were found')
    print('\nSearching for each specifically:')

    for target in ['manu', 'jau', 'yasuni']:
        response = supabase.table('parks')\
            .select('name, center_lat, center_lng')\
            .ilike('name', f'%{target}%')\
            .limit(3)\
            .execute()

        if response.data:
            print(f'\n  Parks matching "{target}": {len(response.data)} results')
            for p in response.data:
                print(f'    - {p["name"]} ({p.get("center_lat", "N/A")}, {p.get("center_lng", "N/A")})')
