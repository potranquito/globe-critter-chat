-- Update Parks Schema for WDPA Integration
-- Enhances the parks table to support World Database on Protected Areas data
-- Date: October 12, 2025

-- Add WDPA-specific fields to parks table
ALTER TABLE parks
ADD COLUMN IF NOT EXISTS wdpa_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS designation_eng TEXT,
ADD COLUMN IF NOT EXISTS iucn_category TEXT,
ADD COLUMN IF NOT EXISTS governance TEXT,
ADD COLUMN IF NOT EXISTS own_type TEXT,
ADD COLUMN IF NOT EXISTS management_authority TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS status_year INTEGER,
ADD COLUMN IF NOT EXISTS gis_area_km2 DECIMAL,
ADD COLUMN IF NOT EXISTS reported_area_km2 DECIMAL,
ADD COLUMN IF NOT EXISTS marine_area_km2 DECIMAL,
ADD COLUMN IF NOT EXISTS no_take_area_km2 DECIMAL,
ADD COLUMN IF NOT EXISTS iso3 TEXT,
ADD COLUMN IF NOT EXISTS parent_iso3 TEXT,
ADD COLUMN IF NOT EXISTS verif TEXT,
ADD COLUMN IF NOT EXISTS metadataid INTEGER,
ADD COLUMN IF NOT EXISTS sub_location TEXT;

-- Add indexes for WDPA fields
CREATE INDEX IF NOT EXISTS idx_parks_wdpa_id ON parks(wdpa_id);
CREATE INDEX IF NOT EXISTS idx_parks_designation ON parks(designation_eng);
CREATE INDEX IF NOT EXISTS idx_parks_iucn_category ON parks(iucn_category);
CREATE INDEX IF NOT EXISTS idx_parks_status ON parks(status);
CREATE INDEX IF NOT EXISTS idx_parks_iso3 ON parks(iso3);
CREATE INDEX IF NOT EXISTS idx_parks_gis_area ON parks(gis_area_km2);

-- Update existing indexes
DROP INDEX IF EXISTS idx_parks_type;
CREATE INDEX idx_parks_designation_type ON parks(park_type, designation_eng);

-- Add constraint for valid IUCN categories
ALTER TABLE parks
DROP CONSTRAINT IF EXISTS valid_iucn_category;

ALTER TABLE parks
ADD CONSTRAINT valid_iucn_category
CHECK (iucn_category IS NULL OR iucn_category IN ('Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI', 'Not Reported', 'Not Applicable', 'Not Assigned'));

-- Add constraint for valid status values
ALTER TABLE parks
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE parks
ADD CONSTRAINT valid_status
CHECK (status IS NULL OR status IN ('Proposed', 'Inscribed', 'Adopted', 'Designated', 'Established'));

-- Create view for ecoregion park summary
CREATE OR REPLACE VIEW ecoregion_parks_summary AS
SELECT
  e.id AS ecoregion_id,
  e.name AS ecoregion_name,
  e.biome,
  e.realm,
  COUNT(DISTINCT p.id) AS total_parks,
  COUNT(DISTINCT CASE WHEN p.iucn_category IN ('Ia', 'Ib', 'II') THEN p.id END) AS strict_protection_parks,
  SUM(p.gis_area_km2) AS total_protected_area_km2,
  COUNT(DISTINCT sp.species_id) AS total_species
FROM ecoregions e
LEFT JOIN parks p ON p.ecoregion_id = e.id
LEFT JOIN species_parks sp ON sp.park_id = p.id
GROUP BY e.id, e.name, e.biome, e.realm
ORDER BY total_parks DESC;

-- Create view for park species summary
CREATE OR REPLACE VIEW park_species_summary AS
SELECT
  p.id AS park_id,
  p.name AS park_name,
  p.designation_eng,
  p.iucn_category,
  p.gis_area_km2,
  COUNT(DISTINCT sp.species_id) AS total_species,
  COUNT(DISTINCT CASE WHEN s.conservation_status = 'CR' THEN sp.species_id END) AS critically_endangered,
  COUNT(DISTINCT CASE WHEN s.conservation_status = 'EN' THEN sp.species_id END) AS endangered,
  COUNT(DISTINCT CASE WHEN s.conservation_status = 'VU' THEN sp.species_id END) AS vulnerable,
  COUNT(DISTINCT CASE WHEN s.class = 'MAMMALIA' THEN sp.species_id END) AS mammals,
  COUNT(DISTINCT CASE WHEN s.class = 'AVES' THEN sp.species_id END) AS birds,
  COUNT(DISTINCT CASE WHEN s.class = 'REPTILIA' THEN sp.species_id END) AS reptiles,
  COUNT(DISTINCT CASE WHEN s.class = 'AMPHIBIA' THEN sp.species_id END) AS amphibians,
  COUNT(DISTINCT CASE WHEN s.kingdom = 'PLANTAE' THEN sp.species_id END) AS plants
FROM parks p
LEFT JOIN species_parks sp ON sp.park_id = p.id
LEFT JOIN species s ON s.id = sp.species_id
GROUP BY p.id, p.name, p.designation_eng, p.iucn_category, p.gis_area_km2
ORDER BY total_species DESC;

-- Function to find parks within an ecoregion
CREATE OR REPLACE FUNCTION get_parks_in_ecoregion(ecoregion_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  wdpa_id INTEGER,
  designation_eng TEXT,
  iucn_category TEXT,
  park_type TEXT,
  gis_area_km2 DECIMAL,
  center_lat DECIMAL,
  center_lng DECIMAL,
  species_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.wdpa_id,
    p.designation_eng,
    p.iucn_category,
    p.park_type,
    p.gis_area_km2,
    p.center_lat,
    p.center_lng,
    COUNT(DISTINCT sp.species_id) AS species_count
  FROM parks p
  LEFT JOIN species_parks sp ON sp.park_id = p.id
  WHERE p.ecoregion_id = ecoregion_uuid
  GROUP BY p.id, p.name, p.wdpa_id, p.designation_eng, p.iucn_category, p.park_type, p.gis_area_km2, p.center_lat, p.center_lng
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get parks by country
CREATE OR REPLACE FUNCTION get_parks_by_country(country_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  wdpa_id INTEGER,
  designation_eng TEXT,
  iucn_category TEXT,
  gis_area_km2 DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.wdpa_id,
    p.designation_eng,
    p.iucn_category,
    p.gis_area_km2
  FROM parks p
  WHERE p.iso3 = country_code
  ORDER BY p.gis_area_km2 DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN parks.wdpa_id IS 'World Database on Protected Areas unique identifier';
COMMENT ON COLUMN parks.designation_eng IS 'Protected area designation in English (e.g., National Park, Wildlife Refuge)';
COMMENT ON COLUMN parks.iucn_category IS 'IUCN Protected Area Management Category (Ia-VI)';
COMMENT ON COLUMN parks.gis_area_km2 IS 'Calculated area from GIS geometry in km²';
COMMENT ON COLUMN parks.iso3 IS 'ISO 3166-1 alpha-3 country code';

COMMENT ON VIEW ecoregion_parks_summary IS 'Summary statistics of parks and species per ecoregion';
COMMENT ON VIEW park_species_summary IS 'Summary of species diversity and conservation status per park';
