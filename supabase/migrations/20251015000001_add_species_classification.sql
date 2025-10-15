-- Add species classification columns
-- These columns will store pre-computed classification data for better performance

-- Add new columns to species table
ALTER TABLE species
ADD COLUMN IF NOT EXISTS species_type TEXT,
ADD COLUMN IF NOT EXISTS ui_group TEXT,
ADD COLUMN IF NOT EXISTS trophic_role TEXT;

-- Create indexes for filtering performance
CREATE INDEX IF NOT EXISTS idx_species_type ON species(species_type);
CREATE INDEX IF NOT EXISTS idx_ui_group ON species(ui_group);
CREATE INDEX IF NOT EXISTS idx_trophic_role ON species(trophic_role);

-- Add check constraints for valid values
ALTER TABLE species
ADD CONSTRAINT species_type_check
CHECK (species_type IN ('Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Plant', 'Coral', 'Invertebrate') OR species_type IS NULL);

ALTER TABLE species
ADD CONSTRAINT ui_group_check
CHECK (ui_group IN ('Animals', 'Birds', 'Plants & Corals') OR ui_group IS NULL);

ALTER TABLE species
ADD CONSTRAINT trophic_role_check
CHECK (trophic_role IN ('Producer', 'Mixotroph', 'Filter-feeder', 'Predator', 'Herbivore', 'Omnivore', 'Scavenger', 'Detritivore', 'Parasite') OR trophic_role IS NULL);

-- Function to classify species type based on taxonomic class
CREATE OR REPLACE FUNCTION classify_species_type(
  p_class TEXT,
  p_common_name TEXT,
  p_scientific_name TEXT
) RETURNS TEXT AS $$
DECLARE
  v_class_lower TEXT;
  v_search_text TEXT;
BEGIN
  v_class_lower := LOWER(COALESCE(p_class, ''));
  v_search_text := LOWER(COALESCE(p_common_name, '') || ' ' || COALESCE(p_scientific_name, ''));

  -- Class-based classification
  IF v_class_lower LIKE '%mammalia%' OR v_class_lower LIKE 'mammal%' THEN
    RETURN 'Mammal';
  ELSIF v_class_lower LIKE '%aves%' OR v_class_lower LIKE 'bird%' THEN
    RETURN 'Bird';
  ELSIF v_class_lower LIKE '%reptilia%' OR v_class_lower LIKE 'reptil%' THEN
    RETURN 'Reptile';
  ELSIF v_class_lower LIKE '%amphibia%' OR v_class_lower LIKE 'amphibian%' THEN
    RETURN 'Amphibian';
  ELSIF v_class_lower ~ '(chondrichthyes|elasmobranchii|actinopterygii|sarcopterygii)' OR v_class_lower LIKE 'fish%' THEN
    RETURN 'Fish';
  ELSIF v_class_lower ~ '(magnoliopsida|liliopsida|pinopsida|cycadopsida|polypodiopsida)' OR v_class_lower LIKE 'plant%' THEN
    RETURN 'Plant';
  ELSIF v_class_lower ~ '(anthozoa|scleractinia|octocorallia)' THEN
    RETURN 'Coral';
  ELSIF v_class_lower ~ '(cephalopoda|bivalvia|gastropoda|malacostraca|echinodermata|porifera|insect)' THEN
    RETURN 'Invertebrate';
  END IF;

  -- Keyword fallback
  IF v_search_text ~ '\y(coral|acropora|montipora|porites|pocillopora)\y' THEN
    RETURN 'Coral';
  ELSIF v_search_text ~ '\y(manta|ray|shark|tuna|wrasse|parrotfish|butterflyfish|barracuda|clownfish)\y' THEN
    RETURN 'Fish';
  ELSIF v_search_text ~ '\y(whale|dolphin|seal|sea lion|walrus|otter)\y' THEN
    RETURN 'Mammal';
  ELSIF v_search_text ~ '\y(turtle|krait|sea snake)\y' THEN
    RETURN 'Reptile';
  ELSIF v_search_text ~ '\y(kelp|seaweed|seagrass|eelgrass|zostera|posidonia)\y' THEN
    RETURN 'Plant';
  ELSIF v_search_text ~ '\y(octopus|squid|clam|snail|crab|shrimp|lobster|jellyfish|anemone|sponge|urchin|starfish|sea cucumber)\y' THEN
    RETURN 'Invertebrate';
  END IF;

  -- Default to Invertebrate for unknown
  RETURN 'Invertebrate';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine UI group from species type
CREATE OR REPLACE FUNCTION classify_ui_group(p_species_type TEXT) RETURNS TEXT AS $$
BEGIN
  IF p_species_type IN ('Plant', 'Coral') THEN
    RETURN 'Plants & Corals';
  ELSIF p_species_type = 'Bird' THEN
    RETURN 'Birds';
  ELSE
    RETURN 'Animals';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to classify trophic role
CREATE OR REPLACE FUNCTION classify_trophic_role(
  p_species_type TEXT,
  p_description TEXT,
  p_common_name TEXT
) RETURNS TEXT AS $$
DECLARE
  v_search_text TEXT;
  v_common_lower TEXT;
