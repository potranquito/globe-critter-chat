-- Populate species-ecoregion links
-- Run this AFTER migration-only.sql

-- This will take 5-30 minutes depending on data size
SELECT * FROM populate_all_species_ecoregion_links();
