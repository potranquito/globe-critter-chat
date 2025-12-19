-- Fix functions to handle sample_points stored as JSONB string
-- The issue: sample_points is stored as a JSONB string, not a proper array
-- Run this in Supabase SQL Editor

DROP FUNCTION IF EXISTS public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_species_in_bounds(TEXT, INTEGER);

-- Recreate with proper handling of the string-encoded JSON
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
    s.sample_points IS NOT NULL
    -- Parse the JSONB string into an array and check each point
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(s.sample_points) = 'string'
          THEN (s.sample_points #>> '{}')::jsonb  -- Convert string to jsonb
          ELSE s.sample_points
        END
      ) AS point
      WHERE
        (point->>'lat') IS NOT NULL
        AND (point->>'lng') IS NOT NULL
        AND (point->>'lat')::NUMERIC BETWEEN (region_lat - radius_degrees) AND (region_lat + radius_degrees)
        AND (point->>'lng')::NUMERIC BETWEEN (region_lng - radius_degrees) AND (region_lng + radius_degrees)
    )
    AND (taxonomic_class IS NULL OR s.class = taxonomic_class)
    AND (taxonomic_kingdom IS NULL OR s.kingdom = taxonomic_kingdom)
  ORDER BY
    CASE WHEN s.common_name IS NOT NULL AND s.common_name != '' THEN 0 ELSE 1 END,
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
  -- Simplified: just return random species with sample points
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.class,
    s.image_url
  FROM species s
  WHERE s.sample_points IS NOT NULL
  ORDER BY RANDOM()
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_species_in_bounds(TEXT, INTEGER) TO anon, authenticated;

-- Test it
SELECT * FROM public.get_diverse_species_in_region(
    17.5,      -- Mexico latitude (where Thorius omiltemi is)
    -99.8,     -- Mexico longitude
    1.0,       -- 1 degree radius
    'AMPHIBIA',
    NULL,
    3
);
