# Enable Curated Species Display

## Quick Start Guide

Follow these steps in order to show 100% curated species (with option to mix IUCN later):

### Step 1: Apply Database Migration

Run this SQL in Supabase Dashboard: https://app.supabase.com/project/iwmbvpdqwekgxegaxrhr/sql

```sql
-- Copy and paste the entire contents of: apply_is_curated_migration.sql
```

This adds the `is_curated` column and creates helper functions.

### Step 2: Mark Curated Species

Run the import script to flag all CSV species as curated:

```bash
source venv/bin/activate
python3 scripts/import_curated_species.py
```

Expected output:
```
✅ New species imported: 0
♻️  Existing species updated: 240
🔗 New ecoregion links created: 0
```

### Step 3: Update Frontend to Use Curated Species

The frontend currently uses: `get_balanced_ecoregion_species`

We'll switch it to use: `get_curated_species_by_ecoregion_balanced`

Edit `src/pages/Index.tsx` line 799-806:

**BEFORE:**
```typescript
const { data: balancedSpecies, error: speciesError } = await supabase.rpc(
  'get_balanced_ecoregion_species',
  {
    p_ecoregion_id: ecoregionData.id,
    p_species_per_class: speciesPerClass,
    p_exclude_species: []
  }
);
```

**AFTER (100% curated):**
```typescript
const { data: balancedSpecies, error: speciesError } = await supabase.rpc(
  'get_curated_species_by_ecoregion_balanced',
  {
    ecoregion_uuid: ecoregionData.id,
    max_per_class: speciesPerClass
  }
);
```

### Step 4: Test

1. Start dev server: `npm run dev`
2. Click on each ecoregion:
   - Arctic → Should show Polar Bear, Reindeer, Arctic Fox, **Muskox**, **Snowy Owl**, **Walrus**
   - Coral Triangle → Should show 40 curated marine species
   - Amazon → Should show Jaguar, Macaw, Sloth, etc.
   - All species should have high-quality images

## Later: Mix 70% Curated + 30% IUCN

Once curated species are working, we can create a mixed function:

```sql
CREATE OR REPLACE FUNCTION get_mixed_species_by_ecoregion(
  ecoregion_uuid UUID,
  max_per_class INTEGER DEFAULT 3,
  curated_percentage DECIMAL DEFAULT 0.7  -- 70% curated, 30% IUCN
)
-- Returns curated species first, then fills remaining slots with IUCN species
```

Then update frontend to use the mix percentage you want!

## Verification Queries

Check curated species count:
```sql
SELECT
  e.name as ecoregion,
  COUNT(*) FILTER (WHERE s.is_curated = true) as curated_count,
  COUNT(*) FILTER (WHERE s.is_curated = false) as iucn_count
FROM species s
JOIN species_ecoregions se ON s.id = se.species_id
JOIN ecoregions e ON se.ecoregion_id = e.id
GROUP BY e.name
ORDER BY e.name;
```

Expected result:
```
Arctic Terrestrial    | 40 curated | ~2000 IUCN
Coral Triangle        | 40 curated | ~500 IUCN
Amazon and Guianas    | 40 curated | ~3000 IUCN
... etc
```

---

**Status**: Ready to apply! Start with Step 1 ✅
