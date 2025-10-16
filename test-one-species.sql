-- Test extracting points from ONE species to see the error
WITH one_species AS (
    SELECT id, scientific_name, sample_points
    FROM species
    WHERE sample_points IS NOT NULL
    AND jsonb_array_length(sample_points) > 0
    LIMIT 1
)
SELECT
    scientific_name,
    elem AS point,
    elem->>'lat' AS lat,
    elem->>'lng' AS lng
FROM one_species,
LATERAL jsonb_array_elements(sample_points) AS elem;
