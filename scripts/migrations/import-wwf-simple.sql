-- Manually insert WWF priority ecoregions WITHOUT geometry (just use center points)
-- This is much faster and works for proximity matching

INSERT INTO ecoregions (ecoregion_id, name, biome, realm, center_lat, center_lng, radius_km)
VALUES
    ('201', 'Amazon Rainforest', 'Tropical Rainforest', 'Neotropical', -3.5, -62.0, 1500),
    ('202', 'Arctic Tundra', 'Tundra', 'Nearctic', 71.0, -100.0, 1500),
    ('203', 'Borneo Rainforest', 'Tropical Rainforest', 'Indo-Malayan', 0.5, 114.0, 400),
    ('204', 'Congo Basin', 'Tropical Rainforest', 'Afrotropic', -2.0, 24.0, 800),
    ('205', 'East African Savanna', 'Grassland', 'Afrotropic', -2.0, 34.0, 800),
    ('206', 'Great Barrier Reef', 'Coral Reef', 'Australasian', -18.0, 147.0, 400),
    ('207', 'Madagascar Forests', 'Tropical Forest', 'Afrotropic', -18.0, 46.0, 300),
    ('208', 'Mojave Desert', 'Desert', 'Nearctic', 35.0, -115.0, 300),
    ('209', 'Patagonian Steppe', 'Grassland', 'Neotropical', -45.0, -70.0, 500),
    ('210', 'Serengeti', 'Grassland', 'Afrotropic', -2.5, 34.8, 200)
ON CONFLICT (ecoregion_id) DO NOTHING;

-- Check results
SELECT COUNT(*) as total_ecoregions FROM ecoregions;
SELECT * FROM ecoregions LIMIT 5;
