#!/usr/bin/env python3
"""
Debug why only 2 parks showing instead of 3
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
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

print('🐛 Debugging Congo Basin Park Display\n')
print('=' * 70)

# Get the 3 parks that should be selected
park_names = ['Middle Zambezi', 'Sikanda (Hwange-Block B)', 'Mbi Crater']

for name in park_names:
    parks = supabase.table('parks')\
        .select('*')\
        .ilike('name', f'%{name}%')\
        .limit(1)\
        .execute()

    if parks.data:
        park = parks.data[0]
        print(f'\n📍 {park["name"]}')
        print(f'   ID: {park["id"]}')
        print(f'   Lat: {park["center_lat"]} (type: {type(park["center_lat"])})')
        print(f'   Lng: {park["center_lng"]} (type: {type(park["center_lng"])})')
        print(f'   Valid coords: {park["center_lat"] is not None and park["center_lng"] is not None}')
        print(f'   Area: {park.get("gis_area_km2")}')
        print(f'   Designation: {park.get("designation_eng")}')
    else:
        print(f'\n❌ {name} not found')

# Check distance between the 3 parks
print('\n' + '=' * 70)
print('Distances between selected parks:\n')

park_data = []
for name in park_names:
    parks = supabase.table('parks')\
        .select('name, center_lat, center_lng')\
        .ilike('name', f'%{name}%')\
        .limit(1)\
        .execute()
    if parks.data:
        park_data.append(parks.data[0])

for i, park1 in enumerate(park_data):
    for j, park2 in enumerate(park_data[i+1:], i+1):
        if park1['center_lat'] and park1['center_lng'] and park2['center_lat'] and park2['center_lng']:
            dist = haversine_distance(
                park1['center_lat'], park1['center_lng'],
                park2['center_lat'], park2['center_lng']
            )
            print(f'{park1["name"][:20]} → {park2["name"][:20]}: {dist:.1f} km')
