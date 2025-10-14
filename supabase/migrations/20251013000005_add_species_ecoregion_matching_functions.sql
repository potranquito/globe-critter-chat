-- Add spatial matching functions for species-ecoregion linking
-- Date: October 13, 2025

-- Function 1: Match species to ecoregion by geometry (point-in-polygon)
-- Checks if any sample_points fall within an ecoregion's geometry boundary
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

COMMENT ON FUNCTION match_species_to_ecoregion_by_points IS 'Finds species whose sample points fall within an ecoregion geometry. Returns species_id and overlap percentage.';

-- Function 2: Match species to ecoregion by proximity (distance from center)
-- For ecoregions without geometry, use center point + radius
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

COMMENT ON FUNCTION match_species_to_ecoregion_by_proximity IS 'Finds species whose sample points are within radius_km of ecoregion center. Returns species_id and overlap percentage.';

-- Function 3: Helper to get species for a specific ecoregion (updated version)
-- This replaces the basic version from the original migration
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

COMMENT ON FUNCTION get_species_by_ecoregion IS 'Returns species for an ecoregion, ordered by overlap percentage and conservation status';

-- Function 4: Batch populate species_ecoregions for all ecoregions
-- This is a convenience function to populate the entire junction table
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

COMMENT ON FUNCTION populate_all_species_ecoregion_links IS 'Populates species_ecoregions junction table for all ecoregions. Can be run to refresh all links.';
