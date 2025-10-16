-- Check the results after population

-- Total links created
SELECT
    COUNT(*) as total_links,
    COUNT(DISTINCT species_id) as unique_species,
    COUNT(DISTINCT ecoregion_id) as unique_ecoregions
FROM species_ecoregions;

-- Top 10 ecoregions by species count
SELECT
    e.name as ecoregion_name,
    COUNT(*) as species_count
FROM species_ecoregions se
JOIN ecoregions e ON e.id = se.ecoregion_id
GROUP BY e.name
ORDER BY species_count DESC
LIMIT 10;

-- Arctic regions species counts
SELECT
    e.name as ecoregion,
    COUNT(se.species_id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
WHERE e.name ILIKE '%arctic%' OR e.name ILIKE '%tundra%'
GROUP BY e.id, e.name
ORDER BY species_count DESC;
