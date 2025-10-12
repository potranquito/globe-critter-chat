-- Species Database Migration
-- Creates tables for IUCN Red List species data
-- Author: Claude Code
-- Date: October 12, 2025

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop old placeholder species table and related data
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.location_species CASCADE;
DROP TABLE IF EXISTS public.species CASCADE;

-- Species table: Main species data from IUCN Red List
CREATE TABLE IF NOT EXISTS species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iucn_id INTEGER UNIQUE NOT NULL,
  scientific_name TEXT NOT NULL,
  common_name TEXT,

  -- Conservation status
  conservation_status TEXT, -- CR, EN, VU, NT, LC, DD, EX
  conservation_status_full TEXT, -- Critically Endangered, Endangered, etc.

  -- Taxonomy
  kingdom TEXT,
  phylum TEXT,
  class TEXT,
  order_name TEXT,
  family TEXT,
  genus TEXT,

  -- Habitat classification
  is_marine BOOLEAN DEFAULT false,
  is_terrestrial BOOLEAN DEFAULT false,
  is_freshwater BOOLEAN DEFAULT false,

  -- Geographic data (PostGIS)
  geographic_range GEOGRAPHY(MULTIPOLYGON, 4326),

  -- Image data (URL-only approach - $0 storage!)
  image_url TEXT,
  image_large_url TEXT,
  image_attribution TEXT,
  image_license TEXT,
  image_source TEXT, -- 'inaturalist', 'wikipedia', 'eol', 'flickr', 'placeholder'
  image_cached_at TIMESTAMP,

  -- IUCN metadata
  iucn_citation TEXT,
  compiler TEXT,
  year_compiled INTEGER,

  -- Additional data (can be enriched later)
  description TEXT,
  threats TEXT[],
  population_trend TEXT, -- increasing, stable, decreasing, unknown

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_species_iucn_id ON species(iucn_id);
CREATE INDEX idx_species_scientific_name ON species(scientific_name);
CREATE INDEX idx_species_conservation_status ON species(conservation_status);
CREATE INDEX idx_species_habitat ON species(is_marine, is_terrestrial, is_freshwater);
CREATE INDEX idx_species_taxonomy ON species(class, order_name, family);
CREATE INDEX idx_species_geographic_range ON species USING GIST(geographic_range);

-- Ecoregions table (you already have this data, but defining structure)
CREATE TABLE IF NOT EXISTS ecoregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecoregion_id TEXT UNIQUE NOT NULL, -- e.g., "51308.0"
  name TEXT NOT NULL,
  biome TEXT,
  realm TEXT,
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_km INTEGER,
  -- Add geometry for spatial queries
  geometry GEOGRAPHY(POLYGON, 4326),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ecoregions_id ON ecoregions(ecoregion_id);
CREATE INDEX idx_ecoregions_name ON ecoregions(name);
CREATE INDEX idx_ecoregions_geometry ON ecoregions USING GIST(geometry);

