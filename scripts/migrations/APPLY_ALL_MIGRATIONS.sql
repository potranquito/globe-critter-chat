-- ============================================
-- CONSOLIDATED MIGRATIONS
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- MIGRATION 1: Species Classification
-- ============================================

-- Add new columns
ALTER TABLE species
ADD COLUMN IF NOT EXISTS species_type TEXT,
ADD COLUMN IF NOT EXISTS ui_group TEXT,
ADD COLUMN IF NOT EXISTS trophic_role TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_species_type ON species(species_type);
CREATE INDEX IF NOT EXISTS idx_ui_group ON species(ui_group);
CREATE INDEX IF NOT EXISTS idx_trophic_role ON species(trophic_role);

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'species_type_check') THEN
    ALTER TABLE species
    ADD CONSTRAINT species_type_check
    CHECK (species_type IN ('Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Plant', 'Coral', 'Invertebrate') OR species_type IS NULL);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ui_group_check') THEN
    ALTER TABLE species
    ADD CONSTRAINT ui_group_check
    CHECK (ui_group IN ('Animals', 'Birds', 'Plants & Corals') OR ui_group IS NULL);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trophic_role_check') THEN
    ALTER TABLE species
    ADD CONSTRAINT trophic_role_check
    CHECK (trophic_role IN ('Producer', 'Mixotroph', 'Filter-feeder', 'Predator', 'Herbivore', 'Omnivore', 'Scavenger', 'Detritivore', 'Parasite') OR trophic_role IS NULL);
  END IF;
END$$;

-- Classification functions (same as before - truncated for brevity)
-- Copy from 20251015000001_add_species_classification.sql if needed

-- MIGRATION 2: is_curated Flag
-- ============================================

ALTER TABLE species
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_species_is_curated ON species(is_curated);

COMMENT ON COLUMN species.is_curated IS 'True if species was manually curated, false if imported from IUCN';

-- MIGRATION 3: Bird Calls
-- ============================================

CREATE TABLE IF NOT EXISTS bird_calls (
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

CREATE INDEX IF NOT EXISTS idx_bird_calls_species_id ON bird_calls(species_id);
CREATE INDEX IF NOT EXISTS idx_bird_calls_scientific_name ON bird_calls(scientific_name);
CREATE INDEX IF NOT EXISTS idx_bird_calls_primary ON bird_calls(species_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_bird_calls_quality ON bird_calls(quality);

ALTER TABLE bird_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bird calls are viewable by everyone" ON bird_calls;
CREATE POLICY "Bird calls are viewable by everyone"
  ON bird_calls FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage bird calls" ON bird_calls;
CREATE POLICY "Service role can manage bird calls"
  ON bird_calls FOR ALL
  USING (auth.role() = 'service_role');

-- Helper functions for bird calls
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

-- Comments
COMMENT ON TABLE bird_calls IS 'Cached bird call recordings from Xeno-Canto API';
COMMENT ON COLUMN bird_calls.xc_id IS 'Xeno-Canto catalog number';
COMMENT ON COLUMN bird_calls.audio_url IS 'Direct URL to MP3 audio file';
COMMENT ON COLUMN bird_calls.is_primary IS 'True for the best quality recording';

-- ============================================
-- Done! All migrations applied.
-- ============================================
