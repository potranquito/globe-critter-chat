-- Rename found_in column to habitat_info
-- Run this in Supabase SQL Editor

ALTER TABLE species
RENAME COLUMN found_in TO habitat_info;

-- Update comment to reflect new name
COMMENT ON COLUMN species.habitat_info IS 'Brief habitat description where species might be seen (e.g., "Alpine tundra and rocky slopes", "Tropical reefs, 5-40m depth")';
