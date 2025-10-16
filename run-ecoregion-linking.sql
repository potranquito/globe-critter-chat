-- Populate species-ecoregion links
SELECT * FROM populate_all_species_ecoregion_links();

-- Check results
SELECT
    COUNT(*) as total_links,
    COUNT(DISTINCT species_id) as unique_species,
    COUNT(DISTINCT ecoregion_id) as unique_ecoregions
FROM species_ecoregions;

-- Show Arctic Tundra species
SELECT
    e.name as ecoregion,
    COUNT(se.species_id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
WHERE e.name = 'Arctic Tundra'
GROUP BY e.name;
