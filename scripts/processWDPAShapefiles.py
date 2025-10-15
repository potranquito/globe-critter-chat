#!/usr/bin/env python3
"""
WDPA Shapefile Processing Script (Python)

Processes World Database on Protected Areas (WDPA) shapefiles
and imports protected areas into Supabase.

Requirements:
    pip install fiona shapely supabase python-dotenv

Usage:
    python3 scripts/processWDPAShapefiles.py
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
import fiona
from shapely.geometry import shape, Point
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configuration
SHAPEFILE_DIR = Path.home() / 'Downloads' / 'protected-regions'
BATCH_SIZE = 500

def init_supabase() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY')

    if not url or not key:
        raise ValueError("Missing Supabase credentials in .env file")

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
        print(f"  ⚠️  Warning: Could not calculate centroid: {e}")
        return None

def process_wdpa_shapefile(shapefile_path: Path, supabase: Client) -> int:
    """Process a single WDPA shapefile"""
    print(f"\n📦 Processing: {shapefile_path.name}")

    parks_batch = []
    total_inserted = 0

    try:
        with fiona.open(shapefile_path) as src:
            total_features = len(src)
            print(f"  ↳ Total features: {total_features:,}")

            for idx, feature in enumerate(src, 1):
                if idx % 1000 == 0:
                    print(f"  ↳ Processed {idx:,}/{total_features:,} features...", end='\r')

                props = feature['properties']
                geom = feature['geometry']

                # Calculate centroid
                centroid = calculate_centroid(geom)
                if not centroid:
                    continue

                # Map WDPA fields to parks table
                park_data = {
                    'name': props.get('NAME', 'Unknown'),
                    'wdpa_id': props.get('WDPAID'),
                    'designation': props.get('DESIG'),
                    'designation_eng': props.get('DESIG_ENG'),
                    'iucn_category': props.get('IUCN_CAT') if props.get('IUCN_CAT') != 'Not Reported' else None,
                    'status': props.get('STATUS'),
                    'status_year': props.get('STATUS_YR'),
                    'gis_area_km2': props.get('GIS_AREA'),
                    'reported_area_km2': props.get('REP_AREA'),
                    'marine_area_km2': props.get('GIS_M_AREA'),
                    'iso3': props.get('ISO3'),
                    'parent_iso3': props.get('PARENT_ISO'),
                    'governance': props.get('GOV_TYPE'),
                    'own_type': props.get('OWN_TYPE'),
                    'management_authority': props.get('MANG_AUTH'),
                    'verif': props.get('VERIF'),
                    'metadataid': props.get('METADATAID'),
                    'sub_location': props.get('SUB_LOC'),
                    'center_lat': centroid['lat'],
                    'center_lng': centroid['lng'],
                    'park_type': 'protected_area'
                }

                # Clean up None values and empty strings
                park_data = {k: v for k, v in park_data.items() if v not in [None, '', 'Unknown']}

                parks_batch.append(park_data)

                # Insert in batches
                if len(parks_batch) >= BATCH_SIZE:
                    try:
                        supabase.table('parks').insert(parks_batch).execute()
                        total_inserted += len(parks_batch)
                        print(f"    ✓ Inserted {total_inserted:,}/{total_features:,} records", end='\r')
                        parks_batch = []
                    except Exception as e:
                        print(f"\n  ⚠️  Warning: Batch insert failed: {e}")
                        parks_batch = []

            # Insert remaining records
            if parks_batch:
                try:
                    supabase.table('parks').insert(parks_batch).execute()
                    total_inserted += len(parks_batch)
                except Exception as e:
                    print(f"\n  ⚠️  Warning: Final batch insert failed: {e}")

            print(f"\n  ✓ Completed: {total_inserted:,} parks inserted")
            return total_inserted

    except Exception as e:
        print(f"\n  ✗ Error processing shapefile: {e}")
        return total_inserted

def main():
    """Main processing function"""
    print("🌍 WDPA Shapefile Processing Script (Python)")
    print("=" * 60)

    # Initialize Supabase
    try:
        supabase = init_supabase()
        print("✓ Connected to Supabase")
    except Exception as e:
        print(f"✗ Failed to connect to Supabase: {e}")
        sys.exit(1)

    # Find shapefiles
    shapefiles = list(SHAPEFILE_DIR.glob("WDPA_*.shp"))

    if not shapefiles:
        print(f"✗ No WDPA shapefiles found in {SHAPEFILE_DIR}")
        print("  Expected files like: WDPA_Oct2025_Public_shp-polygons.shp")
        sys.exit(1)

    print(f"\n📁 Found {len(shapefiles)} shapefile(s):")
    for shp in shapefiles:
        print(f"  - {shp.name}")

    # Get current count
    try:
        result = supabase.table('parks').select('*', count='exact', head=True).execute()
        initial_count = result.count
        print(f"\n📊 Current parks in database: {initial_count:,}")
    except Exception as e:
        print(f"⚠️  Could not get initial count: {e}")
        initial_count = 0

    print("\nStarting processing...")
    start_time = time.time()

    total_parks = 0

    # Process each shapefile
    for idx, shapefile in enumerate(shapefiles, 1):
        print(f"\n[{idx}/{len(shapefiles)}]")
        parks_added = process_wdpa_shapefile(shapefile, supabase)
        total_parks += parks_added

    elapsed_time = (time.time() - start_time) / 60

    # Get final count
    try:
        result = supabase.table('parks').select('*', count='exact', head=True).execute()
        final_count = result.count
    except Exception as e:
        print(f"⚠️  Could not get final count: {e}")
        final_count = initial_count + total_parks

    # Summary
    print("\n" + "=" * 60)
    print("🎉 Processing Complete!")
    print()
    print(f"   Initial parks: {initial_count:,}")
    print(f"   Final parks: {final_count:,}")
    print(f"   New parks added: {final_count - initial_count:,}")
    print(f"   Shapefiles processed: {len(shapefiles)}")
    print(f"   Duration: {elapsed_time:.1f} minutes")
    print("=" * 60)
    print()

if __name__ == "__main__":
    main()
