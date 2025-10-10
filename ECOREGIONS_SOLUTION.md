# Ecoregions Database Solution

## Problem
Currently using OpenAI to resolve species to habitat coordinates, which is:
- Inconsistent (missing regions like Russia for polar bears)
- Slow (API calls for every search)
- Expensive (OpenAI API costs)
- Unreliable (depends on API availability)

## Solution: Ecoregions Database (RAG + Static Dataset)

Based on [WWF Terrestrial Ecoregions of the World (TEOW)](https://en.wikipedia.org/wiki/Ecoregion), there are **867 terrestrial ecoregions** grouped into:
- 14 major biomes
- 8 biogeographical realms
- Marine ecoregions
- Freshwater ecoregions

### Architecture

```
┌─────────────────────────────────────────┐
│  User searches "Polar Bear"             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  1. Check Static Species-to-Ecoregion   │
│     Mapping (Fast, Accurate)            │
│     - JSON file with 500+ common species│
│     - Maps species → ecoregion IDs      │
└───────────────┬─────────────────────────┘
                │
                ├─── Found? ──────────────┐
                │                         │
                ▼                         ▼
┌─────────────────────────┐    ┌──────────────────────┐
│  2a. Load Ecoregion     │    │  2b. Fallback:       │
│      Coordinates from   │    │      OpenAI Query    │
│      Static Dataset     │    │      (rare species)  │
└─────────┬───────────────┘    └──────────┬───────────┘
          │                               │
          └───────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│  3. Render Multiple Habitat Zones       │
│     - Green pins at center coordinates  │
│     - Transparent zones (radiusKm)      │
│     - Species filter & carousel         │
└─────────────────────────────────────────┘
```

### Data Structure

#### Static Ecoregions Dataset
**File:** `src/data/ecoregions.json`

```json
{
  "ecoregions": [
    {
      "id": "NA0201",
      "name": "Arctic Coastal Tundra",
      "realm": "Nearctic",
      "biome": "Tundra",
      "centerLat": 69.5,
      "centerLng": -149.0,
      "radiusKm": 300,
      "bounds": {
        "north": 71.5,
        "south": 67.5,
        "east": -140.0,
        "west": -158.0
      },
      "climate": "Polar",
      "biodiversity": "medium"
    }
  ]
}
```

#### Species-to-Ecoregion Mapping
**File:** `src/data/speciesEcoregions.json`

```json
{
  "species": {
    "polar-bear": {
      "commonName": "Polar Bear",
      "scientificName": "Ursus maritimus",
      "ecoregions": [
        "NA0201",  // Arctic Coastal Tundra (Alaska)
        "NA0203",  // Canadian Arctic Tundra
        "PA0501",  // Arctic Desert (Greenland)
        "PA0603",  // Chukotka Coastal Tundra (Russia)
        "PA0605"   // Svalbard-Franz Josef Arctic Tundra
      ],
      "primaryEcoregion": "NA0201"
    },
    "desert-tortoise": {
      "commonName": "Desert Tortoise",
      "scientificName": "Gopherus agassizii",
      "ecoregions": ["NA1310"],  // Mojave Desert
      "primaryEcoregion": "NA1310"
    }
  }
}
```

### Implementation Strategy

#### Phase 1: Quick Fix (Immediate)
1. ✅ Add static fallback data for top 50 endangered species
2. ✅ Improve OpenAI prompt to be more explicit
3. ✅ Show filter/carousel immediately (don't wait for APIs)

#### Phase 2: Ecoregions Dataset (Week 1)
1. Download WWF TEOW dataset (GeoJSON format)
2. Create simplified JSON with 867 ecoregions
3. Add species-to-ecoregion mapping for 100+ species
4. Update habitatResolver to check static data first

#### Phase 3: RAG Database (Week 2-3)
1. Set up Supabase vector database
2. Embed ecoregion descriptions using OpenAI embeddings
3. Semantic search: "Where do polar bears live?" → retrieves ecoregions
4. Hybrid approach: Static for exact matches, RAG for complex queries

### Data Sources

1. **WWF Terrestrial Ecoregions of the World (TEOW)**
   - 867 ecoregions with GeoJSON polygons
   - Available at: https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world
   - License: Public domain

2. **Marine Ecoregions of the World (MEOW)**
   - For ocean species (whales, seals, etc.)
   - Available at: https://www.marineregions.org/

3. **IUCN Red List Habitat Classifications**
   - Species habitat requirements
   - Available at: https://www.iucnredlist.org/

### Benefits

✅ **Accuracy:** Scientifically validated ecoregion boundaries  
✅ **Speed:** Instant lookup (no API calls)  
✅ **Cost:** Free (one-time dataset download)  
✅ **Offline:** Works without internet  
✅ **Comprehensive:** 867 ecoregions covering entire planet  
✅ **Scalable:** Easy to add new species  
✅ **Fallback:** Can still use OpenAI for rare/unlisted species

### Example: Polar Bear Query

**Current (Broken):**
```
User: "polar bear"
→ OpenAI call (500ms)
→ Returns 3 zones (missing Russia, Svalbard)
→ Creates 3 pins
```

**With Ecoregions Database:**
```
User: "polar bear"
→ Lookup in speciesEcoregions.json (1ms)
→ Returns 5 ecoregion IDs
→ Load 5 ecoregions from ecoregions.json (1ms)
→ Creates 5 pins with accurate coordinates
→ Total: 2ms vs 500ms (250x faster!)
```

### Migration Plan

1. **Immediate (Today):**
   - Add static fallback for polar bears with 5 regions
   - Fix filter/carousel to show immediately
   - Improve OpenAI prompt

2. **This Week:**
   - Download WWF TEOW dataset
   - Create ecoregions.json (867 entries)
   - Create speciesEcoregions.json (50 species)

3. **Next Week:**
   - Expand to 200+ species
   - Add marine ecoregions
   - Implement RAG for complex queries

4. **Future:**
   - User-contributed species mappings
   - Real-time ecoregion boundary visualization
   - Integration with conservation status data

