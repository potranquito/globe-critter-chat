-- First, check what columns actually exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'species_parks'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE species_parks
ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS is_flagship BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS curation_priority INTEGER DEFAULT 50 CHECK (curation_priority BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS educational_value TEXT DEFAULT 'medium' CHECK (educational_value IN ('high', 'medium', 'low'));

-- Verify columns now exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'species_parks'
ORDER BY ordinal_position;
