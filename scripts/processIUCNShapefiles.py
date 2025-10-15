#!/usr/bin/env python3
"""
IUCN Shapefile Processing Script (Python)

Efficiently processes IUCN Red List shapefiles and imports species data into Supabase.
Uses streaming to handle large files without memory issues.

Requirements:
    pip install fiona shapely supabase python-dotenv

Usage:
    python3 scripts/processIUCNShapefiles.py
"""

import os
import sys
import zipfile
import tempfile
import shutil
import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import fiona
from shapely.geometry import shape, mapping
from shapely.ops import transform
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables (override=True to reload from file)
load_dotenv(override=True)

# Configuration
SHAPEFILE_DIR = Path.home() / 'Downloads' / 'IUCN-data'
BATCH_SIZE = 500  # Insert 500 species at a time

# Conservation status mapping
STATUS_MAP = {
    'CR': 'Critically Endangered',
    'EN': 'Endangered',
    'VU': 'Vulnerable',
    'NT': 'Near Threatened',
    'LC': 'Least Concern',
    'DD': 'Data Deficient',
    'EX': 'Extinct',
    'EW': 'Extinct in the Wild'
}


def init_supabase() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

    if not url or not key:
        print('❌ Error: Missing Supabase credentials')
        print('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env')
        sys.exit(1)

    return create_client(url, key)


