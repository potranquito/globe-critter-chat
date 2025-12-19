-- Add 'found_in' column to species table for habitat information
-- This stores brief habitat descriptions like "Tropical reefs among soft corals"

ALTER TABLE species
ADD COLUMN IF NOT EXISTS found_in TEXT;

-- Add helpful comment
COMMENT ON COLUMN species.found_in IS 'Brief habitat description where species might be seen (e.g., "Alpine tundra and rocky slopes", "Tropical reefs, 5-40m depth")';

-- Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'species' AND column_name = 'found_in';
