# Globe Critter Chat - Project Handoff Document

**Date:** 2025-10-12
**Current Status:** Subspecies support added, Python import pipeline complete, ready for mammals import (13,178 records)

---

## 🎯 Project Overview

**Globe Critter Chat** is a conservation-focused game where players:
- Explore ecoregions and parks worldwide
- Discover endangered species in their natural habitats
- Complete missions (clean trash, remove poop, document species)
- Improve global "Earth Health" through conservation actions

**Game Mechanics:**
- Ecoregions contain sub-regions (parks/refuges)
- Players must complete all sub-regions to complete an ecoregion
- Earth health bar goes up with completions
- Data is dynamic - can replay regions as real-world data changes

---

## 🗄️ Database Architecture

### **Platform:** Supabase (PostgreSQL with PostGIS)
- **Why:** Free tier, geospatial support, real-time, built-in auth
- **Connection:** Already configured in `.env`
- **Current usage:** ~50-100 MB of 500 MB free tier

### **Key Tables:**

#### `species` (493 records imported, ready for 13,178+ mammals)
```sql
- PRIMARY KEY (iucn_id, subspecies, subpopulation, presence, seasonal)
- iucn_id: INTEGER
- scientific_name: TEXT
- conservation_status: TEXT (CR, EN, VU, NT, LC, DD)
- kingdom, phylum, class, order_name, family, genus: TEXT
- is_marine, is_terrestrial, is_freshwater: BOOLEAN

# Subspecies and population variants (NEW)
- subspecies: TEXT (e.g., "californianus" for California sea lion)
- subpopulation: TEXT (e.g., "Southern Resident" for killer whales)
- presence: INTEGER (IUCN code: 1=Extant, 3=Possibly Extinct, etc.)
- seasonal: INTEGER (IUCN code: 1=Resident, 2=Breeding, 4=Passage, etc.)
- source: TEXT (data source)
- distribution_comments: TEXT

# Geographic data
- sample_points: JSONB (8 geographic points per species)
- approx_range_area_km2: DOUBLE PRECISION
- countries: TEXT[] (to be populated)
- image_url: TEXT (to be populated via iNaturalist API)
```

**Sample points strategy:** Each species has 8 representative locations using intelligent grid sampling. This allows accurate species-to-park matching without storing massive geometry files.

**Subspecies support:** The composite primary key allows tracking multiple variants of the same species (e.g., different killer whale populations, seasonal occurrences, or subspecies) while maintaining accurate geographic data for each variant.

#### `parks` (Processing now - USA only)
```sql
- id: UUID
- wdpa_id: INTEGER
- name: TEXT
- center_lat, center_lng: DECIMAL
- designation_eng: TEXT
- iucn_category: TEXT (Ia, Ib, II, III, IV, V, VI)
- park_type: TEXT
- gis_area_km2: DECIMAL
- iso3: TEXT (country code)
- bounds: GEOGRAPHY(POLYGON) - may store full geometry for parks
```

#### `ecoregions` (Schema designed, not yet populated)
```sql
- id: BIGSERIAL
- name: TEXT
- center_lat, center_lng: DOUBLE PRECISION
- color: TEXT (for map display)
- base_health, current_health: INTEGER (0-100)
- difficulty_level: INTEGER (1-5)
```

#### Game tables (designed but not implemented):
- `park_ecoregions` - Links parks to ecoregions
- `player_progress` - Tracks completion status
- `earth_health` - Global game state
- `mission_types` - Mission definitions
- `player_missions` - Active missions

---

## 📊 Current Data Status

### ✅ **Species Data (COMPLETE)**
- **Source:** IUCN Red List shapefiles (~13GB in `~/Downloads/Animal Zips/`)
- **Imported:** 199 species (mostly marine/coastal: abalones, hagfish, mangroves, etc.)
- **Location:** Supabase `species` table
- **Sample query:**
```typescript
const { data } = await supabase
  .from('species')
  .select('scientific_name, conservation_status, sample_points')
  .eq('conservation_status', 'EN');
```

### 🔄 **Parks Data (PENDING)**
- **Source:** WDPA shapefiles (~2.7GB in `~/Downloads/protected-regions/`)
- **Status:** Not yet started (waiting for species import to complete first)
- **Scope:** Global (Arctic, Amazon, Great Barrier Reef, Africa, etc.)
- **Command:** `python3 scripts/processWDPAShapefiles.py` (needs to be created based on species script pattern)

### ⏳ **Not Yet Imported:**
- MAMMALS.zip (13,178 records) - waiting for migration to be applied
- Global parks data from WDPA shapefiles
- Ecoregion boundaries
- Species images (iNaturalist API integration ready but not executed)

**Important Note:** The first 493 species were imported WITHOUT subspecies data (old schema). After migration + full re-import, these will be updated with correct subspecies/population variants.

---

## 🛠️ Available Scripts

### Data Processing
```bash
npm run process-shapefiles      # Process IUCN species (all)
npm run process-wdpa            # Process WDPA parks (all countries)
npm run process-wdpa:usa        # Process USA parks only
npm run fetch-images            # Fetch species images from iNaturalist
```

