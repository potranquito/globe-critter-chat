-- Migration: Balanced species selection and media enrichment
-- Created: 2025-10-14

-- =============================================================================
-- PART 1: Balanced species selection by taxonomic class
-- =============================================================================

-- Function to get balanced species from an ecoregion
-- Returns equal representation across taxonomic groups (mammals, birds, reptiles, amphibians, fish, plants)
-- Gracefully handles ecoregions that don't have all taxonomic groups
CREATE OR REPLACE FUNCTION get_balanced_ecoregion_species(
  p_ecoregion_id UUID,
  p_species_per_class INTEGER DEFAULT 3,
  p_exclude_species TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  class TEXT,
  kingdom TEXT,
  image_url TEXT,
  overlap_percentage NUMERIC,
  taxonomic_group TEXT
) AS $$
DECLARE
  v_class_record RECORD;
  v_total_species_available INTEGER;
  v_species_returned INTEGER := 0;
BEGIN
  -- Get species balanced across major taxonomic groups
  -- Priority order: Mammals, Birds, Reptiles, Amphibians, Fish/Marine, Plants, Other
  -- If some groups are missing, it will simply skip them and return what's available

  -- First check if we have any species at all
  SELECT COUNT(*) INTO v_total_species_available
  FROM species_ecoregions se
  JOIN species s ON s.id = se.species_id
  WHERE se.ecoregion_id = p_ecoregion_id
    AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
    AND s.scientific_name IS NOT NULL;

  -- If no species available, return empty result
  IF v_total_species_available = 0 THEN
    RETURN;
  END IF;

  FOR v_class_record IN
    SELECT DISTINCT
      CASE
        WHEN s.class = 'MAMMALIA' THEN 'Mammals'
        WHEN s.class = 'AVES' THEN 'Birds'
        WHEN s.class = 'REPTILIA' THEN 'Reptiles'
        WHEN s.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN s.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN s.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END as taxonomic_group,
      CASE
        WHEN s.class = 'MAMMALIA' THEN 1
        WHEN s.class = 'AVES' THEN 2
        WHEN s.class = 'REPTILIA' THEN 3
        WHEN s.class = 'AMPHIBIA' THEN 4
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 5
        WHEN s.kingdom = 'PLANTAE' THEN 6
        WHEN s.class = 'INSECTA' THEN 7
        ELSE 8
      END as priority_order
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
      AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
      AND s.scientific_name IS NOT NULL
    ORDER BY priority_order
  LOOP
    RETURN QUERY
    SELECT
      s.id,
      s.scientific_name,
      s.common_name,
      s.conservation_status,
      s.class,
      s.kingdom,
      s.image_url,
      se.overlap_percentage,
      v_class_record.taxonomic_group
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
      AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
      AND CASE
        WHEN s.class = 'MAMMALIA' THEN 'Mammals'
        WHEN s.class = 'AVES' THEN 'Birds'
        WHEN s.class = 'REPTILIA' THEN 'Reptiles'
        WHEN s.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN s.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN s.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END = v_class_record.taxonomic_group
    ORDER BY
      -- Prioritize species with common names
      CASE WHEN s.common_name IS NOT NULL THEN 0 ELSE 1 END,
      -- Prioritize higher overlap percentage
      se.overlap_percentage DESC,
      -- Prioritize conservation importance
      CASE
        WHEN s.conservation_status = 'CR' THEN 0
        WHEN s.conservation_status = 'EN' THEN 1
        WHEN s.conservation_status = 'VU' THEN 2
        WHEN s.conservation_status = 'NT' THEN 3
        ELSE 4
      END,
      -- Add randomness for variety
      RANDOM()
    LIMIT p_species_per_class;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_balanced_ecoregion_species IS 'Returns species from an ecoregion with balanced representation across taxonomic groups';

-- Function to get balanced species from a spatial region (for areas without ecoregion data)
CREATE OR REPLACE FUNCTION get_balanced_spatial_species(
  p_region_lat DECIMAL,
  p_region_lng DECIMAL,
  p_radius_degrees DECIMAL,
  p_species_per_class INTEGER DEFAULT 3,
  p_exclude_species TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  class TEXT,
  kingdom TEXT,
  image_url TEXT,
  taxonomic_group TEXT
) AS $$
DECLARE
  v_class_record RECORD;