-- Species-Ecoregions junction table (many-to-many)
CREATE TABLE IF NOT EXISTS species_ecoregions (
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  ecoregion_id UUID REFERENCES ecoregions(id) ON DELETE CASCADE,

  -- Metadata about the relationship
  overlap_percentage DECIMAL, -- How much of species range overlaps this ecoregion
  is_primary_habitat BOOLEAN DEFAULT false, -- Is this the main ecoregion for this species?

  PRIMARY KEY (species_id, ecoregion_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_species_ecoregions_species ON species_ecoregions(species_id);
CREATE INDEX idx_species_ecoregions_ecoregion ON species_ecoregions(ecoregion_id);

-- Parks/Protected Areas table
CREATE TABLE IF NOT EXISTS parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,

  -- Location
  country TEXT,
  state_province TEXT,
  ecoregion_id UUID REFERENCES ecoregions(id),

  -- Geographic data
  bounds GEOGRAPHY(POLYGON, 4326),
  center_lat DECIMAL,
  center_lng DECIMAL,

  -- Park metadata
  park_type TEXT, -- 'national_park', 'wildlife_refuge', 'nature_reserve', 'protected_area'
  protection_status TEXT, -- 'strict', 'moderate', 'minimal'
  size_km2 DECIMAL,

  -- External IDs
  protected_planet_id TEXT,
  wdpa_id TEXT, -- World Database on Protected Areas

  -- Additional info
  description TEXT,
  established_year INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parks_name ON parks(name);
CREATE INDEX idx_parks_country ON parks(country);
CREATE INDEX idx_parks_ecoregion ON parks(ecoregion_id);
CREATE INDEX idx_parks_type ON parks(park_type);
CREATE INDEX idx_parks_bounds ON parks USING GIST(bounds);
CREATE INDEX idx_parks_center ON parks(center_lat, center_lng);

-- Species-Parks junction table (many-to-many)
CREATE TABLE IF NOT EXISTS species_parks (
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,

  -- Metadata
  confirmed_sighting BOOLEAN DEFAULT false, -- Has this species been confirmed in this park?
  last_sighting_date DATE,
  population_estimate INTEGER,
  observation_count INTEGER DEFAULT 0,

  PRIMARY KEY (species_id, park_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_species_parks_species ON species_parks(species_id);
CREATE INDEX idx_species_parks_park ON species_parks(park_id);

-- Enrichment cache table (for background agents)
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,

  -- Cache key
  source TEXT NOT NULL, -- 'fire', 'earthquake', 'weather', 'ebird', 'inaturalist', 'news'

  -- Cached data (JSONB for flexibility)
  data JSONB NOT NULL,

  -- Cache metadata
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Unique constraint: one cache entry per park+source
  UNIQUE(park_id, source)
);

CREATE INDEX idx_enrichment_cache_park ON enrichment_cache(park_id);
CREATE INDEX idx_enrichment_cache_source ON enrichment_cache(source);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parks_updated_at
  BEFORE UPDATE ON parks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Get species by ecoregion
CREATE OR REPLACE FUNCTION get_species_by_ecoregion(ecoregion_uuid UUID)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.image_url
  FROM species s
  JOIN species_ecoregions se ON s.id = se.species_id
  WHERE se.ecoregion_id = ecoregion_uuid
  ORDER BY s.scientific_name;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get species by park
CREATE OR REPLACE FUNCTION get_species_by_park(park_uuid UUID)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  conservation_status TEXT,
  image_url TEXT,
  confirmed_sighting BOOLEAN,
  last_sighting_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.scientific_name,
    s.common_name,
    s.conservation_status,
    s.image_url,
    sp.confirmed_sighting,
    sp.last_sighting_date
  FROM species s
  JOIN species_parks sp ON s.id = sp.species_id
  WHERE sp.park_id = park_uuid
  ORDER BY s.scientific_name;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Clean expired enrichment cache
DROP FUNCTION IF EXISTS clean_expired_cache();
CREATE OR REPLACE FUNCTION clean_expired_enrichment_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM enrichment_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE species IS 'IUCN Red List species data with geographic ranges and metadata';
COMMENT ON TABLE ecoregions IS 'WWF Ecoregions - biogeographic regions of the world';
COMMENT ON TABLE species_ecoregions IS 'Junction table mapping species to their ecoregions';
COMMENT ON TABLE parks IS 'Protected areas, national parks, wildlife refuges';
COMMENT ON TABLE species_parks IS 'Junction table mapping species to parks where they occur';
COMMENT ON TABLE enrichment_cache IS 'Cache for background agent data (fire, weather, sightings, etc.)';

COMMENT ON COLUMN species.geographic_range IS 'PostGIS MULTIPOLYGON of species range from IUCN shapefiles';
COMMENT ON COLUMN species.image_url IS 'URL to species image from iNaturalist/Wikipedia/EOL (not stored locally)';
COMMENT ON COLUMN species.conservation_status IS 'IUCN status code: CR, EN, VU, NT, LC, DD, EX';

-- Recreate user_badges table with updated schema
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('species', 'achievement', 'milestone')),

  -- For species badges
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,

  -- For achievement badges
  achievement_id TEXT,
  achievement_name TEXT,
  achievement_description TEXT,
  achievement_icon TEXT,

  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure species badges are unique
  CONSTRAINT unique_user_species_badge UNIQUE(user_id, species_id),
  -- Ensure achievement badges are unique
  CONSTRAINT unique_user_achievement_badge UNIQUE(user_id, achievement_id),
  -- Ensure either species_id OR achievement_id is set
  CONSTRAINT badge_type_consistency CHECK (
    (badge_type = 'species' AND species_id IS NOT NULL AND achievement_id IS NULL) OR
    (badge_type IN ('achievement', 'milestone') AND species_id IS NULL AND achievement_id IS NOT NULL)
  )
);

-- Indexes for user_badges
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_type ON public.user_badges(badge_type);
CREATE INDEX idx_user_badges_earned ON public.user_badges(earned_at);

-- RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT ALL ON species TO authenticated;
-- GRANT ALL ON ecoregions TO authenticated;
-- GRANT ALL ON species_ecoregions TO authenticated;
-- GRANT ALL ON parks TO authenticated;
-- GRANT ALL ON species_parks TO authenticated;
-- GRANT ALL ON enrichment_cache TO authenticated;
