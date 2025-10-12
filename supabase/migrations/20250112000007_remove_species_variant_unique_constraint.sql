-- Remove UNIQUE constraint to allow multiple geographic polygons per species variant
-- This enables better geographic coverage for species-to-park matching

ALTER TABLE species DROP CONSTRAINT IF EXISTS species_variant_unique;
