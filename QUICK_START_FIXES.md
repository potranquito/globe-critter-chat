# Quick Start & Fixes Summary

## 🚀 Localhost Issue - RESOLVED

**Problem:** `localhost` refused to connect

**Solution:** The dev server is running on **port 8081**, not the default port.

**Access your app at:** http://localhost:8081

To verify the server is running:
```bash
ps aux | grep vite
# or
lsof -i -P -n | grep LISTEN | grep vite
```

## ✅ Implementation Complete

### 1. Balanced Species Distribution (with graceful handling)

**What it does:**
- Automatically distributes species across taxonomic groups: Mammals, Birds, Reptiles, Amphibians, Fish, Plants, Insects
- **Handles missing groups gracefully** - if an ecoregion has no reptiles, it just returns what's available
- No errors if some taxonomic groups are missing

**Database functions:**
- `get_balanced_ecoregion_species()` - For ecoregions with linked species
- `get_balanced_spatial_species()` - For geographic regions without ecoregion data

**Example:**
- Arctic might return: 3 mammals, 3 birds, 2 fish (no reptiles - that's OK!)
- Rainforest might return: 3 mammals, 3 birds, 3 reptiles, 3 amphibians, 3 plants, 3 insects

### 2. Image Sources & API Keys

**All APIs are PUBLIC - NO API KEYS REQUIRED! ✅**

**Image sources (in priority order):**
1. **Wikimedia Commons** - https://commons.wikimedia.org/w/api.php (FREE, no key)
2. **Wikipedia** - https://en.wikipedia.org/w/api.php (FREE, no key)
3. **Wikidata** - https://www.wikidata.org/w/api.php (FREE, no key)
4. **iNaturalist** - https://api.inaturalist.org/v1 (FREE, no key)

**Rate limits:**
- Wikimedia: Very generous (no strict limits for reasonable use)
- iNaturalist: ~100 requests/minute (handled by script rate limiting)

**No costs, no keys needed!** Just run the enrichment script and it works.

### 3. Parks & Ecoregions Images

**Updated components:**
- ✅ `EcoRegionCard` - Already supported images, now receives them from database
- ✅ `WildlifeLocationCard` - Already supported images, now receives them from database
- ✅ `Index.tsx` - Now fetches and passes `image_url` to both cards
- ✅ All park queries include `image_url, image_attribution` fields
- ✅ Ecoregion query includes `image_url, image_attribution, image_source` fields

**Where images appear:**
1. **Far-right card** - When you click an ecoregion, the EcoRegionCard shows its image
2. **Fast facts card** - When you click a park, the WildlifeLocationCard shows its image
3. **Species cards** - Already have imageUrl support

## 📦 Files Modified

### Database
- `supabase/migrations/20251014000001_balanced_species_and_media.sql` - Updated with graceful handling

### Backend
- `supabase/functions/wikimedia-image-fetch/index.ts` - Added API documentation
- `supabase/functions/discover-region-species/index.ts` - Uses balanced selection

### Frontend
- `src/pages/Index.tsx` - Fetches and passes image_url for parks and ecoregions
- `src/services/regionService.ts` - Added imageUrl and imageAttribution to RegionInfo
- `src/types/habitat.ts` - Added new fields to Species interface
- `src/components/RegionSpeciesCarousel.tsx` - Added imageUrl and taxonomicGroup support

### Scripts
- `scripts/enrichMediaFromWikimedia.py` - Batch enrichment (no API keys needed!)

### Documentation
- `WIKIMEDIA_ENRICHMENT_GUIDE.md` - Complete usage guide
- `SPECIES_DIVERSITY_AND_MEDIA_IMPLEMENTATION.md` - Technical details
- `TESTING_GUIDE.md` - Comprehensive testing
- `QUICK_START_FIXES.md` - This file

## 🎯 Next Steps

### 1. Apply Database Migration

```bash
cd /home/potranquito/repos/globe-critter-chat

# Method 1: Using Supabase CLI (recommended)
supabase db push

# Method 2: Manual application
# psql "your-database-url" -f supabase/migrations/20251014000001_balanced_species_and_media.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy the image fetch function
supabase functions deploy wikimedia-image-fetch

# Deploy the updated discover function
supabase functions deploy discover-region-species
```

### 3. Run Enrichment Script

```bash
# Activate your Python virtual environment if you have one
# source venv/bin/activate

# Install dependencies (if not already installed)
pip install requests supabase python-dotenv

# Enrich species (start small)
python scripts/enrichMediaFromWikimedia.py --type species --limit 50

# Enrich parks
python scripts/enrichMediaFromWikimedia.py --type parks --limit 25

# Enrich ecoregions
python scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 25

# If everything looks good, run larger batches
python scripts/enrichMediaFromWikimedia.py --type all --limit 200
```

### 4. Test in Browser

1. Open http://localhost:8081
2. Click on an ecoregion (green pins marked with 🟢)
3. Check the far-right card - should show ecoregion image if available
4. Click on a park from the carousel
5. Check the park card - should show park image if available
6. Check species cards - should show species images and common names

### 5. Verify Data

```sql
-- Check ecoregion images
SELECT name, image_url IS NOT NULL as has_image
FROM ecoregions
ORDER BY name
LIMIT 10;

-- Check park images
SELECT name, image_url IS NOT NULL as has_image
FROM parks
ORDER BY name
LIMIT 10;

-- Check species with balanced selection
SELECT
  taxonomic_group,
  COUNT(*) as count
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (SELECT id FROM ecoregions WHERE name ILIKE '%borneo%' LIMIT 1),
  p_species_per_class := 3
)
GROUP BY taxonomic_group;
```

## 🐛 Troubleshooting

### Issue: Migration fails

**Solution:**
```bash
# Check if migration already applied
supabase db diff

# If there are conflicts, you can manually apply specific parts
psql "your-db-url" -c "SELECT * FROM get_balanced_ecoregion_species LIMIT 1;"
```

### Issue: No images appearing

**Possible causes:**
1. Migration not applied yet
2. Enrichment script not run yet
3. API rate limiting (wait a few minutes)

**Solution:**
```bash
# Check if images exist in database
psql "your-db-url" -c "SELECT COUNT(*) FROM species WHERE image_url IS NOT NULL;"

# If count is 0, run enrichment
python scripts/enrichMediaFromWikimedia.py --type species --limit 10
```

### Issue: Unbalanced species (e.g., all mammals)

**This is normal if:**
- Ecoregion naturally lacks certain groups (Arctic has few reptiles)
- Species haven't been linked to ecoregion yet

**Solution:**
- Run species linking script if you have one
- Check what species exist in that ecoregion:
```sql
SELECT
  CASE
    WHEN s.class = 'MAMMALIA' THEN 'Mammals'
    WHEN s.class = 'AVES' THEN 'Birds'
    WHEN s.class = 'REPTILIA' THEN 'Reptiles'
    WHEN s.class = 'AMPHIBIA' THEN 'Amphibians'
    WHEN s.kingdom = 'PLANTAE' THEN 'Plants'
    ELSE 'Other'
  END as group,
  COUNT(*)
FROM species_ecoregions se
JOIN species s ON s.id = se.species_id
WHERE se.ecoregion_id = 'YOUR_ECOREGION_ID'
GROUP BY group;
```

### Issue: Python script fails

**Common errors:**
- `ModuleNotFoundError: No module named 'requests'` → Run: `pip install requests`
- `ModuleNotFoundError: No module named 'supabase'` → Run: `pip install supabase`
- `Error: Missing SUPABASE_URL` → Check your `.env` file

**Solution:**
```bash
# Check .env file exists and has correct values
cat .env | grep SUPABASE

# Install all dependencies
pip install requests supabase python-dotenv
```

## 📊 Expected Results

### Before
- Ecoregion cards: Emoji placeholders
- Park cards: Generic wildlife icon
- Species: Unbalanced (15 mammals, 2 birds, 1 plant)

### After
- Ecoregion cards: Beautiful landscape photos from Wikimedia
- Park cards: Actual park photos
- Species: Balanced diversity (3 mammals, 3 birds, 3 reptiles, 3 amphibians, 3 plants, 3 fish)
- All with proper attribution

## 💡 Key Features

1. **No API keys needed** - All sources are public APIs
2. **Graceful degradation** - Missing taxonomic groups? No problem!
3. **Proper attribution** - All images include source and license info
4. **Zero storage cost** - Uses external CDN URLs, not Supabase storage
5. **Rate limiting** - Built into enrichment script
6. **Fallback sources** - If Wikimedia fails, tries Wikipedia, then iNaturalist

## 🎨 UI Updates

The UI now supports:
- ✅ Ecoregion images in the far-right card
- ✅ Park images in the fast facts card
- ✅ Species images in all species displays
- ✅ Taxonomic group labels (coming soon - add to UI)
- ✅ Diversity breakdown (coming soon - add to UI)

## 📝 Status

- ✅ Database functions created (with graceful handling)
- ✅ Edge functions updated
- ✅ UI components updated
- ✅ Enrichment script ready
- ✅ No API keys required
- ✅ Image support for species, parks, and ecoregions
- ⏳ Migration needs to be applied
- ⏳ Enrichment needs to be run

## 🚀 Ready to Deploy!

Everything is ready. Just follow the "Next Steps" above to:
1. Apply the migration
2. Deploy the functions
3. Run the enrichment
4. Test in browser at http://localhost:8081

No API keys, no complex setup - just run it!
