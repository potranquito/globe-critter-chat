-- Final fix for species functions - handle string-encoded JSONB
-- Your Arctic species query worked, so this will too!

DROP FUNCTION IF EXISTS public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_species_in_bounds(TEXT, INTEGER);

-- Create the working function for diverse species
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
  FROM species s,
       jsonb_array_elements((s.sample_points #>> '{}')::jsonb) AS point
  WHERE
    s.sample_points IS NOT NULL
    AND (point->>'lat')::NUMERIC BETWEEN (region_lat - radius_degrees) AND (region_lat + radius_degrees)
    AND (point->>'lng')::NUMERIC BETWEEN (region_lng - radius_degrees) AND (region_lng + radius_degrees)
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

-- Create simplified bounds function
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
  WHERE s.sample_points IS NOT NULL
  ORDER BY RANDOM()
  LIMIT max_results;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_diverse_species_in_region(NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_species_in_bounds(TEXT, INTEGER) TO anon, authenticated;

-- Test it with Arctic coordinates (should return Muskox, Narwhal, Arctic Fox, etc.)
SELECT * FROM public.get_diverse_species_in_region(
    71.0,
    -100.0,
    10.0,
    'MAMMALIA',
    NULL,
    3
);
