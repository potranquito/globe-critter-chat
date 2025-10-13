# Subspecies & Population Support - Implementation Summary

**Date:** 2025-10-12
**Status:** Ready for migration and import

## What Changed

### 1. Database Schema Enhancement
**File:** `supabase/migrations/20250112000007_add_subspecies_support.sql`

Added fields to track species variants:
- `subspecies` - Subspecies name (e.g., "californianus" for California sea lion)
- `subpopulation` - Population name (e.g., "Southern Resident" for killer whales)
- `presence` - IUCN presence code (1=Extant, 3=Possibly Extinct, etc.)
- `seasonal` - IUCN seasonal code (1=Resident, 2=Breeding, 4=Passage, etc.)
- `source` - Data source
- `distribution_comments` - Distribution notes

**New Primary Key:**
```sql
PRIMARY KEY (iucn_id, COALESCE(subspecies, ''), COALESCE(subpopulation, ''), COALESCE(presence, 0), COALESCE(seasonal, 0))
```

This composite key allows the same species to have multiple entries for different:
- Subspecies
- Geographic populations
- Seasonal occurrences
- Presence status (extant vs possibly extinct)

### 2. Python Import Script Updates
**File:** `scripts/processIUCNShapefiles.py`

**Changes:**
1. Added subspecies/population field extraction from IUCN shapefiles
2. Removed deduplication logic (now keeps all variants)
3. Updated upsert to work with new composite primary key

**New fields captured:**
- `props.get('subspecies')` → `subspecies`
- `props.get('subpop')` → `subpopulation`
- `props.get('presence')` → `presence`
- `props.get('seasonal')` → `seasonal`
- `props.get('source')` → `source`
- `props.get('dist_comm')` → `distribution_comments`

## Why This Matters

### Before:
- **Problem:** MAMMALS.zip has 13,178 records but only ~6,000 unique species
- **Issue:** Multiple entries for same `iucn_id` (e.g., killer whales in different regions)
- **Result:** Import failed with "ON CONFLICT DO UPDATE cannot affect row twice"

### After:
- **Solution:** Composite primary key allows multiple variants per species
- **Benefit:** Can track all killer whale populations separately:
  - Southern Resident (endangered, Pacific Northwest)
  - Transient (different range, different behaviors)
  - Offshore (different diet, different range)
- **Result:** All 13,178+ mammal records can be imported

## Game Design Benefits

### For Players:
1. **Richer discovery** - Find different populations of the same species
2. **Regional accuracy** - Correct whale type shows up in correct location
3. **Conservation nuance** - Learn about different conservation statuses per population

### For Developers:
1. **Flexible queries** - Can show all species OR filter by population
2. **LLM integration** - Can prompt LLM to choose which variant to showcase based on:
   - Player location
   - Seasonal context
   - Story needs
3. **Future expansion** - Easy to add more variant types

## Example Queries

### Get all killer whale variants:
```sql
SELECT scientific_name, subpopulation, conservation_status, presence
FROM species
WHERE scientific_name = 'Orcinus orca';
```

### Get species in a specific region (using sample_points):
```sql
SELECT DISTINCT scientific_name, subpopulation, conservation_status
FROM species
WHERE species_near_location(
  countries,
  sample_points,
  47.6, -122.3,  -- Seattle coordinates
  'USA',
  500  -- 500km radius
);
```

### Get all unique species (ignore variants):
```sql
SELECT DISTINCT iucn_id, scientific_name, conservation_status
FROM species;
```

## Next Steps

1. **Apply Migration** - Run SQL in Supabase dashboard (see MIGRATION_INSTRUCTIONS.md)
2. **Run Import** - Execute `caffeinate -i python3 scripts/processIUCNShapefiles.py`
3. **Verify** - Should see ~6,500+ unique species, 13,178+ total records
4. **Commit** - Git commit with message about subspecies support
5. **Update Docs** - Update HANDOFF.md with new schema and counts

## Files Modified

- ✅ `supabase/migrations/20250112000007_add_subspecies_support.sql` (NEW)
- ✅ `scripts/processIUCNShapefiles.py` (MODIFIED)
- ✅ `MIGRATION_INSTRUCTIONS.md` (NEW)
- ✅ `SUBSPECIES_UPDATE_SUMMARY.md` (NEW)

## Expected Import Results

**Before:** 493 species total
**After:** ~6,500 unique species + variants = 13,178+ total records

**Breakdown:**
- Marine species: ~493 (already imported)
- Mammals (all variants): ~13,178 (NEW)
- **Total unique species:** ~6,500+
- **Total records with variants:** ~13,600+

**Import Time:** ~10-15 minutes (with caffeinate to prevent sleep)

---

**Ready to proceed!** Follow MIGRATION_INSTRUCTIONS.md to complete the setup.
