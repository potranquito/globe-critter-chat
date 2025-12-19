-- ============================================================================
-- DATABASE RESTORATION - STEP 1: CREATE ALL TABLES
-- ============================================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jqirupugxgsqgydxaebt/sql
--
-- This creates all tables and inserts the 6 curated ecoregions
-- After this, run the Python script to import species from CSV
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- CLEAN SLATE: Drop existing tables
-- ============================================================================

DROP TABLE IF EXISTS public.enrichment_cache CASCADE;
DROP TABLE IF EXISTS public.species_parks CASCADE;
DROP TABLE IF EXISTS public.species_ecoregions CASCADE;
DROP TABLE IF EXISTS public.bird_calls CASCADE;
DROP TABLE IF EXISTS public.parks CASCADE;
DROP TABLE IF EXISTS public.ecoregions CASCADE;
DROP TABLE IF EXISTS public.species CASCADE;
DROP TABLE IF EXISTS public.global_health CASCADE;

-- ============================================================================
-- CREATE CORE TABLES
-- ============================================================================

-- Species table
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iucn_id INTEGER UNIQUE,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  conservation_status TEXT,
  conservation_status_full TEXT,
  kingdom TEXT,
  phylum TEXT,
  class TEXT,
  order_name TEXT,
  family TEXT,
  genus TEXT,
  is_marine BOOLEAN DEFAULT false,
  is_terrestrial BOOLEAN DEFAULT false,
  is_freshwater BOOLEAN DEFAULT false,
  geographic_range GEOGRAPHY(MULTIPOLYGON, 4326),
  image_url TEXT,
  image_large_url TEXT,
  image_attribution TEXT,
  image_license TEXT,
  image_source TEXT,
  image_cached_at TIMESTAMP,
  species_type TEXT,
  ui_group TEXT,
  trophic_role TEXT,
  is_curated BOOLEAN DEFAULT false,
  iucn_citation TEXT,
  compiler TEXT,
  year_compiled INTEGER,
  description TEXT,
  threats TEXT[],
  population_trend TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ecoregions table
CREATE TABLE ecoregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecoregion_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  biome TEXT,
  realm TEXT,
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_km INTEGER,
  geometry GEOGRAPHY(POLYGON, 4326),
  image_url TEXT,
  image_attribution TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parks table
CREATE TABLE parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  state_province TEXT,
  ecoregion_id UUID REFERENCES ecoregions(id),
  bounds GEOGRAPHY(POLYGON, 4326),
  center_lat DECIMAL,
  center_lng DECIMAL,
  park_type TEXT,
  protection_status TEXT,
  size_km2 DECIMAL,
  protected_planet_id TEXT,
  wdpa_id TEXT,
  description TEXT,
  established_year INTEGER,
  image_url TEXT,
  image_attribution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Species-Ecoregions junction table
