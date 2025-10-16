# Ecoregion Game Logic Update

## Problem Statement

Current IUCN database (53,649 species) focuses on **threatened/endangered species only**. This creates gaps:
- ❌ Missing iconic but stable species (Lions, Joshua Trees, Common Dolphins)
- ❌ Missing culturally important plants (Baobab, Sequoia, Bamboo)
- ❌ Incomplete educational experience for users
- ❌ Can't showcase full ecosystem diversity

## Solution: Phased Species Integration Strategy

### **Phase 1: Launch with Endangered Species** (Current MVP)
**Timeline:** Immediate - Q1 2026

**Approach:**
- Use existing IUCN database (53,649 species)
- Focus on CR/EN/VU species for initial educational impact
- Benefits:
  - ✅ Conservation-focused messaging
  - ✅ High educational value
  - ✅ Data already in database
  - ✅ Fast time to market

**Species Mix per Park (10 total):**
- 3 Endangered mammals (CR/EN/VU)
- 2 Endangered birds
- 1 Endangered reptile/amphibian
- 2 Endangered plants (when available)
- 2 Lesser-known endangered species (insects, fish, etc.)

**Example - Mojave Desert Park:**
- ✓ Desert Tortoise (Gopherus morafkai) - VU
- ✓ Desert Bighorn Sheep - VU
- ✓ Yucca species - EN
- + 7 other threatened Mojave species

**Marketing Message:**
> "Save the world's most endangered species, one ecoregion at a time"

---

### **Phase 2: Add Iconic Flagship Species** (Post-Launch)
**Timeline:** Q2 2026

**Approach:**
- Manually curate 200-300 iconic but stable species
- Source from educational databases (iNaturalist, Wikipedia, National Geographic)
- Add to supplemental `flagship_species` table

**Priority Species to Add:**
1. **Mammals:** Lion, Common Elephant, Common Dolphin, Kangaroo, Bison
2. **Birds:** Bald Eagle, Macaw (non-endangered species), Ostrich, Penguin species
3. **Plants:** Joshua Tree, Creosote Bush, Cholla, Mesquite, Baobab, Sequoia
4. **Marine:** Clownfish, Sea Anemone, Common Coral species
5. **Insects:** Monarch Butterfly, Honeybee, Dragonfly species

**Species Mix per Park (10 total):**
- 2 Iconic flagship (Lion, Joshua Tree)
- 3 Endangered species (educational priority)
- 3 Common but important (ecosystem roles)
- 2 Lesser-known species (discovery/surprise)

**Example - Mojave Desert Park (Updated):**
- 🌟 Joshua Tree (flagship, added manually)
- 🌟 Coyote (flagship, added manually)
- ✓ Desert Tortoise (VU) - from IUCN
- ✓ Desert Bighorn Sheep (VU) - from IUCN
- 🌿 Creosote Bush (common, added manually)
- 🌿 Cholla Cactus (common, added manually)
- ✓ Yucca species (EN) - from IUCN
- 🦎 Desert Iguana (common, added manually)
- 🦂 Arizona Bark Scorpion (common, added manually)
- ✓ Desert Pupfish (EN) - from IUCN

**Marketing Message:**
> "Explore iconic wildlife and save endangered species"

---

### **Phase 3: Complete Ecosystem Integration** (Long-term)
**Timeline:** Q3-Q4 2026

**Approach:**
- Integrate full GBIF database (1B+ occurrences)
- Add invasive species education
- Include extinct species for historical context
- Dynamic species based on real-time sightings (eBird API)

**Species Mix per Park (15 total):**
- 3 Iconic flagship
- 4 Endangered species
- 3 Common ecosystem species
- 2 Invasive species (educational warning)
- 2 Recently extinct (historical context)
- 1 Real-time sighting (live data)

---

## Implementation Plan

