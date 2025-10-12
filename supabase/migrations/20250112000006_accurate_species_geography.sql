-- Accurate Species Geography
-- Replace simple bbox/centroid with sample points for better accuracy

-- Remove the simple bbox fields
ALTER TABLE species DROP COLUMN IF EXISTS bbox_north;
ALTER TABLE species DROP COLUMN IF EXISTS bbox_south;
ALTER TABLE species DROP COLUMN IF EXISTS bbox_east;
ALTER TABLE species DROP COLUMN IF EXISTS bbox_west;
ALTER TABLE species DROP COLUMN IF EXISTS range_center_lat;
ALTER TABLE species DROP COLUMN IF EXISTS range_center_lng;
ALTER TABLE species DROP COLUMN IF EXISTS range_area_km2;

-- Add sample points (array of representative locations within the species' range)
-- Each point is a JSON object: {lat: number, lng: number, country?: string}
ALTER TABLE species ADD COLUMN IF NOT EXISTS sample_points JSONB;

-- Add approximate range area
ALTER TABLE species ADD COLUMN IF NOT EXISTS approx_range_area_km2 DOUBLE PRECISION;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_species_countries ON species USING GIN(countries);
CREATE INDEX IF NOT EXISTS idx_species_sample_points ON species USING GIN(sample_points);

-- Comments
COMMENT ON COLUMN species.sample_points IS 'Array of 3-10 representative points within species range: [{lat, lng, country?}]';
COMMENT ON COLUMN species.countries IS 'Array of ISO3 country codes where species exists';
COMMENT ON COLUMN species.approx_range_area_km2 IS 'Approximate total range area in square kilometers';

-- Helper function to check if species exists near a location
CREATE OR REPLACE FUNCTION species_near_location(
  species_countries TEXT[],
  species_points JSONB,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_country TEXT,
  max_distance_km DOUBLE PRECISION DEFAULT 500
)
RETURNS BOOLEAN AS $$
DECLARE
  point JSONB;
  point_lat DOUBLE PRECISION;
  point_lng DOUBLE PRECISION;
  distance_km DOUBLE PRECISION;
BEGIN
  -- First check: Is location in one of the species' countries?
  IF location_country IS NOT NULL AND species_countries IS NOT NULL THEN
    IF NOT (location_country = ANY(species_countries)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Second check: Is location near any sample point?
  IF species_points IS NOT NULL THEN
    FOR point IN SELECT * FROM jsonb_array_elements(species_points)
    LOOP
      point_lat := (point->>'lat')::DOUBLE PRECISION;
      point_lng := (point->>'lng')::DOUBLE PRECISION;

      -- Rough distance calculation (Haversine formula simplified)
      -- Accurate enough for filtering, not for precise measurements
      distance_km := 111.32 * SQRT(
        POW(point_lat - location_lat, 2) +
        POW((point_lng - location_lng) * COS(RADIANS(location_lat)), 2)
      );

      IF distance_km <= max_distance_km THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION species_near_location IS 'Check if a species exists near a given location (within max_distance_km)';
