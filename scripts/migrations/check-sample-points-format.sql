-- Check the format of sample_points
SELECT
    scientific_name,
    pg_typeof(sample_points) as data_type,
    sample_points
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
