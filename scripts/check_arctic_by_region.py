#!/usr/bin/env python3
"""Check Arctic parks by geographic region"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🧊 Arctic Parks by Region\n')
print('=' * 70)

# Arctic Terrestrial ecoregion center from database
arctic_center_lat = 66.23064445586458
arctic_center_lng = -17.250505134135906

print(f'Arctic Terrestrial ecoregion center: ({arctic_center_lat:.2f}, {arctic_center_lng:.2f})')
print('This is near Iceland/Greenland\n')

# Check different Arctic regions
regions = {
    'Alaska': {'lat_range': (60, 72), 'lng_range': (-170, -130)},
    'Canada Arctic': {'lat_range': (60, 83), 'lng_range': (-140, -60)},
    'Greenland': {'lat_range': (60, 84), 'lng_range': (-75, -10)},
    'Iceland': {'lat_range': (63, 67), 'lng_range': (-25, -13)},
    'Svalbard': {'lat_range': (76, 81), 'lng_range': (10, 35)},
    'Northern Scandinavia': {'lat_range': (66, 72), 'lng_range': (15, 35)},
    'Northern Russia': {'lat_range': (66, 80), 'lng_range': (30, 180)}
}

for region_name, bounds in regions.items():
    response = supabase.table('parks')\
        .select('name, center_lat, center_lng, gis_area_km2, marine_area_km2')\
        .gte('center_lat', bounds['lat_range'][0])\
        .lte('center_lat', bounds['lat_range'][1])\
        .gte('center_lng', bounds['lng_range'][0])\
        .lte('center_lng', bounds['lng_range'][1])\
        .order('gis_area_km2', desc=True)\
        .limit(5)\
        .execute()

    parks = response.data

    # Filter parks with area > 0
    parks_with_area = [p for p in parks if p.get('gis_area_km2') and p['gis_area_km2'] > 100]

    print(f'\n{region_name}:')
    print(f'  Total parks: {len(parks)}')
    print(f'  Parks with area > 100 km²: {len(parks_with_area)}')

    if parks_with_area:
        print(f'  Top parks:')
        for park in parks_with_area[:3]:
            area = park.get('gis_area_km2', 0)
            marine_pct = 0
            if park.get('marine_area_km2') and area > 0:
                marine_pct = (park['marine_area_km2'] / area) * 100
            park_type = 'Marine' if marine_pct > 50 else 'Terrestrial'
            print(f'    - {park["name"]}')
            print(f'      ({park["center_lat"]:.2f}, {park["center_lng"]:.2f}), {area:.0f} km², {park_type}')

print('\n' + '=' * 70)
print('\n💡 RECOMMENDATION:')
print('Since the Arctic Terrestrial center is near Iceland/Greenland (-17°W),')
print('we should search for parks in that region specifically, not worldwide.')
print('\nSuggested approach:')
print('1. Search within ±30° longitude of ecoregion center (-47° to 13°)')
print('2. This covers: Greenland, Iceland, and parts of Canada')
print('3. Exclude far regions like Alaska (-150°W) and Svalbard (+20°E)')
