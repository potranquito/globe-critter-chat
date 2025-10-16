-- Diagnose why Borneo has 0 species linked
-- Check if IUCN species exist in Borneo region

-- 1. Check Borneo ecoregion details
SELECT name, center_lat, center_lng, radius_km
FROM ecoregions
WHERE name = 'Borneo';

-- 2. Count species with sample points near Borneo center
-- Borneo center: 0.9°N, 114.2°E, radius 1,216km
-- Check if ANY species have sample points in this general region (Borneo is roughly 0-7°N, 109-119°E)
SELECT COUNT(*) as total_species_in_borneo_region,
       COUNT(DISTINCT scientific_name) as unique_species
FROM species
WHERE sample_points IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(sample_points) AS point
    WHERE (point->>'lat')::float BETWEEN -5 AND 10
      AND (point->>'lng')::float BETWEEN 105 AND 125
  );

-- 3. Sample some species that should be in Borneo
SELECT scientific_name, common_name,
       jsonb_array_length(sample_points) as point_count,
       sample_points::jsonb->0 as first_point
FROM species
WHERE sample_points IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(sample_points) AS point
    WHERE (point->>'lat')::float BETWEEN -5 AND 10
      AND (point->>'lng')::float BETWEEN 105 AND 125
  )
LIMIT 20;

-- 4. Find species with sample points closest to Borneo center
-- This helps determine if the radius is too small
WITH distances AS (
  SELECT
    s.id,
    s.scientific_name,
    point->>'lat' as lat,
    point->>'lng' as lng,
    -- Calculate approximate distance using spherical law of cosines
    acos(
      sin(radians(0.9)) * sin(radians((point->>'lat')::float)) +
      cos(radians(0.9)) * cos(radians((point->>'lat')::float)) *
      cos(radians((point->>'lng')::float) - radians(114.2))
    ) * 6371 as distance_km
  FROM species s,
       jsonb_array_elements(s.sample_points) AS point
  WHERE s.sample_points IS NOT NULL
)
SELECT scientific_name, lat, lng, round(distance_km::numeric, 1) as distance_km
FROM distances
WHERE distance_km < 3000  -- Check within 3000km
ORDER BY distance_km
LIMIT 50;

-- 5. Check if there are species between radius 1216km and 2000km
WITH distances AS (
  SELECT
    s.id,
    s.scientific_name,
    acos(
      sin(radians(0.9)) * sin(radians((point->>'lat')::float)) +
      cos(radians(0.9)) * cos(radians((point->>'lat')::float)) *
      cos(radians((point->>'lng')::float) - radians(114.2))
    ) * 6371 as distance_km
  FROM species s,
       jsonb_array_elements(s.sample_points) AS point
  WHERE s.sample_points IS NOT NULL
)
SELECT
  COUNT(*) as species_count_between_1216_and_2000km
FROM distances
WHERE distance_km > 1216 AND distance_km <= 2000;
