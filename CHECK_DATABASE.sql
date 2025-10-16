-- Run these queries in Supabase SQL Editor to verify everything is working
-- https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/editor

-- 1. Check if classification columns exist
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'species'
  AND column_name IN ('species_type', 'ui_group', 'trophic_role', 'is_curated')
ORDER BY column_name;

-- Expected: Should see 4 rows (all the new columns)

-- 2. Check if any species have been classified
SELECT
  species_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM species
WHERE species_type IS NOT NULL
GROUP BY species_type
ORDER BY count DESC;

-- Expected: Should see counts for Mammal, Bird, Fish, etc.
-- If this returns 0 rows, the classification hasn't run yet

-- 3. Check bird species count
SELECT COUNT(*) as total_birds
FROM species
WHERE species_type = 'Bird' OR class ILIKE '%aves%';

-- Expected: Should show ~11,000+ birds

-- 4. Check if bird_calls table exists
SELECT
  COUNT(*) as cached_bird_calls,
  COUNT(DISTINCT scientific_name) as unique_species
FROM bird_calls;

-- Expected: 0 initially (will populate as users play calls)

-- 5. Check edge function status (run this in your terminal, not SQL editor)
-- supabase functions list

-- Expected: Should see "fetch-bird-call" in the list

-- 6. Sample bird species to test
SELECT
  scientific_name,
  common_name,
  class,
  species_type,
  ui_group,
  trophic_role
FROM species
WHERE common_name ILIKE '%cardinal%'
   OR common_name ILIKE '%robin%'
   OR common_name ILIKE '%blue jay%'
LIMIT 10;

-- Expected: Should see birds with species_type = 'Bird'
-- If species_type is NULL, the classification function hasn't run

-- 7. If species_type is NULL, run this to manually classify:
-- (Only run if needed)
/*
UPDATE species
SET
  species_type = CASE
    WHEN class ILIKE '%aves%' THEN 'Bird'
    WHEN class ILIKE '%mammalia%' THEN 'Mammal'
    WHEN class ILIKE '%actinopterygii%' OR class ILIKE '%chondrichthyes%' THEN 'Fish'
    WHEN class ILIKE '%reptilia%' THEN 'Reptile'
    WHEN class ILIKE '%amphibia%' THEN 'Amphibian'
    ELSE 'Invertebrate'
  END,
  ui_group = CASE
    WHEN class ILIKE '%aves%' THEN 'Birds'
    WHEN class ILIKE '%aves%' THEN 'Birds'
    ELSE 'Animals'
  END,
  trophic_role = CASE
    WHEN class ILIKE '%aves%' THEN 'Predator'
    WHEN class ILIKE '%mammalia%' THEN 'Omnivore'
    ELSE 'Omnivore'
  END
WHERE species_type IS NULL;
*/