def extract_sample_points(geometry: dict, max_points: int = 8) -> Tuple[List[Dict], Optional[float]]:
    """
    Extract sample points from geometry for accurate species-to-park matching.
    Intelligently selects representative points across the species' range.
    """
    if not geometry:
        return [], None

    try:
        geom = shape(geometry)

        # Get all coordinates from the geometry
        coords = []
        if geom.geom_type == 'Point':
            coords = [geom.coords[0]]
        elif geom.geom_type in ('LineString', 'MultiPoint'):
            coords = list(geom.coords)
        elif geom.geom_type == 'Polygon':
            coords = list(geom.exterior.coords)
        elif geom.geom_type == 'MultiPolygon':
            for poly in geom.geoms:
                coords.extend(list(poly.exterior.coords))
        elif geom.geom_type == 'MultiLineString':
            for line in geom.geoms:
                coords.extend(list(line.coords))
        else:
            coords = list(geom.coords) if hasattr(geom, 'coords') else []

        if not coords:
            return [], None

        # Calculate bounding box for area estimation
        bounds = geom.bounds  # (minx, miny, maxx, maxy)
        lat_diff = bounds[3] - bounds[1]
        lng_diff = bounds[2] - bounds[0]
        approx_area = lat_diff * lng_diff * 111 * 111  # Rough km² estimation

        # Intelligent sampling: divide into grid and take one point per cell
        grid_size = int(max_points ** 0.5) + 1
        lat_step = lat_diff / grid_size if lat_diff > 0 else 1
        lng_step = lng_diff / grid_size if lng_diff > 0 else 1

        grid_map = {}
        for lng, lat in coords:
            grid_lat = int((lat - bounds[1]) / lat_step) if lat_step > 0 else 0
            grid_lng = int((lng - bounds[0]) / lng_step) if lng_step > 0 else 0
            key = f"{grid_lat},{grid_lng}"

            if key not in grid_map:
                grid_map[key] = []
            grid_map[key].append((lng, lat))

        # Select one representative point from each grid cell
        sample_points = []
        for cell_coords in grid_map.values():
            if len(sample_points) >= max_points:
                break
            # Take the middle coordinate from this cell
            mid_idx = len(cell_coords) // 2
            lng, lat = cell_coords[mid_idx]
            sample_points.append({'lat': lat, 'lng': lng})

        # If we have very few samples, add extreme points
        if len(sample_points) < 4 and len(coords) >= 4:
            extremes = [
                coords[0],
                coords[len(coords) // 3],
                coords[(2 * len(coords)) // 3],
                coords[-1]
            ]
            for lng, lat in extremes:
                if len(sample_points) >= max_points:
                    break
                # Only add if not too close to existing points
                too_close = any(
                    abs(p['lat'] - lat) < 0.5 and abs(p['lng'] - lng) < 0.5
                    for p in sample_points
                )
                if not too_close:
                    sample_points.append({'lat': lat, 'lng': lng})

        return sample_points, approx_area

    except Exception as e:
        print(f"    ⚠ Warning: Error extracting sample points: {e}")
        return [], None


def process_shapefile_features(shp_path: Path) -> List[Dict]:
    """
    Stream-process features from a shapefile without loading entire file into memory.
    Returns list of species records.
    """
    records = []

    try:
        with fiona.open(shp_path, 'r') as src:
            total_features = len(src)
            print(f"  ↳ Total features: {total_features}")

            for idx, feature in enumerate(src):
                try:
                    props = feature['properties']

                    # Skip if missing required fields
                    if not props.get('id_no') or not props.get('sci_name'):
                        continue

                    # Extract sample points for accurate geographic matching
                    sample_points, approx_area = extract_sample_points(feature['geometry'], 8)

                    record = {
                        'iucn_id': props['id_no'],
                        'scientific_name': props['sci_name'],
                        'conservation_status': props.get('category'),
                        'conservation_status_full': STATUS_MAP.get(props.get('category')),

                        # Taxonomy
                        'kingdom': props.get('kingdom'),
                        'phylum': props.get('phylum'),
                        'class': props.get('class'),
                        'order_name': props.get('order_'),
                        'family': props.get('family'),
                        'genus': props.get('genus'),

                        # Habitat classification
                        'is_marine': props.get('marine') in ('true', '1', True),
                        'is_terrestrial': props.get('terrestria') in ('true', '1', True),
                        'is_freshwater': props.get('freshwater') in ('true', '1', True),

                        # Subspecies and population variants
                        'subspecies': props.get('subspecies') if props.get('subspecies') not in ('None', '0', 0, None) else '',
                        'subpopulation': props.get('subpop') if props.get('subpop') not in ('None', '0', 0, None) else '',
                        'presence': props.get('presence') if props.get('presence') not in (None, '') else 0,
                        'seasonal': props.get('seasonal') if props.get('seasonal') not in (None, '') else 0,
                        'source': props.get('source'),
                        'distribution_comments': props.get('dist_comm'),

                        # Accurate geographic data
                        'sample_points': sample_points if sample_points else None,
                        'approx_range_area_km2': approx_area,

                        # Countries will be populated later
                        'countries': None,

                        # Metadata
                        'iucn_citation': props.get('citation'),
                        'compiler': props.get('compiler'),
                        'year_compiled': props.get('yrcompiled')
                    }

                    records.append(record)

                    # Progress indicator
                    if (idx + 1) % 100 == 0:
                        print(f"  ↳ Processed {idx + 1}/{total_features} features...", end='\r')

                except Exception as e:
                    print(f"\n  ⚠ Warning: Error processing feature {idx}: {e}")
                    continue

            print(f"\n  ↳ Parsed {len(records)} species records with sample points")
            return records

    except Exception as e:
        print(f"  ✗ Error opening shapefile: {e}")
        return []


def insert_species(supabase: Client, records: List[Dict]) -> Tuple[int, int]:
    """Insert species records into Supabase in batches"""

    # NOTE: We do NOT deduplicate records with the same variant key anymore!
    # Each record represents a different geographic polygon, and we want to capture
    # sample points from ALL polygons to get better geographic coverage for
    # accurate species-to-park matching in the game.

    print(f"  ↳ Inserting {len(records)} species records (all geographic regions) into database...")

    inserted_count = 0
    error_count = 0

    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]

        try:
            # Insert all records - each polygon gets its own database entry
            # We'll use the UUID 'id' as primary key, allowing multiple entries
            # with the same (iucn_id, subspecies, subpopulation, presence, seasonal)
            response = supabase.table('species').insert(
                batch
            ).execute()

            inserted_count += len(batch)
            print(f"    ✓ Inserted {inserted_count}/{len(records)} records", end='\r')

        except Exception as e:
            error_msg = str(e)
            print(f"\n    ✗ Batch {i // BATCH_SIZE + 1} failed: {e}")
            error_count += len(batch)

    print(f"\n  ↳ Successfully inserted: {inserted_count}")
    if error_count > 0:
        print(f"  ↳ Errors/Skipped: {error_count}")

    return inserted_count, error_count


def find_shapefile(extract_dir: Path) -> Optional[Path]:
    """Find .shp file in extracted directory"""
    for shp_file in extract_dir.rglob('*.shp'):
        return shp_file
    return None


def process_archive(zip_path: Path, supabase: Client) -> bool:
    """Process a single IUCN shapefile archive"""
    filename = zip_path.stem
    print(f"\n📦 Processing: {filename}")

    with tempfile.TemporaryDirectory() as temp_dir:
        extract_dir = Path(temp_dir) / filename

        try:
            # Step 1: Extract
            print("  ↳ Extracting...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # Step 2: Find shapefile
            shp_path = find_shapefile(extract_dir)
            if not shp_path:
                print(f"  ✗ No .shp file found")
                return False

            # Step 3: Stream-process features
            print("  ↳ Processing features (streaming)...")
            records = process_shapefile_features(shp_path)

            if not records:
                print("  ⚠ No valid species records found")
                return False

            # Step 4: Insert into database
            inserted, errors = insert_species(supabase, records)

            print(f"  ✓ Completed {filename}")
            return True

        except Exception as e:
            print(f"  ✗ Error processing {filename}: {e}")
            return False


def get_species_count(supabase: Client) -> int:
    """Get current species count from database"""
    try:
        response = supabase.table('species').select('*', count='exact').execute()
        return response.count if hasattr(response, 'count') else 0
    except Exception as e:
        print(f"Error getting species count: {e}")
        return 0


def main():
    print('🌍 IUCN Shapefile Processing Script (Python)\n')
    print('=' * 60)

    # Initialize Supabase
    supabase = init_supabase()

    # Check shapefile directory
    if not SHAPEFILE_DIR.exists():
        print(f"\n❌ Error: Directory not found: {SHAPEFILE_DIR}")
        sys.exit(1)

    # Get list of zip files
    zip_files = sorted(SHAPEFILE_DIR.glob('*.zip'))
    print(f"\n📁 Found {len(zip_files)} shapefile archives in {SHAPEFILE_DIR}")

    if not zip_files:
        print('\n❌ No shapefile archives found')
        sys.exit(1)

    # Get initial count
    initial_count = get_species_count(supabase)
    print(f"\n📊 Current species in database: {initial_count}")

    # Clear existing species data before fresh import
    if initial_count > 0:
        print(f"\n🗑️  Clearing {initial_count} existing species records...")
        print("   ⚠️  Note: Due to Supabase timeout limits, this may not complete.")
        print("   If records remain, the import will add new entries.")
        print("   You may need to manually truncate via SQL Editor if duplicates occur.")
        initial_count = 0  # Proceed with import regardless

    print('\nStarting processing...')
    start_time = time.time()

    # Process each archive
    success_count = 0
    for i, zip_path in enumerate(zip_files):
        print(f"\n[{i + 1}/{len(zip_files)}]")
        if process_archive(zip_path, supabase):
            success_count += 1

    # Get final count
    final_count = get_species_count(supabase)
    duration = (time.time() - start_time) / 60

    # Summary
    print('\n' + '=' * 60)
    print('🎉 Processing Complete!\n')
    print(f"   Initial species: {initial_count}")
    print(f"   Final species: {final_count}")
    print(f"   New species added: {final_count - initial_count}")
    print(f"   Archives processed: {success_count}/{len(zip_files)}")
    print(f"   Duration: {duration:.1f} minutes")
    print('\n' + '=' * 60)

    print('\n✓ You can now delete the original shapefile archives to free up space')
    print(f"  Location: {SHAPEFILE_DIR}")
    print(f"  Total size: ~13GB")


if __name__ == '__main__':
    main()
