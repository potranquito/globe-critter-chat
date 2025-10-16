-- Drop old functions and create new ones that work with existing schema

-- Drop old function versions
DROP FUNCTION IF EXISTS match_species_to_park_by_proximity(UUID, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS populate_all_species_park_links();
DROP FUNCTION IF EXISTS populate_species_park_links_simple();

-- Function 1: Match species to a park by proximity
CREATE FUNCTION match_species_to_park_by_proximity(
    target_park_id UUID,
    center_latitude DECIMAL,
    center_longitude DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    species_id UUID,
    match_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH sample_point_matches AS (
        SELECT
            s.id as species_id,
            jsonb_array_elements(s.sample_points) AS point
        FROM species s
        WHERE s.sample_points IS NOT NULL
    )
    SELECT
        spm.species_id,
        COUNT(*)::INTEGER as match_count
    FROM sample_point_matches spm
    WHERE ST_DWithin(
        ST_MakePoint(center_longitude, center_latitude)::geography,
        ST_MakePoint(
            (spm.point->>'lng')::NUMERIC,
            (spm.point->>'lat')::NUMERIC
        )::geography,
        radius_km * 1000
    )
    GROUP BY spm.species_id;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Populate species_parks for all parks
CREATE FUNCTION populate_species_park_links_simple()
RETURNS TABLE (
    park_name TEXT,
    species_matched INTEGER
) AS $$
DECLARE
    park_rec RECORD;
    matched_count INTEGER;
BEGIN
    FOR park_rec IN
        SELECT
            id,
            name,
            center_lat,
            center_lng,
            CASE
                WHEN gis_area_km2 IS NOT NULL THEN GREATEST(SQRT(gis_area_km2), 10)::DECIMAL
                ELSE 50
            END as radius_km
        FROM parks
        WHERE center_lat IS NOT NULL
        AND center_lng IS NOT NULL
        ORDER BY gis_area_km2 DESC NULLS LAST
        LIMIT 100
    LOOP
        INSERT INTO species_parks (species_id, park_id, confirmed_sighting, observation_count)
        SELECT
            m.species_id,
            park_rec.id,
            m.match_count > 2,
            m.match_count
        FROM match_species_to_park_by_proximity(
            park_rec.id,
            park_rec.center_lat,
            park_rec.center_lng,
            park_rec.radius_km
        ) m
        ON CONFLICT (species_id, park_id) DO UPDATE
        SET observation_count = EXCLUDED.observation_count,
            confirmed_sighting = EXCLUDED.confirmed_sighting;

        GET DIAGNOSTICS matched_count = ROW_COUNT;

        park_name := park_rec.name;
        species_matched := matched_count;

        IF matched_count > 0 THEN
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
