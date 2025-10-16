-- Show exactly what's in sample_points

SELECT
    scientific_name,
    sample_points,
    sample_points::text as raw_text,
    jsonb_typeof(sample_points) as type,
    -- Try to parse the string value as JSON
    (sample_points #>> '{}')::jsonb as parsed
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
