# Database Status Assessment
**Date**: 2025-01-23
**Purpose**: Verify database schema before species enrichment

## Current Situation

### Uncommitted Changes
```
Modified files:
- src/components/ChatHistory.tsx (bold markdown styling)
- src/components/InfoCard.tsx
- src/pages/ParkSelectionPage.tsx (learning mode fixes)
- src/pages/TriviaPage.tsx (Borneo background)

Untracked files:
- SPECIES_ENRICHMENT_GUIDE.md (new)
- check_species_gaps.py (new)
- public/images/*.png (trivia backgrounds, pixel characters)
- update_*_images.py (image update scripts)
```

## Database Schema Analysis

### ✅ Fields that EXIST and are working:
1. **dietary_category** - ✅ Present (migration: 20251016000001)
   - Values: Carnivore, Herbivore, Omnivore, Producer
   - Has index and constraint
   - Auto-populated by trigger

2. **is_invasive** - ✅ Present (migration: 20251013000001)
   - Type: BOOLEAN DEFAULT false
   - Used in learning mode filters

3. **species_type** - ✅ Present (migration: 20251015000001)
   - Values: Mammal, Bird, Reptile, Amphibian, Fish, Plant, Coral, etc.

4. **ui_group** - ✅ Present (migration: 20251015000001)
   - Values: Animals, Birds, Plants & Corals

5. **trophic_role** - ✅ Present
   - Values: Predator, Herbivore, Omnivore, Producer, Filter-feeder, etc.

6. **conservation_status** - ✅ Present (IUCN status)
   - Values: LC, VU, EN, CR, EW, EX, DD, NE

7. **is_curated** - ✅ Present (migration: 20251014000005)
   - Filters species for display

8. **class** - ✅ Present (taxonomic class)
   - Values: MAMMALIA, AVES, REPTILIA, AMPHIBIA, ACTINOPTERYGII, etc.

### ❌ Fields that are MISSING:

1. **is_venomous** - ❌ NOT FOUND in any migration
   - **Used by**: ParkSelectionPage.tsx line 522
   - **Display**: "Venomous: Yes/No" in learning mode
   - **Filter**: Learning topics use `venomous` filter (line 400)
   - **Problem**: Field doesn't exist, will always show undefined/No
   - **Impact**: Medium - learning mode displays incomplete info

### 📋 Fields that need VERIFICATION:
- `taxonomic_group` - Used by frontend, need to verify DB column name
- `image_url` - Present, verify populated
- `description` - Present, verify populated

## Frontend Expectations vs Database Reality

### RegionSpecies Interface (TypeScript):
```typescript
interface RegionSpecies {
  scientificName: string;        // ✅ scientific_name
  commonName: string;            // ✅ common_name
  animalType: string;            // ✅ class / species_type
  conservationStatus: string;    // ✅ conservation_status
  imageUrl?: string;             // ✅ image_url
  speciesType?: string;          // ✅ species_type
  uiGroup?: string;              // ✅ ui_group
  trophicRole?: string;          // ✅ trophic_role
  dietaryCategory?: string;      // ✅ dietary_category
  taxonomicGroup?: string;       // ⚠️ Need to verify mapping
  isInvasive?: boolean;          // ✅ is_invasive
  isVenomous?: boolean;          // ❌ MISSING - is_venomous
}
```

## Recommendation: Add Missing Field BEFORE Species Enrichment

### Why Add Now?
1. **Data Completeness**: New species added via CSV should include venomous status
2. **Learning Mode**: Already displays venomous info, just needs data
3. **Future Topics**: Could enable "Venomous Species" learning topic
4. **One Migration**: Better to add now than migrate later after adding 100+ species

### Proposed Migration

**File**: `supabase/migrations/20250123000001_add_is_venomous.sql`

