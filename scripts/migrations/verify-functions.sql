-- Verify that the functions exist and check their permissions
-- Run this in Supabase SQL Editor to debug

-- Check if functions exist
SELECT
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname IN ('get_species_in_bounds', 'get_diverse_species_in_region');

-- Check function permissions
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name IN ('get_species_in_bounds', 'get_diverse_species_in_region');

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_species_in_bounds(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_diverse_species_in_region(DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER) TO anon, authenticated;

-- Verify the grants worked
SELECT
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('get_species_in_bounds', 'get_diverse_species_in_region');
