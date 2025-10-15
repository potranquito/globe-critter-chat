-- Add spatial query functions for ecoregion queries
-- Date: October 13, 2025

-- Function to get species within a bounding box
CREATE OR REPLACE FUNCTION get_species_in_bounds(
  bbox_wkt TEXT,
  max_results INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  class TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.class,
    s.image_url
  FROM species s
  WHERE s.geographic_range IS NOT NULL
    AND ST_Intersects(
      s.geographic_range::geometry,
      ST_GeomFromText(bbox_wkt, 4326)
    )
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get diverse species in a geographic region
CREATE OR REPLACE FUNCTION get_diverse_species_in_region(
  region_lat DECIMAL,
  region_lng DECIMAL,
  radius_degrees DECIMAL,
  taxonomic_class TEXT DEFAULT NULL,
  taxonomic_kingdom TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  class TEXT,
  kingdom TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.class,
    s.kingdom,
    s.image_url
  FROM species s
  WHERE
    s.geographic_range IS NOT NULL
    AND ST_Intersects(
      s.geographic_range::geometry,
      ST_MakeEnvelope(
        region_lng - radius_degrees,
        region_lat - radius_degrees,
        region_lng + radius_degrees,
        region_lat + radius_degrees,
        4326
      )
    )
    AND (taxonomic_class IS NULL OR s.class = taxonomic_class)
    AND (taxonomic_kingdom IS NULL OR s.kingdom = taxonomic_kingdom)
  ORDER BY
    -- Prioritize species with common names
    CASE WHEN s.common_name IS NOT NULL THEN 0 ELSE 1 END,
    -- Prioritize endangered species
    CASE
      WHEN s.conservation_status = 'CR' THEN 0
      WHEN s.conservation_status = 'EN' THEN 1
      WHEN s.conservation_status = 'VU' THEN 2
      ELSE 3
    END,
    RANDOM()
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_species_in_bounds IS 'Returns species whose range intersects with a bounding box (WKT format)';
COMMENT ON FUNCTION get_diverse_species_in_region IS 'Returns diverse species from a geographic region, prioritizing those with common names and conservation importance';