```sql
-- Add is_venomous field for species that can inject venom
-- This is distinct from poisonous (toxic when eaten)

ALTER TABLE species
ADD COLUMN IF NOT EXISTS is_venomous BOOLEAN DEFAULT false;

-- Add index for filtering performance
CREATE INDEX IF NOT EXISTS idx_species_venomous ON species(is_venomous);

-- Add helpful comment
COMMENT ON COLUMN species.is_venomous IS 'True if species can inject venom (snakes, spiders, etc.). Distinct from poisonous.';

-- Backfill known venomous species based on common patterns
UPDATE species
SET is_venomous = true
WHERE
  -- Venomous snakes
  common_name ~* '\\y(viper|cobra|mamba|adder|rattlesnake|copperhead|cottonmouth|taipan|krait|bushmaster|fer-de-lance|pit viper|coral snake)\\y'
  OR scientific_name ~* '\\y(Vipera|Naja|Dendroaspis|Crotalus|Agkistrodon|Oxyuranus|Bungarus|Lachesis|Bothrops|Trimeresurus|Micrurus)\\y'
  -- Venomous lizards
  OR common_name ~* '\\y(gila monster|beaded lizard)\\y'
  OR scientific_name ~* '\\y(Heloderma)\\y'
  -- Venomous fish
  OR common_name ~* '\\y(stonefish|lionfish|stingray|scorpionfish|weever|catfish.*venomous)\\y'
  OR scientific_name ~* '\\y(Synanceia|Pterois|Dasyatis|Scorpaena)\\y'
  -- Venomous invertebrates (spiders, scorpions, jellyfish, etc.)
  OR common_name ~* '\\y(black widow|brown recluse|funnel-web spider|box jellyfish|sea wasp|blue-ringed octopus|cone snail|scorpion)\\y'
  OR class IN ('ARACHNIDA', 'SCORPIONES')
  OR (class = 'HYDROZOA' AND common_name ~* 'jellyfish')
  -- Venomous amphibians (poison dart frogs)
  OR common_name ~* '\\y(poison dart frog|poison frog|poison arrow frog)\\y'
  OR scientific_name ~* '\\y(Dendrobates|Phyllobates|Ranitomeya|Oophaga)\\y';

-- Report on what was updated
SELECT
  class,
  COUNT(*) as venomous_count,
  array_agg(common_name ORDER BY common_name LIMIT 5) as examples
FROM species
WHERE is_venomous = true
GROUP BY class
ORDER BY venomous_count DESC;
```

### Alternative: Skip for Now

**Pros of skipping**:
- Fewer changes before enrichment
- Can add manually per species in CSV
- Not critical for core learning mode

**Cons of skipping**:
- Learning mode will show "Venomous: No" for all species (misleading)
- Need to retrofit later when adding venomous species
- CSV enrichment process needs extra manual step

## Action Plan

### Option A: Add Migration First (RECOMMENDED)

**Time**: 10 minutes
**Risk**: Low (simple field addition)

1. **Commit current work**:
   ```bash
   git add src/components/ChatHistory.tsx src/pages/ParkSelectionPage.tsx src/pages/TriviaPage.tsx src/components/InfoCard.tsx
   git commit -m "feat: Improve learning mode UX - bold styling, faster text, fixed filters/counter, no duplicates"

   git add public/images/*.png
   git commit -m "feat: Add trivia backgrounds for Borneo, Congo, Madagascar"

   git add SPECIES_ENRICHMENT_GUIDE.md check_species_gaps.py
   git commit -m "docs: Add species enrichment guide and diagnostic tool"
   ```

2. **Create and apply migration**:
   ```bash
   # Create migration file
   cat > supabase/migrations/20250123000001_add_is_venomous.sql << 'EOF'
   [SQL from above]
   EOF

   # Apply migration (if using local Supabase)
   supabase db push

   # OR apply via Supabase dashboard SQL editor
   ```

3. **Test migration**:
   ```bash
   python check_species_gaps.py
   # Should show venomous counts if any exist
   ```

4. **Proceed with enrichment**:
   - Add species CSVs with `is_venomous` column
   - Import as usual

### Option B: Skip Migration, Manual CSV

**Time**: 5 minutes now + extra time per species later

1. **Commit current work** (same as Option A)

2. **Add venomous flag in CSV manually**:
   ```csv
   ecoregion,scientific_name,common_name,class,is_venomous
   Amazon Rainforest,Lachesis muta,Bushmaster,REPTILIA,true
   Amazon Rainforest,Boa constrictor,Boa constrictor,REPTILIA,false
   ```

3. **Note limitation**: Learning mode will show "Venomous: No" until database is updated

## Final Recommendation

**✅ Use Option A: Add Migration First**

**Reasoning**:
1. Small time investment (10 min) prevents future technical debt
2. Learning mode already expects this field
3. Automatic backfill catches obvious venomous species
4. Cleaner CSV import process
5. Better user experience in learning mode

**Next Steps After Decision**:
1. Commit current work (Option A or B)
2. Apply migration if chosen (Option A)
3. Run diagnostic: `python check_species_gaps.py`
4. Begin species enrichment for gaps (Amazon reptiles, etc.)
5. Use existing scripts: `update_species_with_images.py`

## Summary

- **Current work**: Ready to commit (no conflicts)
- **Missing field**: `is_venomous` (used by learning mode but not in DB)
- **Recommendation**: Add migration before enrichment
- **Benefit**: Complete data model, better UX, less tech debt
- **Risk**: Minimal (simple column addition)
