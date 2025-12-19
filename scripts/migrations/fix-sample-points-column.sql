-- Fix sample_points column to be proper JSONB

-- Check current type
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'species'
AND column_name = 'sample_points';

-- Convert the column from TEXT to JSONB
ALTER TABLE species
ALTER COLUMN sample_points TYPE JSONB USING sample_points::JSONB;

-- Verify it worked
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'species'
AND column_name = 'sample_points';

-- Test on one species
SELECT
    scientific_name,
    jsonb_typeof(sample_points) as type,
    jsonb_array_length(sample_points) as num_points
FROM species
WHERE sample_points IS NOT NULL
LIMIT 1;
