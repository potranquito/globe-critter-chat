-- Globe Critter Chat: Gamification System - Initial Schema
-- Created: 2025-10-10
-- Description: Core tables for user authentication, locations, species, lessons, and gamification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  health_contributed INTEGER DEFAULT 0 CHECK (health_contributed >= 0),
  total_lessons_completed INTEGER DEFAULT 0 CHECK (total_lessons_completed >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Index for username lookups
CREATE INDEX idx_users_username ON public.users(username);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- ============================================================================
-- LOCATION HIERARCHY
-- ============================================================================

-- Regions (mid-level: Las Vegas, Death Valley, etc.)
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  center_lat FLOAT NOT NULL CHECK (center_lat >= -90 AND center_lat <= 90),
  center_lng FLOAT NOT NULL CHECK (center_lng >= -180 AND center_lng <= 180),
  bounds JSONB, -- GeoJSON polygon
  country TEXT,
  state_province TEXT,

  -- Stats
  total_locations INTEGER DEFAULT 0 CHECK (total_locations >= 0),
  completed_locations INTEGER DEFAULT 0 CHECK (completed_locations >= 0),
  completion_percentage FLOAT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Metadata
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_region_location UNIQUE(name, center_lat, center_lng)
);

-- Indexes for regions
CREATE INDEX idx_regions_coords ON public.regions(center_lat, center_lng);
CREATE INDEX idx_regions_name ON public.regions(name);
CREATE INDEX idx_regions_country_state ON public.regions(country, state_province);

-- RLS for regions (public read)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regions are viewable by everyone"
  ON public.regions FOR SELECT
  USING (true);

-- Locations (specific parks, refuges, preserves)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  type TEXT, -- "wildlife_refuge", "national_park", "preserve", etc.
  description TEXT,
  center_lat FLOAT NOT NULL CHECK (center_lat >= -90 AND center_lat <= 90),
  center_lng FLOAT NOT NULL CHECK (center_lng >= -180 AND center_lng <= 180),
  bounds JSONB, -- GeoJSON polygon

  -- External IDs
  protected_planet_id TEXT,
  google_place_id TEXT,
  ebird_hotspot_id TEXT,

  -- Cached data (refreshed every 24 hours)
  species_count INTEGER DEFAULT 0 CHECK (species_count >= 0),
  threat_count INTEGER DEFAULT 0 CHECK (threat_count >= 0),
  cached_data JSONB, -- Full API responses
  last_data_fetch TIMESTAMP WITH TIME ZONE,

  -- Gamification
  times_completed INTEGER DEFAULT 0 CHECK (times_completed >= 0),
  health_value INTEGER DEFAULT 5 CHECK (health_value > 0), -- Base points for completion
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_location_name UNIQUE(region_id, name)
);

-- Indexes for locations
CREATE INDEX idx_locations_region ON public.locations(region_id);
CREATE INDEX idx_locations_coords ON public.locations(center_lat, center_lng);
CREATE INDEX idx_locations_type ON public.locations(type);
CREATE INDEX idx_locations_last_fetch ON public.locations(last_data_fetch);

-- RLS for locations (public read)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are viewable by everyone"
  ON public.locations FOR SELECT
  USING (true);

-- ============================================================================
-- SPECIES & BIODIVERSITY
-- ============================================================================

-- Species master list
CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  common_name TEXT,
  scientific_name TEXT UNIQUE NOT NULL,
  species_type TEXT, -- "bird", "mammal", "plant", "insect", etc.
  conservation_status TEXT, -- IUCN: "CR", "EN", "VU", "NT", "LC", "DD", "NE"
  description TEXT,
  image_url TEXT,

  -- External IDs
  ebird_code TEXT,
  inaturalist_taxon_id INTEGER,
  gbif_taxon_id INTEGER,

  -- Badge info
  badge_icon TEXT, -- Emoji or icon name
  badge_rarity TEXT DEFAULT 'common' CHECK (badge_rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for species
CREATE INDEX idx_species_scientific ON public.species(scientific_name);
CREATE INDEX idx_species_common ON public.species(common_name);
CREATE INDEX idx_species_type ON public.species(species_type);
CREATE INDEX idx_species_conservation ON public.species(conservation_status);

-- RLS for species (public read)
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Species are viewable by everyone"
  ON public.species FOR SELECT
  USING (true);

-- Location-Species relationship (what lives where)
CREATE TABLE public.location_species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  species_id UUID REFERENCES public.species(id) ON DELETE CASCADE,
  observation_count INTEGER DEFAULT 1 CHECK (observation_count > 0),
  last_observed TIMESTAMP WITH TIME ZONE,
  data_source TEXT, -- "ebird", "inaturalist", "gbif"

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_location_species UNIQUE(location_id, species_id)
);

