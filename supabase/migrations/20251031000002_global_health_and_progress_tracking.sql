-- Global Health and Automated Progress Tracking
-- Automatically updates eco-region progress and global health when users complete parks
-- Date: October 31, 2025

-- ============================================================================
-- PART 1: Global Health Tracking - Update Existing Table
-- ============================================================================

-- Add health_percentage column (if doesn't exist from current_health rename)
DO $$
BEGIN
  -- Try to rename current_health to health_percentage
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'global_health'
    AND column_name = 'current_health'
  ) THEN
    ALTER TABLE global_health RENAME COLUMN current_health TO health_percentage;
  END IF;

  -- If health_percentage doesn't exist yet, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'global_health'
    AND column_name = 'health_percentage'
  ) THEN
    ALTER TABLE global_health ADD COLUMN health_percentage DECIMAL DEFAULT 0 CHECK (health_percentage >= 0 AND health_percentage <= 100);
  END IF;
END $$;

-- Make sure health_percentage is DECIMAL type
ALTER TABLE global_health
  ALTER COLUMN health_percentage TYPE DECIMAL;

-- Add new columns if they don't exist
ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS health_percentage DECIMAL DEFAULT 0 CHECK (health_percentage >= 0 AND health_percentage <= 100);

ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS total_ecoregions INTEGER DEFAULT 0;

ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS completed_ecoregions INTEGER DEFAULT 0;

ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS total_users INTEGER DEFAULT 0;

ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS active_users INTEGER DEFAULT 0;

ALTER TABLE global_health
  ADD COLUMN IF NOT EXISTS total_parks_completed INTEGER DEFAULT 0;

-- Remove old columns we don't need anymore
ALTER TABLE global_health
  DROP COLUMN IF EXISTS total_lessons_completed;

-- Ensure there's a row in the table
INSERT INTO global_health (id, health_percentage, total_ecoregions, completed_ecoregions, total_users, active_users, total_parks_completed, updated_at)
VALUES (1, 0, 0, 0, 0, 0, 0, NOW())
ON CONFLICT (id) DO UPDATE SET
  health_percentage = COALESCE(global_health.health_percentage, 0),
  total_ecoregions = COALESCE(global_health.total_ecoregions, 0),
  completed_ecoregions = COALESCE(global_health.completed_ecoregions, 0),
  active_users = COALESCE(global_health.active_users, 0),
  total_parks_completed = COALESCE(global_health.total_parks_completed, 0),
  updated_at = NOW();

-- Add/update comments
COMMENT ON TABLE global_health IS 'Global health meter showing overall game progress across all users';
COMMENT ON COLUMN global_health.health_percentage IS 'Percentage of eco-regions completed (0-100)';

-- ============================================================================
-- PART 1B: Create User Eco-region Progress Table (if doesn't exist)
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
  pollution_asset_removed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, ecoregion_id)
);

-- Indexes for progress queries
CREATE INDEX IF NOT EXISTS idx_ecoregion_progress_user ON user_ecoregion_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ecoregion_progress_complete ON user_ecoregion_progress(user_id, is_complete);
CREATE INDEX IF NOT EXISTS idx_ecoregion_progress_percentage ON user_ecoregion_progress(user_id, completion_percentage DESC);

COMMENT ON TABLE user_ecoregion_progress IS 'Tracks user progress completing all parks in an ecoregion';
COMMENT ON COLUMN user_ecoregion_progress.pollution_asset_removed IS 'Game asset state: true when pollution graphic removed from globe';

-- RLS for user_ecoregion_progress
ALTER TABLE user_ecoregion_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ecoregion progress" ON user_ecoregion_progress;
CREATE POLICY "Users can view their own ecoregion progress"
  ON user_ecoregion_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ecoregion progress" ON user_ecoregion_progress;
CREATE POLICY "Users can insert their own ecoregion progress"
  ON user_ecoregion_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ecoregion progress" ON user_ecoregion_progress;
CREATE POLICY "Users can update their own ecoregion progress"
  ON user_ecoregion_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 2: Automatic Progress Update Functions
-- ============================================================================

