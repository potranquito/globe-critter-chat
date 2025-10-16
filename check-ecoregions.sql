-- Check what ecoregions exist
SELECT name, biome, realm, center_lat, center_lng
FROM ecoregions
WHERE name ILIKE '%arctic%' OR name ILIKE '%tundra%'
LIMIT 10;

-- Get all ecoregion names (for reference)
SELECT name FROM ecoregions ORDER BY name LIMIT 20;