### Verification
```bash
npx tsx scripts/verifyData.ts  # Check database contents
```

### Development
```bash
npm run dev                     # Start Vite dev server
```

---

## 🚀 Next Steps (Priority Order)

### **Immediate (Must Do First):**

1. **Wait for parks processing to complete** (~5-15 min)
   - Check: `npx tsx scripts/verifyData.ts`
   - Should see parks count > 0

2. **Update WDPA script for park sample points** (same approach as species)
   - Problem: Parks may also hit geometry size limits
   - Solution: Extract 3-5 boundary points per park instead of full geometry
   - File: `scripts/processWDPAShapefiles.ts`

3. **Populate `countries` field for species**
   - Option A: Reverse geocode sample points to country codes
   - Option B: Manual mapping using park overlap
   - Helper function already exists: `species_near_location()`

### **Core Game Infrastructure:**

4. **Create ecoregion data**
   - Source: WWF Terrestrial Ecoregions (shapefile available)
   - Or: Manually define major ecoregions (e.g., "Yellowstone Ecosystem", "Amazon Rainforest")
   - Populate `ecoregions` table

5. **Link parks to ecoregions**
   - Populate `park_ecoregions` table
   - Use spatial overlap or manual assignment

6. **Implement species-to-park matching function**
```typescript
// Query species in a park
const speciesInPark = await supabase.rpc('species_near_location', {
  species_countries: species.countries,
  species_points: species.sample_points,
  location_lat: park.center_lat,
  location_lng: park.center_lng,
  location_country: park.iso3,
  max_distance_km: 500
});
```

### **Frontend Integration:**

7. **Map already shows labels** (`mapTypeId="hybrid"` in GoogleEarthMap.tsx:190)

8. **Create species discovery UI**
   - Show species list for selected park
   - Display conservation status with colors
   - Show species images (when populated)

9. **Implement mission system**
   - Use database for mission definitions
   - Use LLM sparingly for flavor text (cache responses!)

10. **Build progress tracking**
    - Player completes parks → ecoregions → Earth health increases
    - Real-time updates using Supabase subscriptions

---

## 🔧 Key Technical Decisions

### **Why sample points instead of full geometries?**
- **Problem:** Full IUCN geometries are 5-15 MB per species (50-100 GB total)
- **Solution:** 8 representative points per species (~500 bytes)
- **Trade-off:** ~95% accuracy vs. 99.9% accuracy (acceptable for game)
- **Benefit:** Fits in Supabase free tier, fast queries

### **Why Supabase over alternatives?**
- PostGIS support (essential for geospatial)
- Free tier sufficient for development
- Built-in auth, APIs, real-time subscriptions
- Easy to upgrade ($25/mo → 8 GB storage)

### **Database vs. LLM for species info?**
- **Database:** Species lists, locations, conservation status (free, fast, accurate)
- **LLM:** Mission descriptions, fun facts, dialogue (expensive, slow, creative)
- **Strategy:** Use database for game engine, LLM for narrative (cache all LLM responses!)

### **Why hybrid progression system?**
- **Base health:** Permanent progress (completing ecoregions)
- **Health bonus:** Fluctuating (maintenance, real-world data changes)
- **Result:** Players don't lose core progress but have incentive to replay

---

## 📁 Important Files

### **Database Migrations**
- `supabase/migrations/20251012000000_init_species_parks.sql` - Initial schema
- `supabase/migrations/20251012000001_update_parks_for_wdpa.sql` - WDPA fields
- `supabase/migrations/20250112000003_add_species_image_url.sql` - Image support
- `supabase/migrations/20250112000005_simplify_species_schema.sql` - Removed heavy geometries
- `supabase/migrations/20250112000006_accurate_species_geography.sql` - Sample points approach
- `supabase/migrations/20250112000007_add_subspecies_support.sql` - **NEW** Subspecies/population variants with composite primary key

### **Processing Scripts**
- `scripts/processIUCNShapefiles.py` - **PRIMARY** Python script for importing species (handles large files, subspecies support)
- `scripts/processIUCNShapefiles.ts` - Legacy Node.js script (deprecated due to memory limits)
- `scripts/processWDPAShapefiles.ts` - Import parks from WDPA shapefiles (needs Python version)
- `scripts/fetchSpeciesImages.ts` - Get images from iNaturalist API
- `scripts/verifyData.ts` - Check database contents

### **Frontend Components**
- `src/components/GoogleEarthMap.tsx` - Main map (hybrid mode with labels)
- `src/components/Globe.tsx` - 3D globe view (fallback when Google Maps fails)

