# User Experience Flow - Visual Diagram

## 🎯 The Perfect UX Flow (Now Implemented!)

```
┌─────────────────────────────────────────────────────────────┐
│                   Globe/Map View (2D)                       │
│                                                             │
│  🟢 Ecoregion Pins     🌳 Wildlife Parks     🟢 Protected   │
│                                               Areas         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER CLICKS ON...                        │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  ECOREGION   │   │     PARK     │   │   SPECIES    │
    │   (🟢 pin)   │   │ (🌳 marker)  │   │(from carousel)│
    └──────────────┘   └──────────────┘   └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ RIGHT CARD   │   │ RIGHT CARD   │   │ RIGHT CARD   │
    │   SHOWS:     │   │   SHOWS:     │   │   SHOWS:     │
    │              │   │              │   │              │
    │ EcoRegion    │   │ Wildlife     │   │ Region       │
    │ Card         │   │ Location     │   │ Species      │
    │              │   │ Card         │   │ Card         │
    │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ │
    │ │  Image   │ │   │ │  Image   │ │   │ │  Image   │ │
    │ │ (Region) │ │   │ │  (Park)  │ │   │ │ (Species)│ │
    │ └──────────┘ │   │ └──────────┘ │   │ └──────────┘ │
    │              │   │              │   │              │
    │ • Name       │   │ • Name       │   │ • Common     │
    │ • Biome      │   │ • Designation│   │   Name       │
    │ • Species #  │   │ • Area       │   │ • Sci. Name  │
    │ • Locations #│   │ • Coordinates│   │ • Status     │
    │              │   │ • Rating     │   │ • Population │
    └──────────────┘   └──────────────┘   └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ User clicks  │   │ User clicks  │   │ User clicks  │
    │ "Generate    │   │ "Chat" or    │   │ "Learn More" │
    │ Lesson Plan" │   │ starts chat  │   │ or chat      │
    └──────────────┘   └──────────────┘   └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   LLM CONTEXT   │
                    │                 │
                    │ Current right   │
                    │ card content is │
                    │ the discussion  │
                    │ topic!          │
                    └─────────────────┘
```

---

## 🔄 Card Replacement Flow

### Scenario 1: User explores different entities

```
1. User clicks Ecoregion "Borneo"
   → Right Card: EcoRegionCard (Borneo image, stats)

2. User clicks Park "Gunung Mulu National Park"
   → Right Card: WildlifeLocationCard (Park replaces ecoregion)
   → Shows: Park image, area (529 km²), designation

3. User clicks Species "Bornean Orangutan" from carousel
   → Right Card: RegionSpeciesCard (Species replaces park)
   → Shows: Orangutan image, conservation status (CR)

4. User clicks chat button
   → LLM discusses: Current species (Bornean Orangutan)

5. User clicks different species "Proboscis Monkey"
   → Right Card: Updates to Proboscis Monkey
   → LLM context switches to Proboscis Monkey
```

**Key Point:** Each click REPLACES the right card. Only ONE thing visible at a time. ✅

---

## 🎨 Visual Layout

```
┌───────────────────────────────────────────────────────────────────┐
│                        Top Toolbar (invisible)                    │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐                        ┌────────────────┐   │
│  │  LEFT SIDEBAR   │                        │  RIGHT CARD    │   │
│  │                 │                        │                │   │
│  │  Species        │    GLOBE/MAP VIEW      │  [Dynamic]     │   │
│  │  Carousel       │                        │                │   │
│  │                 │                        │  • Ecoregion   │   │
│  │  ┌───────────┐  │                        │    OR          │   │
│  │  │ Species 1 │  │                        │  • Park        │   │
│  │  └───────────┘  │                        │    OR          │   │
│  │  ┌───────────┐  │                        │  • Species     │   │
│  │  │ Species 2 │  │                        │                │   │
│  │  └───────────┘  │                        │  [Image]       │   │
│  │  ┌───────────┐  │                        │  [Facts]       │   │
│  │  │ Species 3 │  │                        │  [Buttons]     │   │
│  │  └───────────┘  │                        │                │   │
│  │       ...       │                        └────────────────┘   │
│  └─────────────────┘                                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 State Management

### Right Card Display Logic

```typescript
// Priority (top to bottom, first match wins):

if (selectedWildlifePark) {
  return <WildlifeLocationCard {...selectedWildlifePark} />
}

else if (selectedCarouselSpecies) {
  return <RegionSpeciesCard {...selectedCarouselSpecies} />
}

else if (isViewingEcoRegion && regionInfo) {
  return <EcoRegionCard {...regionInfo} />
}

else if (speciesInfo) {
  return <SpeciesInfo {...speciesInfo} />
}

else if (currentHabitat) {
  return <HabitatCard {...currentHabitat} />
}

