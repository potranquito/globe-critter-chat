#!/usr/bin/env python3
"""
Species-to-Ecoregion Spatial Matching Script

This script links IUCN species to ecoregions by checking if their sample_points
fall within ecoregion boundaries using PostGIS spatial functions.

Strategy:
1. For each ecoregion with geometry, find all species whose sample_points fall within it
2. Use PostGIS ST_Contains or ST_DWithin for proximity matching
3. Insert matches into species_ecoregions junction table
4. Calculate overlap percentage based on how many sample points match

Requirements:
    pip install supabase python-dotenv

Usage:
    python3 scripts/linkSpeciesToEcoregions.py
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv
import json
import time

# Load environment variables
load_dotenv()

# Configuration
BATCH_SIZE = 1000  # Process species in batches
PROXIMITY_THRESHOLD_KM = 50  # If ecoregion has no geometry, use proximity matching


def init_supabase() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

    if not url or not key:
        print('❌ Error: Missing Supabase credentials')
        print('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env')
        sys.exit(1)

    return create_client(url, key)


def get_ecoregions_with_geometry(supabase: Client) -> List[Dict]:
    """Fetch all ecoregions that have geometry defined"""
    print('📍 Fetching ecoregions with geometry...')

    try:
        response = supabase.table('ecoregions').select(
            'id, ecoregion_id, name, biome, realm, geometry, center_lat, center_lng, radius_km'
        ).not_.is_('geometry', 'null').execute()

        ecoregions = response.data
        print(f'  ✓ Found {len(ecoregions)} ecoregions with geometry')
        return ecoregions

    except Exception as e:
        print(f'  ✗ Error fetching ecoregions: {e}')
        return []


def get_ecoregions_with_center(supabase: Client) -> List[Dict]:
    """Fetch ecoregions that only have center coordinates (no geometry)"""
    print('📍 Fetching ecoregions with center coordinates...')

    try:
        response = supabase.table('ecoregions').select(
            'id, ecoregion_id, name, biome, realm, center_lat, center_lng, radius_km'
        ).is_('geometry', 'null').not_.is_('center_lat', 'null').execute()

        ecoregions = response.data
        print(f'  ✓ Found {len(ecoregions)} ecoregions with center points')
        return ecoregions

    except Exception as e:
        print(f'  ✗ Error fetching ecoregions: {e}')
        return []


def match_species_to_ecoregion_by_geometry(
    supabase: Client,
    ecoregion: Dict
) -> List[Tuple[str, str, float]]:
    """
    Find all species whose sample_points fall within an ecoregion's geometry.
    Returns list of (species_id, ecoregion_id, overlap_percentage) tuples.
    """
    ecoregion_id = ecoregion['id']
    ecoregion_name = ecoregion['name']

    print(f'  🔍 Matching species to: {ecoregion_name}')

    try:
        # Use PostGIS to find species with sample points within this ecoregion
        # We'll check if ANY sample point falls within the ecoregion geometry
        query = supabase.rpc('match_species_to_ecoregion_by_points', {
            'target_ecoregion_id': ecoregion_id
        })

        response = query.execute()
        matches = response.data or []

        print(f'    ✓ Found {len(matches)} species matches')
        return [(m['species_id'], ecoregion_id, m['overlap_percentage']) for m in matches]

    except Exception as e:
        # If RPC doesn't exist yet, we'll create it later
        print(f'    ⚠ RPC function not available yet: {e}')
        return []


def match_species_to_ecoregion_by_proximity(
    supabase: Client,
    ecoregion: Dict,
    proximity_km: float = 50
) -> List[Tuple[str, str, float]]:
    """
    Find species whose sample_points are within proximity_km of ecoregion center.
    Fallback method for ecoregions without geometry.
    """
    ecoregion_id = ecoregion['id']
    ecoregion_name = ecoregion['name']
    center_lat = ecoregion['center_lat']
    center_lng = ecoregion['center_lng']
    radius_km = ecoregion.get('radius_km', proximity_km)

    print(f'  🔍 Proximity matching for: {ecoregion_name} (radius: {radius_km}km)')

    try:
        # Use PostGIS distance calculation
        query = supabase.rpc('match_species_to_ecoregion_by_proximity', {
            'target_ecoregion_id': ecoregion_id,
            'center_latitude': center_lat,
            'center_longitude': center_lng,
            'radius_km': radius_km
        })

        response = query.execute()
        matches = response.data or []

        print(f'    ✓ Found {len(matches)} species matches')
        return [(m['species_id'], ecoregion_id, m['overlap_percentage']) for m in matches]

    except Exception as e:
        print(f'    ⚠ RPC function not available: {e}')
        return []


def insert_species_ecoregion_links(
    supabase: Client,
    links: List[Tuple[str, str, float]]
) -> Tuple[int, int]:
    """
    Insert species-ecoregion links into the junction table.
    Returns (inserted_count, error_count)
    """
    if not links:
        return 0, 0

    print(f'  💾 Inserting {len(links)} species-ecoregion links...')

    records = [
        {
            'species_id': species_id,
            'ecoregion_id': ecoregion_id,
            'overlap_percentage': overlap_pct,
            'is_primary_habitat': overlap_pct > 50.0
        }
        for species_id, ecoregion_id, overlap_pct in links
    ]

    inserted = 0
    errors = 0

    # Insert in batches
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]

        try:
            # Use upsert to avoid duplicate key errors
            response = supabase.table('species_ecoregions').upsert(
                batch,
                on_conflict='species_id,ecoregion_id'
            ).execute()

            inserted += len(batch)
            print(f'    ✓ Inserted {inserted}/{len(records)} links', end='\r')

        except Exception as e:
            print(f'\n    ✗ Batch insert error: {e}')
            errors += len(batch)

    print(f'\n  ✓ Successfully inserted: {inserted}')
    if errors > 0:
        print(f'  ✗ Errors: {errors}')

    return inserted, errors


def clear_existing_links(supabase: Client):
    """Clear all existing species-ecoregion links"""
    print('🗑️  Clearing existing species-ecoregion links...')

    try:
        response = supabase.table('species_ecoregions').delete().neq('species_id', '00000000-0000-0000-0000-000000000000').execute()
        print('  ✓ Cleared existing links')
    except Exception as e:
        print(f'  ⚠ Warning: Could not clear existing links: {e}')


def create_matching_functions(supabase: Client):
    """Create PostgreSQL functions for spatial matching"""
    print('🔧 Creating spatial matching functions...')

    # Function 1: Match by geometry (point-in-polygon)
    function_1 = """
