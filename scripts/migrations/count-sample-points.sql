-- Count sample_points
SELECT
    COUNT(*) as total_species,
    COUNT(sample_points) as with_sample_points
FROM species;
