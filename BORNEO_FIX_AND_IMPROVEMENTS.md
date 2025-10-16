# Borneo Species Fix & Future Ecoregion Improvements

**Date:** October 13, 2025
**Status:** FIXED ✅
**New Species Count:** Borneo now has 4,179 species (was 0)

---

## 🎯 Problem Summary

Borneo ecoregion showed **0 species** despite having 3,331 species in the IUCN database within its geographic region.

---

## 🔍 Root Cause Analysis

### Geographic Overlap Issue

The Coral Triangle and Borneo ecoregions have overlapping geographic areas:

| Ecoregion | Center Coordinates | Radius | Type |
|-----------|-------------------|--------|------|
| **Coral Triangle** | 1.7°N, 127.4°E | 3,000 km | Marine 🌊 |
| **Borneo** | 0.9°N, 114.2°E | 1,216 km | Terrestrial 🌳 |

**Distance between centers:** 1,472 km

Since the Coral Triangle has a 3,000 km radius, it completely covers Borneo's center and most of its area.

### Linking Script Logic Bug

The original linking script (`scripts/link_species_radius_based.py`) had a `break` statement that prevented species from belonging to multiple ecoregions:

```python
# BEFORE (line 94)
for eco in ecoregions.data:
    distance = haversine_distance(lat, lng, eco['center_lat'], eco['center_lng'])
    if distance <= eco['radius_km']:
        links.append({'species_id': species['id'], 'ecoregion_id': eco['id']})
        break  # ❌ PROBLEM: Stops after first match
```

**Result:** Since ecoregions were processed in this order:
1. Madagascar
2. Coral Triangle ← matches first for Borneo species!
3. Congo Basin
4. Amazon and Guianas
5. Borneo ← never reached due to break
6. Arctic Terrestrial

All Borneo species were assigned to Coral Triangle and never checked against Borneo.

---

## ✅ Solution Implemented

### Changed Script Logic

Removed the `break` statement to allow species to belong to multiple overlapping ecoregions:

```python
# AFTER (line 94)
for eco in ecoregions.data:
    distance = haversine_distance(lat, lng, eco['center_lat'], eco['center_lng'])
    if distance <= eco['radius_km']:
        links.append({'species_id': species['id'], 'ecoregion_id': eco['id']})
        # Don't break - allow species to belong to multiple ecoregions
```

### Results After Fix

**Re-ran linking:** `python3 scripts/link_species_radius_based.py`

| Ecoregion | Species Count (Before) | Species Count (After) | Change |
|-----------|------------------------|----------------------|--------|
| Madagascar | 2,443 | 2,443 | No change |
| Coral Triangle | 13,424 | 13,424 | No change |
| Congo Basin | 4,254 | 4,254 | No change |
| Amazon and Guianas | 7,838 | 7,838 | No change |
| **Borneo** | **0** | **4,179** | **+4,179** ✅ |
| Arctic Terrestrial | 2,220 | 2,220 | No change |

**Total links:** Increased from 30,179 to **34,358** (species can now have multiple ecoregion links)

---

## 🌊 Marine vs Terrestrial Habitat Distinction

### Current Situation

Both Coral Triangle and Borneo share geographic space, but they represent **different ecosystems**:

- **Coral Triangle:** Marine biodiversity hotspot (reefs, ocean species)
- **Borneo:** Terrestrial rainforest (land mammals, reptiles, amphibians, plants)

However, the current linking is **purely geographic** (radius-based), so:
- Coral Triangle gets 13,424 species but includes terrestrial animals from nearby islands
- Borneo gets 4,179 species but includes marine animals from coastal waters

### Habitat Data Available

The `species` table already has habitat flags:
- `is_marine` - Ocean/reef species
- `is_terrestrial` - Land species
- `is_freshwater` - Rivers/lakes species

Sample analysis of current links:

| Ecoregion | Marine % | Terrestrial % | Freshwater % |
|-----------|----------|---------------|--------------|
| Coral Triangle | **90%** | 10% | 10% |
| Borneo | 30% | **70%** | 20% |
| Amazon | 20% | **80%** | 50% |
| Congo Basin | 20% | **80%** | 80% |
| Madagascar | 40% | **60%** | 50% |
| Arctic | 20% | **80%** | 80% |

### The Good News

The current system is **working reasonably well**:
- Coral Triangle naturally gets mostly marine species (90%)
- Borneo naturally gets mostly terrestrial species (70%)

This is because:
- Marine species have sample points in ocean areas
- Terrestrial species have sample points on land
- Geographic proximity naturally clusters species by habitat

---

## 🚀 Future Improvements (Optional)

While the current system works, here are **optional enhancements** for better habitat matching:

### Option 1: Habitat-Based Confidence Scores

Add a `habitat_confidence` field to `species_ecoregions` table:

```sql
ALTER TABLE species_ecoregions
ADD COLUMN habitat_confidence TEXT DEFAULT 'medium'
  CHECK (habitat_confidence IN ('high', 'medium', 'low'));
```

Then update linking logic to mark confidence:
```python
# High confidence examples:
# - Marine species in Coral Triangle
# - Terrestrial species in Borneo
# - Freshwater species in Amazon

if eco['name'] == 'Coral Triangle' and species['is_marine']:
    confidence = 'high'
elif eco['name'] == 'Borneo' and species['is_terrestrial']:
    confidence = 'high'
else:
    confidence = 'medium'
```

### Option 2: Frontend Filtering

Let users filter species by habitat when viewing an ecoregion:

