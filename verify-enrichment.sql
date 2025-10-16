-- Verify enrichment data for Arctic Tundra species
SELECT
    scientific_name,
    common_name,
    class,
    conservation_status,
    CASE
        WHEN image_url IS NOT NULL THEN SUBSTRING(image_url, 1, 50) || '...'
        ELSE 'No Image'
    END as image_preview
FROM species
WHERE scientific_name IN ('Rangifer tarandus', 'Ranunculus allenii', 'Claytonia tuberosa', 'Schoenoplectus tabernaemontani')
LIMIT 10;