-- Drop existing functions if they exist (so we can recreate with new signatures)
DROP FUNCTION IF EXISTS update_ecoregion_progress_on_park_change() CASCADE;
DROP FUNCTION IF EXISTS calculate_global_health() CASCADE;
DROP FUNCTION IF EXISTS update_global_health() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_global_health() CASCADE;
DROP FUNCTION IF EXISTS get_user_ecoregion_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_ecoregion_parks_with_progress(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS recalculate_user_progress(UUID) CASCADE;

-- Function: Update eco-region progress when park progress changes
CREATE OR REPLACE FUNCTION update_ecoregion_progress_on_park_change()
RETURNS TRIGGER AS $$
DECLARE
  v_ecoregion_id UUID;
  v_total_parks INTEGER;
  v_completed_parks INTEGER;
  v_parks_completed UUID[];
  v_is_complete BOOLEAN;
BEGIN
  -- Get the ecoregion for this park
  SELECT ecoregion_id INTO v_ecoregion_id
  FROM parks
  WHERE id = NEW.park_id;

  -- If park doesn't have an ecoregion, skip
  IF v_ecoregion_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total parks in this ecoregion
  SELECT COUNT(*) INTO v_total_parks
  FROM parks
  WHERE ecoregion_id = v_ecoregion_id;

  -- Get all parks with 3 stars (completed) for this user in this ecoregion
  SELECT
    COUNT(*),
    ARRAY_AGG(upp.park_id)
  INTO
    v_completed_parks,
    v_parks_completed
  FROM user_park_progress upp
  INNER JOIN parks p ON p.id = upp.park_id
  WHERE upp.user_id = NEW.user_id
    AND p.ecoregion_id = v_ecoregion_id
    AND upp.stars = 3;

  -- Determine if ecoregion is complete
  v_is_complete := (v_completed_parks >= v_total_parks AND v_total_parks > 0);

  -- Upsert user_ecoregion_progress
  INSERT INTO user_ecoregion_progress (
    user_id,
    ecoregion_id,
    parks_completed,
    total_parks,
    completed_parks,
    is_complete,
    pollution_asset_removed,
    completed_at,
    started_at
  ) VALUES (
    NEW.user_id,
    v_ecoregion_id,
    COALESCE(v_parks_completed, '{}'),
    v_total_parks,
    v_completed_parks,
    v_is_complete,
    v_is_complete, -- Auto-remove pollution when complete
    CASE WHEN v_is_complete THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, ecoregion_id) DO UPDATE SET
    parks_completed = COALESCE(v_parks_completed, '{}'),
    total_parks = v_total_parks,
    completed_parks = v_completed_parks,
    is_complete = v_is_complete,
    pollution_asset_removed = CASE
      WHEN v_is_complete THEN true
      ELSE user_ecoregion_progress.pollution_asset_removed
    END,
    completed_at = CASE
      WHEN v_is_complete AND user_ecoregion_progress.completed_at IS NULL THEN NOW()
      ELSE user_ecoregion_progress.completed_at
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_ecoregion_progress_on_park_change IS 'Automatically updates eco-region completion when park progress changes';

-- Trigger: Update ecoregion progress when park stars change
CREATE TRIGGER trigger_update_ecoregion_on_park_change
  AFTER INSERT OR UPDATE ON user_park_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_ecoregion_progress_on_park_change();

-- ============================================================================
-- PART 3: Global Health Calculation Functions
-- ============================================================================

-- Function: Calculate global health based on completed eco-regions
CREATE OR REPLACE FUNCTION calculate_global_health()
RETURNS DECIMAL AS $$
DECLARE
  v_total_ecoregions INTEGER;
  v_completed_ecoregions INTEGER;
  v_health_percentage DECIMAL;
BEGIN
  -- Count total ecoregions that have parks
  SELECT COUNT(DISTINCT e.id) INTO v_total_ecoregions
  FROM ecoregions e
  INNER JOIN parks p ON p.ecoregion_id = e.id;

  -- Count how many unique ecoregions have been completed by at least one user
  SELECT COUNT(DISTINCT ecoregion_id) INTO v_completed_ecoregions
  FROM user_ecoregion_progress
  WHERE is_complete = true;

  -- Calculate percentage
  IF v_total_ecoregions > 0 THEN
    v_health_percentage := (v_completed_ecoregions::DECIMAL / v_total_ecoregions * 100);
  ELSE
    v_health_percentage := 0;
  END IF;

  RETURN ROUND(v_health_percentage, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_global_health IS 'Calculates global health percentage based on completed eco-regions';

-- Function: Update global health stats
CREATE OR REPLACE FUNCTION update_global_health()
RETURNS void AS $$
DECLARE
  v_health_percentage DECIMAL;
  v_total_ecoregions INTEGER;
  v_completed_ecoregions INTEGER;
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_total_parks_completed INTEGER;
BEGIN
  -- Calculate health percentage
  v_health_percentage := calculate_global_health();

  -- Get total ecoregions with parks
  SELECT COUNT(DISTINCT e.id) INTO v_total_ecoregions
  FROM ecoregions e
  INNER JOIN parks p ON p.ecoregion_id = e.id;

  -- Get completed ecoregions
  SELECT COUNT(DISTINCT ecoregion_id) INTO v_completed_ecoregions
  FROM user_ecoregion_progress
  WHERE is_complete = true;

  -- Get user counts
  SELECT COUNT(DISTINCT id) INTO v_total_users FROM users;

  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM user_park_progress
  WHERE updated_at > NOW() - INTERVAL '7 days';

  -- Get total parks completed (3 stars)
  SELECT COUNT(*) INTO v_total_parks_completed
  FROM user_park_progress
  WHERE stars = 3;

  -- Update global health
  UPDATE global_health SET
    health_percentage = v_health_percentage,
    total_ecoregions = v_total_ecoregions,
    completed_ecoregions = v_completed_ecoregions,
    total_users = v_total_users,
    active_users = v_active_users,
    total_parks_completed = v_total_parks_completed,
    updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_global_health IS 'Updates global health statistics based on all user progress';

-- Trigger: Update global health when ecoregion progress changes
CREATE OR REPLACE FUNCTION trigger_update_global_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if is_complete changed
  IF (TG_OP = 'INSERT' AND NEW.is_complete = true) OR
     (TG_OP = 'UPDATE' AND OLD.is_complete = false AND NEW.is_complete = true) THEN
    PERFORM update_global_health();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_global_health_on_ecoregion_complete
  AFTER INSERT OR UPDATE ON user_ecoregion_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_global_health();

-- ============================================================================
-- PART 4: Helper Query Functions
-- ============================================================================

-- Function: Get user's eco-region progress summary
CREATE OR REPLACE FUNCTION get_user_ecoregion_summary(p_user_id UUID)
RETURNS TABLE (
  ecoregion_id UUID,
  ecoregion_name TEXT,
  biome TEXT,
  realm TEXT,
  total_parks INTEGER,
  completed_parks INTEGER,
  completion_percentage DECIMAL,
  is_complete BOOLEAN,
  pollution_removed BOOLEAN,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.biome,
    e.realm,
    uep.total_parks,
    uep.completed_parks,
    uep.completion_percentage,
    uep.is_complete,
    uep.pollution_asset_removed,
    uep.started_at,
    uep.completed_at
  FROM user_ecoregion_progress uep
  INNER JOIN ecoregions e ON e.id = uep.ecoregion_id
  WHERE uep.user_id = p_user_id
  ORDER BY uep.completion_percentage DESC, uep.started_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_ecoregion_summary IS 'Returns summary of all eco-regions a user has started or completed';

-- Function: Get parks in an eco-region with user progress
CREATE OR REPLACE FUNCTION get_ecoregion_parks_with_progress(
  p_ecoregion_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  park_id UUID,
  park_name TEXT,
  stars INTEGER,
  completed BOOLEAN,
  completed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    COALESCE(upp.stars, 0) as stars,
    COALESCE(upp.stars = 3, false) as completed,
    upp.completed_at
  FROM parks p
  LEFT JOIN user_park_progress upp ON upp.park_id = p.id AND upp.user_id = p_user_id
  WHERE p.ecoregion_id = p_ecoregion_id
  ORDER BY COALESCE(upp.stars, 0) DESC, p.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ecoregion_parks_with_progress IS 'Returns all parks in an eco-region with user completion status';

-- ============================================================================
-- PART 5: Manual Refresh Function (for testing/debugging)
-- ============================================================================

-- Function: Recalculate all progress for a user (useful for testing)
CREATE OR REPLACE FUNCTION recalculate_user_progress(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_ecoregion RECORD;
BEGIN
  -- For each ecoregion the user has progress in
  FOR v_ecoregion IN
    SELECT DISTINCT p.ecoregion_id
    FROM user_park_progress upp
    INNER JOIN parks p ON p.id = upp.park_id
    WHERE upp.user_id = p_user_id
      AND p.ecoregion_id IS NOT NULL
  LOOP
    -- Trigger recalculation by updating a park in this ecoregion
    PERFORM update_ecoregion_progress_on_park_change()
    FROM user_park_progress upp
    INNER JOIN parks p ON p.id = upp.park_id
    WHERE upp.user_id = p_user_id
      AND p.ecoregion_id = v_ecoregion.ecoregion_id
    LIMIT 1;
  END LOOP;

  -- Update global health
  PERFORM update_global_health();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_user_progress IS 'Manually recalculates all progress for a user (for testing/debugging)';
