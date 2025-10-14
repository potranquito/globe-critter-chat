-- Species Curation and User Sessions
-- Enables species-park matching, flagship tagging, and user progress tracking
-- Date: October 13, 2025

-- ============================================================================
-- PART 1: Species-Parks Junction Table (Spatial Matching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS species_parks (
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  is_flagship BOOLEAN DEFAULT false,
  curation_priority INTEGER DEFAULT 50 CHECK (curation_priority BETWEEN 0 AND 100),
  educational_value TEXT DEFAULT 'medium' CHECK (educational_value IN ('high', 'medium', 'low')),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (species_id, park_id)
);

-- Indexes for fast querying
CREATE INDEX idx_species_parks_park ON species_parks(park_id);
CREATE INDEX idx_species_parks_species ON species_parks(species_id);
CREATE INDEX idx_species_parks_flagship ON species_parks(park_id, is_flagship);
CREATE INDEX idx_species_parks_priority ON species_parks(park_id, curation_priority DESC);

COMMENT ON TABLE species_parks IS 'Junction table linking species to protected areas with curation metadata';
COMMENT ON COLUMN species_parks.is_flagship IS 'True if this is an iconic/flagship species for this park';
COMMENT ON COLUMN species_parks.curation_priority IS '0-100 priority for showing this species (100 = always show)';
COMMENT ON COLUMN species_parks.educational_value IS 'Educational importance of this species for this location';

-- ============================================================================
-- PART 2: Enhanced Species Table (Curation Flags)
-- ============================================================================

ALTER TABLE species
ADD COLUMN IF NOT EXISTS is_invasive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_threatened BOOLEAN GENERATED ALWAYS AS (
  conservation_status IN ('CR', 'EN', 'VU')
) STORED,
ADD COLUMN IF NOT EXISTS ecological_role TEXT CHECK (
  ecological_role IS NULL OR
  ecological_role IN ('keystone', 'flagship', 'indicator', 'invasive', 'endemic', 'threatened')
),
ADD COLUMN IF NOT EXISTS plant_importance TEXT CHECK (
  plant_importance IS NULL OR
  plant_importance IN ('native', 'endemic', 'invasive', 'threatened', 'medicinal', 'cultural')
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_species_invasive ON species(is_invasive) WHERE is_invasive = true;
CREATE INDEX IF NOT EXISTS idx_species_threatened ON species(is_threatened) WHERE is_threatened = true;
CREATE INDEX IF NOT EXISTS idx_species_ecological_role ON species(ecological_role);
CREATE INDEX IF NOT EXISTS idx_species_kingdom_class ON species(kingdom, class);

COMMENT ON COLUMN species.is_invasive IS 'True if species is invasive/problematic in some regions';
COMMENT ON COLUMN species.is_threatened IS 'Auto-computed: true if CR, EN, or VU status';
COMMENT ON COLUMN species.ecological_role IS 'Ecological significance (keystone, flagship, indicator, etc.)';
COMMENT ON COLUMN species.plant_importance IS 'Special designation for plant species';

-- ============================================================================
-- PART 3: User Session Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_park_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  ecoregion_id UUID REFERENCES ecoregions(id),
  species_shown UUID[] DEFAULT '{}',  -- Array of species IDs shown in carousel
  species_learned UUID[] DEFAULT '{}',  -- Species user clicked to learn about
  quiz_type TEXT CHECK (quiz_type IS NULL OR quiz_type IN ('trivia', 'matching', 'identification', 'conservation')),
  quiz_completed BOOLEAN DEFAULT false,
  quiz_score INTEGER,
  quiz_data JSONB,  -- Store quiz questions and answers
  background_context JSONB,  -- Cached API data (weather, sightings, etc.)
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_score CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100))
);

-- Indexes for user progress queries
CREATE INDEX idx_user_sessions_user ON user_park_sessions(user_id);
CREATE INDEX idx_user_sessions_park ON user_park_sessions(park_id);
CREATE INDEX idx_user_sessions_ecoregion ON user_park_sessions(ecoregion_id);
CREATE INDEX idx_user_sessions_completed ON user_park_sessions(user_id, completed_at);
CREATE INDEX idx_user_sessions_active ON user_park_sessions(user_id, started_at) WHERE completed_at IS NULL;

COMMENT ON TABLE user_park_sessions IS 'Tracks individual user learning sessions within protected areas';
COMMENT ON COLUMN user_park_sessions.species_shown IS 'All species presented in carousel for this session';
COMMENT ON COLUMN user_park_sessions.species_learned IS 'Species user actively clicked to learn about';
COMMENT ON COLUMN user_park_sessions.background_context IS 'Real-time API data fetched during session';

-- ============================================================================
-- PART 4: User Species History (Avoid Duplicates Across Sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_species_history (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  times_seen INTEGER DEFAULT 1,
  times_learned INTEGER DEFAULT 0,  -- User clicked to learn more
  last_seen_at TIMESTAMP DEFAULT NOW(),
  first_seen_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, species_id)
);

-- Indexes for duplicate avoidance
CREATE INDEX idx_user_species_user ON user_species_history(user_id);
CREATE INDEX idx_user_species_recent ON user_species_history(user_id, last_seen_at DESC);

COMMENT ON TABLE user_species_history IS 'Tracks which species each user has encountered to avoid repetition';

