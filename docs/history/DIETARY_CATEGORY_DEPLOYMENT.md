# Dietary Category Filter Implementation - Deployment Guide

## Overview
This update changes the left filter banner from the 3-category system (Animals, Birds, Plants & Corals) to a 4-category dietary system (Carnivores, Herbivores, Omnivores, Producers).

## What Changed

### Database Changes
- **New Field**: Added `dietary_category` column to `species` table
- **New Function**: `classify_dietary_category()` - Maps trophic_role to UI categories
- **Enhanced Function**: `classify_trophic_role_enhanced()` - Better dietary classification logic
- **New Trigger**: Auto-classifies species on insert/update

### Frontend Changes
- **SpeciesTypeFilter.tsx**: Now shows 4 dietary buttons instead of 3 animal groups
- **RegionSpeciesCarousel.tsx**: Updated filtering logic to use dietary_category
- **speciesClassification.ts**: Added `getDietaryCategory()` helper function
- **speciesFilter.ts**: Updated type definitions for new categories

### Backend Changes
- **discover-region-species/index.ts**: Edge function now returns `dietary_category` field

## Deployment Steps

### 1. Apply Database Migration

```bash
# Connect to your Supabase database
psql -h <your-supabase-host> -U postgres -d postgres

# Run the migration
\i supabase/migrations/20251016000001_add_dietary_category.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. Backfill Existing Data

```bash
# Run the backfill script to update all existing species
psql -h <your-supabase-host> -U postgres -d postgres -f backfill_dietary_categories.sql
```

This will:
- Add `dietary_category` to all existing species
- Calculate categories based on existing `trophic_role` data
- Show distribution statistics

### 3. Deploy Frontend Changes

```bash
# Build and deploy frontend
npm run build
npm run deploy  # Or your deployment command
```

### 4. Deploy Backend Edge Function

```bash
# Deploy the updated Edge Function
supabase functions deploy discover-region-species
```

## Verification

### Check Database
```sql
-- Verify dietary categories are populated
SELECT
  dietary_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM species), 2) as percentage
FROM species
WHERE dietary_category IS NOT NULL
GROUP BY dietary_category
ORDER BY count DESC;
```

Expected results:
- **Carnivore**: ~40-50% (predators, scavengers)
- **Omnivore**: ~30-40% (mixed diet, filter-feeders)
- **Herbivore**: ~10-20% (plant-eaters)
- **Producer**: ~5-10% (plants, corals)

### Test Frontend
1. Open the application
2. Look at the left filter banner
3. Should see 4 buttons:
   - 🦁 Carnivores
   - 🦌 Herbivores
   - 🐻 Omnivores
   - 🌿 Producers
4. Click each button and verify species carousel filters correctly

### Test Edge Function
```bash
# Test the discover-region-species function
curl -X POST <your-supabase-url>/functions/v1/discover-region-species \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "centerLat": 70,
      "centerLng": -150,
      "minLat": 65,
      "maxLat": 75,
      "minLng": -160,
      "maxLng": -140
    },
    "regionName": "Arctic Tundra",
    "limit": 10
  }'
```

Verify the response includes `dietaryCategory` field for each species.

## Rollback Plan

If you need to rollback:

### 1. Revert Frontend
```bash
git revert <commit-hash>
npm run build
npm run deploy
```

### 2. Revert Database (Optional)
```sql
-- Remove the dietary_category column
ALTER TABLE species DROP COLUMN IF EXISTS dietary_category;

-- Drop the new functions
DROP FUNCTION IF EXISTS classify_dietary_category(TEXT, TEXT);
DROP FUNCTION IF EXISTS classify_trophic_role_enhanced(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS auto_classify_species_enhanced();
```

### 3. Redeploy Old Edge Function
```bash
git checkout <previous-commit>
supabase functions deploy discover-region-species
```

## Troubleshooting

### Issue: Dietary categories are NULL
**Solution**: Run the backfill script:
```bash
psql -f backfill_dietary_categories.sql
```

### Issue: Filter buttons don't work
**Cause**: Frontend not using dietary_category field
**Solution**: Check that the Edge Function is returning `dietary_category` and frontend is reading it

### Issue: Species classification seems wrong
**Cause**: Classification logic may need refinement
**Solution**: Update `classify_trophic_role_enhanced()` function in migration file and re-run:
```sql
UPDATE species
SET trophic_role = classify_trophic_role_enhanced(species_type, description, common_name, class),
    dietary_category = classify_dietary_category(
      classify_trophic_role_enhanced(species_type, description, common_name, class),
      species_type
    );
```

## Classification Logic

### Carnivores
- Trophic roles: Predator, Scavenger, Parasite
- Examples: Lions, sharks, eagles, crocodiles

### Herbivores
- Trophic roles: Herbivore, Detritivore
- Examples: Deer, elephants, tortoises, parrotfish

### Omnivores
- Trophic roles: Omnivore, Filter-feeder
- Examples: Bears, pigs, primates, baleen whales, manta rays

### Producers
- Trophic roles: Producer, Mixotroph
- Species types: Plant, Coral
- Examples: Seagrass, kelp, corals, trees

## Notes

- Birds are now distributed across dietary categories (raptors = Carnivores, songbirds = Omnivores, etc.)
- Filter-feeders are classified as Omnivores (they eat both phytoplankton and zooplankton)
- The system maintains backward compatibility with old filter types
- Database trigger automatically classifies new species on insert

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs for Edge Function errors
3. Verify database migration was successful
4. Test with sample species to ensure classification is working