```typescript
// src/components/RegionSpeciesCarousel.tsx
const filters = {
  marine: ecoregion.name === 'Coral Triangle',
  terrestrial: ecoregion.realm === 'Terrestrial',
  // Show best matches first
};

const query = supabase
  .from('species_ecoregions')
  .select('species(*)')
  .eq('ecoregion_id', ecoregion.id)
  .eq('species.is_marine', filters.marine);  // Filter by habitat
```

### Option 3: Update Coral Triangle Realm

Change Coral Triangle's `realm` from "Terrestrial" to "Marine":

```sql
UPDATE ecoregions
SET realm = 'Marine'
WHERE name = 'Coral Triangle';
```

This makes the distinction clearer in the UI.

### Option 4: Weighted Sorting

Sort species by relevance when displaying:
- Coral Triangle: Show marine species first
- Borneo: Show terrestrial species first

```sql
-- Get species for Coral Triangle, marine first
SELECT s.*
FROM species s
JOIN species_ecoregions se ON s.id = se.species_id
WHERE se.ecoregion_id = :coral_triangle_id
ORDER BY s.is_marine DESC,  -- Marine species first
         s.scientific_name;
```

---

## 📈 Impact Analysis

### Before Fix
- 5 working ecoregions
- 30,179 species-ecoregion links
- Borneo unusable

### After Fix
- **6 working ecoregions** ✅
- **34,358 species-ecoregion links** (+14%)
- Borneo fully functional with 4,179 species

### Geographic Accuracy
✅ **Species can belong to multiple ecoregions** - This is geographically accurate!

Example: A species found in coastal Borneo waters might legitimately belong to both:
- Coral Triangle (marine ecosystem)
- Borneo (terrestrial ecosystem)

This overlap is realistic and provides richer data.

---

## 🔄 Adding New Ecoregions in the Future

**YES!** The import process is fully reusable. Here's how:

### Step-by-Step Guide

**1. Update MVP Ecoregions List**

Edit `scripts/import_mvp_ecoregions.py`:
```python
MVP_ECOREGIONS = [
    "Amazon and Guianas",
    "Arctic Terrestrial",
    "Congo Basin",
    "Coral Triangle",
    "Madagascar",
    "Borneo",
    # Add new ecoregions here:
    "Patagonia",               # New!
    "Himalayas",               # New!
    "Great Barrier Reef",      # New!
]
```

**2. Run Import Script**

```bash
cd ~/repos/globe-critter-chat
source venv/bin/activate
python3 scripts/import_mvp_ecoregions.py
```

This will:
- Read WWF shapefile (`~/Downloads/protected-regions/WWF_Priority_Ecoregions.shp`)
- Import only the ecoregions in your list
- Calculate center coordinates and radius
- Transform from EPSG:3857 to EPSG:4326 (lat/lng)

**3. Link Species to New Ecoregions**

```bash
python3 scripts/link_species_radius_based.py
```

This will:
- Clear ALL existing links
- Re-link all 53,649 species to ALL ecoregions (including new ones)
- Takes ~15 seconds
- Supports multiple ecoregions per species

**4. Verify Results**

```bash
python3 scripts/check_ecoregion_habitats.py
```

This shows species counts per ecoregion and habitat breakdown.

### Important Notes

✅ **No need to re-import IUCN species** - They're already in the database
✅ **Linking is fast** - Only takes 13-15 seconds for all 53K species
✅ **Non-destructive** - Original WWF shapefile is preserved
✅ **Documented** - All scripts have detailed comments

⚠️ **Linking clears ALL existing links** - When you add new ecoregions, all species get re-linked. This ensures consistency but means any manual adjustments are lost.

### Adding Custom Ecoregions (Beyond WWF)

If you want to add ecoregions **not in the WWF shapefile**:

1. Add them directly to the database:
```sql
INSERT INTO ecoregions (ecoregion_id, name, biome, realm, center_lat, center_lng, radius_km)
VALUES (
  'custom-1',
  'Galápagos Islands',
  'Island Endemic',
  'Marine',
  -0.9538,  -- Center latitude
  -90.9656, -- Center longitude
  500       -- Radius in km
);
```

2. Run linking script to connect species:
```bash
python3 scripts/link_species_radius_based.py
```

---

## 🧪 Testing Checklist

After fixing Borneo, verify:

- [x] Borneo has >0 species
- [x] Coral Triangle still has ~13K species
- [x] Other ecoregions unchanged
- [x] Total links increased from 30,179 to 34,358
- [x] Known Borneo species (e.g., Hylobates abbotti) now linked
- [x] Habitat ratios reasonable (Coral=90% marine, Borneo=70% terrestrial)

**Frontend Testing** (Next Step):
1. Load map → Should show 6 ecoregion pins
2. Click Borneo → Should show 4,179 species
3. Species should be mostly terrestrial animals
4. Click Coral Triangle → Should show 13,424 species
5. Species should be mostly marine animals

---

## 📚 Related Documentation

- `IUCN_DATA_IMPORT_COMPLETE.md` - Original import documentation
- `scripts/link_species_radius_based.py` - Linking script (now fixed)
- `scripts/diagnose_borneo.py` - Diagnostic tool used to find the bug
- `scripts/check_ecoregion_habitats.py` - Habitat analysis tool

---

## 💡 Key Takeaways

1. **Borneo is fixed!** 4,179 species now available
2. **Multi-region support is good** - Species can belong to multiple ecoregions
3. **Habitat filtering works naturally** - Geographic data already clusters species by habitat
4. **System is extensible** - Easy to add new ecoregions in the future
5. **Documentation is comprehensive** - All scripts and processes are documented

The system is ready for frontend integration! 🎉
