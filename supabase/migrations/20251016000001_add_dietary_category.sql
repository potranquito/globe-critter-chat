-- Add dietary category for UI filtering (Carnivore, Herbivore, Omnivore, Producer)
-- This simplifies the complex trophic_role into 4 clear UI categories

-- Add new column for dietary category
ALTER TABLE species
ADD COLUMN IF NOT EXISTS dietary_category TEXT;

-- Create index for filtering performance
CREATE INDEX IF NOT EXISTS idx_dietary_category ON species(dietary_category);

-- Add check constraint for valid values
ALTER TABLE species
DROP CONSTRAINT IF EXISTS dietary_category_check;

ALTER TABLE species
ADD CONSTRAINT dietary_category_check
CHECK (dietary_category IN ('Carnivore', 'Herbivore', 'Omnivore', 'Producer') OR dietary_category IS NULL);

-- Function to map trophic_role to dietary_category (4 UI groups)
CREATE OR REPLACE FUNCTION classify_dietary_category(
  p_trophic_role TEXT,
  p_species_type TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Producers (Plants & Corals)
  IF p_trophic_role IN ('Producer', 'Mixotroph') OR p_species_type IN ('Plant', 'Coral') THEN
    RETURN 'Producer';
  END IF;

  -- Carnivores (meat-eaters)
  IF p_trophic_role IN ('Predator', 'Scavenger', 'Parasite') THEN
    RETURN 'Carnivore';
  END IF;

  -- Herbivores (plant-eaters)
  IF p_trophic_role IN ('Herbivore', 'Detritivore') THEN
    RETURN 'Herbivore';
  END IF;

  -- Filter-feeders: Most filter-feeders are carnivorous (eating zooplankton)
  -- Exception: Some are herbivorous (eating phytoplankton)
  IF p_trophic_role = 'Filter-feeder' THEN
    -- Baleen whales, manta rays, whale sharks eat plankton (mix of plants & animals) = Omnivore
    RETURN 'Omnivore';
  END IF;

  -- Omnivores (everything else)
  IF p_trophic_role = 'Omnivore' THEN
    RETURN 'Omnivore';
  END IF;

  -- Default fallback
  RETURN 'Omnivore';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced trophic_role classification with better dietary accuracy
CREATE OR REPLACE FUNCTION classify_trophic_role_enhanced(
  p_species_type TEXT,
  p_description TEXT,
  p_common_name TEXT,
  p_class TEXT
) RETURNS TEXT AS $$
DECLARE
  v_search_text TEXT;
  v_common_lower TEXT;
  v_class_lower TEXT;
BEGIN
  v_search_text := LOWER(COALESCE(p_description, ''));
  v_common_lower := LOWER(COALESCE(p_common_name, ''));
  v_class_lower := LOWER(COALESCE(p_class, ''));

  -- PRODUCERS: Plants & photosynthetic organisms
  IF v_search_text ~ '\y(photosynth|autotroph|primary\s+producer|seagrass|kelp|seaweed)\y' THEN
    RETURN 'Producer';
  END IF;

  -- MIXOTROPHS: Corals with zooxanthellae
  IF v_search_text ~ '\y(zooxanthell|mixotroph|symbiont)\y' THEN
    RETURN 'Mixotroph';
  END IF;

  -- HERBIVORES: Plant-eaters (check FIRST before predator)
  IF v_search_text ~ '\y(herbivor|graze|browse|frugivor|folivor|granivor|algae-?eat|plant-?eat|leaf-?eat)\y' THEN
    RETURN 'Herbivore';
  END IF;

  -- OMNIVORES: Explicit omnivores
  IF v_search_text ~ '\yomnivor\y' THEN
    RETURN 'Omnivore';
  END IF;

  -- CARNIVORES: Predators and meat-eaters
  IF v_search_text ~ '\y(hunt|carnivor|raptor|piscivor|ambush|prey\s+on|feeds?\s+on\s+(fish|birds|mammals|reptiles|amphibians|insects))\y' THEN
    RETURN 'Predator';
  END IF;

  -- SCAVENGERS: Carrion-eaters
  IF v_search_text ~ '\y(scaveng|carrion)\y' THEN
    RETURN 'Scavenger';
  END IF;

  -- FILTER-FEEDERS: Plankton-eaters
  IF v_search_text ~ '\y(filter-?feed|planktivor|suspension.?feeder|baleen)\y' THEN
    RETURN 'Filter-feeder';
  END IF;

  -- DETRITIVORES: Decomposers
  IF v_search_text ~ '\y(detritivor|detritus)\y' THEN
    RETURN 'Detritivore';
  END IF;

  -- PARASITES
  IF v_search_text ~ '\y(parasite|parasitic)\y' THEN
    RETURN 'Parasite';
  END IF;

  -- Common name based classification (PRIORITY ORDER MATTERS!)

  -- Herbivores (check FIRST)
  IF v_common_lower ~ '\y(deer|elk|moose|bison|buffalo|antelope|gazelle|zebra|giraffe|elephant|rhino|hippo|manatee|dugong|green.?sea.?turtle|iguana|tortoise|parrotfish|surgeonfish|rabbit|hare|pika|vole|lemming)\y' THEN
    RETURN 'Herbivore';
  END IF;

  -- Omnivores (check SECOND)
  IF v_common_lower ~ '\y(bear|pig|boar|monkey|ape|chimpanzee|gorilla|baboon|macaque|raccoon|badger|skunk|opossum|gull|crow|raven|jay|thrush|robin|starling|sparrow|finch|crab|lobster|shrimp|prawn)\y' THEN
    RETURN 'Omnivore';
  END IF;

  -- Carnivores (check THIRD)
  IF v_common_lower ~ '\y(shark|ray(?!fish)|barracuda|tuna|grouper|snapper|eagle|hawk|falcon|owl|kite|osprey|cat|leopard|lion|tiger|cheetah|jaguar|puma|lynx|wolf|fox|coyote|jackal|hyena|weasel|mink|otter|seal|sea.?lion|walrus|crocodile|alligator|caiman|python|boa|viper|cobra|mamba|octopus|squid|cuttlefish|jellyfish|anemone)\y' THEN
    RETURN 'Predator';
  END IF;

  -- Scavengers
  IF v_common_lower ~ '\y(vulture|condor|buzzard)\y' THEN
    RETURN 'Scavenger';
  END IF;

  -- Filter-feeders
  IF v_common_lower ~ '\y(baleen|whale.?shark|basking.?shark|manta|mobula|bivalve|clam|oyster|mussel|scallop|sponge)\y' THEN
    RETURN 'Filter-feeder';
  END IF;

  -- Detritivores
  IF v_common_lower ~ '\y(sea.?cucumber|worm|snail)\y' THEN
    RETURN 'Detritivore';
  END IF;

  -- Taxonomic class-based defaults (GUARDRAILS)
  IF p_species_type = 'Plant' THEN
    RETURN 'Producer';
  ELSIF p_species_type = 'Coral' THEN
    -- Most corals have zooxanthellae (mixotrophs)
    IF v_search_text ~ '\y(azooxanthellate|deep.?sea|cold.?water)\y' THEN
      RETURN 'Filter-feeder';
    ELSE
      RETURN 'Mixotroph';
    END IF;
  ELSIF p_species_type = 'Fish' THEN
    -- Fish are diverse - check for herbivorous fish
    IF v_common_lower ~ '\y(parrotfish|surgeonfish|rabbitfish|damselfish|tang)\y' THEN
      RETURN 'Herbivore';
    END IF;
    -- Most fish are predators
    RETURN 'Predator';
  ELSIF p_species_type = 'Bird' THEN
    -- Birds are diverse - many are omnivores or herbivores
    IF v_class_lower ~ '\y(passeriform|galliform|anseriform)\y' THEN
      RETURN 'Omnivore';  -- Songbirds, chickens, ducks
    END IF;
    -- Raptors and seabirds are predators
    RETURN 'Predator';
  ELSIF p_species_type IN ('Reptile', 'Amphibian') THEN
    -- Most are carnivores, but some are herbivores
    IF v_common_lower ~ '\y(tortoise|iguana)\y' THEN
      RETURN 'Herbivore';
    END IF;
    RETURN 'Predator';
  ELSIF p_species_type = 'Mammal' THEN
    -- Mammals are very diverse - default to omnivore
    RETURN 'Omnivore';
  ELSIF p_species_type = 'Invertebrate' THEN
    -- Invertebrates are diverse - default to omnivore
    RETURN 'Omnivore';
  END IF;

  -- Ultimate fallback
  RETURN 'Omnivore';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the auto-classification trigger to use enhanced function and set dietary_category
CREATE OR REPLACE FUNCTION auto_classify_species_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  -- Classify species type if not set
  IF NEW.species_type IS NULL THEN
    NEW.species_type := classify_species_type(NEW.class, NEW.common_name, NEW.scientific_name);
  END IF;

  -- Classify UI group if not set
  IF NEW.ui_group IS NULL THEN
    NEW.ui_group := classify_ui_group(NEW.species_type);
  END IF;

  -- Classify trophic role using enhanced function
  IF NEW.trophic_role IS NULL THEN
    NEW.trophic_role := classify_trophic_role_enhanced(
      NEW.species_type,
      NEW.description,
      NEW.common_name,
      NEW.class
    );
  END IF;

  -- Set dietary category based on trophic role
  NEW.dietary_category := classify_dietary_category(NEW.trophic_role, NEW.species_type);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger with new enhanced version
DROP TRIGGER IF EXISTS trigger_auto_classify_species ON species;
CREATE TRIGGER trigger_auto_classify_species
  BEFORE INSERT OR UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_species_enhanced();

-- Backfill all existing species with enhanced classification
UPDATE species
SET
  trophic_role = classify_trophic_role_enhanced(
    species_type,
    description,
    common_name,
    class
  ),
  dietary_category = classify_dietary_category(
    classify_trophic_role_enhanced(
      species_type,
      description,
      common_name,
      class
    ),
    species_type
  );

-- Add helpful comment
COMMENT ON COLUMN species.dietary_category IS 'Simplified dietary category for UI filtering: Carnivore, Herbivore, Omnivore, Producer';
