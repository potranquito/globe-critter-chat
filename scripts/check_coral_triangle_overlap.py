#!/usr/bin/env python3
"""
Check if Coral Triangle overlaps with Borneo
This would explain why Borneo gets 0 species
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

print('🌊 Checking Coral Triangle - Borneo Overlap\n')
print('=' * 70)

# Get ecoregions
ecoregions = supabase.table('ecoregions').select('*').execute()

coral_triangle = None
borneo = None

for eco in ecoregions.data:
    if eco['name'] == 'Coral Triangle':
        coral_triangle = eco
    elif eco['name'] == 'Borneo':
        borneo = eco

if not coral_triangle or not borneo:
    print('❌ Could not find ecoregions')
    exit(1)

print(f'Coral Triangle:')
print(f'  Center: ({coral_triangle["center_lat"]:.2f}, {coral_triangle["center_lng"]:.2f})')
print(f'  Radius: {coral_triangle["radius_km"]} km')
print()
print(f'Borneo:')
print(f'  Center: ({borneo["center_lat"]:.2f}, {borneo["center_lng"]:.2f})')
print(f'  Radius: {borneo["radius_km"]} km')
print()

# Calculate distance between centers
distance = haversine_distance(
    coral_triangle['center_lat'], coral_triangle['center_lng'],
    borneo['center_lat'], borneo['center_lng']
)

print(f'Distance between centers: {distance:.1f} km')
print()

# Check if regions overlap
coral_reaches_borneo_center = distance <= coral_triangle['radius_km']
borneo_reaches_coral_center = distance <= borneo['radius_km']

print(f'Does Coral Triangle reach Borneo center? {coral_reaches_borneo_center}')
print(f'Does Borneo reach Coral Triangle center? {borneo_reaches_coral_center}')
print()

if coral_reaches_borneo_center:
    print('🚨 PROBLEM IDENTIFIED!')
    print()
    print('Coral Triangle\'s 3000 km radius covers Borneo\'s center!')
    print('Because the linking script processes ecoregions in order and breaks')
    print('after the first match, ALL Borneo species get assigned to Coral')
    print('Triangle instead of Borneo.')
    print()
    print('SOLUTIONS:')
    print('1. Remove the "break" statement (line 94) to allow multiple ecoregion links per species')
    print('2. Use smallest-radius-first matching (prioritize more specific regions)')
    print('3. Reduce Coral Triangle radius or adjust center to avoid Borneo')
    print()
    print('RECOMMENDED: Remove the break statement so species can belong to multiple regions.')

# Test with a known Borneo species
print('\n' + '=' * 70)
print('Testing with Hylobates abbotti (Borneo gibbon):\n')

species = supabase.table('species')\
    .select('id, scientific_name, sample_points')\
    .eq('scientific_name', 'Hylobates abbotti')\
    .limit(1)\
    .execute()

if species.data:
    sp = species.data[0]
    sample_point = sp['sample_points'][0]  # First point
    lat = sample_point['lat']
    lng = sample_point['lng']

    dist_to_borneo = haversine_distance(lat, lng, borneo['center_lat'], borneo['center_lng'])
    dist_to_coral = haversine_distance(lat, lng, coral_triangle['center_lat'], coral_triangle['center_lng'])

    print(f'Sample point: ({lat:.2f}, {lng:.2f})')
    print(f'Distance to Borneo center: {dist_to_borneo:.1f} km (radius={borneo["radius_km"]}km)')
    print(f'Distance to Coral Triangle center: {dist_to_coral:.1f} km (radius={coral_triangle["radius_km"]}km)')
    print()

    matches_borneo = dist_to_borneo <= borneo['radius_km']
    matches_coral = dist_to_coral <= coral_triangle['radius_km']

    print(f'Matches Borneo? {matches_borneo}')
    print(f'Matches Coral Triangle? {matches_coral}')
    print()

    if matches_coral and matches_borneo:
        print('✅ Species matches BOTH regions!')
        print('With current "break" logic, it only gets assigned to Coral Triangle.')
    elif matches_borneo:
        print('✅ Species matches Borneo only')

print('\n' + '=' * 70)
