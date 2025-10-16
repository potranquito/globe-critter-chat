-- Check if sample_points is actually TEXT stored as JSON string

SELECT
    scientific_name,
    pg_typeof(sample_points) as type,
    sample_points::text as raw_value,
    LENGTH(sample_points::text) as length
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;

-- Try to parse it as JSONB
SELECT
    scientific_name,
    sample_points::jsonb as parsed
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