### Step 1: Create Supplemental Species Table
```sql
CREATE TABLE flagship_species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  conservation_status TEXT DEFAULT 'LC',
  class TEXT,
  kingdom TEXT,
  description TEXT,
  fun_facts JSONB,
  image_url TEXT,
  source TEXT DEFAULT 'manual_curation',
  is_iconic BOOLEAN DEFAULT true,
  educational_priority INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Merge Query for Species Selection
```sql
-- Get species for a park (combining IUCN + flagship)
WITH iucn_species AS (
  SELECT * FROM species_parks sp
  JOIN species s ON s.id = sp.species_id
  WHERE sp.park_id = :park_id
),
flagship AS (
  SELECT * FROM flagship_species fs
  WHERE fs.ecoregion_id = :ecoregion_id
)
SELECT * FROM (
  SELECT * FROM iucn_species WHERE conservation_status IN ('CR', 'EN', 'VU') LIMIT 6
  UNION ALL
  SELECT * FROM flagship LIMIT 4
)
ORDER BY is_iconic DESC, conservation_status;
```

### Step 3: Data Curation Workflow

**For each of 10-20 MVP ecoregions:**

1. **Inventory IUCN Species** (automated)
   - Query existing database
   - Filter by ecoregion geography
   - Prioritize CR/EN/VU

2. **Identify Flagship Gaps** (manual review)
   - List iconic species missing from IUCN
   - Prioritize culturally important plants
   - Include apex predators even if common

3. **Research & Add Species** (semi-automated)
   - Use iNaturalist API for images
   - Wikipedia API for descriptions
   - Manual fact-checking
   - Add to `flagship_species` table

4. **Tag Educational Priority** (manual)
   - Mark keystone species
   - Flag invasive species
   - Note ecosystem roles

**Example Curation for Mojave Desert:**

| Species | Source | Status | Priority | Notes |
|---------|--------|--------|----------|-------|
| Desert Tortoise | IUCN ✓ | VU | High | Already in DB |
| Desert Bighorn Sheep | IUCN ✓ | VU | High | Already in DB |
| Joshua Tree | Manual Add 🌟 | LC | **Flagship** | Icon of Mojave |
| Creosote Bush | Manual Add | LC | Medium | Dominant plant |
| Cholla Cactus | Manual Add | LC | Medium | Distinctive feature |
| Coyote | Manual Add 🌟 | LC | **Flagship** | Apex predator |
| Roadrunner | Manual Add 🌟 | LC | **Flagship** | Cultural icon |
| Tamarisk | Manual Add ⚠️ | LC | Medium | **INVASIVE - Educational** |
| Desert Pupfish | IUCN ✓ | EN | High | Devils Hole endemic |
| Yucca brevifolia | IUCN ✓ | EN | High | Joshua Tree species |

---

## Benefits of Phased Approach

### Phase 1 Advantages (Endangered Focus):
✅ Fast launch - data already exists
✅ Strong conservation message
✅ Educational impact from day one
✅ No data sourcing delays
✅ Aligns with mission of protecting species

### Phase 2 Advantages (Add Flagships):
✅ Broader user appeal
✅ Recognizable species increase engagement
✅ Complete ecosystem stories
✅ Better educational diversity
✅ Cultural relevance

### Phase 3 Advantages (Full Ecosystem):
✅ Real-time data freshness
✅ Invasive species awareness
✅ Historical context (extinction education)
✅ Dynamic, living database
✅ Scientific accuracy

---

## Success Metrics

### Phase 1 Targets:
- 10 ecoregions × 3 parks = 30 locations
- 10 species per park = 300 learning experiences
- 80%+ endangered/threatened species
- User learns about conservation status in every session

### Phase 2 Targets:
- Same 30 locations + flagship species
- 60% endangered, 40% flagship/common
- User can name 5+ iconic species per ecoregion
- Increased session completion (flagship species more engaging)

### Phase 3 Targets:
- 20 ecoregions × 5 parks = 100 locations
- 15 species per park = 1,500 learning experiences
- Full ecosystem representation
- Real-time sightings integration

---

## Next Actions

**Immediate (This Week):**
1. ✅ Complete spatial matching (parks ↔ ecoregions ↔ species)
2. ⏳ Select 10 MVP ecoregions
3. ⏳ Identify top 3 parks per ecoregion

**Short-term (Next 2 Weeks):**
4. Create `flagship_species` table schema
5. Curate 50 flagship species for 10 ecoregions (5 per region)
6. Build species curation function (IUCN + flagship merger)

**Medium-term (Next Month):**
7. Add 200 flagship species (20 per ecoregion if 10 regions)
8. Fetch images via iNaturalist API
9. Write educational content for flagship species
10. Test full game loop with mixed species

---

## Example User Experience

### Phase 1 Journey (Endangered-Only):
1. User selects **Mojave Desert** ecoregion
2. Sees 3 parks: Joshua Tree NP, Death Valley NP, Red Rock Canyon
3. Selects **Joshua Tree National Park**
4. Carousel shows 10 species:
   - Desert Tortoise (VU) 🐢
   - Desert Bighorn Sheep (VU) 🐏
   - Yucca species (EN) 🌵
   - 7 other threatened species
5. User learns about **endangered status** and conservation
6. Completes trivia about threats and protection

**Learning:** Heavy conservation focus, may feel "doom and gloom"

### Phase 2 Journey (With Flagships):
1. User selects **Mojave Desert** ecoregion
2. Sees 3 parks: Joshua Tree NP, Death Valley NP, Red Rock Canyon
3. Selects **Joshua Tree National Park**
4. Carousel shows 10 species:
   - 🌟 Joshua Tree (flagship) - "Symbol of the Mojave!"
   - 🌟 Coyote (flagship) - "Desert survivor!"
   - Desert Tortoise (VU) 🐢 - "Needs our help!"
   - Desert Bighorn Sheep (VU) 🐏
   - Creosote Bush 🌿 - "Smells like rain!"
   - Cholla Cactus 🌵
   - Roadrunner 🏃 (flagship)
   - Tamarisk ⚠️ - "Invasive species warning!"
   - Desert Pupfish (EN)
   - Yucca brevifolia (EN)
5. User learns mix of **celebration + conservation**
6. Trivia includes ecosystem roles AND threats

**Learning:** Balanced, engaging, complete ecosystem understanding

---

## Recommendation

**Start with Phase 1** to launch quickly with existing data, then **rapidly move to Phase 2** (within 1-2 months) by adding 50-200 flagship species through manual curation.

This gives us:
- Fast MVP launch ✅
- Strong conservation message ✅
- Clear expansion path ✅
- Manageable data curation scope ✅
