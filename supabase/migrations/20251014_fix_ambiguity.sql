-- FIX: Resolve Function Ambiguity
-- Run this script in Supabase SQL Editor to fix the "Could not choose best candidate function" error.

-- 1. Drop ALL versions of the function to clear the conflict
DROP FUNCTION IF EXISTS get_balanced_ecoregion_species(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_balanced_ecoregion_species(UUID, INTEGER, TEXT[]);

-- 2. Recreate the SINGLE correct version
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
