-- Quick test to check if species-ecoregion linking is working
-- Run this to diagnose why species aren't showing up

-- 1. Check if ecoregions exist
SELECT COUNT(*) as total_ecoregions FROM ecoregions;

-- 2. Check if 'Arctic Tundra' exists in database
SELECT * FROM ecoregions WHERE name ILIKE '%arctic%' OR name ILIKE '%tundra%' LIMIT 5;

-- 3. Check if species table has data
SELECT COUNT(*) as total_species FROM species;

-- 4. Check if species have sample_points
SELECT COUNT(*) as species_with_points FROM species WHERE sample_points IS NOT NULL;

-- 5. Check if species_ecoregions junction table has data
SELECT COUNT(*) as total_links FROM species_ecoregions;

-- 6. Check if species are linked to Arctic ecoregions
SELECT
    e.name as ecoregion,
    COUNT(se.species_id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
WHERE e.name ILIKE '%arctic%' OR e.name ILIKE '%tundra%'
GROUP BY e.id, e.name
ORDER BY species_count DESC;

-- 7. If species_ecoregions is empty, check if matching functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%species%ecoregion%'
AND routine_schema = 'public';

-- Expected results:
-- - Step 1: Should show number of ecoregions (likely 800+)
-- - Step 2: Should show Arctic/Tundra ecoregions
-- - Step 3: Should show number of species (thousands if IUCN data loaded)
-- - Step 4: Should show species with sample_points
-- - Step 5: If 0, you need to run the population script
-- - Step 6: Shows if Arctic has species linked
-- - Step 7: Should show 4 functions if migration applied
