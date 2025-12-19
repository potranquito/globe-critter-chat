-- Fix spatial query functions with correct types and schema
-- Run this in Supabase SQL Editor

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_species_in_bounds(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_diverse_species_in_region(DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER);

-- Recreate with NUMERIC instead of DECIMAL (Supabase compatibility)
CREATE OR REPLACE FUNCTION public.get_species_in_bounds(
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get diverse species in a geographic region
CREATE OR REPLACE FUNCTION public.get_diverse_species_in_region(
  region_lat NUMERIC,
  region_lng NUMERIC,
  radius_degrees NUMERIC,
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_species_in_bounds(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER) TO anon, authenticated;

-- Verify functions were created
SELECT
  proname as function_name,
  pronargs as num_args,
  pronamespace::regnamespace as schema
FROM pg_proc
WHERE proname IN ('get_species_in_bounds', 'get_diverse_species_in_region')
ORDER BY proname;
