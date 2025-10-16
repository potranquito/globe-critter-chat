-- ============================================================================
-- COMPLETE SPECIES-ECOREGION LINKING SETUP
-- This file applies the migration and populates the links in one go
-- ============================================================================

-- STEP 1: Create the spatial matching functions
-- ============================================================================

-- Function 1: Match species to ecoregion by geometry (point-in-polygon)
CREATE OR REPLACE FUNCTION match_species_to_ecoregion_by_points(
    target_ecoregion_id UUID
)
RETURNS TABLE (
    species_id UUID,
    overlap_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH sample_point_matches AS (
        SELECT
            s.id as species_id,
            jsonb_array_elements(s.sample_points) AS point,
            COUNT(*) OVER (PARTITION BY s.id) as total_points
        FROM species s
        WHERE s.sample_points IS NOT NULL
    ),
    point_intersections AS (
        SELECT
            spm.species_id,
            spm.total_points,
            COUNT(*) as matching_points
        FROM sample_point_matches spm
        JOIN ecoregions e ON e.id = target_ecoregion_id
        WHERE e.geometry IS NOT NULL
        AND ST_Contains(
            e.geometry::geometry,
            ST_SetSRID(
                ST_MakePoint(
                    (spm.point->>'lng')::NUMERIC,
                    (spm.point->>'lat')::NUMERIC
                ),
                4326
            )
        )
        GROUP BY spm.species_id, spm.total_points
    )
    SELECT
        pi.species_id,
        ROUND((pi.matching_points::DECIMAL / pi.total_points * 100), 2) as overlap_percentage
    FROM point_intersections pi
    WHERE pi.matching_points > 0;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Match species to ecoregion by proximity (distance from center)
CREATE OR REPLACE FUNCTION match_species_to_ecoregion_by_proximity(
    target_ecoregion_id UUID,
    center_latitude DECIMAL,
    center_longitude DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    species_id UUID,
    overlap_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH sample_point_matches AS (
        SELECT
            s.id as species_id,
            jsonb_array_elements(s.sample_points) AS point,
            COUNT(*) OVER (PARTITION BY s.id) as total_points
        FROM species s
        WHERE s.sample_points IS NOT NULL
    ),
    point_distances AS (
        SELECT
            spm.species_id,
            spm.total_points,
            COUNT(*) as matching_points
        FROM sample_point_matches spm
        WHERE ST_DWithin(
            ST_MakePoint(center_longitude, center_latitude)::geography,
            ST_MakePoint(
                (spm.point->>'lng')::NUMERIC,
                (spm.point->>'lat')::NUMERIC
            )::geography,
            radius_km * 1000  -- Convert km to meters
        )
        GROUP BY spm.species_id, spm.total_points
    )
    SELECT
        pd.species_id,
        ROUND((pd.matching_points::DECIMAL / pd.total_points * 100), 2) as overlap_percentage
    FROM point_distances pd
    WHERE pd.matching_points > 0;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get species for a specific ecoregion (updated version)
DROP FUNCTION IF EXISTS get_species_by_ecoregion(UUID);

CREATE OR REPLACE FUNCTION get_species_by_ecoregion(ecoregion_uuid UUID, max_results INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    scientific_name TEXT,
    common_name TEXT,
    conservation_status TEXT,
    class TEXT,
    image_url TEXT,
    overlap_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.scientific_name,
        s.common_name,
        s.conservation_status,
        s.class,
        s.image_url,
        se.overlap_percentage
    FROM species s
    JOIN species_ecoregions se ON s.id = se.species_id
    WHERE se.ecoregion_id = ecoregion_uuid
    ORDER BY
        se.is_primary_habitat DESC,
        se.overlap_percentage DESC,
        CASE
            WHEN s.conservation_status = 'CR' THEN 1
            WHEN s.conservation_status = 'EN' THEN 2
            WHEN s.conservation_status = 'VU' THEN 3
            ELSE 4
        END,
        s.common_name
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Batch populate species_ecoregions for all ecoregions
CREATE OR REPLACE FUNCTION populate_all_species_ecoregion_links()
RETURNS TABLE (
    ecoregion_name TEXT,
    species_matched INTEGER
) AS $$
DECLARE
    eco RECORD;
    matched_count INTEGER;
BEGIN
    -- Process ecoregions with geometry first
    FOR eco IN
        SELECT id, name, geometry, center_lat, center_lng, radius_km
        FROM ecoregions
        WHERE geometry IS NOT NULL
    LOOP
        -- Insert matches for this ecoregion
        INSERT INTO species_ecoregions (species_id, ecoregion_id, overlap_percentage, is_primary_habitat)
        SELECT
            m.species_id,
            eco.id,
            m.overlap_percentage,
            m.overlap_percentage > 50.0
        FROM match_species_to_ecoregion_by_points(eco.id) m
        ON CONFLICT (species_id, ecoregion_id) DO UPDATE
        SET overlap_percentage = EXCLUDED.overlap_percentage,
            is_primary_habitat = EXCLUDED.is_primary_habitat;

        GET DIAGNOSTICS matched_count = ROW_COUNT;

        ecoregion_name := eco.name;
        species_matched := matched_count;
        RETURN NEXT;
    END LOOP;

    -- Process ecoregions with only center points
    FOR eco IN
        SELECT id, name, center_lat, center_lng, COALESCE(radius_km, 100) as radius_km
        FROM ecoregions
        WHERE geometry IS NULL
        AND center_lat IS NOT NULL
        AND center_lng IS NOT NULL
    LOOP
        -- Insert matches for this ecoregion
        INSERT INTO species_ecoregions (species_id, ecoregion_id, overlap_percentage, is_primary_habitat)
        SELECT
            m.species_id,
            eco.id,
            m.overlap_percentage,
            m.overlap_percentage > 50.0
        FROM match_species_to_ecoregion_by_proximity(eco.id, eco.center_lat, eco.center_lng, eco.radius_km) m
        ON CONFLICT (species_id, ecoregion_id) DO UPDATE
        SET overlap_percentage = EXCLUDED.overlap_percentage,
            is_primary_habitat = EXCLUDED.is_primary_habitat;

        GET DIAGNOSTICS matched_count = ROW_COUNT;

        ecoregion_name := eco.name;
        species_matched := matched_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Populate the species_ecoregions table
-- This will take several minutes depending on data size
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'Migration functions created successfully!'
\echo 'Now populating species-ecoregion links...'
\echo 'This will take 5-30 minutes depending on data size.'
\echo '============================================================================'
\echo ''

-- Run the population function
SELECT * FROM populate_all_species_ecoregion_links();

-- ============================================================================
-- STEP 3: Show results
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'Population complete! Here are the results:'
\echo '============================================================================'
\echo ''

-- Total links created
SELECT
    COUNT(*) as total_links,
    COUNT(DISTINCT species_id) as unique_species,
    COUNT(DISTINCT ecoregion_id) as unique_ecoregions
FROM species_ecoregions;

\echo ''
\echo 'Top 10 ecoregions by species count:'
\echo ''

-- Top ecoregions by species count
SELECT
    e.name as ecoregion_name,
    COUNT(*) as species_count
FROM species_ecoregions se
JOIN ecoregions e ON e.id = se.ecoregion_id
GROUP BY e.name
ORDER BY species_count DESC
LIMIT 10;

\echo ''
\echo 'Arctic regions species counts:'
\echo ''

-- Arctic-specific check
SELECT
    e.name as ecoregion,
    COUNT(se.species_id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
WHERE e.name ILIKE '%arctic%' OR e.name ILIKE '%tundra%'
GROUP BY e.id, e.name
ORDER BY species_count DESC;

\echo ''
\echo '============================================================================'
\echo 'Setup complete! Refresh your browser and click on Arctic Tundra to test.'
\echo '============================================================================'