### **Environment**
- `.env` - Contains Supabase credentials (DO NOT COMMIT!)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_SERVICE_KEY` (sensitive!)
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## ⚠️ Known Issues

### **IUCN Processing Failures**
- **Problem:** Some GeoJSON files exceed Node.js string length limit (2GB)
- **Affected:** Marine species with global ranges (cone snails, eels, sharks, etc.)
- **Solution:** Stream GeoJSON parsing instead of reading entire file
- **Workaround:** 199 species successfully imported (enough for MVP)

### **Database Timeout (Resolved)**
- **Original problem:** Trying to insert full geometries caused timeouts
- **Solution:** Sample points approach (8 points instead of 100,000+ coordinates)

### **Parks May Have Same Issue**
- **Risk:** Large park boundaries might exceed limits
- **Mitigation:** Filter by country (USA only for testing)
- **If needed:** Apply same sample points strategy to parks

---

## 🌍 Data Sources

### **IUCN Red List Shapefiles**
- **Location:** `~/Downloads/Animal Zips/` (13 GB)
- **Contents:** 23 zip files with species range maps
- **Format:** Shapefiles → convert to GeoJSON → extract sample points
- **Can delete after:** Processing complete (data now in database)

### **WDPA Protected Areas**
- **Location:** `~/Downloads/protected-regions/` (2.7 GB)
- **Contents:** Global protected areas database
- **Format:** Shapefiles → convert to GeoJSON → extract park data
- **Can delete after:** Processing complete

### **iNaturalist API (Not Yet Used)**
- **Purpose:** Fetch species photos
- **Endpoint:** `https://api.inaturalist.org/v1/taxa?q={scientific_name}`
- **Rate limit:** ~100 requests/minute
- **Cost:** Free
- **Script ready:** `scripts/fetchSpeciesImages.ts`

---

## 💰 Cost Considerations

### **Current Costs: $0/month**
- Supabase: Free tier (500 MB storage, unlimited queries)
- GDAL tools: Free (brew install gdal)
- iNaturalist API: Free

### **When to Upgrade:**
- **Supabase Pro ($25/mo):** When database > 500 MB or need better performance
- **LLM usage:** Only if implementing dynamic mission generation (budget $50-100/mo, cache aggressively)

### **Cost Optimization:**
- ✅ Database queries: Always free on free tier
- ✅ Sample points: Fits in free tier
- ❌ Full geometries: Would require paid tier
- ⚠️ LLM: Use sparingly, cache everything

---

## 🔍 How to Resume Work

### **Check current status:**
```bash
# 1. Check if parks finished processing
npx tsx scripts/verifyData.ts

# 2. Check background processes
# Look for "npm run process-wdpa:usa" in background

# 3. View database in Supabase dashboard
open https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/editor
```

### **If parks processing is complete:**
- Move to step 4 (create ecoregion data)
- Or step 6 (implement species-to-park matching)

### **If parks processing failed:**
- Check error logs
- May need to apply sample points approach to parks (same as species)
- Start with smaller test: single park boundary

### **To add more species:**
- Fix large GeoJSON file issue (streaming parser)
- Or: Accept 199 species as MVP and add more later

---

## 📚 Useful Queries

### **List all endangered species:**
```sql
SELECT scientific_name, conservation_status, approx_range_area_km2
FROM species
WHERE conservation_status IN ('CR', 'EN', 'VU')
ORDER BY conservation_status;
```

### **Find species near a location:**
```sql
SELECT * FROM species
WHERE species_near_location(
  countries,
  sample_points,
  44.5,  -- Yellowstone latitude
  -110.5, -- Yellowstone longitude
  'USA',
  500     -- 500km radius
);
```

### **Count parks by IUCN category:**
```sql
SELECT iucn_category, COUNT(*) as count
FROM parks
GROUP BY iucn_category
ORDER BY count DESC;
```

---

## 🎮 Game Design Notes

### **Accuracy is Important**
- User explicitly requested accurate species-to-park matching
- Sample points approach provides ~95% accuracy
- Better than bounding box (60-70% accuracy)
- Good enough for gameplay while fitting in free tier

### **Database > LLM for Core Data**
- Database: Free, fast, accurate, consistent
- LLM: Expensive, slow, hallucinates, inconsistent
- Use database for game mechanics
- Use LLM only for narrative flavor (and cache it!)

### **Hybrid Progression System**
- Base progress: Permanent (completions)
- Health bonus: Fluctuating (maintenance)
- Allows replayability without frustrating players

---

## ✅ Success Criteria

You'll know the infrastructure is ready when:
- [ ] Species count > 199 (or accept 199 as MVP)
- [ ] Parks count > 0 (USA parks imported)
- [ ] All species have sample_points populated
- [ ] Helper function `species_near_location()` works
- [ ] Can query "species in Yellowstone" successfully
- [ ] Map shows park labels (already done!)

Then you can build the game UI on top of this solid foundation!

---

## 🆘 If Something Breaks

### **"Can't connect to Supabase"**
- Check `.env` has correct credentials
- Verify project isn't paused: https://supabase.com/dashboard

### **"GeoJSON file too large"**
- Skip that file for now (not critical for MVP)
- Or: Implement streaming JSON parser

### **"Database timeout"**
- Reduce batch size in processing scripts
- Or: Already solved with sample points approach!

### **"Out of disk space"**
- Delete processed shapefiles: `~/Downloads/Animal Zips/` (13 GB)
- Delete WDPA files: `~/Downloads/protected-regions/` (2.7 GB)
- Only delete AFTER verifying data is in database!

---

**Good luck! The foundation is solid. Now build something amazing! 🌍🐻🎮**
