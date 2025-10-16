-- Check dietary category distribution
SELECT
  dietary_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM species WHERE dietary_category IS NOT NULL), 1) as percentage
FROM species
WHERE dietary_category IS NOT NULL
GROUP BY dietary_category
ORDER BY count DESC;

-- Check sample species by category
SELECT 'CARNIVORES' as category, common_name, class, trophic_role, dietary_category
FROM species
WHERE dietary_category = 'Carnivore'
  AND common_name IS NOT NULL
LIMIT 5;

SELECT 'HERBIVORES' as category, common_name, class, trophic_role, dietary_category
FROM species
WHERE dietary_category = 'Herbivore'
  AND common_name IS NOT NULL
LIMIT 5;

SELECT 'OMNIVORES' as category, common_name, class, trophic_role, dietary_category
FROM species
WHERE dietary_category = 'Omnivore'
  AND common_name IS NOT NULL
LIMIT 5;

-- Check what cats and buffalo have
SELECT common_name, class, trophic_role, dietary_category, description
FROM species
WHERE common_name ILIKE '%cat%' OR common_name ILIKE '%buffalo%'
LIMIT 10;
