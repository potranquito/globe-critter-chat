-- Apply the dietary category migration and backfill data
-- Run this script to update all existing species with the new dietary_category field

\echo 'Starting dietary category migration...'

-- Step 1: Apply the migration (add column, functions, etc.)
\i supabase/migrations/20251016000001_add_dietary_category.sql

\echo 'Migration applied successfully!'

-- Step 2: Verify the migration worked
\echo 'Verifying migration...'

SELECT
  COUNT(*) as total_species,
  COUNT(dietary_category) as species_with_dietary_category,
  COUNT(CASE WHEN dietary_category IS NULL THEN 1 END) as species_without_dietary_category
FROM species;

\echo 'Dietary category distribution:'

SELECT
  dietary_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM species), 2) as percentage
FROM species
WHERE dietary_category IS NOT NULL
GROUP BY dietary_category
ORDER BY count DESC;

\echo 'Sample species by dietary category:'

SELECT dietary_category, common_name, class, trophic_role
FROM species
WHERE dietary_category IS NOT NULL
GROUP BY dietary_category, common_name, class, trophic_role
ORDER BY dietary_category, common_name
LIMIT 20;

\echo 'Migration and backfill complete!'