-- Indexes for location_species
CREATE INDEX idx_location_species_location ON public.location_species(location_id);
CREATE INDEX idx_location_species_species ON public.location_species(species_id);

-- RLS for location_species (public read)
ALTER TABLE public.location_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location species are viewable by everyone"
  ON public.location_species FOR SELECT
  USING (true);

-- ============================================================================
-- ENVIRONMENTAL THREATS
-- ============================================================================

-- Threats (wildfires, earthquakes, deforestation, etc.)
CREATE TABLE public.threats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  threat_type TEXT NOT NULL, -- "wildfire", "earthquake", "deforestation", "drought", "pollution", "habitat_loss"
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  lat FLOAT CHECK (lat >= -90 AND lat <= 90),
  lng FLOAT CHECK (lng >= -180 AND lng <= 180),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source TEXT, -- "NASA_FIRMS", "USGS_Earthquake", "GFW", "manual"
  external_id TEXT,
  metadata JSONB -- Store full API response
);

-- Indexes for threats
CREATE INDEX idx_threats_location ON public.threats(location_id);
CREATE INDEX idx_threats_type ON public.threats(threat_type);
CREATE INDEX idx_threats_severity ON public.threats(severity);
CREATE INDEX idx_threats_detected ON public.threats(detected_at);

-- RLS for threats (public read)
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threats are viewable by everyone"
  ON public.threats FOR SELECT
  USING (true);

-- ============================================================================
-- LESSONS & EDUCATION
-- ============================================================================

-- Generated lessons (cached for 7 days)
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown format
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER DEFAULT 30 CHECK (estimated_minutes > 0),

  -- Featured elements
  featured_species UUID[], -- Array of species IDs
  featured_threats UUID[], -- Array of threat IDs
  key_concepts TEXT[], -- ["adaptation", "food_web", "conservation", etc.]

  -- Generation metadata
  generated_by TEXT DEFAULT 'LLM',
  generation_prompt TEXT,
  api_sources JSONB, -- Which APIs were called
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',

  -- Quality metrics
  times_completed INTEGER DEFAULT 0 CHECK (times_completed >= 0),
  average_rating FLOAT CHECK (average_rating >= 1 AND average_rating <= 5)
);

-- Indexes for lessons
CREATE INDEX idx_lessons_location ON public.lessons(location_id);
CREATE INDEX idx_lessons_expires ON public.lessons(expires_at);
CREATE INDEX idx_lessons_generated ON public.lessons(generated_at);

-- RLS for lessons (public read)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons are viewable by everyone"
  ON public.lessons FOR SELECT
  USING (true);

-- ============================================================================
-- USER PROGRESS & GAMIFICATION
-- ============================================================================

-- User lesson completions
CREATE TABLE public.user_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Completion info
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER CHECK (time_spent_minutes >= 0),
  health_earned INTEGER NOT NULL CHECK (health_earned > 0),
  species_learned UUID[], -- Array of species IDs

  -- Optional feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback TEXT,

  CONSTRAINT unique_user_lesson UNIQUE(user_id, lesson_id)
);

-- Indexes for user_completions
CREATE INDEX idx_user_completions_user ON public.user_completions(user_id);
CREATE INDEX idx_user_completions_lesson ON public.user_completions(lesson_id);
CREATE INDEX idx_user_completions_completed ON public.user_completions(completed_at);

-- RLS for user_completions
ALTER TABLE public.user_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
  ON public.user_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.user_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Completion stats are viewable by everyone"
  ON public.user_completions FOR SELECT
  USING (true);

