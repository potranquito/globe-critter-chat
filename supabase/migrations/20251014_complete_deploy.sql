-- Migration: Balanced species selection and media enrichment (Final Version)
-- Created: 2025-10-14

-- =============================================================================
-- PART 1: Balanced species selection by taxonomic class
-- =============================================================================

-- Explicitly drop the function with specific signature to avoid ambiguity
DROP FUNCTION IF EXISTS get_balanced_ecoregion_species(UUID, INTEGER, TEXT);

-- Function to get balanced species from an ecoregion
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
BEGIN
  -- Check if we have any species
  SELECT COUNT(*) INTO v_total_species_available
  FROM species_ecoregions se
  JOIN species s ON s.id = se.species_id
  WHERE se.ecoregion_id = p_ecoregion_id
    AND (p_exclude_species IS NULL OR s.scientific_name != p_exclude_species)
    AND s.scientific_name IS NOT NULL;

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
      END as taxonomic_group
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
    ORDER BY taxonomic_group
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
      CASE WHEN s.common_name IS NOT NULL THEN 0 ELSE 1 END,
      se.overlap_percentage DESC,
      RANDOM()
    LIMIT p_species_per_class;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_balanced_ecoregion_species(UUID, INTEGER, TEXT) IS 'Returns species from an ecoregion with balanced representation across taxonomic groups';

-- Function to get balanced species from a spatial region
DROP FUNCTION IF EXISTS get_balanced_spatial_species(DECIMAL, DECIMAL, DECIMAL, INTEGER, TEXT);

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
      END as taxonomic_group
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
      CASE WHEN s.common_name IS NOT NULL THEN 0 ELSE 1 END,
      RANDOM()
    LIMIT p_species_per_class;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_balanced_spatial_species(DECIMAL, DECIMAL, DECIMAL, INTEGER, TEXT) IS 'Returns species from a spatial region with balanced representation across taxonomic groups';

-- =============================================================================
-- PART 2: Add media/image fields to ecoregions and parks tables
-- =============================================================================

ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS image_attribution TEXT;
ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS image_license TEXT;
ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'wikimedia';
ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS wikimedia_page_title TEXT;
ALTER TABLE ecoregions ADD COLUMN IF NOT EXISTS image_cached_at TIMESTAMP;

ALTER TABLE parks ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE parks ADD COLUMN IF NOT EXISTS image_attribution TEXT;
ALTER TABLE parks ADD COLUMN IF NOT EXISTS image_license TEXT;
ALTER TABLE parks ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'wikimedia';
ALTER TABLE parks ADD COLUMN IF NOT EXISTS wikimedia_page_title TEXT;
ALTER TABLE parks ADD COLUMN IF NOT EXISTS image_cached_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_species_image_source ON species(image_source) WHERE image_url IS NULL;
CREATE INDEX IF NOT EXISTS idx_ecoregions_image_url ON ecoregions(image_url) WHERE image_url IS NULL;
CREATE INDEX IF NOT EXISTS idx_parks_image_url ON parks(image_url) WHERE image_url IS NULL;

-- =============================================================================
-- PART 3: Security Fixes
-- =============================================================================

-- Fix 'Security Definer' warning for region_progress view
ALTER VIEW public.region_progress SET (security_invoker = true);

-- Note: spatial_ref_sys changes removed due to insufficient permissions.
-- It is safe to ignore the RLS warning for spatial_ref_sys.
