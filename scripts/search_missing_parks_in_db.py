#!/usr/bin/env python3
"""Search database for the missing parks"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔍 Searching Database for Missing Parks\n')
print('=' * 70)

# Target parks
searches = [
    ('Arctic National Wildlife Refuge', ['arctic national wildlife', 'anwr']),
    ('Gates of the Arctic', ['gates of the arctic', 'gates arctic']),
    ('Tallurutiup Imanga', ['tallurutiup', 'lancaster sound']),
    ('Manu National Park', ['manu', 'parque nacional manu', 'parque nacional del manu']),
    ('Jaú National Park', ['jaú', 'jau', 'parque nacional do jaú', 'parque nacional do jau']),
    ('Yasuni National Park', ['yasuni', 'yasuní', 'parque nacional yasuni'])
]

for park_name, search_terms in searches:
    print(f'\n🔎 Searching for: {park_name}')

    found = False
    for term in search_terms:
        response = supabase.table('parks')\
            .select('name, wdpa_id, center_lat, center_lng, gis_area_km2, iso3, designation_eng')\
            .ilike('name', f'%{term}%')\
            .limit(5)\
            .execute()

        if response.data and len(response.data) > 0:
            found = True
            print(f'   ✅ Found {len(response.data)} match(es) for "{term}":')
            for park in response.data:
                area = park.get('gis_area_km2') or 0
                print(f'      - {park["name"]}')
                print(f'        WDPA ID: {park.get("wdpa_id", "N/A")}')
                print(f'        Location: ({park.get("center_lat", "N/A")}, {park.get("center_lng", "N/A")})')
                print(f'        Area: {area:,.0f} km²')
                print(f'        Country: {park.get("iso3", "N/A")}')
                print(f'        Type: {park.get("designation_eng", "N/A")}')
            break

    if not found:
        print(f'   ❌ Not found in database')

print('\n' + '=' * 70)
print('\n💡 ANALYSIS:')
print('If parks are not found, possible reasons:')
print('1. Parks have different names in WDPA database')
print('2. Parks were skipped during import (status constraint violation)')
print('3. Parks exist as points not polygons (or vice versa)')
print('\nNext steps:')
print('- Check WDPA website for official park names')
print('- Look for alternative naming conventions (e.g., Spanish/Portuguese)')
print('- Check if parks were skipped in import log')
