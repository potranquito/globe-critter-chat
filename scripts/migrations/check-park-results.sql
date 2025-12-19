-- Check results after populating species-park links

-- Total links created
SELECT
    COUNT(*) as total_links,
    COUNT(DISTINCT species_id) as unique_species,
    COUNT(DISTINCT park_id) as unique_parks
FROM species_parks;

-- Top 10 parks by species count
SELECT
    p.name as park_name,
    COUNT(*) as species_count
FROM species_parks sp
JOIN parks p ON p.id = sp.park_id
GROUP BY p.name
ORDER BY species_count DESC
LIMIT 10;

-- Arctic/northern parks (if any)
SELECT
    p.name as park_name,
    p.center_lat,
    p.center_lng,
    COUNT(sp.species_id) as species_count
FROM parks p
LEFT JOIN species_parks sp ON p.id = sp.park_id
WHERE p.center_lat > 60
GROUP BY p.id, p.name, p.center_lat, p.center_lng
ORDER BY species_count DESC
LIMIT 10;
