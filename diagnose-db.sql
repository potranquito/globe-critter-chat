-- Diagnostic queries to understand the database state
-- Run this in Supabase SQL Editor

-- 1. Check if tables exist and have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('species', 'ecoregions', 'parks', 'species_ecoregions', 'species_parks')
ORDER BY tablename;

-- 2. Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('species', 'ecoregions', 'parks')
ORDER BY tablename, policyname;

-- 3. Check if functions exist
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef
        WHEN true THEN 'DEFINER'
        ELSE 'INVOKER'
    END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('get_species_in_bounds', 'get_diverse_species_in_region')
ORDER BY p.proname;

-- 4. Check if species table has data and geographic_range column
SELECT
    COUNT(*) as total_species,
    COUNT(geographic_range) as species_with_range,
    COUNT(DISTINCT class) as unique_classes,
    COUNT(DISTINCT kingdom) as unique_kingdoms
FROM species;

-- 5. Sample a few species to see data structure
SELECT
    id,
    scientific_name,
    common_name,
    class,
    kingdom,
    conservation_status,
    geographic_range IS NOT NULL as has_geography
FROM species
LIMIT 5;

-- 6. Check ecoregions table
SELECT COUNT(*) as total_ecoregions FROM ecoregions;
SELECT * FROM ecoregions LIMIT 3;

-- 7. Test the function manually with simple parameters
SELECT * FROM public.get_diverse_species_in_region(
    71.0::NUMERIC,  -- Arctic latitude
    -100.0::NUMERIC, -- Arctic longitude
    10.0::NUMERIC,   -- radius
    'MAMMALIA'::TEXT, -- class
    NULL::TEXT,      -- kingdom
    3                -- limit
);