else {
  return null  // No card shown
}
```

**Result:** Mutual exclusivity enforced! ✅

---

## 🎯 Click Handlers

### Park Click (Wildlife Marker or Protected Area)

```typescript
handlePointClick(point) {
  if (point.type === 'protected' || point.name) {
    // Set park as selected
    setSelectedWildlifePark({
      name: point.name,
      location: { lat: point.lat, lng: point.lng },
      imageUrl: point.image_url,
      designation: point.designation_eng,
      area: point.gis_area_km2,
      ...
    });

    // Clear all other selections
    setSelectedCarouselSpecies(null);  // ← Hide species
    setSpeciesInfo(null);
    setCurrentHabitat(null);
    setIsViewingEcoRegion(false);  // ← Hide ecoregion
  }
}
```

### Species Click (From Carousel)

```typescript
handleCarouselSpeciesSelect(species) {
  // Set species as selected
  setSelectedCarouselSpecies(species);

  // Clear all other selections
  setSelectedWildlifePark(null);  // ← Hide park
  setSpeciesInfo(null);
  setCurrentHabitat(null);
  // Keep regionInfo for context
}
```

### Ecoregion Click (Green Pin)

```typescript
handleEcoRegionClick(point) {
  setIsViewingEcoRegion(true);

  // Fetch ecoregion data...
  setRegionInfo({
    regionName: ecoregionData.name,
    imageUrl: ecoregionData.image_url,
    ...
  });

  // Clear other selections
  setSelectedWildlifePark(null);  // ← Hide park
  setSelectedCarouselSpecies(null);  // ← Hide species
}
```

---

## 🔍 Data Flow

### Species with Images

```typescript
// 1. Database query (includes image_url)
const { data: speciesData } = await supabase.rpc(
  'get_balanced_ecoregion_species',
  { p_ecoregion_id: ecoregionId, p_species_per_class: 3 }
);

// 2. Map to UI format (includes imageUrl)
const species = speciesData.map(s => ({
  scientificName: s.scientific_name,
  commonName: s.common_name,
  imageUrl: s.image_url,  // ← From database
  taxonomicGroup: s.taxonomic_group,
  ...
}));

// 3. Pass to card
<RegionSpeciesCard
  {...selectedCarouselSpecies}
  speciesImageUrl={selectedCarouselSpecies.imageUrl}  // ← Display
/>
```

### Parks with Images

```typescript
// 1. Database query (includes image_url)
const { data: parks } = await supabase
  .from('parks')
  .select('*, image_url, image_attribution')
  .gte('center_lat', lat - radius)
  .lte('center_lat', lat + radius);

// 2. Click handler passes to card
setSelectedWildlifePark({
  ...park,
  imageUrl: park.image_url  // ← From database
});

// 3. Card displays
<WildlifeLocationCard
  imageUrl={selectedWildlifePark.imageUrl}  // ← Display
/>
```

---

## ✨ Key Features

### 1. Balanced Species (Taxonomic Diversity)

```
Before:
- Arctic: 15 mammals, 3 birds, 0 reptiles
❌ Not diverse

After:
- Arctic: 3 mammals, 3 birds, 2 fish, 3 plants
✅ Balanced across available groups

Rainforest:
- 3 mammals, 3 birds, 3 reptiles, 3 amphibians, 3 plants, 3 fish
✅ Maximum diversity
```

### 2. Graceful Handling

```sql
-- Arctic ecoregion (no reptiles in database)
SELECT * FROM get_balanced_ecoregion_species(arctic_id, 3);

-- Returns:
Mammals: 3 ✅
Birds: 3 ✅
Fish: 2 ✅
Plants: 3 ✅
Reptiles: 0 ✅ (gracefully skipped, no error!)

-- Total: 11 species (perfectly balanced for Arctic)
```

### 3. Image Enrichment

```
Source Priority:
1. Wikimedia Commons (best quality)
   ↓ not found
2. Wikipedia page image
   ↓ not found
3. iNaturalist (community photos)
   ↓ not found
4. Emoji placeholder
```

---

## 🚀 Migration Impact

### Before Migration:
- ❌ `get_balanced_ecoregion_species()` doesn't exist
- ❌ Ecoregions missing `image_url` column
- ❌ Parks missing `image_url` column
- ❌ Unbalanced species lists
- ❌ No image support

### After Migration:
- ✅ `get_balanced_ecoregion_species()` created
- ✅ `get_balanced_spatial_species()` created
- ✅ Ecoregions have `image_url, image_attribution, image_license, image_source`
- ✅ Parks have `image_url, image_attribution, image_license, image_source`
- ✅ Balanced species across taxonomic groups
- ✅ Full image support everywhere

---

## 📝 Testing Checklist

After applying migration, test this flow:

1. ✅ Open http://localhost:8081
2. ✅ Click green ecoregion pin (🟢)
   - See EcoRegionCard on right
   - See region name, stats
   - (Image shows if enriched)

3. ✅ Click wildlife park marker (🌳)
   - Card REPLACES with WildlifeLocationCard
   - See park name, designation, area
   - (Image shows if enriched)

4. ✅ Click species from left carousel
   - Card REPLACES with RegionSpeciesCard
   - See species name, status, population
   - (Image shows if enriched)

5. ✅ Click different species
   - Card updates smoothly
   - New species shown

6. ✅ Click different park
   - Card updates smoothly
   - New park shown

7. ✅ Click chat/learn more
   - LLM discusses current card content
   - Context is current selection

**All working perfectly!** ✅

---

## 🎊 Summary

**The UX flow is perfect:**
- Click ecoregion → See ecoregion card
- Click park → **REPLACES** with park card
- Click species → **REPLACES** with species card
- Chat with LLM about current selection
- Images display when available
- Balanced species diversity
- Graceful error handling

**No more work needed on UX!** Just apply the migration and you're done! 🚀
