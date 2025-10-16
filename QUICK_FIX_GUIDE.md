# 🚀 Quick Fix Guide - Get Species & Parks Working

## The Problem (Simple Version)

1. **Species carousel is empty** → Missing database function
2. **No parks showing** → Parks table is empty

## The Solution (2 Steps)

### STEP 1: Fix Species Carousel (Run SQL in Supabase)

1. Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql

2. Click "**New Query**"

3. Copy this ENTIRE SQL block and paste it:

```sql
-- Function to get balanced species mix by ecoregion
CREATE OR REPLACE FUNCTION get_curated_species_by_ecoregion_balanced(
  ecoregion_uuid UUID,
  max_per_class INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  scientific_name TEXT,
  common_name TEXT,
  class TEXT,
  conservation_status TEXT,
  taxonomic_group TEXT,
  image_url TEXT,
  is_marine BOOLEAN,
  is_terrestrial BOOLEAN,
  is_freshwater BOOLEAN,
  overlap_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_species AS (
    SELECT
      s.id,
      s.scientific_name,
      s.common_name,
      s.class,
      s.conservation_status,
      COALESCE(s.ui_group, 'Animals') as taxonomic_group,
      s.image_url,
      s.is_marine,
      s.is_terrestrial,
      s.is_freshwater,
      COALESCE(se.overlap_percentage, 100.0) as overlap_percentage,
      ROW_NUMBER() OVER (
        PARTITION BY s.class
        ORDER BY
          s.is_curated DESC,
          s.image_url IS NOT NULL DESC,
          s.common_name IS NOT NULL DESC,
          RANDOM()
      ) as rank_in_class
    FROM species s
    JOIN species_ecoregions se ON s.id = se.species_id
    WHERE se.ecoregion_id = ecoregion_uuid
  )
  SELECT
    ranked_species.id,
    ranked_species.scientific_name,
    ranked_species.common_name,
    ranked_species.class,
    ranked_species.conservation_status,
    ranked_species.taxonomic_group,
    ranked_species.image_url,
    ranked_species.is_marine,
    ranked_species.is_terrestrial,
    ranked_species.is_freshwater,
    ranked_species.overlap_percentage
  FROM ranked_species
  WHERE rank_in_class <= max_per_class
  ORDER BY rank_in_class, class;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_curated_species_by_ecoregion_balanced TO anon, authenticated, service_role;

SELECT '✅ Species function created!' as status;
```

4. Click "**Run**"

5. You should see: `✅ Species function created!`

**Result:** Species carousel will now work! Refresh your browser.

---

### STEP 2: Add Sample Parks (Run Python Script)

I'll create a simple script that adds 3 well-known parks for each of your 6 ecoregions.

Run this command:

```bash
python3 add_sample_parks.py
```

This will add parks like:
- **Amazon**: Yasuní National Park, Manu National Park, Jaú National Park
- **Arctic**: Northeast Greenland National Park, Quttinirpaaq National Park
- **Borneo**: Kinabalu Park, Gunung Mulu National Park
- **Congo**: Salonga National Park, Virunga National Park
- **Coral Triangle**: Tubbataha Reefs Natural Park, Raja Ampat
- **Madagascar**: Masoala National Park, Ranomafana National Park

**Result:** Parks will show in the 2D map view when you click an ecoregion!

---

## Test After Fixing

1. Refresh browser at http://localhost:8080/
2. Click on "Amazon and Guianas" ecoregion
3. You should see:
   - ✅ **Left side**: Species carousel with images scrolling
   - ✅ **Map**: 3 park markers appear
   - ✅ **2D view**: Can click on parks to see details

---

## What Each Fix Does

### Fix #1: Database Function
- Your app calls `get_curated_species_by_ecoregion_balanced()` to load species
- This function didn't exist → empty carousel
- Now it will return up to 10 species per taxonomic class (mammals, birds, etc.)
- Prioritizes curated species with images

### Fix #2: Sample Parks
- Parks table was completely empty (0 parks)
- Adding 3 hand-picked major parks per ecoregion (18 total)
- These will show up as clickable markers on the map
- LocationsCarousel will display them in a scrollable list

---

**Ready? Run Step 1 in Supabase SQL Editor now!**

(I'm creating the Step 2 script next...)
