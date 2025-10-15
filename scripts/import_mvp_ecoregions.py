#!/usr/bin/env python3
"""
Import 6 WWF Priority Ecoregions for MVP
Selects diverse, high-interest regions with good species coverage
"""

import os
import sys
from pathlib import Path
import fiona
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv(override=True)

# MVP Ecoregions - diverse, iconic, high biodiversity
MVP_ECOREGIONS = [
    "Amazon and Guianas",          # Iconic rainforest, highest biodiversity
    "Arctic Terrestrial",           # Climate change, polar species
    "Congo Basin",                  # Second largest rainforest
    "Coral Triangle",               # Marine biodiversity hotspot
    "Madagascar",                   # Endemic species island
    "Borneo",                       # Orangutans, deforestation focus
]

SHAPEFILE = Path.home() / 'Downloads' / 'protected-regions' / 'WWF_Priority_Ecoregions.shp'

def init_supabase():
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('❌ Missing Supabase credentials')
        sys.exit(1)
    return create_client(url, key)

def calculate_centroid_and_radius(geometry):
    """Extract centroid and estimated radius from polygon, transform to WGS84"""
    try:
        geom = shape(geometry)

        # Transform from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
        project = pyproj.Transformer.from_crs('EPSG:3857', 'EPSG:4326', always_xy=True).transform
        geom_wgs84 = transform(project, geom)

        # Get centroid in WGS84 (lat/lng)
        centroid = geom_wgs84.centroid

        # Calculate radius from bounding box in degrees, then convert to km
        bounds = geom_wgs84.bounds  # (minx, miny, maxx, maxy) in degrees
        lat_diff = abs(bounds[3] - bounds[1])
        lng_diff = abs(bounds[2] - bounds[0])

        # Convert degrees to km (rough approximation: 1 degree ≈ 111 km)
        radius_km = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111 / 2
        radius_km = min(radius_km, 3000)  # Cap at 3000km

        return {
            'center_latitude': centroid.y,  # Latitude in degrees (-90 to 90)
            'center_longitude': centroid.x,  # Longitude in degrees (-180 to 180)
            'radius_km': round(radius_km, 1),
        }
    except Exception as e:
        print(f"  ⚠️ Error calculating centroid: {e}")
        return None

print('🌍 Importing 6 MVP WWF Priority Ecoregions\n')
print('=' * 60)

supabase = init_supabase()

# Clear existing ecoregions
print('\n🗑️  Clearing existing ecoregions...')
supabase.table('ecoregions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
print('   ✓ Cleared')

print(f'\n📂 Reading: {SHAPEFILE.name}\n')

imported = []

with fiona.open(str(SHAPEFILE)) as src:
    for feature in src:
        props = feature['properties']
        name = props.get('FLAG_NAME') or props.get('simple')

        # Only process MVP ecoregions
        if name not in MVP_ECOREGIONS:
            continue

        print(f'📍 Processing: {name}')

        # Calculate centroid and radius
        geo_data = calculate_centroid_and_radius(feature['geometry'])
        if not geo_data:
            print(f'   ✗ Skipped (geometry error)')
            continue

        # Prepare record matching actual schema
        # Use simple center + radius approach (geometry field is optional)
        record = {
            'ecoregion_id': str(props.get('PRIORIT_ID', name)),  # Use priority ID as unique ID
            'name': name,
            'biome': 'WWF Priority',
            'realm': 'Marine' if props.get('MARINE') == 'Y' else 'Terrestrial',
            'center_lat': geo_data['center_latitude'],
            'center_lng': geo_data['center_longitude'],
            'radius_km': int(geo_data['radius_km']),
            # Skip geometry for now - use center + radius matching instead
        }

        # Insert into database
        try:
            result = supabase.table('ecoregions').insert(record).execute()
            imported.append(name)
            print(f'   ✓ Imported ({geo_data["center_latitude"]:.1f}, {geo_data["center_longitude"]:.1f}, {geo_data["radius_km"]}km)')
        except Exception as e:
            print(f'   ✗ Error: {e}')

print('\n' + '=' * 60)
print(f'✅ Imported {len(imported)}/6 ecoregions:\n')
for name in imported:
    print(f'   • {name}')

print('\n' + '=' * 60)
print('Next step: Link species to these ecoregions')