-- User badges (species badges & achievements)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('species', 'achievement', 'milestone')),

  -- For species badges
  species_id UUID REFERENCES public.species(id) ON DELETE CASCADE,

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

-- ============================================================================
-- GLOBAL STATS
-- ============================================================================

-- Global health tracking (singleton table)
CREATE TABLE public.global_health (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_health FLOAT DEFAULT 0 CHECK (current_health >= 0 AND current_health <= 100),
  total_lessons_completed INTEGER DEFAULT 0 CHECK (total_lessons_completed >= 0),
  total_users INTEGER DEFAULT 0 CHECK (total_users >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT global_health_singleton CHECK (id = 1)
);

-- Ensure only one row exists
CREATE UNIQUE INDEX global_health_singleton_idx ON public.global_health((id = 1));

-- RLS for global_health (public read)
ALTER TABLE public.global_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global health is viewable by everyone"
  ON public.global_health FOR SELECT
  USING (true);

-- ============================================================================
-- API CACHE
-- ============================================================================

-- API response cache (reduce duplicate API calls)
CREATE TABLE public.api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for api_cache
CREATE INDEX idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- RLS for api_cache (public read)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "API cache is viewable by everyone"
  ON public.api_cache FOR SELECT
  USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update user's last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_completions to update last_active
CREATE TRIGGER trigger_update_user_last_active
  AFTER INSERT ON public.user_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Function to update region completion percentage
CREATE OR REPLACE FUNCTION update_region_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.regions
  SET
    completed_locations = (
      SELECT COUNT(DISTINCT uc.location_id)
      FROM public.user_completions uc
      INNER JOIN public.locations l ON uc.location_id = l.id
      WHERE l.region_id = NEW.region_id
    ),
    completion_percentage = (
      SELECT CASE
        WHEN COUNT(DISTINCT l.id) = 0 THEN 0
        ELSE (COUNT(DISTINCT uc.location_id)::FLOAT / COUNT(DISTINCT l.id)::FLOAT) * 100
      END
      FROM public.locations l
      LEFT JOIN public.user_completions uc ON uc.location_id = l.id
      WHERE l.region_id = NEW.region_id
    ),
    last_updated = NOW()
  WHERE id = NEW.region_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update region stats when lesson completed
CREATE TRIGGER trigger_update_region_completion
  AFTER INSERT ON public.user_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_region_completion();

-- Function to update global health
CREATE OR REPLACE FUNCTION update_global_health()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.global_health
  SET
    total_lessons_completed = (SELECT COUNT(*) FROM public.user_completions),
    total_users = (SELECT COUNT(DISTINCT user_id) FROM public.user_completions),
    current_health = LEAST(100, (SELECT COUNT(*) FROM public.user_completions)::FLOAT * 0.01), -- Each lesson = 0.01% health
    updated_at = NOW()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update global health on completion
CREATE TRIGGER trigger_update_global_health
  AFTER INSERT ON public.user_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_global_health();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired lessons
CREATE OR REPLACE FUNCTION clean_expired_lessons()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lessons
  WHERE expires_at < NOW()
  AND times_completed = 0; -- Only delete unused lessons
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.users IS 'User profiles and authentication data';
COMMENT ON TABLE public.regions IS 'Geographic regions containing multiple locations (e.g., Las Vegas, Death Valley)';
COMMENT ON TABLE public.locations IS 'Specific wildlife locations (parks, refuges, preserves)';
COMMENT ON TABLE public.species IS 'Master list of all species (animals, plants, fungi)';
COMMENT ON TABLE public.location_species IS 'Many-to-many relationship between locations and species';
COMMENT ON TABLE public.threats IS 'Environmental threats (fires, earthquakes, deforestation, etc.)';
COMMENT ON TABLE public.lessons IS 'Generated educational lesson plans';
COMMENT ON TABLE public.user_completions IS 'User progress tracking for completed lessons';
COMMENT ON TABLE public.user_badges IS 'Badges earned by users (species badges, achievements)';
COMMENT ON TABLE public.global_health IS 'Global health meter (singleton table)';
COMMENT ON TABLE public.api_cache IS 'Cache for external API responses';
