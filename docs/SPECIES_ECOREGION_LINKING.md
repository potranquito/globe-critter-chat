# Species-to-Ecoregion Linking Guide

## Problem Statement

IUCN species weren't showing up for eco-regions because:
1. Species data only had geographic coordinates (`sample_points`) but no ecoregion labels
2. The `species_ecoregions` junction table was empty
3. The frontend query used GBIF API instead of the IUCN database

## Solution Overview

We created a **spatial matching system** that:
1. Uses PostGIS to check if species sample points fall within ecoregion boundaries
2. Populates the `species_ecoregions` junction table with matches
3. Updates the frontend to query IUCN data directly from the database

## Implementation Steps

### Step 1: Apply Database Migration

The migration creates SQL functions for spatial matching.

```bash
# Option A: Using the migration script (requires psql)
./apply-migrations.sh

# Option B: Manual SQL execution
# Run the SQL file: supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql
```

The migration creates these functions:
- `match_species_to_ecoregion_by_points(ecoregion_id)` - Uses geometry boundaries
- `match_species_to_ecoregion_by_proximity(ecoregion_id, lat, lng, radius)` - Uses center + radius
- `get_species_by_ecoregion(ecoregion_id, limit)` - Retrieves species for an ecoregion
- `populate_all_species_ecoregion_links()` - Batch populates all links

### Step 2: Populate Species-Ecoregion Links

#### Option A: SQL Script (Simplest)

```bash
# Run the SQL script to populate all links
psql "your-connection-string" -f populate-species-ecoregion-links.sql
```

This will:
- Match all species to all ecoregions
- Insert records into `species_ecoregions` table
- Show summary statistics

#### Option B: Python Script (More Control)

```bash
# Install dependencies
pip install supabase python-dotenv

# Run the script
python3 scripts/linkSpeciesToEcoregions.py
```

The script provides:
- Progress tracking
- Batch processing
- Error handling
- Detailed logging

### Step 3: Verify the Data

Check that species are linked to ecoregions:

```sql
-- Count total links
SELECT COUNT(*) FROM species_ecoregions;

-- Check species per ecoregion
SELECT
    e.name,
    COUNT(se.species_id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
GROUP BY e.name
ORDER BY species_count DESC
LIMIT 10;

-- Test get_species_by_ecoregion function
SELECT * FROM get_species_by_ecoregion('your-ecoregion-uuid', 10);
```

### Step 4: Update Frontend Query (Already Done)

The `discover-region-species` function now:
1. **First**: Queries the IUCN database via `species_ecoregions` junction table
2. **Second**: Falls back to spatial query using `get_diverse_species_in_region`
3. **Third**: Falls back to GBIF API if no IUCN data is available

## How the Spatial Matching Works

### For Ecoregions with Geometry

Uses **point-in-polygon** matching:

```sql
ST_Contains(
    ecoregion.geometry,
    ST_MakePoint(sample_point.lng, sample_point.lat)
)
```

Calculates `overlap_percentage` based on how many sample points fall within the boundary.

### For Ecoregions with Center Points Only

Uses **distance-based** matching:

```sql
ST_DWithin(
    ST_MakePoint(ecoregion.center_lng, ecoregion.center_lat),
    ST_MakePoint(sample_point.lng, sample_point.lat),
    radius_km * 1000  -- Convert to meters
)
```

### Overlap Percentage

The `overlap_percentage` field indicates what portion of a species' sample points fall within the ecoregion:
- `100%` = All sample points are in this ecoregion
- `50%` = Half of sample points are in this ecoregion
- Species with `>50%` overlap are marked as `is_primary_habitat = true`

## Database Schema

### species_ecoregions (Junction Table)

```sql
CREATE TABLE species_ecoregions (
  species_id UUID REFERENCES species(id),
  ecoregion_id UUID REFERENCES ecoregions(id),
  overlap_percentage DECIMAL,
  is_primary_habitat BOOLEAN,
  PRIMARY KEY (species_id, ecoregion_id)
);
```

## Performance Considerations

- **First run**: May take 5-30 minutes depending on data size
- **Subsequent runs**: Use `ON CONFLICT` to update existing records
- **Indexing**: Proper indexes on `species_id` and `ecoregion_id` ensure fast queries

## Troubleshooting

### No species showing up for ecoregion

```sql
-- Check if ecoregion has any species links
SELECT COUNT(*) FROM species_ecoregions WHERE ecoregion_id = 'your-uuid';

-- If 0, run the matching function manually
SELECT * FROM populate_all_species_ecoregion_links();
```

### Species data is empty

```sql
-- Check if species table has sample_points
SELECT COUNT(*) FROM species WHERE sample_points IS NOT NULL;

-- If 0, you need to run the IUCN data import script
python3 scripts/processIUCNShapefiles.py
```

### Ecoregion has no geometry

```sql
-- Check ecoregion geometry status
SELECT name, geometry IS NOT NULL as has_geometry, center_lat, center_lng
FROM ecoregions
WHERE name ILIKE '%your region%';
```

If no geometry, the proximity matching will be used instead.

## Files Created

1. **Migration**: `supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql`
2. **Python Script**: `scripts/linkSpeciesToEcoregions.py`
3. **SQL Script**: `populate-species-ecoregion-links.sql`
4. **Edge Function**: Updated `supabase/functions/discover-region-species/index.ts`
5. **Migration Script**: Updated `apply-migrations.sh`

## Next Steps

1. ✅ Apply the migration
2. ✅ Populate the species-ecoregion links
3. ⏳ Deploy the updated edge function
4. ⏳ Test in the frontend by clicking on eco-regions
5. ⏳ Verify IUCN species are displaying correctly

## Benefits

- **Fast queries**: Junction table lookups are much faster than spatial calculations
- **Accurate data**: Uses your IUCN shapefile data instead of external APIs
- **Offline support**: No dependency on GBIF API
- **Rich metadata**: Includes conservation status, common names, images from IUCN
- **Flexible**: Falls back to multiple strategies if data is incomplete
