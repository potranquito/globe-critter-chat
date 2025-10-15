-- Add bird calls table and functions
-- This allows caching of Xeno-Canto recordings for better performance

-- Create bird_calls table
CREATE TABLE IF NOT EXISTS bird_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id UUID REFERENCES species(id) ON DELETE CASCADE,
  scientific_name TEXT NOT NULL,

  -- Xeno-Canto metadata
  xc_id TEXT NOT NULL, -- Xeno-canto recording catalog number
  audio_url TEXT NOT NULL, -- Direct URL to MP3 file
  quality TEXT, -- A, B, C, D, E rating
  recording_type TEXT, -- song, call, etc.
  length_seconds NUMERIC,

  -- Additional metadata
  recordist TEXT,
  country TEXT,
  location TEXT,
  date TEXT,

  -- Caching metadata
  cached_at TIMESTAMP DEFAULT NOW(),
  playback_count INT DEFAULT 0,
  last_played_at TIMESTAMP,

  -- Performance
  is_primary BOOLEAN DEFAULT false, -- Best quality recording for this species

  UNIQUE(species_id, xc_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bird_calls_species_id ON bird_calls(species_id);
CREATE INDEX IF NOT EXISTS idx_bird_calls_scientific_name ON bird_calls(scientific_name);
CREATE INDEX IF NOT EXISTS idx_bird_calls_primary ON bird_calls(species_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_bird_calls_quality ON bird_calls(quality);

-- Enable RLS
ALTER TABLE bird_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read bird calls
CREATE POLICY "Bird calls are viewable by everyone"
  ON bird_calls FOR SELECT
  USING (true);

-- RLS Policy: Only service role can insert/update
CREATE POLICY "Service role can manage bird calls"
  ON bird_calls FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get cached bird call for a species
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

-- Function to increment playback count
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

-- Function to check if bird call exists
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

-- View for bird species with calls
CREATE OR REPLACE VIEW bird_species_with_calls AS
SELECT
  s.id,
  s.scientific_name,
  s.common_name,
  s.species_type,
  COUNT(bc.id) as call_count,
  BOOL_OR(bc.is_primary) as has_primary_call
FROM species s
LEFT JOIN bird_calls bc ON s.id = bc.species_id
WHERE s.species_type = 'Bird'
GROUP BY s.id, s.scientific_name, s.common_name, s.species_type;

-- Add helpful comments
COMMENT ON TABLE bird_calls IS 'Cached bird call recordings from Xeno-Canto API';
COMMENT ON COLUMN bird_calls.xc_id IS 'Xeno-Canto catalog number (e.g., 123456)';
COMMENT ON COLUMN bird_calls.audio_url IS 'Direct URL to MP3 audio file';
COMMENT ON COLUMN bird_calls.is_primary IS 'True for the best quality recording to use by default';
COMMENT ON COLUMN bird_calls.playback_count IS 'Number of times this recording has been played';
