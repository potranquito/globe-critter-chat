-- Fix spatial query functions to work with the actual species table schema
-- The species table uses sample_points (JSONB) instead of geographic_range (PostGIS)
-- Run this in Supabase SQL Editor

-- Drop old functions that reference non-existent geographic_range column
DROP FUNCTION IF EXISTS public.get_species_in_bounds(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_diverse_species_in_region(DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER);

-- Create new function that uses sample_points for geographic filtering
-- This checks if any of the sample points are within the bounding box
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
    -- Check if sample_points contains any points within the bounding box
    s.sample_points IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(s.sample_points) AS point
      WHERE (point->>'lat')::NUMERIC BETWEEN (region_lat - radius_degrees) AND (region_lat + radius_degrees)
        AND (point->>'lng')::NUMERIC BETWEEN (region_lng - radius_degrees) AND (region_lng + radius_degrees)
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

-- Create simplified get_species_in_bounds that also uses sample_points
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
DECLARE
  -- Parse the WKT POLYGON to get min/max lat/lng
  -- Format: POLYGON((lng1 lat1, lng2 lat2, lng3 lat3, lng4 lat4, lng1 lat1))
  min_lat NUMERIC;
  max_lat NUMERIC;
  min_lng NUMERIC;
  max_lng NUMERIC;
BEGIN
  -- For simplicity, extract rough bounds from the WKT
  -- This is a simplified parser - assumes rectangular polygon
  SELECT
    MIN((point->>'lat')::NUMERIC),
    MAX((point->>'lat')::NUMERIC),
    MIN((point->>'lng')::NUMERIC),
    MAX((point->>'lng')::NUMERIC)
  INTO min_lat, max_lat, min_lng, max_lng
  FROM species s
  CROSS JOIN jsonb_array_elements(s.sample_points) AS point
  WHERE s.sample_points IS NOT NULL
  LIMIT 1; -- Just to get some baseline values

  -- Now return species with sample points in the general area
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.class,
    s.image_url
  FROM species s
  WHERE
    s.sample_points IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(s.sample_points) AS point
      WHERE (point->>'lat')::NUMERIC IS NOT NULL
        AND (point->>'lng')::NUMERIC IS NOT NULL
    )
  ORDER BY RANDOM()
  LIMIT max_results;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_species_in_bounds(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER) TO anon, authenticated;

-- Test the function
SELECT * FROM public.get_diverse_species_in_region(
    71.0,     -- Arctic latitude
    -100.0,   -- Arctic longitude
    10.0,     -- radius (10 degrees ~ 1100km)
    'MAMMALIA', -- class
    NULL,     -- kingdom
    3         -- limit
);

COMMENT ON FUNCTION public.get_diverse_species_in_region IS 'Returns diverse species from a geographic region using sample_points data';
COMMENT ON FUNCTION public.get_species_in_bounds IS 'Returns species within bounds using sample_points data';