BEGIN
  v_search_text := LOWER(COALESCE(p_description, ''));
  v_common_lower := LOWER(COALESCE(p_common_name, ''));

  -- Regex pattern matching on description
  IF v_search_text ~ '\y(photosynth|autotroph|primary\s+producer|seagrass|kelp|seaweed)\y' THEN
    RETURN 'Producer';
  ELSIF v_search_text ~ '\y(zooxanthell|mixotroph|symbiont)\y' THEN
    RETURN 'Mixotroph';
  ELSIF v_search_text ~ '\y(filter-?feed|planktivor|suspension.?feeder|baleen)\y' THEN
    RETURN 'Filter-feeder';
  ELSIF v_search_text ~ '\y(hunt|prey|carnivor|raptor|piscivor|ambush)\y' THEN
    RETURN 'Predator';
  ELSIF v_search_text ~ '\y(herbivor|graze|browse|frugivor|folivor|granivor|algae-?eat)\y' THEN
    RETURN 'Herbivore';
  ELSIF v_search_text ~ '\yomnivor\y' THEN
    RETURN 'Omnivore';
  ELSIF v_search_text ~ '\y(scaveng|carrion)\y' THEN
    RETURN 'Scavenger';
  ELSIF v_search_text ~ '\y(detritivor|detritus)\y' THEN
    RETURN 'Detritivore';
  ELSIF v_search_text ~ '\y(parasite|parasitic)\y' THEN
    RETURN 'Parasite';
  END IF;

  -- Default rules based on common names
  IF v_common_lower ~ '\y(shark|ray|manta|barracuda|eagle|hawk|falcon|owl|cat|leopard|lion|tiger|crocodile|octopus|squid|jellyfish)\y' THEN
    RETURN 'Predator';
  ELSIF v_common_lower ~ '\y(green.?sea.?turtle|iguana|tortoise|parrotfish|surgeonfish|manatee|dugong)\y' THEN
    RETURN 'Herbivore';
  ELSIF v_common_lower ~ '\y(bear|pig|monkey|gull|crow|crab)\y' THEN
    RETURN 'Omnivore';
  ELSIF v_common_lower ~ '\y(vulture|hyena|condor)\y' THEN
    RETURN 'Scavenger';
  ELSIF v_common_lower ~ '\y(baleen|whale shark|basking shark|manta|bivalve|sponge|clam|oyster|mussel)\y' THEN
    RETURN 'Filter-feeder';
  ELSIF v_common_lower ~ '\y(sea cucumber|worm)\y' THEN
    RETURN 'Detritivore';
  END IF;

  -- Guardrails based on species type
  IF p_species_type = 'Plant' THEN
    RETURN 'Producer';
  ELSIF p_species_type = 'Coral' THEN
    -- Check if azooxanthellate
    IF v_search_text ~ '\y(azooxanthellate|deep.?sea|cold.?water)\y' THEN
      RETURN 'Filter-feeder';
    ELSE
      RETURN 'Mixotroph';
    END IF;
  ELSIF p_species_type = 'Fish' THEN
    RETURN 'Predator';
  ELSIF p_species_type = 'Bird' THEN
    RETURN 'Predator';
  ELSIF p_species_type IN ('Reptile', 'Amphibian') THEN
    RETURN 'Predator';
  ELSIF p_species_type = 'Mammal' THEN
    RETURN 'Omnivore';
  ELSIF p_species_type = 'Invertebrate' THEN
    RETURN 'Omnivore';
  END IF;

  -- Ultimate fallback
  RETURN 'Omnivore';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill existing species data
-- This will classify all existing species in the database
UPDATE species
SET
  species_type = classify_species_type(class, common_name, scientific_name),
  ui_group = classify_ui_group(classify_species_type(class, common_name, scientific_name)),
  trophic_role = classify_trophic_role(
    classify_species_type(class, common_name, scientific_name),
    description,
    common_name
  )
WHERE species_type IS NULL OR ui_group IS NULL OR trophic_role IS NULL;

-- Create trigger to auto-classify new species
CREATE OR REPLACE FUNCTION auto_classify_species()
RETURNS TRIGGER AS $$
BEGIN
  -- Only classify if not already set
  IF NEW.species_type IS NULL THEN
    NEW.species_type := classify_species_type(NEW.class, NEW.common_name, NEW.scientific_name);
  END IF;

  IF NEW.ui_group IS NULL THEN
    NEW.ui_group := classify_ui_group(NEW.species_type);
  END IF;

  IF NEW.trophic_role IS NULL THEN
    NEW.trophic_role := classify_trophic_role(NEW.species_type, NEW.description, NEW.common_name);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_classify_species ON species;
CREATE TRIGGER trigger_auto_classify_species
  BEFORE INSERT OR UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_species();

-- Add helpful comment
COMMENT ON COLUMN species.species_type IS 'Coarse species classification: Mammal, Bird, Fish, Reptile, Amphibian, Plant, Coral, Invertebrate';
COMMENT ON COLUMN species.ui_group IS 'UI grouping for filtering: Animals, Birds, Plants & Corals';
COMMENT ON COLUMN species.trophic_role IS 'Ecological role: Producer, Mixotroph, Filter-feeder, Predator, Herbivore, Omnivore, Scavenger, Detritivore, Parasite';