CREATE OR REPLACE FUNCTION match_species_to_ecoregion_by_points(
    target_ecoregion_id UUID
)
RETURNS TABLE (
    species_id UUID,
    overlap_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH sample_point_matches AS (
        SELECT
            s.id as species_id,
            jsonb_array_elements(s.sample_points) AS point,
            COUNT(*) OVER (PARTITION BY s.id) as total_points
        FROM species s
        WHERE s.sample_points IS NOT NULL
    ),
    point_intersections AS (
        SELECT
            spm.species_id,
            spm.total_points,
            COUNT(*) as matching_points
        FROM sample_point_matches spm
        JOIN ecoregions e ON e.id = target_ecoregion_id
        WHERE e.geometry IS NOT NULL
        AND ST_Contains(
            e.geometry::geometry,
            ST_SetSRID(
                ST_MakePoint(
                    (spm.point->>'lng')::NUMERIC,
                    (spm.point->>'lat')::NUMERIC
                ),
                4326
            )
        )
        GROUP BY spm.species_id, spm.total_points
    )
    SELECT
        pi.species_id,
        ROUND((pi.matching_points::DECIMAL / pi.total_points * 100), 2) as overlap_percentage
    FROM point_intersections pi
    WHERE pi.matching_points > 0;
END;
$$ LANGUAGE plpgsql;
"""

    # Function 2: Match by proximity (distance from center)
    function_2 = """
CREATE OR REPLACE FUNCTION match_species_to_ecoregion_by_proximity(
    target_ecoregion_id UUID,
    center_latitude DECIMAL,
    center_longitude DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    species_id UUID,
    overlap_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH sample_point_matches AS (
        SELECT
            s.id as species_id,
            jsonb_array_elements(s.sample_points) AS point,
            COUNT(*) OVER (PARTITION BY s.id) as total_points
        FROM species s
        WHERE s.sample_points IS NOT NULL
    ),
    point_distances AS (
        SELECT
            spm.species_id,
            spm.total_points,
            COUNT(*) as matching_points
        FROM sample_point_matches spm
        WHERE ST_DWithin(
            ST_MakePoint(center_longitude, center_latitude)::geography,
            ST_MakePoint(
                (spm.point->>'lng')::NUMERIC,
                (spm.point->>'lat')::NUMERIC
            )::geography,
            radius_km * 1000  -- Convert km to meters
        )
        GROUP BY spm.species_id, spm.total_points
    )
    SELECT
        pd.species_id,
        ROUND((pd.matching_points::DECIMAL / pd.total_points * 100), 2) as overlap_percentage
    FROM point_distances pd
    WHERE pd.matching_points > 0;
END;
$$ LANGUAGE plpgsql;
"""

    try:
        # Execute SQL via RPC or direct query
        # Note: Supabase Python client doesn't support direct SQL execution
        # We'll need to run this via SQL file instead
        print('  ⚠ Functions need to be created via SQL migration')
        print('  ℹ Writing functions to migration file...')

        migration_path = Path('supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql')
        migration_path.parent.mkdir(parents=True, exist_ok=True)

        with open(migration_path, 'w') as f:
            f.write('-- Add spatial matching functions for species-ecoregion linking\n')
            f.write('-- Date: October 13, 2025\n\n')
            f.write(function_1)
            f.write('\n\n')
            f.write(function_2)

        print(f'  ✓ Created migration file: {migration_path}')
        print('  ℹ Run migration with: supabase db push')

        return True

    except Exception as e:
        print(f'  ✗ Error creating functions: {e}')
        return False


def main():
    print('🌍 Species-to-Ecoregion Spatial Matching Script\n')
    print('=' * 60)

    # Initialize Supabase
    supabase = init_supabase()

    # Create matching functions
    create_matching_functions(supabase)

    print('\n' + '=' * 60)
    print('⚠️  IMPORTANT: Run the migration before continuing!')
    print('   Command: supabase db push')
    print('   OR manually run the SQL from the migration file')
    print('=' * 60)

    response = input('\nHave you run the migration? (y/n): ')
    if response.lower() != 'y':
        print('\n❌ Exiting. Please run the migration first.')
        sys.exit(0)

    print('\n' + '=' * 60)
    print('Starting species-ecoregion matching...\n')

    start_time = time.time()
    total_links = []

    # Clear existing links (optional)
    clear_response = input('Clear existing species-ecoregion links? (y/n): ')
    if clear_response.lower() == 'y':
        clear_existing_links(supabase)

    # Step 1: Match species to ecoregions with geometry
    print('\n📍 STEP 1: Matching species to ecoregions with geometry...')
    ecoregions_with_geom = get_ecoregions_with_geometry(supabase)

    for i, ecoregion in enumerate(ecoregions_with_geom):
        print(f'\n[{i+1}/{len(ecoregions_with_geom)}] Processing: {ecoregion["name"]}')
        links = match_species_to_ecoregion_by_geometry(supabase, ecoregion)

        if links:
            inserted, errors = insert_species_ecoregion_links(supabase, links)
            total_links.extend(links)

    # Step 2: Match species to ecoregions with only center points
    print('\n📍 STEP 2: Matching species to ecoregions via proximity...')
    ecoregions_with_center = get_ecoregions_with_center(supabase)

    for i, ecoregion in enumerate(ecoregions_with_center):
        print(f'\n[{i+1}/{len(ecoregions_with_center)}] Processing: {ecoregion["name"]}')
        links = match_species_to_ecoregion_by_proximity(
            supabase,
            ecoregion,
            ecoregion.get('radius_km', PROXIMITY_THRESHOLD_KM)
        )

        if links:
            inserted, errors = insert_species_ecoregion_links(supabase, links)
            total_links.extend(links)

    # Summary
    duration = (time.time() - start_time) / 60
    unique_species = len(set(link[0] for link in total_links))
    unique_ecoregions = len(set(link[1] for link in total_links))

    print('\n' + '=' * 60)
    print('🎉 Matching Complete!\n')
    print(f'   Total links created: {len(total_links)}')
    print(f'   Unique species matched: {unique_species}')
    print(f'   Unique ecoregions matched: {unique_ecoregions}')
    print(f'   Duration: {duration:.1f} minutes')
    print('=' * 60)

    print('\n✅ Next steps:')
    print('   1. Update frontend queries to use IUCN species data')
    print('   2. Test eco-region species display')
    print('   3. Verify species are showing up correctly')


if __name__ == '__main__':
    main()