BEGIN
  -- Get species balanced across major taxonomic groups using spatial query

  FOR v_class_record IN
    SELECT DISTINCT
      CASE
        WHEN s.class = 'MAMMALIA' THEN 'Mammals'
        WHEN s.class = 'AVES' THEN 'Birds'
        WHEN s.class = 'REPTILIA' THEN 'Reptiles'
        WHEN s.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN s.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN s.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END as taxonomic_group,
      CASE
        WHEN s.class = 'MAMMALIA' THEN 1
        WHEN s.class = 'AVES' THEN 2
        WHEN s.class = 'REPTILIA' THEN 3
        WHEN s.class = 'AMPHIBIA' THEN 4
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 5
        WHEN s.kingdom = 'PLANTAE' THEN 6
        WHEN s.class = 'INSECTA' THEN 7
        ELSE 8
      END as priority_order
    FROM species s
    WHERE s.geographic_range IS NOT NULL
      AND ST_Intersects(
        s.geographic_range::geometry,
        ST_MakeEnvelope(
          p_region_lng - p_radius_degrees,
          p_region_lat - p_radius_degrees,
          p_region_lng + p_radius_degrees,
          p_region_lat + p_radius_degrees,
          4326
        )
      )
      AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
      AND s.scientific_name IS NOT NULL
    ORDER BY priority_order
  LOOP
    RETURN QUERY
    SELECT
      s.id,
      s.scientific_name,
      s.common_name,
      s.conservation_status,
      s.class,
      s.kingdom,
      s.image_url,
      v_class_record.taxonomic_group
    FROM species s
    WHERE s.geographic_range IS NOT NULL
      AND ST_Intersects(
        s.geographic_range::geometry,
        ST_MakeEnvelope(
          p_region_lng - p_radius_degrees,
          p_region_lat - p_radius_degrees,
          p_region_lng + p_radius_degrees,
          p_region_lat + p_radius_degrees,
          4326
        )
      )
      AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
      AND CASE
        WHEN s.class = 'MAMMALIA' THEN 'Mammals'
        WHEN s.class = 'AVES' THEN 'Birds'
        WHEN s.class = 'REPTILIA' THEN 'Reptiles'
        WHEN s.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN s.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN s.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN s.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END = v_class_record.taxonomic_group
    ORDER BY
      -- Prioritize species with common names
      CASE WHEN s.common_name IS NOT NULL THEN 0 ELSE 1 END,
      -- Prioritize conservation importance
      CASE
        WHEN s.conservation_status = 'CR' THEN 0
        WHEN s.conservation_status = 'EN' THEN 1
        WHEN s.conservation_status = 'VU' THEN 2
        WHEN s.conservation_status = 'NT' THEN 3
        ELSE 4
      END,
      -- Add randomness for variety
      RANDOM()
    LIMIT p_species_per_class;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_balanced_spatial_species IS 'Returns species from a spatial region with balanced representation across taxonomic groups';

-- =============================================================================
-- PART 2: Add media/image fields to ecoregions and parks tables
-- =============================================================================

-- Add Wikimedia image fields to ecoregions table
ALTER TABLE ecoregions
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_attribution TEXT,
ADD COLUMN IF NOT EXISTS image_license TEXT,
ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'wikimedia',
ADD COLUMN IF NOT EXISTS wikimedia_page_title TEXT, -- For fetching from Wikimedia
ADD COLUMN IF NOT EXISTS image_cached_at TIMESTAMP;

COMMENT ON COLUMN ecoregions.image_url IS 'URL to the ecoregion image (preferably from Wikimedia Commons)';
COMMENT ON COLUMN ecoregions.wikimedia_page_title IS 'Wikimedia Commons page title for fetching images';

-- Add Wikimedia image fields to parks table (if not already present)
ALTER TABLE parks
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_attribution TEXT,
ADD COLUMN IF NOT EXISTS image_license TEXT,
ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'wikimedia',
ADD COLUMN IF NOT EXISTS wikimedia_page_title TEXT,
ADD COLUMN IF NOT EXISTS image_cached_at TIMESTAMP;

COMMENT ON COLUMN parks.image_url IS 'URL to the park image (preferably from Wikimedia Commons)';
COMMENT ON COLUMN parks.wikimedia_page_title IS 'Wikimedia Commons page title for fetching images';

-- Create index for faster image lookup
CREATE INDEX IF NOT EXISTS idx_species_image_source ON species(image_source) WHERE image_url IS NULL;
CREATE INDEX IF NOT EXISTS idx_ecoregions_image_url ON ecoregions(image_url) WHERE image_url IS NULL;
CREATE INDEX IF NOT EXISTS idx_parks_image_url ON parks(image_url) WHERE image_url IS NULL;
