-- Fix ecoregions table to accept MultiPolygon geometries

-- Drop the old geometry column
ALTER TABLE ecoregions DROP COLUMN IF EXISTS geometry;

-- Add new geometry column that accepts any polygon type
ALTER TABLE ecoregions ADD COLUMN geometry GEOGRAPHY(MULTIPOLYGON, 4326);

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_ecoregions_geometry ON ecoregions USING GIST(geometry);
