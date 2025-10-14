-- Migration: Prioritize species with images and common names
-- Created: 2025-10-14
-- This updates the balanced species function to prefer species that have both
-- common names AND images, making the UI more engaging

-- Drop the old function (with old signature)
DROP FUNCTION IF EXISTS get_balanced_ecoregion_species(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION get_balanced_ecoregion_species(
  p_ecoregion_id UUID,
  p_species_per_class INTEGER DEFAULT 3,
  p_exclude_species TEXT[] DEFAULT ARRAY[]::TEXT[]
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
  taxonomic_group TEXT,
  is_marine BOOLEAN,
  is_terrestrial BOOLEAN,
  is_freshwater BOOLEAN
) AS $$
DECLARE
  v_class_record RECORD;
  v_total_species_available INTEGER;
  v_species_returned INTEGER := 0;
BEGIN
  -- Get species balanced across major taxonomic groups
  -- Priority: Species with images AND common names first

  -- First check if we have any species at all
  SELECT COUNT(*) INTO v_total_species_available
  FROM species_ecoregions se
  JOIN species s ON s.id = se.species_id
  WHERE se.ecoregion_id = p_ecoregion_id
    AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
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
      AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
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
      v_class_record.taxonomic_group,
      s.is_marine,
      s.is_terrestrial,
      s.is_freshwater
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
      AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
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
      -- HIGHEST PRIORITY: Species with BOTH image AND common name
      CASE
        WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 0
        WHEN s.common_name IS NOT NULL THEN 1
        WHEN s.image_url IS NOT NULL THEN 2
        ELSE 3
      END,
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

COMMENT ON FUNCTION get_balanced_ecoregion_species IS 'Returns species from an ecoregion with balanced taxonomic diversity, prioritizing species with images and common names for better UX';
