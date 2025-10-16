# 🔧 Fix Species Carousel and Parks

## Problems Identified:

1. ❌ **Species carousel not showing** - Missing database function `get_curated_species_by_ecoregion_balanced`
2. ❌ **No parks/protected areas** - Parks table is empty (0 parks in database)
3. ⚠️  **Database schema missing some functions** - RPC functions not created

---

## Solution 1: Create Missing Database Function

### Step 1: Run SQL in Supabase

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql

2. Click "New Query"

3. Copy and paste the **entire contents** of `create_species_functions.sql`

4. Click "Run"

5. You should see: `✅ Species functions created successfully!`

This will create the function needed to load species for each ecoregion.

---

## Solution 2: Restore Parks Data

You mentioned you had a tool to fetch nearby national parks. The parks table is currently empty.

### Option A: Do you have a parks backup CSV?

If you have a backup file with parks data, we can import it.

Common filenames:
- `parks.csv`
- `protected_areas.csv`
- `wdpa_data.csv`
- Any CSV with park/protected area data

**Let me know if you have this file!**

### Option B: Import from Protected Planet API

You have a Protected Planet API key in your .env file:
```
VITE_PROTECTED_PLANET_KEY="3e2f33113ce47a14ce0bf3be25e4cf45"
```

I can create a script to fetch parks for each of your 6 ecoregions:
- Amazon and Guianas
- Arctic Terrestrial
- Borneo
- Congo Basin
- Coral Triangle
- Madagascar

This would fetch ~10-20 major protected areas per ecoregion.

**Would you like me to create this import script?**

---

## Quick Test After Fixing

After you run the SQL function in Supabase:

1. Refresh your browser at http://localhost:8080/
2. Click on an ecoregion (e.g., "Amazon and Guianas")
3. You should now see:
   - ✅ Species carousel on the left with images
   - ✅ Species organized by taxonomy (Mammals, Birds, etc.)
   - ⚠️  Parks will still be empty until we import parks data

---

## What the Database Function Does

The `get_curated_species_by_ecoregion_balanced` function:

1. Finds all species linked to an ecoregion
2. Groups them by taxonomic class (MAMMALIA, AVES, REPTILIA, etc.)
3. Returns up to 10 species per class for diversity
4. Prioritizes:
   - Curated species (hand-picked with good images)
   - Species with images
   - Species with common names
   - Random selection for variety

This ensures you get a nice mix of mammals, birds, reptiles, amphibians, etc. instead of just one type.

---

## Current Database Status

✅ **Ecoregions**: 6 ecoregions with correct WWF names
✅ **Species**: 846 species (234 curated + 612 IUCN)
✅ **Species-Ecoregion Links**: 846 links (all species properly linked)
❌ **Parks**: 0 parks (table is empty)
❌ **Database Functions**: Missing (need to run SQL)

---

## Next Steps

**Right now:**
1. Run `create_species_functions.sql` in Supabase SQL Editor (see Step 1 above)

**After that:**
2. Let me know if you have a parks backup CSV, or
3. Let me know if you want me to create a Protected Planet import script

---

## Files Created for You

- `create_species_functions.sql` - SQL to create missing database function
- `check_parks_status.py` - Script that confirmed parks table is empty
- `FIX_SPECIES_CAROUSEL_AND_PARKS.md` - This guide

---

## Why Species Aren't Showing

Your app calls this database function:
```javascript
await supabase.rpc('get_curated_species_by_ecoregion_balanced', {
  ecoregion_uuid: ecoregionData.id,
  max_per_class: 10
})
```

But the function doesn't exist in the database! So it returns an error and no species show up.

Once you run the SQL, the carousel will work immediately.

---

**Ready to fix? Run the SQL in Supabase now!** 🚀
