#!/usr/bin/env python3
"""
WWF Ecoregions Shapefile Processing Script

Processes WWF Priority Ecoregions shapefiles and imports them into Supabase.

Requirements:
    pip install fiona shapely supabase python-dotenv

Usage:
    python3 scripts/processWWFEcoregions.py
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
import fiona
from shapely.geometry import shape, mapping
from shapely.ops import transform
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import json

# Load environment variables
load_dotenv()

# Configuration
SHAPEFILE_DIR = Path.home() / 'Downloads' / 'protected-regions'
BATCH_SIZE = 100

def init_supabase() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

    if not url or not key:
        print('❌ Error: Missing Supabase credentials')
        print('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env')
        sys.exit(1)

    return create_client(url, key)


def calculate_centroid(geometry) -> Optional[Dict[str, float]]:
    """Calculate centroid from geometry"""
    try:
        geom = shape(geometry)
        centroid = geom.centroid
        return {
            'lat': centroid.y,
            'lng': centroid.x
        }
    except Exception as e:
        print(f"  ⚠️ Warning: Could not calculate centroid: {e}")
        return None


def calculate_radius(geometry) -> float:
    """Estimate radius in km from geometry bounds"""
    try:
        geom = shape(geometry)
        bounds = geom.bounds  # (minx, miny, maxx, maxy)

        # Calculate rough radius as half the diagonal of bounding box
        lat_diff = abs(bounds[3] - bounds[1])
        lng_diff = abs(bounds[2] - bounds[0])

        # Rough conversion: 1 degree ≈ 111 km
        radius_km = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111 / 2

        return min(radius_km, 2000)  # Cap at 2000km
    except Exception as e:
        print(f"  ⚠️ Warning: Could not calculate radius: {e}")
        return 100  # Default 100km


def process_wwf_shapefile(shapefile_path: Path, supabase: Client) -> int:
    """Process WWF ecoregions shapefile"""
    print(f"\n📦 Processing: {shapefile_path.name}")

    ecoregions_batch = []
    total_inserted = 0

    try:
        with fiona.open(shapefile_path) as src:
            total_features = len(src)
            print(f"  ↳ Total features: {total_features:,}")

            for idx, feature in enumerate(src, 1):
                if idx % 10 == 0:
                    print(f"  ↳ Processed {idx:,}/{total_features:,} features...", end='\r')

                props = feature['properties']
                geom = feature['geometry']

                # Calculate centroid and radius
                centroid = calculate_centroid(geom)
                if not centroid:
                    continue

                radius_km = calculate_radius(geom)

                # Convert geometry to WKT for PostGIS
                geom_shape = shape(geom)
                geom_wkt = geom_shape.wkt

                # Map WWF fields to ecoregions table
                ecoregion_data = {
                    'ecoregion_id': str(props.get('ECO_ID') or props.get('G200_NUM') or f'wwf_{idx}'),
                    'name': props.get('ECO_NAME') or props.get('G200_REGIO') or 'Unknown Ecoregion',
                    'biome': props.get('BIOME') or props.get('G200_BIOME'),
                    'realm': props.get('REALM') or props.get('G200_REALM'),
                    'center_lat': centroid['lat'],
                    'center_lng': centroid['lng'],
                    'radius_km': int(radius_km),
                    'geometry': f'SRID=4326;{geom_wkt}'
                }

                # Clean up None values
                ecoregion_data = {k: v for k, v in ecoregion_data.items() if v is not None}

                ecoregions_batch.append(ecoregion_data)

                # Insert in batches
                if len(ecoregions_batch) >= BATCH_SIZE:
                    try:
                        supabase.table('ecoregions').upsert(
                            ecoregions_batch,
                            on_conflict='ecoregion_id'
                        ).execute()
                        total_inserted += len(ecoregions_batch)
                        print(f"    ✓ Inserted {total_inserted:,}/{total_features:,} ecoregions", end='\r')
                        ecoregions_batch = []
                    except Exception as e:
                        print(f"\n  ⚠️  Warning: Batch insert failed: {e}")
                        ecoregions_batch = []

            # Insert remaining records
            if ecoregions_batch:
                try:
                    supabase.table('ecoregions').upsert(
                        ecoregions_batch,
                        on_conflict='ecoregion_id'
                    ).execute()
                    total_inserted += len(ecoregions_batch)
                except Exception as e:
                    print(f"\n  ⚠️  Warning: Final batch insert failed: {e}")

            print(f"\n  ✓ Completed: {total_inserted:,} ecoregions inserted")
            return total_inserted

    except Exception as e:
        print(f"\n  ✗ Error processing shapefile: {e}")
        return total_inserted


def main():
    """Main processing function"""
    print('🌍 WWF Ecoregions Shapefile Processing Script\n')
    print('=' * 60)

    # Initialize Supabase
    supabase = init_supabase()
    print('✓ Connected to Supabase')

    # Find shapefiles
    shapefiles = list(SHAPEFILE_DIR.glob("**/WWF*.shp"))
    shapefiles.extend(SHAPEFILE_DIR.glob("**/*ecoregion*.shp"))
    shapefiles.extend(SHAPEFILE_DIR.glob("**/*g200*.shp"))

    if not shapefiles:
        print(f"\n❌ No WWF ecoregion shapefiles found in {SHAPEFILE_DIR}")
        print("  Expected files like: WWF_Priority_Ecoregions.shp")

        # Try to extract if zip exists
        zip_files = list(SHAPEFILE_DIR.glob("WWF*.zip"))
        if zip_files:
            print(f"\n📦 Found zip file: {zip_files[0]}")
            print("  Please extract it first and run this script again")

        sys.exit(1)

    print(f"\n📁 Found {len(shapefiles)} shapefile(s):")
    for shp in shapefiles:
        print(f"  - {shp.name}")

    # Get current count
    try:
        result = supabase.table('ecoregions').select('*', count='exact', head=True).execute()
        initial_count = result.count
        print(f"\n📊 Current ecoregions in database: {initial_count:,}")
    except Exception as e:
        print(f"⚠️  Could not get initial count: {e}")
        initial_count = 0

    print('\nStarting processing...')
    start_time = time.time()

    total_ecoregions = 0

    # Process each shapefile
    for idx, shapefile in enumerate(shapefiles, 1):
        print(f"\n[{idx}/{len(shapefiles)}]")
        ecoregions_added = process_wwf_shapefile(shapefile, supabase)
        total_ecoregions += ecoregions_added

    elapsed_time = (time.time() - start_time) / 60

    # Get final count
    try:
        result = supabase.table('ecoregions').select('*', count='exact', head=True).execute()
        final_count = result.count
    except Exception as e:
        print(f"⚠️  Could not get final count: {e}")
        final_count = initial_count + total_ecoregions

    # Summary
    print('\n' + '=' * 60)
    print('🎉 Processing Complete!\n')
    print(f"   Initial ecoregions: {initial_count:,}")
    print(f"   Final ecoregions: {final_count:,}")
    print(f"   New ecoregions added: {final_count - initial_count:,}")
    print(f"   Shapefiles processed: {len(shapefiles)}")
    print(f"   Duration: {elapsed_time:.1f} minutes")
    print('=' * 60)
    print()
    print('✅ Next steps:')
    print('   1. Run: python3 scripts/linkSpeciesToEcoregions.py')
    print('   2. Refresh browser and test eco-region display')


if __name__ == '__main__':
    main()
