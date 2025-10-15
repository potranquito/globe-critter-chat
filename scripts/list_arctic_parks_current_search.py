#!/usr/bin/env python3
"""List Arctic parks using the current frontend search criteria"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🧊 Arctic Parks - Current Frontend Search\n')
print('=' * 70)
print('Search criteria:')
print('  - Latitude: >= 63°N')
print('  - Longitude: -60° to +25° (Greenland/Canada/Iceland region)')
print('  - Area: > 1000 km²')
print('=' * 70)

# Use exact same query as frontend
response = supabase.table('parks')\
    .select('name, center_lat, center_lng, designation_eng, gis_area_km2, marine_area_km2, iso3')\
    .gte('center_lat', 63)\
    .gte('center_lng', -60)\
    .lte('center_lng', 25)\
    .gt('gis_area_km2', 1000)\
    .order('gis_area_km2', desc=True)\
    .limit(50)\
    .execute()

parks = response.data
print(f'\nFound {len(parks)} Arctic parks\n')

for i, park in enumerate(parks, 1):
    area = park.get('gis_area_km2', 0)
    marine_pct = 0
    if park.get('marine_area_km2') and area > 0:
        marine_pct = (park['marine_area_km2'] / area) * 100

    park_type = '🌊' if marine_pct > 50 else '🌳'

    print(f'{i:2d}. {park_type} {park["name"]}')
    print(f'     Location: ({park["center_lat"]:.2f}°N, {park["center_lng"]:.2f}°)')
    print(f'     Area: {area:,.0f} km²')
    print(f'     Marine: {marine_pct:.1f}% | Country: {park.get("iso3", "N/A")}')
    print(f'     Designation: {park.get("designation_eng", "N/A")}')
    print()

# Summary
terrestrial_count = sum(1 for p in parks if (p.get('marine_area_km2', 0) / p.get('gis_area_km2', 1) if p.get('gis_area_km2') else 0) <= 0.5)
marine_count = len(parks) - terrestrial_count

print('=' * 70)
print(f'SUMMARY:')
print(f'  Total parks: {len(parks)}')
print(f'  🌳 Terrestrial (<=50% marine): {terrestrial_count}')
print(f'  🌊 Marine (>50% marine): {marine_count}')
