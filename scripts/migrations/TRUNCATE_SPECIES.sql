-- Truncate species table for fresh IUCN import
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql

-- This will delete all species and reset any sequences
TRUNCATE TABLE species CASCADE;

-- Verify it's empty
SELECT COUNT(*) as remaining_species FROM species;

-- Expected result: 0
