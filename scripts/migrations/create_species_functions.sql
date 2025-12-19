-- ============================================================================
-- CREATE MISSING DATABASE FUNCTIONS FOR SPECIES QUERIES
-- ============================================================================

-- Function to get balanced species mix by ecoregion
CREATE OR REPLACE FUNCTION get_curated_species_by_ecoregion_balanced(
  ecoregion_uuid UUID,
  max_per_class INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  class TEXT,
  conservation_status TEXT,
  taxonomic_group TEXT,
  image_url TEXT,
  is_marine BOOLEAN,
  is_terrestrial BOOLEAN,
  is_freshwater BOOLEAN,
  overlap_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_species AS (
    SELECT
      s.id,
      s.scientific_name,
      s.common_name,
      s.class,
      s.conservation_status,
      COALESCE(s.ui_group, 'Animals') as taxonomic_group,
      s.image_url,
      s.is_marine,
      s.is_terrestrial,
      s.is_freshwater,
      COALESCE(se.overlap_percentage, 100.0) as overlap_percentage,
      ROW_NUMBER() OVER (
        PARTITION BY s.class
        ORDER BY
          s.is_curated DESC,                    -- Prioritize curated species
          s.image_url IS NOT NULL DESC,          -- Then species with images
          s.common_name IS NOT NULL DESC,        -- Then species with common names
          RANDOM()                               -- Finally random for variety
      ) as rank_in_class
    FROM species s
    JOIN species_ecoregions se ON s.id = se.species_id
    WHERE se.ecoregion_id = ecoregion_uuid
  )
  SELECT
    ranked_species.id,
    ranked_species.scientific_name,
    ranked_species.common_name,
    ranked_species.class,
    ranked_species.conservation_status,
    ranked_species.taxonomic_group,
    ranked_species.image_url,
    ranked_species.is_marine,
    ranked_species.is_terrestrial,
    ranked_species.is_freshwater,
    ranked_species.overlap_percentage
  FROM ranked_species
  WHERE rank_in_class <= max_per_class
  ORDER BY
    -- Prioritize variety: one species from each class in rotation
    rank_in_class,
    class;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access
GRANT EXECUTE ON FUNCTION get_curated_species_by_ecoregion_balanced TO anon, authenticated, service_role;

-- Test the function
SELECT
  class,
  COUNT(*) as count
FROM get_curated_species_by_ecoregion_balanced(
  (SELECT id FROM ecoregions WHERE name ILIKE '%Amazon%' LIMIT 1),
  10
)
GROUP BY class
ORDER BY count DESC;

SELECT '✅ Species functions created successfully!' as status;
