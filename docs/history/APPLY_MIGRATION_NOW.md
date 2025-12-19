# Apply Database Migration - Simple Instructions

## Your app is running at: http://localhost:8081

The UX fixes are complete! Now you just need to apply the database migration.

## Option 1: Supabase Studio (Easiest - Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr
   - Or go to https://supabase.com/dashboard and select your project

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the migration:**
   - Open file: `supabase/migrations/20251014000001_balanced_species_and_media.sql`
   - Copy the ENTIRE contents
   - Paste into the SQL Editor

4. **Run the query:**
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success" message

Done! The migration is applied.

## Option 2: Command Line (If you have psql)

```bash
# Get your database password from Supabase Dashboard > Project Settings > Database
# Then run:
psql "postgresql://postgres:[YOUR_PASSWORD]@db.iwmbvpdqwekgxegaxrhr.supabase.co:5432/postgres" -f supabase/migrations/20251014000001_balanced_species_and_media.sql
```

## What the migration does:

1. ✅ Creates `get_balanced_ecoregion_species()` function
   - Returns species balanced across taxonomic groups (mammals, birds, reptiles, etc.)
   - Gracefully handles missing groups (e.g., Arctic with no reptiles)

2. ✅ Creates `get_balanced_spatial_species()` function
   - Same balancing for geographic regions without ecoregion data

3. ✅ Adds image fields to `ecoregions` table:
   - image_url, image_attribution, image_license, image_source

4. ✅ Adds image fields to `parks` table:
   - image_url, image_attribution, image_license, image_source

## After applying migration:

### Test the new UX flow:

1. **Open app:** http://localhost:8081

2. **Click on an ecoregion (green pin with 🟢)**
   - Should show EcoRegionCard on the right
   - If enriched, will show ecoregion image

3. **Click on a park (wildlife marker or green dot)**
   - Should REPLACE the right card with WildlifeLocationCard
   - Shows park information
   - If enriched, will show park image

4. **Click on a species from left carousel**
   - Should REPLACE the right card with species card
   - Shows species information
   - If enriched, will show species image

5. **Chat about the current selection:**
   - Whatever is shown on the right card is what you'll discuss with the LLM

### Then run enrichment (optional but recommended):

```bash
# Enrich species images and common names
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50

# Enrich park images
python3 scripts/enrichMediaFromWikimedia.py --type parks --limit 25

# Enrich ecoregion images
python3 scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 25
```

## Verify migration worked:

Run this in Supabase SQL Editor:

```sql
-- Check if function exists
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'get_balanced_ecoregion_species';

-- Should return 1 row showing the function exists

-- Test the function (replace UUID with actual ecoregion ID)
SELECT taxonomic_group, COUNT(*)
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (SELECT id FROM ecoregions LIMIT 1),
  p_species_per_class := 3
)
GROUP BY taxonomic_group;
```

## Current Status:

✅ **UX Flow Fixed:**
- Park clicks → Replace right card with park info
- Species clicks → Replace right card with species info
- Ecoregion clicks → Show ecoregion card
- All cards use images when available

✅ **Image Support Added:**
- Species cards show `imageUrl` field
- Park cards show `image_url` field
- Ecoregion cards show `image_url` field

✅ **Balanced Species:**
- Equal representation across taxonomic groups
- Graceful handling of missing groups

⏳ **Migration Pending:**
- Apply migration in Supabase Studio (5 minutes)

⏳ **Image Enrichment Pending:**
- Run enrichment script to populate images (optional, 10-20 minutes)

## Everything else is done! Just apply the migration and you're ready to go! 🎉
