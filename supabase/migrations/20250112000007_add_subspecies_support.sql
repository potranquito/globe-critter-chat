-- Add subspecies and population variant fields to species table
-- This allows tracking different populations, subspecies, and seasonal occurrences
-- of the same species (e.g., different killer whale populations)

ALTER TABLE species
ADD COLUMN IF NOT EXISTS subspecies TEXT,
ADD COLUMN IF NOT EXISTS subpopulation TEXT,
ADD COLUMN IF NOT EXISTS presence INTEGER,
ADD COLUMN IF NOT EXISTS seasonal INTEGER,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS distribution_comments TEXT;

-- Drop the existing primary key constraint
ALTER TABLE species DROP CONSTRAINT IF EXISTS species_pkey;

-- Create a new composite primary key that includes variant information
-- This allows the same species (iucn_id) to have multiple entries for different
-- subspecies, populations, or seasonal occurrences
ALTER TABLE species
ADD PRIMARY KEY (iucn_id, COALESCE(subspecies, ''), COALESCE(subpopulation, ''), COALESCE(presence, 0), COALESCE(seasonal, 0));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_species_scientific_name ON species(scientific_name);
CREATE INDEX IF NOT EXISTS idx_species_conservation_status ON species(conservation_status);
CREATE INDEX IF NOT EXISTS idx_species_kingdom ON species(kingdom);
CREATE INDEX IF NOT EXISTS idx_species_subspecies ON species(subspecies) WHERE subspecies IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_species_subpopulation ON species(subpopulation) WHERE subpopulation IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN species.subspecies IS 'Subspecies name if applicable';
COMMENT ON COLUMN species.subpopulation IS 'Subpopulation name (e.g., "Southern Resident" for killer whales)';
COMMENT ON COLUMN species.presence IS 'IUCN presence code: 1=Extant, 2=Probably Extant, 3=Possibly Extinct, 4=Extinct, 5=Presence Uncertain';
COMMENT ON COLUMN species.seasonal IS 'IUCN seasonal code: 1=Resident, 2=Breeding Season, 3=Non-breeding Season, 4=Passage, 5=Seasonal Occurrence Uncertain';
COMMENT ON COLUMN species.source IS 'Data source for this record';
COMMENT ON COLUMN species.distribution_comments IS 'Comments about the distribution of this variant';
