-- Check species data
SELECT
    scientific_name,
    common_name,
    class,
    conservation_status,
    CASE
        WHEN image_url IS NOT NULL THEN 'Has Image'
        ELSE 'No Image'
    END as image_status
FROM species
WHERE scientific_name IN ('Rangifer tarandus', 'Ranunculus allenii', 'Claytonia tuberosa')
LIMIT 10;

-- Count total species
SELECT COUNT(*) as total_species FROM species;

-- Count species with common names
SELECT COUNT(*) as species_with_common_names FROM species WHERE common_name IS NOT NULL;

-- Count species with images
SELECT COUNT(*) as species_with_images FROM species WHERE image_url IS NOT NULL;
