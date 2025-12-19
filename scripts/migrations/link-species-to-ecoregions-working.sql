-- Working version: Link species to ecoregions using proximity matching

-- Drop old functions
DROP FUNCTION IF EXISTS match_species_to_ecoregion_by_proximity(UUID, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS populate_all_species_ecoregion_links();

-- Function 1: Match species to an ecoregion by proximity
CREATE FUNCTION match_species_to_ecoregion_by_proximity(
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
            jsonb_array_length(s.sample_points) as total_points
        FROM species s
        WHERE s.sample_points IS NOT NULL
        AND jsonb_typeof(s.sample_points) = 'array'
        AND jsonb_array_length(s.sample_points) > 0
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
            radius_km * 1000
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

-- Function 2: Populate species_ecoregions for all ecoregions
CREATE FUNCTION populate_all_species_ecoregion_links()
RETURNS TABLE (
    ecoregion_name TEXT,
    species_matched INTEGER
) AS $$
DECLARE
    eco RECORD;
    matched_count INTEGER;
BEGIN
    FOR eco IN
        SELECT id, name, center_lat, center_lng, COALESCE(radius_km, 100) as radius_km
        FROM ecoregions
        WHERE center_lat IS NOT NULL
        AND center_lng IS NOT NULL
    LOOP
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

        IF matched_count > 0 THEN
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
