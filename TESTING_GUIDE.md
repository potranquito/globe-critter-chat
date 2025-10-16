# Testing Guide - Species Diversity & Media Enrichment

This guide helps you test the new balanced species selection and media enrichment features.

## Pre-requisites

1. Database migration applied
2. Edge Functions deployed
3. Python environment with required packages (`requests`, `supabase`, `python-dotenv`)

## Quick Start

### 1. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply manually
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase/migrations/20251014000001_balanced_species_and_media.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy image fetch function
supabase functions deploy wikimedia-image-fetch

# Deploy updated discovery function
supabase functions deploy discover-region-species
```

### 3. Test Database Functions

```sql
-- Test 1: Find an ecoregion to test with
SELECT id, name
FROM ecoregions
WHERE name ILIKE '%borneo%'
LIMIT 1;

-- Test 2: Get balanced species for that ecoregion
-- Replace the UUID with the one from Test 1
SELECT
  taxonomic_group,
  scientific_name,
  common_name,
  conservation_status,
  image_url
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := '123e4567-e89b-12d3-a456-426614174000',  -- Replace with actual UUID
  p_species_per_class := 3
)
ORDER BY taxonomic_group, scientific_name;

-- Test 3: Check diversity distribution
SELECT
  taxonomic_group,
  COUNT(*) as species_count
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := '123e4567-e89b-12d3-a456-426614174000',  -- Replace with actual UUID
  p_species_per_class := 3
)
GROUP BY taxonomic_group
ORDER BY species_count DESC;

-- Test 4: Test spatial query (for areas without ecoregion data)
SELECT
  taxonomic_group,
  scientific_name,
  common_name,
  conservation_status
FROM get_balanced_spatial_species(
  p_region_lat := 3.5,
  p_region_lng := 114.0,
  p_radius_degrees := 5.0,
  p_species_per_class := 3
)
ORDER BY taxonomic_group, scientific_name;
```

### 4. Test Image Enrichment

```bash
# Test with 5 species (dry run)
python scripts/enrichMediaFromWikimedia.py --type species --limit 5

# Check the results
psql "postgresql://..." -c "
SELECT
  scientific_name,
  common_name,
  image_source,
  image_url IS NOT NULL as has_image
FROM species
WHERE image_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
"

# Test with parks
python scripts/enrichMediaFromWikimedia.py --type parks --limit 5

# Test with ecoregions
python scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 5
```

### 5. Test Edge Function via API

```bash
# Test the discover-region-species function
curl -X POST 'https://your-project.supabase.co/functions/v1/discover-region-species' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bounds": {
      "minLat": 0,
      "maxLat": 7,
      "minLng": 109,
      "maxLng": 119,
      "centerLat": 3.5,
      "centerLng": 114
    },
    "regionName": "Borneo lowland rain forests",
    "limit": 18
  }' | jq '.'

# Test the wikimedia-image-fetch function
curl -X POST 'https://your-project.supabase.co/functions/v1/wikimedia-image-fetch' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "searchTerm": "Panthera tigris",
    "type": "species",
    "preferredSize": 800,
    "fetchCommonNameFlag": true
  }' | jq '.'
```

## Detailed Testing Scenarios

### Scenario 1: Verify Balanced Distribution

**Goal:** Ensure species are distributed evenly across taxonomic groups

```sql
-- Count species by taxonomic group in Borneo
WITH borneo_species AS (
  SELECT *
  FROM get_balanced_ecoregion_species(
    p_ecoregion_id := (SELECT id FROM ecoregions WHERE name ILIKE '%borneo%' LIMIT 1),
    p_species_per_class := 3
  )
)
SELECT
  taxonomic_group,
  COUNT(*) as count,
  array_agg(scientific_name ORDER BY scientific_name) as species
FROM borneo_species
GROUP BY taxonomic_group
ORDER BY count DESC;
```

**Expected Result:**
- Each taxonomic group (Mammals, Birds, Reptiles, etc.) should have approximately equal counts
- Count should be close to `p_species_per_class` parameter (e.g., 3)

### Scenario 2: Verify Image Sources

**Goal:** Check which image sources are being used

```sql
-- Check image source distribution
SELECT
  image_source,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM species
WHERE image_url IS NOT NULL
GROUP BY image_source
ORDER BY count DESC;
```

**Expected Result:**
- Most images should come from `wikimedia_commons` or `wikipedia`
- Some images from `inaturalist` for species without Wikimedia coverage

### Scenario 3: Verify Common Name Extraction

**Goal:** Ensure common names are being extracted correctly

```sql
-- Check species with common names
SELECT
  scientific_name,
  common_name,
  class,
  kingdom
FROM species
WHERE common_name IS NOT NULL
  AND common_name != scientific_name
ORDER BY updated_at DESC
LIMIT 20;
```

**Expected Result:**
- Common names should be different from scientific names
- Common names should be in English and capitalized

### Scenario 4: Test Regional Discovery

**Goal:** Test the full discovery flow for different regions

```bash
# Test Amazon
curl -X POST 'https://your-project.supabase.co/functions/v1/discover-region-species' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bounds": {
      "minLat": -10,
      "maxLat": 5,
      "minLng": -75,
      "maxLng": -50,
      "centerLat": -2.5,
      "centerLng": -62.5
    },
    "regionName": "Amazon",
    "limit": 18
  }' | jq '.diversity'

# Test Congo
curl -X POST 'https://your-project.supabase.co/functions/v1/discover-region-species' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bounds": {
      "minLat": -5,
      "maxLat": 5,
      "minLng": 10,
      "maxLng": 30,
      "centerLat": 0,
      "centerLng": 20
    },
    "regionName": "Congo",
    "limit": 18
  }' | jq '.diversity'

