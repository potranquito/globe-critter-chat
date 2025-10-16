-- Update database functions to return dietary_category and classification fields
-- This fixes the issue where filters don't work because the fields aren't being returned

-- Update get_balanced_ecoregion_species to include new classification fields
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
  is_freshwater BOOLEAN,
  -- NEW classification fields
  species_type TEXT,
  ui_group TEXT,
  trophic_role TEXT,
  dietary_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH deduplicated_species AS (
    SELECT DISTINCT ON (s.scientific_name)
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
      s.species_type,
      s.ui_group,
      s.trophic_role,
      s.dietary_category
    FROM species_ecoregions se
    JOIN species s ON s.id = se.species_id
    WHERE se.ecoregion_id = p_ecoregion_id
      AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
      AND s.scientific_name IS NOT NULL
    ORDER BY
      s.scientific_name,
      CASE
        WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 0
        WHEN s.common_name IS NOT NULL THEN 1
        WHEN s.image_url IS NOT NULL THEN 2
        ELSE 3
      END,
      se.overlap_percentage DESC NULLS LAST
  ),
  classified_species AS (
    SELECT
      ds.id,
      ds.scientific_name,
      ds.common_name,
      ds.conservation_status,
      ds.class,
      ds.kingdom,
      ds.image_url,
      ds.overlap_percentage,
      ds.is_marine,
      ds.is_terrestrial,
      ds.is_freshwater,
      ds.species_type,
      ds.ui_group,
      ds.trophic_role,
      ds.dietary_category,
      CASE
        WHEN ds.class = 'MAMMALIA' THEN 'Mammals'
        WHEN ds.class = 'AVES' THEN 'Birds'
        WHEN ds.class = 'REPTILIA' THEN 'Reptiles'
        WHEN ds.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN ds.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN ds.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN ds.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END as taxonomic_group,
      CASE
        WHEN ds.class = 'MAMMALIA' THEN 1
        WHEN ds.class = 'AVES' THEN 2
        WHEN ds.class = 'REPTILIA' THEN 3
        WHEN ds.class = 'AMPHIBIA' THEN 4
        WHEN ds.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 5
        WHEN ds.kingdom = 'PLANTAE' THEN 6
        WHEN ds.class = 'INSECTA' THEN 7
        ELSE 8
      END as priority_order,
      CASE
        WHEN ds.image_url IS NOT NULL AND ds.common_name IS NOT NULL THEN 0
        WHEN ds.common_name IS NOT NULL THEN 1
        WHEN ds.image_url IS NOT NULL THEN 2
        ELSE 3
      END as media_priority,
      CASE
        WHEN ds.conservation_status = 'CR' THEN 0
        WHEN ds.conservation_status = 'EN' THEN 1
        WHEN ds.conservation_status = 'VU' THEN 2
        WHEN ds.conservation_status = 'NT' THEN 3
        ELSE 4
      END as conservation_priority,
      RANDOM() as random_order
    FROM deduplicated_species ds
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
      cs.species_type,
      cs.ui_group,
      cs.trophic_role,
      cs.dietary_category,
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
    rs.is_freshwater,
    rs.species_type,
    rs.ui_group,
    rs.trophic_role,
    rs.dietary_category
  FROM ranked_species rs
  WHERE rs.rank_in_group <= p_species_per_class
  ORDER BY rs.priority_order, rs.rank_in_group;

END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_balanced_ecoregion_species IS 'Returns species from an ecoregion with balanced taxonomic diversity and dietary classification fields. Uses DISTINCT ON to prevent duplicate species. Prioritizes species with images and common names.';


-- Update get_balanced_spatial_species to include new classification fields
-- Drop all versions of the function (different signatures exist)
DROP FUNCTION IF EXISTS get_balanced_spatial_species(DECIMAL, DECIMAL, DECIMAL, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_balanced_spatial_species(DECIMAL, DECIMAL, DECIMAL, INTEGER, TEXT[]);

CREATE OR REPLACE FUNCTION get_balanced_spatial_species(
  p_region_lat DECIMAL,
  p_region_lng DECIMAL,
  p_radius_degrees DECIMAL,
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
  taxonomic_group TEXT,
  is_marine BOOLEAN,
  is_terrestrial BOOLEAN,
  is_freshwater BOOLEAN,
  -- NEW classification fields
  species_type TEXT,
  ui_group TEXT,
  trophic_role TEXT,
  dietary_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH nearby_species AS (
    SELECT DISTINCT ON (s.scientific_name)
      s.id,
      s.scientific_name,
      s.common_name,
      s.conservation_status,
      s.class,
      s.kingdom,
      s.image_url,
      s.is_marine,
      s.is_terrestrial,
      s.is_freshwater,
      s.species_type,
      s.ui_group,
      s.trophic_role,
      s.dietary_category
    FROM species s
    WHERE s.scientific_name IS NOT NULL
      AND (cardinality(p_exclude_species) = 0 OR NOT (s.scientific_name = ANY(p_exclude_species)))
      AND s.sample_points IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(s.sample_points) AS point
        WHERE ABS((point->>'lat')::DECIMAL - p_region_lat) <= p_radius_degrees
          AND ABS((point->>'lng')::DECIMAL - p_region_lng) <= p_radius_degrees
      )
    ORDER BY
      s.scientific_name,
      CASE
        WHEN s.image_url IS NOT NULL AND s.common_name IS NOT NULL THEN 0
        WHEN s.common_name IS NOT NULL THEN 1
        WHEN s.image_url IS NOT NULL THEN 2
        ELSE 3
      END,
      RANDOM()
  ),
  classified_species AS (
    SELECT
      ns.id,
      ns.scientific_name,
      ns.common_name,
      ns.conservation_status,
      ns.class,
      ns.kingdom,
      ns.image_url,
      ns.is_marine,
      ns.is_terrestrial,
      ns.is_freshwater,
      ns.species_type,
      ns.ui_group,
      ns.trophic_role,
      ns.dietary_category,
      CASE
        WHEN ns.class = 'MAMMALIA' THEN 'Mammals'
        WHEN ns.class = 'AVES' THEN 'Birds'
        WHEN ns.class = 'REPTILIA' THEN 'Reptiles'
        WHEN ns.class = 'AMPHIBIA' THEN 'Amphibians'
        WHEN ns.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 'Fish'
        WHEN ns.kingdom = 'PLANTAE' THEN 'Plants'
        WHEN ns.class = 'INSECTA' THEN 'Insects'
        ELSE 'Other'
      END as taxonomic_group,
      CASE
        WHEN ns.class = 'MAMMALIA' THEN 1
        WHEN ns.class = 'AVES' THEN 2
        WHEN ns.class = 'REPTILIA' THEN 3
        WHEN ns.class = 'AMPHIBIA' THEN 4
        WHEN ns.class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII') THEN 5
        WHEN ns.kingdom = 'PLANTAE' THEN 6
        WHEN ns.class = 'INSECTA' THEN 7
        ELSE 8
      END as priority_order,
      CASE
        WHEN ns.image_url IS NOT NULL AND ns.common_name IS NOT NULL THEN 0
        WHEN ns.common_name IS NOT NULL THEN 1
        WHEN ns.image_url IS NOT NULL THEN 2
        ELSE 3
      END as media_priority,
      CASE
        WHEN ns.conservation_status = 'CR' THEN 0
        WHEN ns.conservation_status = 'EN' THEN 1
        WHEN ns.conservation_status = 'VU' THEN 2
        WHEN ns.conservation_status = 'NT' THEN 3
        ELSE 4
      END as conservation_priority,
      RANDOM() as random_order
    FROM nearby_species ns
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
      cs.is_marine,
      cs.is_terrestrial,
      cs.is_freshwater,
      cs.species_type,
      cs.ui_group,
      cs.trophic_role,
      cs.dietary_category,
      cs.taxonomic_group,
      cs.priority_order,
      ROW_NUMBER() OVER (
        PARTITION BY cs.taxonomic_group
        ORDER BY
          cs.media_priority,
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
    rs.taxonomic_group,
    rs.is_marine,
    rs.is_terrestrial,
    rs.is_freshwater,
    rs.species_type,
    rs.ui_group,
    rs.trophic_role,
    rs.dietary_category
  FROM ranked_species rs
  WHERE rs.rank_in_group <= p_species_per_class
  ORDER BY rs.priority_order, rs.rank_in_group;

END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_balanced_spatial_species IS 'Returns species from a spatial region with balanced representation across taxonomic groups and dietary classification fields';
