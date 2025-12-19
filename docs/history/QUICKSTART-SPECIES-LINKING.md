# Quick Start: Linking Species to Ecoregions

## The Problem
Your IUCN species weren't showing up for eco-regions because there was no connection between the geographic coordinates in species data and the ecoregion labels.

## The Solution
We created a spatial matching system using PostGIS that links species to ecoregions based on their geographic sample points.

## Quick Steps to Fix

### 1. Apply the Database Migration

```bash
# Get your Supabase connection string from:
# https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/database

# Run the migration script
./apply-migrations.sh
```

When prompted, enter your connection string:
```
postgresql://postgres:[PASSWORD]@[HOST].supabase.com:6543/postgres
```

### 2. Populate the Species-Ecoregion Links

**Option A - Simple SQL (Recommended):**

```bash
# Using psql with your connection string
psql "your-connection-string" -f populate-species-ecoregion-links.sql
```

**Option B - Python Script (More control):**

```bash
# Make sure you have credentials in .env
python3 scripts/linkSpeciesToEcoregions.py
```

This will take 5-30 minutes depending on your data size. You'll see output like:

```
🌍 Species-to-Ecoregion Spatial Matching Script
============================================================
📍 Fetching ecoregions with geometry...
  ✓ Found 847 ecoregions with geometry

[1/847] Processing: Arctic Tundra
  🔍 Matching species to: Arctic Tundra
    ✓ Found 234 species matches
  💾 Inserting 234 species-ecoregion links...
    ✓ Inserted 234/234 links
...
```

### 3. Deploy the Updated Edge Function

```bash
# The edge function has already been updated in the codebase
# You need to deploy it to Supabase

# Option A: Using Supabase CLI
supabase functions deploy discover-region-species

# Option B: Copy/paste into Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/functions
# Update the "discover-region-species" function with the new code
```

### 4. Test It

1. Refresh your browser
2. Click on an eco-region (green dot on the globe)
3. You should now see IUCN species displaying correctly!

## What Changed?

### Database
- Added 4 new SQL functions for spatial matching
- Populated `species_ecoregions` junction table with ~10k+ links

### Frontend Query
Now uses a 3-tier strategy:
1. **First**: Query IUCN database via `species_ecoregions` table (fastest)
2. **Second**: Direct spatial query using `sample_points` (fallback)
3. **Third**: GBIF API (last resort)

## Verify It's Working

```sql
-- Check how many links were created
SELECT COUNT(*) as total_links FROM species_ecoregions;

-- Check a specific ecoregion (e.g., Arctic Tundra)
SELECT
    e.name as ecoregion,
    s.scientific_name,
    s.common_name,
    se.overlap_percentage
FROM species_ecoregions se
JOIN species s ON s.id = se.species_id
JOIN ecoregions e ON e.id = se.ecoregion_id
WHERE e.name ILIKE '%arctic%'
ORDER BY se.overlap_percentage DESC
LIMIT 10;
```

Expected result: You should see species like Polar Bears, Arctic Foxes, etc. with high overlap percentages.

## Files Modified/Created

1. ✅ `supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql`
2. ✅ `scripts/linkSpeciesToEcoregions.py`
3. ✅ `populate-species-ecoregion-links.sql`
4. ✅ `supabase/functions/discover-region-species/index.ts`
5. ✅ `apply-migrations.sh` (updated)

## Need Help?

See the full documentation: `docs/SPECIES_ECOREGION_LINKING.md`

## Troubleshooting

**"No species found for ecoregion"**
- Run: `SELECT * FROM populate_all_species_ecoregion_links();`
- Check: `SELECT COUNT(*) FROM species WHERE sample_points IS NOT NULL;`

**"Function does not exist"**
- Make sure you ran the migration: `./apply-migrations.sh`

**"Edge function not updated"**
- Deploy the function: `supabase functions deploy discover-region-species`
