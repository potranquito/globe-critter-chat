#!/usr/bin/env python3
"""List Amazon parks using the current frontend search criteria"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌳 Amazon Parks - Current Frontend Search\n')
print('=' * 70)
print('Search criteria:')
print('  - Keywords: jaú, jau, manu, yasuni, yasuní, amazon, nacional, reserva, parque, national park')
print('  - Latitude: -15° to 5°N')
print('  - Longitude: -80° to -45°')
print('=' * 70)

# Use exact same query as frontend
search_terms = ['jaú', 'jau', 'manu', 'yasuni', 'yasuní', 'amazon', 'nacional', 'reserva', 'parque', 'national park']
or_query = ','.join([f'name.ilike.%{term}%' for term in search_terms])

response = supabase.table('parks')\
    .select('name, center_lat, center_lng, designation_eng, gis_area_km2, marine_area_km2, iso3')\
    .or_(or_query)\
    .gte('center_lat', -15)\
    .lte('center_lat', 5)\
    .gte('center_lng', -80)\
    .lte('center_lng', -45)\
    .order('gis_area_km2', desc=True)\
    .limit(50)\
    .execute()

parks = response.data
print(f'\nFound {len(parks)} Amazon parks\n')

# Filter for parks with area > 0
parks_with_area = [p for p in parks if p.get('gis_area_km2') and p['gis_area_km2'] > 0]

print(f'Parks with area data (> 0 km²): {len(parks_with_area)}\n')

for i, park in enumerate(parks_with_area[:30], 1):
    area = park.get('gis_area_km2', 0)
    marine_pct = 0
    if park.get('marine_area_km2') and area > 0:
        marine_pct = (park['marine_area_km2'] / area) * 100

    park_type = '🌊' if marine_pct > 50 else '🌳'

    print(f'{i:2d}. {park_type} {park["name"]}')
    print(f'     Location: ({park["center_lat"]:.2f}°, {park["center_lng"]:.2f}°)')
    print(f'     Area: {area:,.0f} km²')
    print(f'     Marine: {marine_pct:.1f}% | Country: {park.get("iso3", "N/A")}')
    print(f'     Designation: {park.get("designation_eng", "N/A")}')
    print()

# Summary
print('=' * 70)
print(f'SUMMARY:')
print(f'  Total parks found: {len(parks)}')
print(f'  Parks with area > 0: {len(parks_with_area)}')
print(f'  Parks with no area data: {len(parks) - len(parks_with_area)}')

# Check for specific target parks
print('\n' + '=' * 70)
print('Checking for specific parks you mentioned:\n')

target_searches = {
    'Manu National Park': ['manu national', 'manu'],
    'Jaú National Park': ['jau national', 'jaú', 'jau'],
    'Yasuni National Park': ['yasuni', 'yasuní']
}

for park_name, search_terms in target_searches.items():
    found = False
    for term in search_terms:
        matching = [p for p in parks if term.lower() in p['name'].lower()]
        if matching:
            print(f'✅ Found matches for "{park_name}": {len(matching)} results')
            for m in matching[:2]:
                print(f'   - {m["name"]} ({m.get("gis_area_km2", 0):.0f} km²)')
            found = True
            break
    if not found:
        print(f'❌ No matches for "{park_name}"')
