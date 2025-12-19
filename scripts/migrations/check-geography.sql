-- Check if species have geographic range data
-- Run this in Supabase SQL Editor

SELECT
    COUNT(*) as total_species,
    COUNT(geographic_range) as with_geography,
    COUNT(*) - COUNT(geographic_range) as without_geography
FROM species;

-- Sample some species to see the data
SELECT
    scientific_name,
    common_name,
    class,
    conservation_status,
    geographic_range IS NOT NULL as has_range,
    ST_AsText(geographic_range::geometry) as range_sample
FROM species
WHERE geographic_range IS NOT NULL
LIMIT 3;

-- Test if ST_Intersects works at all
SELECT
    COUNT(*) as species_with_valid_geometry
FROM species
WHERE geographic_range IS NOT NULL
  AND ST_IsValid(geographic_range::geometry);
