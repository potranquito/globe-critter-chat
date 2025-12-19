-- Find species with malformed sample_points

-- Check the actual column type
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'species'
AND column_name = 'sample_points';

-- Find species where sample_points is not a proper array
SELECT
    id,
    scientific_name,
    pg_typeof(sample_points),
    jsonb_typeof(sample_points) as jsonb_type,
    sample_points
FROM species
WHERE sample_points IS NOT NULL
AND jsonb_typeof(sample_points) != 'array'
LIMIT 5;

-- Count how many are bad
SELECT
    jsonb_typeof(sample_points) as type,
    COUNT(*) as count
FROM species
WHERE sample_points IS NOT NULL
GROUP BY jsonb_typeof(sample_points);
