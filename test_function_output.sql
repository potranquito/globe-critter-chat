-- Test if the database function returns dietary_category
SELECT
  scientific_name,
  common_name,
  class,
  species_type,
  ui_group,
  trophic_role,
  dietary_category,
  taxonomic_group
FROM get_balanced_ecoregion_species(
  (SELECT id FROM ecoregions WHERE name ILIKE '%congo%' LIMIT 1),
  3,
  ARRAY[]::TEXT[]
)
LIMIT 5;
