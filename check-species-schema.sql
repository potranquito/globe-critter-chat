-- Check what columns the species table actually has
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'species'
ORDER BY ordinal_position;
