-- Fix ecoregions table to accept ANY geometry type

-- Drop the old geometry column
ALTER TABLE ecoregions DROP COLUMN IF EXISTS geometry;

-- Add new geometry column that accepts any geometry type (not just Polygon or MultiPolygon)
ALTER TABLE ecoregions ADD COLUMN geometry GEOGRAPHY;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_ecoregions_geometry ON ecoregions USING GIST(geometry);
