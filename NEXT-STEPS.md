# Next Steps to Fix Species Display

## What We Just Fixed

1. ✅ **Removed curated MVP data bypass** - The app was using hardcoded species data instead of querying the database
2. ✅ **Code already queries `species_ecoregions` table** - Lines 430-443 in Index.tsx
3. ✅ **Created spatial matching system** - Migration + scripts to link species to ecoregions

## Why Species Still Aren't Showing

The `species_ecoregions` junction table is **empty**. The frontend code is correct, but there's no data to query.

## What You Need to Do Now

### Step 1: Test Current Database State

Run this SQL to diagnose:

```bash
psql "your-connection-string" -f test-species-links.sql
```

Expected issues:
- ✅ Ecoregions exist (you have these)
- ✅ Species exist (you loaded IUCN data)
- ❌ `species_ecoregions` is empty (0 rows)
- ❌ Matching functions don't exist yet

### Step 2: Apply the Migration

This creates the spatial matching functions:

```bash
./apply-migrations.sh
```

Or manually run:
```bash
psql "your-connection-string" -f supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql
```

### Step 3: Populate the Links

**Option A - SQL (Fastest):**
```bash
psql "your-connection-string" -f populate-species-ecoregion-links.sql
```

**Option B - Python (More control):**
```bash
python3 scripts/linkSpeciesToEcoregions.py
```

This will take 5-30 minutes and create thousands of links between species and ecoregions.

### Step 4: Verify It Worked

```sql
-- Should show thousands of links
SELECT COUNT(*) FROM species_ecoregions;

-- Should show species for Arctic
SELECT
    e.name,
    s.common_name,
    s.scientific_name,
    se.overlap_percentage
FROM species_ecoregions se
JOIN species s ON s.id = se.species_id
JOIN ecoregions e ON e.id = se.ecoregion_id
WHERE e.name ILIKE '%arctic%'
ORDER BY se.overlap_percentage DESC
LIMIT 10;
```

### Step 5: Test in Browser

1. Refresh the page
2. Click "Arctic Tundra" eco-region
3. You should see IUCN species displaying!

## Current Code Flow

When you click "Arctic Tundra":

1. **Finds ecoregion** (line 244):
   ```typescript
   .from('ecoregions')
   .ilike('name', '%Arctic Tundra%')
   ```

2. **Queries species** (line 430):
   ```typescript
   .from('species_ecoregions')
   .select('species:species_id(...)')
   .eq('ecoregion_id', ecoregionData.id)
   ```

3. **Displays in carousel** (line 476):
   ```typescript
   setRegionSpecies(speciesList)
   ```

The query is already correct - it just needs data!

## Troubleshooting

### "Ecoregion not found in database"

The name might not match exactly. Check what names exist:

```sql
SELECT name FROM ecoregions
WHERE name ILIKE '%arctic%'
ORDER BY name;
```

### "No species found in ecoregion"

The junction table is empty. Run Step 3 above.

### "Function does not exist"

The migration wasn't applied. Run Step 2 above.

## Files Ready to Use

1. ✅ Migration: `supabase/migrations/20251013000005_add_species_ecoregion_matching_functions.sql`
2. ✅ SQL Script: `populate-species-ecoregion-links.sql`
3. ✅ Python Script: `scripts/linkSpeciesToEcoregions.py`
4. ✅ Test Script: `test-species-links.sql`
5. ✅ Frontend: Already updated to query IUCN database
6. ✅ Quick Start: `QUICKSTART-SPECIES-LINKING.md`
7. ✅ Full Docs: `docs/SPECIES_ECOREGION_LINKING.md`

## Timeline

- Step 1 (test): 1 minute
- Step 2 (migration): 2 minutes
- Step 3 (populate): 5-30 minutes (depending on data size)
- Step 4 (verify): 1 minute
- Step 5 (test): 30 seconds

**Total: ~10-35 minutes**

Then your IUCN species will show up for all eco-regions!
