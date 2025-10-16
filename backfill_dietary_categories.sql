-- Quick backfill script for dietary categories
-- This updates all existing species with dietary_category based on their trophic_role

\echo '=== Backfilling Dietary Categories ==='

-- Show current state
\echo 'Current state:'
SELECT
  COUNT(*) as total_species,
  COUNT(dietary_category) as with_dietary_category,
  COUNT(trophic_role) as with_trophic_role
FROM species;

-- Update all species that don't have dietary_category set
\echo 'Updating species without dietary_category...'

UPDATE species
SET
  dietary_category = CASE
    -- Producers (Plants & Corals)
    WHEN trophic_role IN ('Producer', 'Mixotroph') OR species_type IN ('Plant', 'Coral') THEN 'Producer'
    -- Carnivores (meat-eaters)
    WHEN trophic_role IN ('Predator', 'Scavenger', 'Parasite') THEN 'Carnivore'
    -- Herbivores (plant-eaters)
    WHEN trophic_role IN ('Herbivore', 'Detritivore') THEN 'Herbivore'
    -- Omnivores (mixed diet including filter-feeders)
    WHEN trophic_role IN ('Omnivore', 'Filter-feeder') THEN 'Omnivore'
    -- Default to Omnivore
    ELSE 'Omnivore'
  END
WHERE dietary_category IS NULL;

-- Show results
\echo 'Updated state:'
SELECT
  COUNT(*) as total_species,
  COUNT(dietary_category) as with_dietary_category
FROM species;

\echo 'Dietary category distribution:'
SELECT
  dietary_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM species WHERE dietary_category IS NOT NULL), 2) as percentage
FROM species
WHERE dietary_category IS NOT NULL
GROUP BY dietary_category
ORDER BY count DESC;

\echo 'Sample species by category:'
SELECT
  dietary_category,
  common_name,
  trophic_role,
  class
FROM species
WHERE dietary_category IS NOT NULL
  AND common_name IS NOT NULL
ORDER BY dietary_category, common_name
LIMIT 40;

\echo '=== Backfill Complete ==='
