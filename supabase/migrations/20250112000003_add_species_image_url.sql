-- Add image_url column to species table for iNaturalist photos
-- Migration: Add species image URLs

ALTER TABLE species
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster queries on species with/without images
CREATE INDEX IF NOT EXISTS idx_species_image_url ON species(image_url) WHERE image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN species.image_url IS 'URL to species photo from iNaturalist or other source';
