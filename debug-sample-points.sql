-- Debug: Check sample_points data

-- 1. How many species have sample_points?
SELECT COUNT(*) as total_species FROM species;
SELECT COUNT(*) as species_with_points FROM species WHERE sample_points IS NOT NULL AND sample_points != '[]'::jsonb;

-- 2. Check if sample_points is empty array vs null
SELECT
    COUNT(*) FILTER (WHERE sample_points IS NULL) as null_points,
    COUNT(*) FILTER (WHERE sample_points = '[]'::jsonb) as empty_array,
    COUNT(*) FILTER (WHERE sample_points IS NOT NULL AND sample_points != '[]'::jsonb) as has_points
FROM species;

-- 3. Test jsonb_array_elements on actual data
SELECT
    scientific_name,
    jsonb_array_elements(sample_points) as point
FROM species
WHERE sample_points IS NOT NULL
AND sample_points != '[]'::jsonb
LIMIT 5;
