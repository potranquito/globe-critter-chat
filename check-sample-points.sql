-- Check the structure of sample_points data
SELECT
    scientific_name,
    common_name,
    class,
    sample_points,
    jsonb_typeof(sample_points) as points_type,
    jsonb_array_length(sample_points) as num_points
FROM species
WHERE sample_points IS NOT NULL
LIMIT 5;

-- Check if any species have sample points
SELECT
    COUNT(*) as total_species,
    COUNT(sample_points) as with_sample_points,
    COUNT(*) - COUNT(sample_points) as without_sample_points
FROM species;
