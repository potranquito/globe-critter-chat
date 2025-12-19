# Species Enrichment Priority List
**Goal**: 20 curated species per major taxonomic group in each eco-region

**Date**: 2025-01-23
**Status**: After adding `is_venomous` field

---

## Priority Order (Easiest to Hardest)

### Priority 1: Nearly Complete (Need <5 species) ⭐⭐⭐

#### Congo Basin
- ✅ **Mammals**: 19/20 (need 1 more)

#### Arctic Terrestrial
- ✅ **Mammals**: 19/20 (need 1 more)

#### Amazon and Guianas
- ✅ **Mammals**: 17/20 (need 3 more)

#### Borneo
- ✅ **Mammals**: 15/20 (need 5 more)

**Estimated time**: 2-3 hours total for all mammals
**Impact**: Completes mammals across all tropical/boreal regions

---

### Priority 2: Moderate Effort (Need 10-16 species) ⭐⭐

#### Amazon and Guianas
- **Reptiles**: 4/20 (need **16 more**) ← Your original observation!
- **Birds**: 4/20 (need **16 more**)
- **Fish**: 3/20 (need **17 more**)
- **Plants**: 6/20 (need **14 more**)

#### Congo Basin
- **Reptiles**: 5/20 (need **15 more**)
- **Birds**: 5/20 (need **15 more**)
- **Plants**: 4/20 (need **16 more**)
- **Fish**: 3/20 (need **17 more**)

#### Madagascar
- **Reptiles**: 8/20 (need **12 more**)
- **Birds**: 5/20 (need **15 more**)
- **Plants**: 5/20 (need **15 more**)

#### Borneo
- **Birds**: 7/20 (need **13 more**)
- **Plants**: 8/20 (need **12 more**)

#### Arctic Terrestrial
- **Birds**: 13/20 (need **7 more**)

**Estimated time**: 20-30 hours total
**Impact**: Core learning mode diversity for major groups

---

### Priority 3: Heavy Lift (Need 15-19 species) ⭐

#### Amazon and Guianas
- **Amphibians**: 2/20 (need **18 more**)
- **INSECTA**: 4/20 (need **16 more**)

#### Congo Basin
- **Amphibians**: 1/20 (need **19 more**)
- **INSECTA**: 1/20 (need **19 more**)

#### Madagascar
- **Amphibians**: 1/20 (need **19 more**)
- **INSECTA**: 1/20 (need **19 more**)

#### Borneo
- **Reptiles**: 2/20 (need **18 more**)
- **Amphibians**: 1/20 (need **19 more**)
- **INSECTA**: 3/20 (need **17 more**)

#### Arctic Terrestrial
- **Fish**: 4/20 (need **16 more**)
- **Plants**: 4/20 (need **16 more**)

#### Coral Triangle
- **Reptiles**: 5/20 (need **15 more**)
- **Mammals**: 6/20 (need **14 more**)
- **Corals**: 4/20 (need **16 more**)
- **Plants**: 2/20 (need **18 more**)
- **GASTROPODA**: 1/20 (need **19 more**)
- **BIVALVIA**: 1/20 (need **19 more**)
- **MALACOSTRACA**: 4/20 (need **16 more**)

**Estimated time**: 40-60 hours total
**Impact**: Advanced learning mode topics (insects, amphibians, marine invertebrates)

---

## Recommended Enrichment Strategy

### Phase 1: Quick Wins (Week 1)
**Time**: 10 hours | **Species added**: ~80-100

1. **Complete all mammals** (4 regions, ~15 species total)
2. **Amazon reptiles** (16 species) - Your original concern!
3. **Amazon birds** (16 species)
4. **Congo reptiles** (15 species)

**Why start here?**
- Most visible impact for users
- Well-documented species (easy to find images)
- Varied conservation statuses (good for education)

### Phase 2: Core Diversity (Week 2-3)
**Time**: 20 hours | **Species added**: ~200

1. **All fish** (Amazon, Congo, Arctic, Coral Triangle)
2. **All plants** (except Coral Triangle)
3. **Madagascar reptiles** (12 species)
4. **Borneo birds & plants** (~25 species)

