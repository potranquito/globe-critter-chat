-- Truncate species table to prepare for fresh import
-- This disables triggers and constraints for faster deletion

TRUNCATE TABLE species CASCADE;

-- Verify it's empty
SELECT COUNT(*) as remaining_records FROM species;
