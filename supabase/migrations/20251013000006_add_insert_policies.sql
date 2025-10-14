-- Add INSERT policies for data import scripts
-- These policies allow service role to insert data during bulk imports
-- Date: October 13, 2025

-- ============================================================================
-- INSERT policy for species table (for bulk imports)
-- ============================================================================

DROP POLICY IF EXISTS "Allow service role to insert species" ON species;
CREATE POLICY "Allow service role to insert species"
  ON species FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to delete species" ON species;
CREATE POLICY "Allow service role to delete species"
  ON species FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow service role to update species" ON species;
CREATE POLICY "Allow service role to update species"
  ON species FOR UPDATE
  USING (true);

-- ============================================================================
-- INSERT policies for ecoregions table
-- ============================================================================

DROP POLICY IF EXISTS "Allow service role to insert ecoregions" ON ecoregions;
CREATE POLICY "Allow service role to insert ecoregions"
  ON ecoregions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to delete ecoregions" ON ecoregions;
CREATE POLICY "Allow service role to delete ecoregions"
  ON ecoregions FOR DELETE
  USING (true);

-- ============================================================================
-- INSERT policies for parks table
-- ============================================================================

DROP POLICY IF EXISTS "Allow service role to insert parks" ON parks;
CREATE POLICY "Allow service role to insert parks"
  ON parks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to delete parks" ON parks;
CREATE POLICY "Allow service role to delete parks"
  ON parks FOR DELETE
  USING (true);

-- ============================================================================
-- INSERT policies for species_ecoregions junction table
-- ============================================================================

DROP POLICY IF EXISTS "Allow service role to insert species_ecoregions" ON species_ecoregions;
CREATE POLICY "Allow service role to insert species_ecoregions"
  ON species_ecoregions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to delete species_ecoregions" ON species_ecoregions;
CREATE POLICY "Allow service role to delete species_ecoregions"
  ON species_ecoregions FOR DELETE
  USING (true);

-- ============================================================================
-- INSERT policies for species_parks junction table
-- ============================================================================

DROP POLICY IF EXISTS "Allow service role to insert species_parks" ON species_parks;
CREATE POLICY "Allow service role to insert species_parks"
  ON species_parks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to delete species_parks" ON species_parks;
CREATE POLICY "Allow service role to delete species_parks"
  ON species_parks FOR DELETE
  USING (true);

COMMENT ON POLICY "Allow service role to insert species" ON species IS 'Allow bulk import scripts to insert species data';
COMMENT ON POLICY "Allow service role to delete species" ON species IS 'Allow bulk import scripts to delete species data';
COMMENT ON POLICY "Allow service role to update species" ON species IS 'Allow bulk import scripts to update species data';
