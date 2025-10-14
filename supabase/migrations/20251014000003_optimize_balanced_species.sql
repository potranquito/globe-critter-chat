-- Migration: Optimize balanced species function to prevent timeouts
-- Created: 2025-10-14
-- The previous version was doing multiple queries in a loop which caused timeouts
-- This version does a single query with window functions for better performance

DROP FUNCTION IF EXISTS get_balanced_ecoregion_species(UUID, INTEGER, TEXT[]);

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
BEGIN
  -- Use a single query with window functions for better performance
  -- This replaces the loop-based approach that was causing timeouts

  RETURN QUERY
  WITH classified_species AS (
    SELECT
      s.id,
      s.scientific_name,
      s.common_name,
      s.conservation_status,
      s.class,
      s.kingdom,
      s.image_url,
      se.overlap_percentage,
      s.is_marine,
      s.is_terrestrial,
      s.is_freshwater,
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
      END as priority_order,
      -- Priority scoring: species with both image AND common name rank highest
      CASE
        WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 0
        WHEN s.common_name IS NOT NULL THEN 1
        WHEN s.image_url IS NOT NULL THEN 2
        ELSE 3
      END as media_priority,
      -- Conservation priority
      CASE
        WHEN s.conservation_status = 'CR' THEN 0
        WHEN s.conservation_status = 'EN' THEN 1
        WHEN s.conservation_status = 'VU' THEN 2
        WHEN s.conservation_status = 'NT' THEN 3
        ELSE 4
      END as conservation_priority,
      -- Random value for tie-breaking
      RANDOM() as random_order
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
      AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
      AND s.scientific_name IS NOT NULL
  ),
  ranked_species AS (
    SELECT
      cs.id,
      cs.scientific_name,
      cs.common_name,
      cs.conservation_status,
      cs.class,
      cs.kingdom,
      cs.image_url,
      cs.overlap_percentage,
      cs.is_marine,
      cs.is_terrestrial,
      cs.is_freshwater,
      cs.taxonomic_group,
      cs.priority_order,
      ROW_NUMBER() OVER (
        PARTITION BY cs.taxonomic_group
        ORDER BY
          cs.media_priority,
          cs.overlap_percentage DESC NULLS LAST,
          cs.conservation_priority,
          cs.random_order
      ) as rank_in_group
    FROM classified_species cs
  )
  SELECT
    rs.id,
    rs.scientific_name,
    rs.common_name,
    rs.conservation_status,
    rs.class,
    rs.kingdom,
    rs.image_url,
    rs.overlap_percentage,
    rs.taxonomic_group,
    rs.is_marine,
    rs.is_terrestrial,
    rs.is_freshwater
  FROM ranked_species rs
  WHERE rs.rank_in_group <= p_species_per_class
  ORDER BY rs.priority_order, rs.rank_in_group;

END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_balanced_ecoregion_species IS 'Returns species from an ecoregion with balanced taxonomic diversity. Optimized with window functions to prevent timeouts. Prioritizes species with images and common names.';
