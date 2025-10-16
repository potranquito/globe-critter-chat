-- Link species directly to parks using spatial matching
-- Updated to match existing species_parks table schema

-- Function 1: Match species to a specific park by proximity
CREATE OR REPLACE FUNCTION match_species_to_park_by_proximity(
    target_park_id UUID,
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

-- Function 2: Batch populate species_parks for all parks
-- Uses existing species_parks columns: species_id, park_id, is_flagship, curation_priority
CREATE OR REPLACE FUNCTION populate_all_species_park_links()
RETURNS TABLE (
    park_name TEXT,
    species_matched INTEGER
) AS $$
DECLARE
    park_rec RECORD;
    matched_count INTEGER;
    processed_count INTEGER := 0;
BEGIN
    -- Process parks with coordinates (use reasonable search radius based on park size)
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
        LIMIT 100  -- Start with first 100 largest parks to test
    LOOP
        processed_count := processed_count + 1;

        -- Insert matches for this park
        INSERT INTO species_parks (species_id, park_id, is_flagship, curation_priority)
        SELECT
            m.species_id,
            park_rec.id,
            false,  -- Default not flagship
            CASE
                WHEN m.overlap_percentage > 75 THEN 80
                WHEN m.overlap_percentage > 50 THEN 60
                WHEN m.overlap_percentage > 25 THEN 40
                ELSE 20
            END
        FROM match_species_to_park_by_proximity(
            park_rec.id,
            park_rec.center_lat,
            park_rec.center_lng,
            park_rec.radius_km
        ) m
        ON CONFLICT (species_id, park_id) DO UPDATE
        SET curation_priority = EXCLUDED.curation_priority;

        GET DIAGNOSTICS matched_count = ROW_COUNT;

        park_name := park_rec.name;
        species_matched := matched_count;

        IF matched_count > 0 THEN
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get species for a specific park (uses existing get_park_species_curated)
-- This is just a simpler version for testing
CREATE OR REPLACE FUNCTION get_species_by_park_simple(park_uuid UUID, max_results INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    scientific_name TEXT,
    common_name TEXT,
    conservation_status TEXT,
    class TEXT,
    image_url TEXT,
    curation_priority INTEGER
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
        sp.curation_priority
    FROM species s
    JOIN species_parks sp ON s.id = sp.species_id
    WHERE sp.park_id = park_uuid
    ORDER BY
        sp.curation_priority DESC,
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
