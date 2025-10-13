-- Simplify species schema for lightweight metadata
-- Remove heavy geographic_range column, add lightweight fields

-- Drop the heavy geography column if it exists
ALTER TABLE species DROP COLUMN IF EXISTS geographic_range;

-- Add lightweight geographic metadata
ALTER TABLE species ADD COLUMN IF NOT EXISTS bbox_north DOUBLE PRECISION;
ALTER TABLE species ADD COLUMN IF NOT EXISTS bbox_south DOUBLE PRECISION;
ALTER TABLE species ADD COLUMN IF NOT EXISTS bbox_east DOUBLE PRECISION;
ALTER TABLE species ADD COLUMN IF NOT EXISTS bbox_west DOUBLE PRECISION;

ALTER TABLE species ADD COLUMN IF NOT EXISTS range_center_lat DOUBLE PRECISION;
ALTER TABLE species ADD COLUMN IF NOT EXISTS range_center_lng DOUBLE PRECISION;

ALTER TABLE species ADD COLUMN IF NOT EXISTS range_area_km2 DOUBLE PRECISION;

-- Add country list (array of ISO3 country codes)
ALTER TABLE species ADD COLUMN IF NOT EXISTS countries TEXT[];

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_species_bbox ON species(bbox_north, bbox_south, bbox_east, bbox_west);
CREATE INDEX IF NOT EXISTS idx_species_center ON species(range_center_lat, range_center_lng);
CREATE INDEX IF NOT EXISTS idx_species_countries ON species USING GIN(countries);

-- Add comments
COMMENT ON COLUMN species.bbox_north IS 'Northern boundary of species range (latitude)';
COMMENT ON COLUMN species.bbox_south IS 'Southern boundary of species range (latitude)';
COMMENT ON COLUMN species.bbox_east IS 'Eastern boundary of species range (longitude)';
COMMENT ON COLUMN species.bbox_west IS 'Western boundary of species range (longitude)';
COMMENT ON COLUMN species.range_center_lat IS 'Approximate center of species range (latitude)';
COMMENT ON COLUMN species.range_center_lng IS 'Approximate center of species range (longitude)';
COMMENT ON COLUMN species.range_area_km2 IS 'Approximate range area in square kilometers';
COMMENT ON COLUMN species.countries IS 'Array of ISO3 country codes where species exists';
