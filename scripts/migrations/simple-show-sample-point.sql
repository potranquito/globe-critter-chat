-- Show sample_points simply
SELECT
    scientific_name,
    sample_points
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
