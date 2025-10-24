-- Add is_venomous field for species that can inject venom
-- This is distinct from poisonous (toxic when eaten)

ALTER TABLE species
ADD COLUMN IF NOT EXISTS is_venomous BOOLEAN DEFAULT false;

-- Add index for filtering performance
CREATE INDEX IF NOT EXISTS idx_species_venomous ON species(is_venomous);

-- Add helpful comment
COMMENT ON COLUMN species.is_venomous IS 'True if species can inject venom (snakes, spiders, etc.). Distinct from poisonous (toxic when eaten).';

-- Backfill known venomous species based on common patterns
UPDATE species
SET is_venomous = true
WHERE
  -- Venomous snakes
  common_name ~* '\y(viper|cobra|mamba|adder|rattlesnake|copperhead|cottonmouth|taipan|krait|bushmaster|fer-de-lance|pit viper|coral snake|anaconda|boa|python)\y'
  OR scientific_name ~* '\y(Vipera|Naja|Dendroaspis|Crotalus|Agkistrodon|Oxyuranus|Bungarus|Lachesis|Bothrops|Trimeresurus|Micrurus|Eunectes|Boa|Python)\y'
  -- Venomous lizards
  OR common_name ~* '\y(gila monster|beaded lizard|komodo dragon)\y'
  OR scientific_name ~* '\y(Heloderma|Varanus komodoensis)\y'
  -- Venomous fish
  OR common_name ~* '\y(stonefish|lionfish|stingray|scorpionfish|weever|electric eel|electric ray)\y'
  OR scientific_name ~* '\y(Synanceia|Pterois|Dasyatis|Scorpaena|Electrophorus|Torpedo)\y'
  -- Venomous invertebrates (spiders, scorpions, jellyfish, etc.)
  OR common_name ~* '\y(black widow|brown recluse|funnel-web spider|box jellyfish|sea wasp|blue-ringed octopus|cone snail|scorpion|tarantula)\y'
  OR class IN ('ARACHNIDA', 'SCORPIONES')
  OR (class IN ('HYDROZOA', 'SCYPHOZOA', 'CUBOZOA') AND common_name ~* 'jellyfish')
  -- Venomous amphibians (poison dart frogs - technically poisonous but commonly called venomous)
  OR common_name ~* '\y(poison dart frog|poison frog|poison arrow frog)\y'
  OR scientific_name ~* '\y(Dendrobates|Phyllobates|Ranitomeya|Oophaga)\y'
  -- Platypus
  OR common_name ~* '\y(platypus)\y'
  OR scientific_name ~* '\y(Ornithorhynchus)\y';

-- Report on what was updated
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM species WHERE is_venomous = true;
  RAISE NOTICE 'Updated % species as venomous', v_count;
END $$;

-- Show distribution by class
SELECT
  class,
  COUNT(*) as venomous_count,
  string_agg(common_name, ', ' ORDER BY common_name) FILTER (WHERE common_name IS NOT NULL) as examples
FROM (
  SELECT DISTINCT ON (class, common_name) class, common_name
  FROM species
  WHERE is_venomous = true
  LIMIT 50
) sub
GROUP BY class
ORDER BY venomous_count DESC;
