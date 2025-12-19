-- Populate species-ecoregion links using the matching functions
-- This script uses the functions created in migration 20251013000005
-- Run this AFTER applying the migration

-- Step 1: Clear existing links (optional - comment out if you want to keep existing links)
-- DELETE FROM species_ecoregions;

-- Step 2: Populate links for all ecoregions
-- This will take a few minutes depending on data size
SELECT * FROM populate_all_species_ecoregion_links();

-- Step 3: Check results
SELECT
    COUNT(*) as total_links,
    COUNT(DISTINCT species_id) as unique_species,
    COUNT(DISTINCT ecoregion_id) as unique_ecoregions
FROM species_ecoregions;

-- Step 4: Show sample results for a specific ecoregion
-- (Replace with an actual ecoregion name from your database)
SELECT
    e.name as ecoregion_name,
    COUNT(*) as species_count
FROM species_ecoregions se
JOIN ecoregions e ON e.id = se.ecoregion_id
GROUP BY e.name
ORDER BY species_count DESC
LIMIT 10;

-- Step 5: Test the get_species_by_ecoregion function
-- (Replace the UUID with an actual ecoregion ID from your database)
-- SELECT * FROM get_species_by_ecoregion('your-ecoregion-uuid-here'::UUID, 10);
