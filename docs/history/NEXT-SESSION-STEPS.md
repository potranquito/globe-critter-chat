# Next Session: Complete Species-to-Ecoregion Linking

## Current Status

### ✅ What's Done
1. Removed curated MVP data bypass in frontend
2. Created 10 ecoregions (Arctic Tundra, Amazon, etc.)
3. Created spatial matching functions for species-ecoregion linking
4. Fixed WWF ecoregion import script (geometry issues resolved)
5. Frontend already queries `species_ecoregions` table correctly

### ❌ What's Broken
- **sample_points data was accidentally deleted** - all 53,649 species have NULL sample_points
- Need to re-import IUCN data to restore sample_points

## Next Steps (Start Here)

### Step 1: Fix the IUCN Import Script (2 minutes)

The script stores `sample_points` as TEXT using `json.dumps()`. We need it to store as JSONB.

**File:** `scripts/processIUCNShapefiles.py`

**Line 202:** Change from:
```python
'sample_points': json.dumps(sample_points) if sample_points else None,
```

To:
```python
'sample_points': sample_points if sample_points else None,
```

**Why:** Python dict/list automatically converts to JSONB in Supabase. `json.dumps()` creates a string, which causes the "scalar" error.

### Step 2: Clear Existing Species (1 minute)

Before re-importing, clear the broken data:

```sql
DELETE FROM species;
```

Or use the script:
```bash
python3 scripts/clear_species.py
```

### Step 3: Re-import IUCN Data (30 minutes)

```bash
cd ~/repos/globe-critter-chat
source venv/bin/activate
python3 scripts/processIUCNShapefiles.py
```

This will:
- Process all IUCN shapefiles from `~/Downloads/IUCN-data/`
- Extract sample_points from each species' geographic range
- Insert 53K+ species with proper JSONB sample_points

**Expected output:**
```
Processing: AMPHIBIANS.zip
  ✓ Found 8,234 species
  ✓ Inserted 8,234 species

Processing: MAMMALS.zip
  ✓ Found 6,500 species
  ✓ Inserted 6,500 species
...
```

### Step 4: Link Species to Ecoregions (5 minutes)

After import completes, run these SQL files:

```sql
-- Run: link-species-to-ecoregions-working.sql
-- This creates the matching functions

-- Run: run-ecoregion-linking.sql
-- This populates species_ecoregions table
```

**Expected output:**
```
ecoregion_name       | species_matched
---------------------|----------------
Arctic Tundra        | 234
Amazon Rainforest    | 1,567
East African Savanna | 892
...

total_links: 15,432
```

### Step 5: Test in Browser (30 seconds)

1. Refresh browser
2. Click "Arctic Tundra" eco-region pin
3. Species carousel should show real IUCN species!

**Expected:** You'll see species like:
- Rangifer tarandus (Caribou)
- Ursus maritimus (Polar Bear)
- Vulpes lagopus (Arctic Fox)
- Ovibos moschatus (Muskox)

## Files You'll Need

All ready to use:
1. ✅ `scripts/processIUCNShapefiles.py` (needs 1-line fix)
2. ✅ `link-species-to-ecoregions-working.sql`
3. ✅ `run-ecoregion-linking.sql`
4. ✅ Frontend already updated (no changes needed)

## Ecoregions Already Created

You have these 10 ecoregions ready:
1. Arctic Tundra (71°N, -100°W, 1500km radius)
2. Amazon Rainforest
3. Borneo Rainforest
4. Congo Basin
5. East African Savanna
6. Great Barrier Reef
7. Madagascar Forests
8. Mojave Desert
9. Patagonian Steppe
10. Serengeti

## Troubleshooting

### If sample_points is still TEXT after import:
```sql
ALTER TABLE species
ALTER COLUMN sample_points TYPE JSONB USING sample_points::JSONB;
```

### If no species match ecoregions:
Check sample_points format:
```sql
SELECT
    scientific_name,
    jsonb_typeof(sample_points) as type,
    jsonb_array_length(sample_points) as count
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
```

Should return `type: array`, not `string` or `scalar`.

### If import fails:
Check IUCN data location:
```bash
ls ~/Downloads/IUCN-data/*.zip
```

Should show: AMPHIBIANS.zip, MAMMALS.zip, REPTILES.zip, etc.

## Summary

**Time estimate:** ~35 minutes total
- Fix script: 2 min
- Clear data: 1 min
- Import: 30 min (runs automatically)
- Link species: 5 min
- Test: 30 sec

**End result:** Arctic Tundra (and all ecoregions) will show real IUCN species with images, conservation status, and scientific names. The hardcoded curated data is gone - everything comes from your database!

## What We Learned

The issue was a chain of problems:
1. No ecoregions in database → Species couldn't be matched
2. sample_points stored as TEXT string → JSON parsing failed
3. Accidentally deleted sample_points trying to fix it
4. Need to re-import with proper JSONB format

Once the import completes with proper JSONB, everything else is ready to go!
