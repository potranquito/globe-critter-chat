-- Investigate how to match species to ecoregions using coordinates
-- This will help us understand the data and create proper matching functions

-- 1. Check what ecoregions we have and their structure
SELECT
    id,
    ecoregion_id,
    name,
    biome,
    realm,
    center_lat,
    center_lng,
    radius_km,
    geometry IS NOT NULL as has_geometry
FROM ecoregions
LIMIT 5;

-- 2. Check how many ecoregions we have
SELECT
    COUNT(*) as total_ecoregions,
    COUNT(geometry) as with_geometry,
    COUNT(center_lat) as with_center
FROM ecoregions;

-- 3. Sample species with their sample_points to understand the structure
SELECT
    scientific_name,
    common_name,
    class,
    jsonb_array_length(sample_points) as num_sample_points,
    (sample_points->0->>'lat')::NUMERIC as first_point_lat,
    (sample_points->0->>'lng')::NUMERIC as first_point_lng
FROM species
WHERE sample_points IS NOT NULL
LIMIT 10;

-- 4. Try to find Arctic species (latitude > 60 degrees)
SELECT
    s.scientific_name,
    s.common_name,
    s.class,
    COUNT(*) as arctic_points
FROM species s,
     jsonb_array_elements(s.sample_points) AS point
WHERE
    s.sample_points IS NOT NULL
    AND (point->>'lat')::NUMERIC > 60  -- Arctic threshold
GROUP BY s.id, s.scientific_name, s.common_name, s.class
ORDER BY arctic_points DESC
LIMIT 10;

-- 5. Check if we have an Arctic Tundra ecoregion
SELECT *
FROM ecoregions
WHERE name ILIKE '%arctic%' OR name ILIKE '%tundra%';

-- 6. Create a test query to match species to a specific lat/lng region
-- Example: Find species near Arctic (71, -100) with 10-degree radius
SELECT
    s.scientific_name,
    s.common_name,
    s.class,
    s.conservation_status,
    COUNT(DISTINCT point) as matching_points
FROM species s,
     jsonb_array_elements(s.sample_points) AS point
WHERE
    s.sample_points IS NOT NULL
    AND (point->>'lat')::NUMERIC BETWEEN 61 AND 81  -- 71 +/- 10
    AND (point->>'lng')::NUMERIC BETWEEN -110 AND -90  -- -100 +/- 10
    AND s.class = 'MAMMALIA'
GROUP BY s.id, s.scientific_name, s.common_name, s.class, s.conservation_status
ORDER BY matching_points DESC
LIMIT 10;