CREATE TABLE species_ecoregions (
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  ecoregion_id UUID REFERENCES ecoregions(id) ON DELETE CASCADE,
  overlap_percentage DECIMAL,
  is_primary_habitat BOOLEAN DEFAULT false,
  PRIMARY KEY (species_id, ecoregion_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Species-Parks junction table
CREATE TABLE species_parks (
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  confirmed_sighting BOOLEAN DEFAULT false,
  last_sighting_date DATE,
  population_estimate INTEGER,
  observation_count INTEGER DEFAULT 0,
  PRIMARY KEY (species_id, park_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bird calls table
CREATE TABLE bird_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  scientific_name TEXT NOT NULL,
  xc_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  quality TEXT,
  recording_type TEXT,
  length_seconds NUMERIC,
  recordist TEXT,
  country TEXT,
  location TEXT,
  date TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  playback_count INT DEFAULT 0,
  last_played_at TIMESTAMP,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(species_id, xc_id)
);

-- Enrichment cache table
CREATE TABLE enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(park_id, source)
);

-- Global health table
CREATE TABLE global_health (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_species INTEGER DEFAULT 0,
  critically_endangered INTEGER DEFAULT 0,
  endangered INTEGER DEFAULT 0,
  vulnerable INTEGER DEFAULT 0,
  near_threatened INTEGER DEFAULT 0,
  health_score DECIMAL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_species_iucn_id ON species(iucn_id);
CREATE INDEX idx_species_scientific_name ON species(scientific_name);
CREATE INDEX idx_species_conservation_status ON species(conservation_status);
CREATE INDEX idx_species_habitat ON species(is_marine, is_terrestrial, is_freshwater);
CREATE INDEX idx_species_taxonomy ON species(class, order_name, family);
CREATE INDEX idx_species_geographic_range ON species USING GIST(geographic_range);
CREATE INDEX idx_species_type ON species(species_type);
CREATE INDEX idx_species_ui_group ON species(ui_group);
CREATE INDEX idx_species_trophic_role ON species(trophic_role);
CREATE INDEX idx_species_is_curated ON species(is_curated);

CREATE INDEX idx_ecoregions_id ON ecoregions(ecoregion_id);
CREATE INDEX idx_ecoregions_name ON ecoregions(name);
CREATE INDEX idx_ecoregions_geometry ON ecoregions USING GIST(geometry);

CREATE INDEX idx_parks_name ON parks(name);
CREATE INDEX idx_parks_country ON parks(country);
CREATE INDEX idx_parks_ecoregion ON parks(ecoregion_id);
CREATE INDEX idx_parks_type ON parks(park_type);
CREATE INDEX idx_parks_bounds ON parks USING GIST(bounds);
CREATE INDEX idx_parks_center ON parks(center_lat, center_lng);

CREATE INDEX idx_species_ecoregions_species ON species_ecoregions(species_id);
CREATE INDEX idx_species_ecoregions_ecoregion ON species_ecoregions(ecoregion_id);
CREATE INDEX idx_species_parks_species ON species_parks(species_id);
CREATE INDEX idx_species_parks_park ON species_parks(park_id);

CREATE INDEX idx_bird_calls_species_id ON bird_calls(species_id);
CREATE INDEX idx_bird_calls_scientific_name ON bird_calls(scientific_name);
CREATE INDEX idx_bird_calls_primary ON bird_calls(species_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_bird_calls_quality ON bird_calls(quality);

CREATE INDEX idx_enrichment_cache_park ON enrichment_cache(park_id);
CREATE INDEX idx_enrichment_cache_source ON enrichment_cache(source);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at);

-- ============================================================================
-- CREATE CONSTRAINTS
-- ============================================================================

ALTER TABLE species
ADD CONSTRAINT species_type_check
CHECK (species_type IN ('Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Plant', 'Coral', 'Invertebrate') OR species_type IS NULL);

ALTER TABLE species
ADD CONSTRAINT ui_group_check
CHECK (ui_group IN ('Animals', 'Birds', 'Plants & Corals') OR ui_group IS NULL);

ALTER TABLE species
ADD CONSTRAINT trophic_role_check
CHECK (trophic_role IN ('Producer', 'Mixotroph', 'Filter-feeder', 'Predator', 'Herbivore', 'Omnivore', 'Scavenger', 'Detritivore', 'Parasite') OR trophic_role IS NULL);

-- ============================================================================
-- INSERT 6 CURATED ECOREGIONS
-- ============================================================================

INSERT INTO ecoregions (ecoregion_id, name, biome, realm, center_lat, center_lng, radius_km)
VALUES
    ('201', 'Arctic Terrestrial', 'Tundra', 'Nearctic', 71.0, -100.0, 1500),
    ('202', 'Congo Basin', 'Tropical Rainforest', 'Afrotropic', -2.0, 24.0, 800),
    ('203', 'Amazon Rainforest', 'Tropical Rainforest', 'Neotropical', -3.5, -62.0, 1500),
    ('204', 'Madagascar Forests', 'Tropical Forest', 'Afrotropic', -18.0, 46.0, 300),
    ('205', 'Borneo Rainforest', 'Tropical Rainforest', 'Indo-Malayan', 0.5, 114.0, 400),
    ('206', 'Coral Triangle', 'Coral Reef', 'Marine', -2.0, 120.0, 800);

-- Initialize global health
INSERT INTO global_health (id, total_species, critically_endangered, endangered, vulnerable, near_threatened, health_score)
VALUES (1, 0, 0, 0, 0, 0, 0.0);

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parks_updated_at
  BEFORE UPDATE ON parks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION get_bird_call(p_scientific_name TEXT)
RETURNS TABLE (
  audio_url TEXT,
  xc_id TEXT,
  quality TEXT,
  recordist TEXT,
  length_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.audio_url,
    bc.xc_id,
    bc.quality,
    bc.recordist,
    bc.length_seconds
  FROM bird_calls bc
  WHERE LOWER(bc.scientific_name) = LOWER(p_scientific_name)
    AND bc.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_bird_call_playback(p_xc_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE bird_calls
  SET
    playback_count = playback_count + 1,
    last_played_at = NOW()
  WHERE xc_id = p_xc_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_bird_call(p_scientific_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM bird_calls
    WHERE LOWER(scientific_name) = LOWER(p_scientific_name)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecoregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_ecoregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON species FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ecoregions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON parks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON species_ecoregions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON species_parks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bird_calls FOR SELECT USING (true);
CREATE POLICY "Public read access" ON enrichment_cache FOR SELECT USING (true);
CREATE POLICY "Public read access" ON global_health FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON species FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON ecoregions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON parks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON species_ecoregions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON species_parks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON bird_calls FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON enrichment_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON global_health FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  '✅ Database structure created!' AS status,
  (SELECT COUNT(*) FROM ecoregions) AS ecoregions_count,
  'Run Python script next to import species' AS next_step;