**Why next?**
- Completes major taxonomic groups
- Enables food web game diversity
- Arctic plants = unique tundra species

### Phase 3: Advanced Topics (Week 4+)
**Time**: 40 hours | **Species added**: ~300

1. **Amphibians** (all regions - focus on poison dart frogs, etc.)
2. **Insects** (butterflies, beetles, ants)
3. **Marine invertebrates** (Coral Triangle - snails, clams, crustaceans)
4. **Arctic fish** (unique cold-water species)

**Why last?**
- More niche learning topics
- Harder to find quality images
- Less critical for core experience

---

## Quick Start: Amazon Reptiles CSV

Create `amazon_reptiles_enrichment.csv`:

```csv
ecoregion,scientific_name,common_name,class,conservation_status,is_venomous,is_invasive
Amazon and Guianas,Boa constrictor,Boa constrictor,REPTILIA,LC,false,false
Amazon and Guianas,Caiman crocodilus,Spectacled caiman,REPTILIA,LC,false,false
Amazon and Guianas,Melanosuchus niger,Black caiman,REPTILIA,LC,false,false
Amazon and Guianas,Geochelone denticulata,Yellow-footed tortoise,REPTILIA,VU,false,false
Amazon and Guianas,Podocnemis unifilis,Yellow-spotted river turtle,REPTILIA,VU,false,false
Amazon and Guianas,Podocnemis expansa,Giant South American river turtle,REPTILIA,LC,false,false
Amazon and Guianas,Corallus hortulanus,Amazon tree boa,REPTILIA,LC,false,false
Amazon and Guianas,Paleosuchus palpebrosus,Cuvier's dwarf caiman,REPTILIA,LC,false,false
Amazon and Guianas,Paleosuchus trigonatus,Smooth-fronted caiman,REPTILIA,LC,false,false
Amazon and Guianas,Tupinambis teguixin,Gold tegu,REPTILIA,LC,false,false
Amazon and Guianas,Bothriopsis bilineata,Two-striped forest pit viper,REPTILIA,LC,true,false
Amazon and Guianas,Bothrops atrox,Common lancehead,REPTILIA,LC,true,false
Amazon and Guianas,Epicrates cenchria,Rainbow boa,REPTILIA,LC,false,false
Amazon and Guianas,Iguana iguana,Green iguana,REPTILIA,LC,false,false
Amazon and Guianas,Chelus fimbriata,Matamata,REPTILIA,LC,false,false
Amazon and Guianas,Anolis punctatus,Amazon anole,REPTILIA,LC,false,false
```

Then run:
```bash
source venv/bin/activate
python update_species_with_images.py
python restore_species_from_csv.py curated_species_database_enriched.csv
```

---

## Total Work Estimate

| Phase | Regions | Groups | Species | Time | Priority |
|-------|---------|--------|---------|------|----------|
| Phase 1 | 4 | 4 | 80-100 | 10h | ⭐⭐⭐ |
| Phase 2 | 6 | 8 | 200 | 20h | ⭐⭐ |
| Phase 3 | 6 | 10 | 300 | 40h | ⭐ |
| **Total** | **6** | **22** | **~580** | **70h** | |

**Goal**: 20 species × 6 regions × 6 major groups = **720 curated species**
**Current**: ~240 curated species
**Need to add**: ~480 species total

---

## Tools Available

1. **check_species_gaps.py** - Identify what's missing
2. **update_species_with_images.py** - Auto-fetch Wikimedia images
3. **restore_species_from_csv.py** - Import to database
4. **manage_curated_species.py** - Mark species as curated
5. **SPECIES_ENRICHMENT_GUIDE.md** - Full strategy guide

---

## Success Metrics

✅ **Minimum viable**: 10+ species per major group (already met!)
✅ **Good experience**: 15+ species per major group
🎯 **Target goal**: 20 species per major group ← **YOU ARE HERE**
🌟 **Excellent**: 25+ species per major group

At 20 per group, learning mode will have excellent diversity and the trivia/food web games will be much more engaging!
