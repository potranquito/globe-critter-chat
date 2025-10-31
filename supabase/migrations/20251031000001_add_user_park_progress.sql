-- User Park Progress Table
-- Stores cumulative star progress for each user-park combination
-- Replaces localStorage-based progress tracking
-- Date: October 31, 2025

-- ============================================================================
-- User Park Progress Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_park_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  park_name TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  completed_at TIMESTAMP WITH TIME ZONE, -- Set when stars reach 3
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_park UNIQUE(user_id, park_id)
);

-- Indexes for fast querying
CREATE INDEX idx_user_park_progress_user ON user_park_progress(user_id);
CREATE INDEX idx_user_park_progress_park ON user_park_progress(park_id);
CREATE INDEX idx_user_park_progress_stars ON user_park_progress(user_id, stars DESC);
CREATE INDEX idx_user_park_progress_completed ON user_park_progress(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Comments
COMMENT ON TABLE user_park_progress IS 'Tracks user star progress (0-3) for each park';
COMMENT ON COLUMN user_park_progress.stars IS 'Number of stars earned (0-3), representing completion phases';
COMMENT ON COLUMN user_park_progress.completed_at IS 'Timestamp when park reached 3 stars (full completion)';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE user_park_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own park progress"
  ON user_park_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own park progress"
  ON user_park_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own park progress"
  ON user_park_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their own park progress"
  ON user_park_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get all park progress for a user
CREATE OR REPLACE FUNCTION get_user_park_progress(p_user_id UUID)
RETURNS TABLE (
  park_id UUID,
  park_name TEXT,
  stars INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    upp.park_id,
    upp.park_name,
    upp.stars,
    upp.completed_at,
    upp.updated_at
  FROM user_park_progress upp
  WHERE upp.user_id = p_user_id
  ORDER BY upp.stars DESC, upp.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_park_progress IS 'Returns all park progress for a given user, ordered by stars and recency';

-- Function: Upsert park star progress
CREATE OR REPLACE FUNCTION upsert_park_progress(
  p_user_id UUID,
  p_park_id UUID,
  p_park_name TEXT,
  p_stars INTEGER
)
RETURNS user_park_progress AS $$
DECLARE
  v_result user_park_progress;
BEGIN
  -- Clamp stars to 0-3 range
  p_stars := GREATEST(0, LEAST(3, p_stars));

  -- Insert or update progress
  INSERT INTO user_park_progress (user_id, park_id, park_name, stars, completed_at, updated_at)
  VALUES (
    p_user_id,
    p_park_id,
    p_park_name,
    p_stars,
    CASE WHEN p_stars = 3 THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, park_id) DO UPDATE SET
    stars = p_stars,
    park_name = p_park_name,
    completed_at = CASE
      WHEN p_stars = 3 AND user_park_progress.completed_at IS NULL THEN NOW()
      WHEN p_stars < 3 THEN NULL
      ELSE user_park_progress.completed_at
    END,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_park_progress IS 'Creates or updates park progress for a user, automatically setting completed_at when stars reach 3';

-- Function: Add one star to a park (max 3)
CREATE OR REPLACE FUNCTION add_park_star(
  p_user_id UUID,
  p_park_id UUID,
  p_park_name TEXT
)
RETURNS user_park_progress AS $$
DECLARE
  v_current_stars INTEGER;
  v_result user_park_progress;
BEGIN
  -- Get current star count
  SELECT stars INTO v_current_stars
  FROM user_park_progress
  WHERE user_id = p_user_id AND park_id = p_park_id;

  -- If no record exists, start at 0
  IF v_current_stars IS NULL THEN
    v_current_stars := 0;
  END IF;

  -- Add one star (max 3)
  SELECT * INTO v_result
  FROM upsert_park_progress(p_user_id, p_park_id, p_park_name, v_current_stars + 1);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_park_star IS 'Increments park stars by 1 (max 3) for a user';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_park_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_park_progress_timestamp
  BEFORE UPDATE ON user_park_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_park_progress_timestamp();
