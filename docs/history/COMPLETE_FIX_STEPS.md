# 🚀 Complete Fix Guide - 3 Easy Steps

## What's Broken:
1. ❌ Species carousel empty
2. ❌ No parks showing on map
3. ⚠️  All animals labeled "Omnivore" (should be Predator, Herbivore, etc.)

## How to Fix (3 Steps):

---

### STEP 1: Fix Database Function (Run SQL) ⏱️ 1 minute

1. Go to: **https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql**

2. Click "**New Query**"

3. Copy **ALL** of `fix_database_function.sql` and paste it

4. Click "**Run**"

5. You should see:
   ```
   ✅ Function dropped and recreated successfully!
   species_returned: (some number)
   ```

**What this does:** Creates the database function needed to load species for each ecoregion.

---

### STEP 2: Add Sample Parks ⏱️ 30 seconds

Run this in your terminal:

```bash
source venv/bin/activate
export VITE_SUPABASE_URL="https://iwmbvpdqwekgxegaxrhr.supabase.co"
export VITE_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"
python3 add_sample_parks.py
```

You should see:
```
✅ Added 18 parks successfully!
Amazon and Guianas: 3 parks
Arctic Terrestrial: 3 parks
Borneo: 3 parks
Congo Basin: 3 parks
Coral Triangle: 3 parks
Madagascar: 3 parks
```

**What this does:** Adds 3 major protected areas for each of your 6 ecoregions.

---

### STEP 3: Fix Species Data (Optional but Recommended) ⏱️ 1 minute

Run this in your terminal:

```bash
python3 fix_species_data.py
```

You should see:
```
✅ Fixed 846 species trophic roles!
📊 Trophic role distribution:
  Predator: 550 species
  Herbivore: 180 species
  Omnivore: 100 species
  ...
```

**What this does:** Fixes all species to have correct trophic roles (Predator, Herbivore, etc.) instead of generic "Omnivore".

---

## Test Your Fixes

1. **Refresh browser**: http://localhost:8080/

2. **Click "Amazon and Guianas"** on the globe

3. **You should now see:**
   - ✅ **Left side**: Species carousel with scrolling animal images
   - ✅ **Map**: 3 park markers (Yasuní, Manu, Jaú)
   - ✅ **Species cards**: Show correct roles (e.g., "Predator" for jaguars, "Herbivore" for tapirs)

4. **Click on a park marker** → Park details card appears on right

---

## What Each Step Fixed

### Step 1: Database Function
- **Before**: App calls `get_curated_species_by_ecoregion_balanced()` → function doesn't exist → empty carousel
- **After**: Function returns up to 10 species per taxonomic class (mammals, birds, reptiles, etc.)

### Step 2: Parks
- **Before**: Parks table empty (0 parks) → no markers on map
- **After**: 18 major parks (3 per ecoregion) → clickable markers appear

### Step 3: Species Data
- **Before**: All species labeled "Omnivore" (incorrect)
- **After**: Accurate roles based on biology:
  - Amphibians → Predator (eat insects)
  - Big cats → Predator
  - Elephants → Herbivore
  - Sharks → Predator (except whale sharks → Filter-feeder)
  - Corals → Filter-feeder
  - Plants → Producer

---

## Files Created

- `fix_database_function.sql` - SQL to drop and recreate the function
- `add_sample_parks.py` - Adds 18 major parks
- `fix_species_data.py` - Corrects trophic roles for all 846 species
- `COMPLETE_FIX_STEPS.md` - This guide

---

## Quick Commands (Copy/Paste)

All 3 steps in one command block:

```bash
# Step 2 & 3 (Step 1 must be done in Supabase SQL Editor)
source venv/bin/activate && \
export VITE_SUPABASE_URL="https://iwmbvpdqwekgxegaxrhr.supabase.co" && \
export VITE_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM" && \
python3 add_sample_parks.py && \
python3 fix_species_data.py
```

---

**Ready? Do Step 1 in Supabase SQL Editor now!** 🚀

Then come back and run the command above for Steps 2 & 3.