# Test Arctic
curl -X POST 'https://your-project.supabase.co/functions/v1/discover-region-species' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bounds": {
      "minLat": 65,
      "maxLat": 80,
      "minLng": -180,
      "maxLng": 180,
      "centerLat": 72.5,
      "centerLng": 0
    },
    "regionName": "Arctic",
    "limit": 18
  }' | jq '.diversity'
```

**Expected Result:**
- Each region should return a `diversity` object
- Diversity object should show balanced counts across groups
- Arctic might have fewer plants, more mammals and birds

### Scenario 5: Performance Testing

**Goal:** Ensure queries are performant

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (SELECT id FROM ecoregions WHERE name ILIKE '%borneo%' LIMIT 1),
  p_species_per_class := 3
);
```

**Expected Result:**
- Query should complete in < 500ms
- Should use indexes on `class`, `kingdom`, `conservation_status`

### Scenario 6: Edge Cases

**Goal:** Test edge cases and error handling

```sql
-- Test 1: Ecoregion with no species
SELECT *
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := '00000000-0000-0000-0000-000000000000',
  p_species_per_class := 3
);
-- Expected: Empty result set (no error)

-- Test 2: Ecoregion with only one taxonomic group
-- (Find a small ecoregion with limited diversity)
SELECT
  taxonomic_group,
  COUNT(*)
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (
    SELECT e.id
    FROM ecoregions e
    JOIN species_ecoregions se ON e.id = se.ecoregion_id
    GROUP BY e.id
    HAVING COUNT(DISTINCT se.species_id) < 10
    LIMIT 1
  ),
  p_species_per_class := 3
)
GROUP BY taxonomic_group;
-- Expected: Returns whatever is available, no error

-- Test 3: Very large species_per_class
SELECT COUNT(*)
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (SELECT id FROM ecoregions WHERE name ILIKE '%borneo%' LIMIT 1),
  p_species_per_class := 100
);
-- Expected: Returns all available species, up to ~600 (100 per group * 6 groups)
```

## Validation Checklist

After running tests, verify:

### Database
- [ ] Migration applied successfully
- [ ] New columns exist in `ecoregions` and `parks` tables
- [ ] Functions `get_balanced_ecoregion_species` and `get_balanced_spatial_species` exist
- [ ] Indexes created for performance

### Species Data
- [ ] At least 50% of species have images
- [ ] At least 30% of species have common names
- [ ] Image sources include wikimedia_commons, wikipedia, inaturalist
- [ ] Attributions and licenses are properly set

### API Responses
- [ ] `discover-region-species` returns `taxonomicGroup` field
- [ ] `discover-region-species` returns `diversity` object
- [ ] Species counts are balanced across groups (within 20%)
- [ ] Images URLs are valid and accessible
- [ ] Common names are displayed

### Edge Functions
- [ ] `wikimedia-image-fetch` deploys successfully
- [ ] `discover-region-species` deploys successfully
- [ ] Functions return within 5 seconds
- [ ] Error handling works (try invalid parameters)

### Frontend
- [ ] Species cards show images
- [ ] Common names are displayed prominently
- [ ] Scientific names shown as secondary
- [ ] Taxonomic group badges/labels visible
- [ ] Diversity breakdown displayed in UI

## Performance Benchmarks

Expected performance metrics:

| Operation | Target Time | Acceptable Time |
|-----------|-------------|-----------------|
| `get_balanced_ecoregion_species` | < 200ms | < 500ms |
| `get_balanced_spatial_species` | < 500ms | < 1000ms |
| `discover-region-species` API | < 2s | < 5s |
| `wikimedia-image-fetch` API | < 3s | < 10s |
| Python enrichment (per species) | < 2s | < 5s |

## Troubleshooting

### Issue: No species returned

**Possible causes:**
1. Ecoregion has no linked species
2. `species_ecoregions` table is empty

**Solution:**
```bash
# Check if ecoregion has species
psql "postgresql://..." -c "
SELECT COUNT(*)
FROM species_ecoregions
WHERE ecoregion_id = 'YOUR_ECOREGION_ID';
"

# If count is 0, run linking script
python scripts/link_species_to_ecoregions.py
```

### Issue: Unbalanced diversity

**Possible causes:**
1. Ecoregion naturally lacks certain taxonomic groups
2. `species_per_class` parameter too high

**Solution:**
- Adjust `species_per_class` parameter (try 2 instead of 3)
- Check if ecoregion has diverse species in database

### Issue: No images found

**Possible causes:**
1. API rate limiting
2. Species name not found in Wikimedia
3. Network issues

**Solution:**
```bash
# Test individual species
curl -X POST 'https://your-project.supabase.co/functions/v1/wikimedia-image-fetch' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"searchTerm": "Panthera tigris"}' | jq '.'

# If successful, run enrichment with smaller batches
python scripts/enrichMediaFromWikimedia.py --type species --limit 10 --batch-size 5
```

### Issue: Common names not extracted

**Possible causes:**
1. Wikipedia article doesn't exist
2. Article format doesn't match patterns
3. Species name spelling different

**Solution:**
- Check Wikipedia manually for the species
- Update `fetch_common_name()` patterns if needed
- Manually set common names for important species

## Next Steps After Testing

1. If tests pass, run full enrichment:
```bash
python scripts/enrichMediaFromWikimedia.py --type all --limit 500
```

2. Update frontend to display new fields

3. Monitor API performance in production

4. Set up scheduled enrichment (weekly cron job)

5. Gather user feedback on species diversity

## Support

If you encounter issues:
1. Check Supabase logs: `supabase functions logs discover-region-species`
2. Check database logs for query errors
3. Review `WIKIMEDIA_ENRICHMENT_GUIDE.md` for detailed documentation
4. Test with smaller limits and simpler queries first
