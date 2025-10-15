-- Add is_curated flag to distinguish manually curated species from IUCN imports
-- Author: Claude Code
-- Date: October 14, 2025

-- Add is_curated column to species table
ALTER TABLE species
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT false;

-- Create index for filtering curated species
CREATE INDEX IF NOT EXISTS idx_species_is_curated ON species(is_curated);

-- Add comment for documentation
COMMENT ON COLUMN species.is_curated IS 'True if species was manually curated (from CSV), false if imported from IUCN database';

-- Update existing curated species that have been imported from CSV
-- These species typically have high-quality images and descriptions
UPDATE species
SET is_curated = true
WHERE
  -- Species with Wikimedia Commons images are likely curated
  (image_source = 'Wikimedia Commons' OR image_attribution = 'Wikimedia Commons')
  -- Or species with detailed descriptions that match curated format
  OR (description IS NOT NULL AND LENGTH(description) > 20 AND description NOT LIKE '%IUCN%');

-- Helper function: Get curated species by ecoregion
CREATE OR REPLACE FUNCTION get_curated_species_by_ecoregion(ecoregion_uuid UUID)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  image_url TEXT,
  description TEXT,
  is_curated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.image_url,
    s.description,
    s.is_curated
  FROM species s
  JOIN species_ecoregions se ON s.id = se.species_id
  WHERE se.ecoregion_id = ecoregion_uuid
    AND s.is_curated = true
  ORDER BY s.common_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_curated_species_by_ecoregion IS 'Returns only manually curated species for a given ecoregion';

-- Update the balanced species function to prioritize curated species
-- This ensures curated species appear first in the carousel
CREATE OR REPLACE FUNCTION get_balanced_species_for_ecoregion_v2(
  ecoregion_uuid UUID,
  max_per_class INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  class TEXT,
  conservation_status TEXT,
  image_url TEXT,
  image_attribution TEXT,
  description TEXT,
  is_curated BOOLEAN,
  overlap_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_species AS (
    SELECT DISTINCT ON (s.scientific_name)
      s.id,
      s.scientific_name,
      s.common_name,
      s.class,
      s.conservation_status,
      s.image_url,
      s.image_attribution,
      s.description,
      s.is_curated,
      se.overlap_percentage,
      -- Prioritize curated species first
      CASE
        WHEN s.is_curated THEN 0
        WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 1
        WHEN s.common_name IS NOT NULL THEN 2
        WHEN s.image_url IS NOT NULL THEN 3
        ELSE 4
      END as media_priority,
      ROW_NUMBER() OVER (
        PARTITION BY s.class
        ORDER BY
          -- Prioritize curated species
          CASE WHEN s.is_curated THEN 0 ELSE 1 END,
          -- Then by media availability
          CASE
            WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 0
            WHEN s.common_name IS NOT NULL THEN 1
            WHEN s.image_url IS NOT NULL THEN 2
            ELSE 3
          END,
          se.overlap_percentage DESC,
          -- Conservation status priority
          CASE s.conservation_status
            WHEN 'CR' THEN 1
            WHEN 'EN' THEN 2
            WHEN 'VU' THEN 3
            WHEN 'NT' THEN 4
            WHEN 'LC' THEN 5
            ELSE 6
          END,
          RANDOM()
      ) as rank
    FROM species s
    JOIN species_ecoregions se ON s.id = se.species_id
    WHERE se.ecoregion_id = ecoregion_uuid
      AND s.common_name IS NOT NULL
  )
  SELECT
    rs.id,
    rs.scientific_name,
    rs.common_name,
    rs.class,
    rs.conservation_status,
    rs.image_url,
    rs.image_attribution,
    rs.description,
    rs.is_curated,
    rs.overlap_percentage
  FROM ranked_species rs
  WHERE rs.rank <= max_per_class
  ORDER BY
    -- Curated species first
    CASE WHEN rs.is_curated THEN 0 ELSE 1 END,
    rs.media_priority,
    rs.overlap_percentage DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_balanced_species_for_ecoregion_v2 IS 'Returns balanced species with curated species prioritized first';
