-- Check what columns exist in species_parks table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'species_parks'
ORDER BY ordinal_position;
