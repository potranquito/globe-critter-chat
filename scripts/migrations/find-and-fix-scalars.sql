-- Find rows where sample_points is not an array

SELECT
    id,
    scientific_name,
    jsonb_typeof(sample_points) as type,
    sample_points
FROM species
WHERE sample_points IS NOT NULL
AND jsonb_typeof(sample_points) != 'array'
LIMIT 10;

-- Count them
SELECT COUNT(*) as scalar_rows
FROM species
WHERE sample_points IS NOT NULL
AND jsonb_typeof(sample_points) != 'array';

-- Fix them: Set scalar values to NULL (they're not usable anyway)
UPDATE species
SET sample_points = NULL
WHERE sample_points IS NOT NULL
AND jsonb_typeof(sample_points) != 'array';

-- Verify all remaining are arrays
SELECT
    jsonb_typeof(sample_points) as type,
    COUNT(*) as count
FROM species
WHERE sample_points IS NOT NULL
GROUP BY jsonb_typeof(sample_points);