-- ============================================================================
-- PART 5: Ecoregion Progress Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_ecoregion_progress (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ecoregion_id UUID REFERENCES ecoregions(id) ON DELETE CASCADE,
  parks_completed UUID[] DEFAULT '{}',
  parks_in_progress UUID[] DEFAULT '{}',
  total_parks INTEGER DEFAULT 0,
  completed_parks INTEGER DEFAULT 0,
  completion_percentage DECIMAL GENERATED ALWAYS AS (
    CASE WHEN total_parks > 0 THEN (completed_parks::DECIMAL / total_parks * 100) ELSE 0 END
  ) STORED,
  is_complete BOOLEAN DEFAULT false,
  pollution_asset_removed BOOLEAN DEFAULT false,  -- Game mechanic: remove pollution on completion
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, ecoregion_id)
);

-- Indexes for progress queries
CREATE INDEX idx_ecoregion_progress_user ON user_ecoregion_progress(user_id);
CREATE INDEX idx_ecoregion_progress_complete ON user_ecoregion_progress(user_id, is_complete);
CREATE INDEX idx_ecoregion_progress_percentage ON user_ecoregion_progress(user_id, completion_percentage DESC);

COMMENT ON TABLE user_ecoregion_progress IS 'Tracks user progress completing all parks in an ecoregion';
COMMENT ON COLUMN user_ecoregion_progress.pollution_asset_removed IS 'Game asset state: true when pollution graphic removed from globe';

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get curated species for a park
CREATE OR REPLACE FUNCTION get_park_species_curated(
  p_park_id UUID,
  p_user_id UUID,
  p_max_species INTEGER DEFAULT 10
)
RETURNS TABLE (
  species_id UUID,
  common_name TEXT,
  scientific_name TEXT,
  conservation_status TEXT,
  is_flagship BOOLEAN,
  is_invasive BOOLEAN,
  is_threatened BOOLEAN,
  curation_priority INTEGER,
  class TEXT,
  kingdom TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH flagship_species AS (
    -- Get flagship species first (priority)
    SELECT sp.species_id
    FROM species_parks sp
    WHERE sp.park_id = p_park_id
      AND sp.is_flagship = true
    LIMIT 4
  ),
  seen_species AS (
    -- Get species user has already seen
    SELECT ush.species_id
    FROM user_species_history ush
    WHERE ush.user_id = p_user_id
  ),
  random_species AS (
    -- Get random diverse species
    SELECT DISTINCT ON (s.class) sp.species_id
    FROM species_parks sp
    JOIN species s ON s.id = sp.species_id
    WHERE sp.park_id = p_park_id
      AND sp.is_flagship = false
      AND sp.species_id NOT IN (SELECT species_id FROM seen_species)
    ORDER BY s.class, RANDOM()
    LIMIT p_max_species - (SELECT COUNT(*) FROM flagship_species)
  )
  SELECT
    s.id,
    s.common_name,
    s.scientific_name,
    s.conservation_status,
    sp.is_flagship,
    s.is_invasive,
    s.is_threatened,
    sp.curation_priority,
    s.class,
    s.kingdom
  FROM species s
  JOIN species_parks sp ON sp.species_id = s.id
  WHERE sp.park_id = p_park_id
    AND s.id IN (
      SELECT species_id FROM flagship_species
      UNION ALL
      SELECT species_id FROM random_species
    )
  ORDER BY sp.is_flagship DESC, sp.curation_priority DESC, s.conservation_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_park_species_curated IS 'Returns curated species list for a park (flagship + diverse random)';

-- Function: Update user species history
CREATE OR REPLACE FUNCTION record_species_viewed(
  p_user_id UUID,
  p_species_ids UUID[],
  p_learned_ids UUID[] DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  -- Insert or update species history
  INSERT INTO user_species_history (user_id, species_id, times_seen, times_learned)
  SELECT
    p_user_id,
    unnest(p_species_ids),
    1,
    CASE WHEN unnest(p_species_ids) = ANY(p_learned_ids) THEN 1 ELSE 0 END
  ON CONFLICT (user_id, species_id) DO UPDATE SET
    times_seen = user_species_history.times_seen + 1,
    times_learned = user_species_history.times_learned +
      CASE WHEN EXCLUDED.species_id = ANY(p_learned_ids) THEN 1 ELSE 0 END,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_species_viewed IS 'Records which species a user has seen/learned in their history';

-- Function: Get user ecoregion progress
CREATE OR REPLACE FUNCTION get_user_ecoregion_progress(p_user_id UUID)
RETURNS TABLE (
  ecoregion_id UUID,
  ecoregion_name TEXT,
  biome TEXT,
  completion_percentage DECIMAL,
  completed_parks INTEGER,
  total_parks INTEGER,
  is_complete BOOLEAN,
  pollution_removed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uep.ecoregion_id,
    e.name,
    e.biome,
    uep.completion_percentage,
    uep.completed_parks,
    uep.total_parks,
    uep.is_complete,
    uep.pollution_asset_removed
  FROM user_ecoregion_progress uep
  JOIN ecoregions e ON e.id = uep.ecoregion_id
  WHERE uep.user_id = p_user_id
  ORDER BY uep.completion_percentage DESC, uep.started_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_ecoregion_progress IS 'Returns user progress across all ecoregions';
