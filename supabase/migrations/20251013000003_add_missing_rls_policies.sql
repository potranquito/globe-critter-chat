-- Add missing RLS policies for species-related tables
-- These tables need RLS policies to be accessible via the Supabase REST API
-- Date: October 13, 2025

-- ============================================================================
-- RLS for species table
-- ============================================================================

ALTER TABLE species ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Species are viewable by everyone" ON species;
CREATE POLICY "Species are viewable by everyone"
  ON species FOR SELECT
  USING (true);

-- ============================================================================
-- RLS for ecoregions table
-- ============================================================================

ALTER TABLE ecoregions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ecoregions are viewable by everyone" ON ecoregions;
CREATE POLICY "Ecoregions are viewable by everyone"
  ON ecoregions FOR SELECT
  USING (true);

-- ============================================================================
-- RLS for parks table
-- ============================================================================

ALTER TABLE parks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parks are viewable by everyone" ON parks;
CREATE POLICY "Parks are viewable by everyone"
  ON parks FOR SELECT
  USING (true);

-- ============================================================================
-- RLS for species_ecoregions junction table
-- ============================================================================

ALTER TABLE species_ecoregions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Species ecoregions are viewable by everyone" ON species_ecoregions;
CREATE POLICY "Species ecoregions are viewable by everyone"
  ON species_ecoregions FOR SELECT
  USING (true);

-- ============================================================================
-- RLS for species_parks junction table
-- ============================================================================

ALTER TABLE species_parks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Species parks are viewable by everyone" ON species_parks;
CREATE POLICY "Species parks are viewable by everyone"
  ON species_parks FOR SELECT
  USING (true);

-- ============================================================================
-- RLS for enrichment_cache table
-- ============================================================================

ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrichment cache is viewable by everyone" ON enrichment_cache;
CREATE POLICY "Enrichment cache is viewable by everyone"
  ON enrichment_cache FOR SELECT
  USING (true);

COMMENT ON POLICY "Species are viewable by everyone" ON species IS 'Allow public read access to species data';
COMMENT ON POLICY "Ecoregions are viewable by everyone" ON ecoregions IS 'Allow public read access to ecoregion data';
COMMENT ON POLICY "Parks are viewable by everyone" ON parks IS 'Allow public read access to parks data';
COMMENT ON POLICY "Species ecoregions are viewable by everyone" ON species_ecoregions IS 'Allow public read access to species-ecoregion relationships';
COMMENT ON POLICY "Species parks are viewable by everyone" ON species_parks IS 'Allow public read access to species-park relationships';
COMMENT ON POLICY "Enrichment cache is viewable by everyone" ON enrichment_cache IS 'Allow public read access to cached enrichment data';
