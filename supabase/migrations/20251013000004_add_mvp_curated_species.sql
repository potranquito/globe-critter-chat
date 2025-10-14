-- Add MVP Curated Species with Region Tags
-- This creates a simple, working dataset for 5-6 key ecoregions

-- Add region_tag column to species table
ALTER TABLE species ADD COLUMN IF NOT EXISTS region_tags TEXT[];

-- Create index for region tags
CREATE INDEX IF NOT EXISTS idx_species_region_tags ON species USING GIN(region_tags);

-- Add common names and region tags for Arctic Tundra species
UPDATE species
SET
  common_name = 'Caribou',
  region_tags = ARRAY['Arctic Tundra', 'Northern Hemisphere']
WHERE scientific_name = 'Rangifer tarandus' AND common_name IS NULL;

UPDATE species
SET
  common_name = 'Allen''s Buttercup',
  region_tags = ARRAY['Arctic Tundra', 'Temperate Grasslands']
WHERE scientific_name = 'Ranunculus allenii' AND common_name IS NULL;

UPDATE species
SET
  common_name = 'Beringian Springbeauty',
  region_tags = ARRAY['Arctic Tundra', 'Northern Hemisphere']
WHERE scientific_name = 'Claytonia tuberosa' AND common_name IS NULL;

UPDATE species
SET
  common_name = 'Soft-stemmed Bulrush',
  region_tags = ARRAY['Arctic Tundra', 'Wetlands', 'Temperate']
WHERE scientific_name = 'Schoenoplectus tabernaemontani' AND common_name IS NULL;

-- Add comment explaining the region_tags field
COMMENT ON COLUMN species.region_tags IS 'MVP curated region tags for easy filtering by ecoregion/biome. Example: ["Arctic Tundra", "Amazon Rainforest"]';
