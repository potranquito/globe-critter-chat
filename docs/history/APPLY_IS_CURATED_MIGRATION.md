# Add is_curated Flag to Species Database

## What This Does

This migration adds an `is_curated` boolean flag to the `species` table to distinguish between:
- **Curated species** (manually selected from CSV files with high-quality images)
- **IUCN species** (automatically imported from IUCN database)

## Benefits

1. **Filter species lists** - Show only curated species in UI
2. **Prioritize display** - Show curated species first in carousels
3. **Data quality** - Identify which species have been manually verified
4. **Analytics** - Track coverage of curated vs IUCN species

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://app.supabase.com/project/iwmbvpdqwekgxegaxrhr/sql
2. Copy the contents of `supabase/migrations/20251014000005_add_is_curated_flag.sql`
3. Paste into the SQL editor
4. Click "Run"

### Option 2: Supabase CLI

```bash
supabase db push
```

## What Gets Updated

After applying the migration:

1. **New column added**: `species.is_curated` (boolean, default false)
2. **Index created**: For fast filtering by curated status
3. **Existing data updated**: Species with Wikimedia Commons images automatically marked as curated
4. **New functions added**:
   - `get_curated_species_by_ecoregion()` - Returns only curated species
   - `get_balanced_species_for_ecoregion_v2()` - Prioritizes curated species

## Next Step: Mark Curated Species

After applying the migration, run the import script to mark all CSV species as curated:

```bash
source venv/bin/activate
python3 scripts/import_curated_species.py
```

This will:
- Set `is_curated = true` for all 240 species in `curated_species_database_enriched.csv`
- Including the 6 Arctic species (Polar Bear, Reindeer, Arctic Fox, Muskox, Snowy Owl, Walrus)

## Verification

Check that curated species are marked correctly:

```sql
-- Count curated vs IUCN species
SELECT
  is_curated,
  COUNT(*) as count
FROM species
GROUP BY is_curated;

-- Show curated Arctic species
SELECT
  scientific_name,
  common_name,
  is_curated
FROM species s
JOIN species_ecoregions se ON s.id = se.species_id
JOIN ecoregions e ON se.ecoregion_id = e.id
WHERE e.name ILIKE '%arctic%'
  AND is_curated = true;
```

## Using the Flag in Your App

### Filter for curated species only:

```typescript
const { data: curatedSpecies } = await supabase
  .from('species')
  .select('*')
  .eq('is_curated', true);
```

### Use the new balanced function (curated species first):

```typescript
const { data: species } = await supabase
  .rpc('get_balanced_species_for_ecoregion_v2', {
    ecoregion_uuid: ecoregionId,
    max_per_class: 3
  });
```

### Get only curated species for an ecoregion:

```typescript
const { data: curatedSpecies } = await supabase
  .rpc('get_curated_species_by_ecoregion', {
    ecoregion_uuid: ecoregionId
  });
```

## Current Curated Species Count

After import, you should have:
- **Coral Triangle**: 40 curated species
- **Amazon and Guianas**: 40 curated species
- **Congo Basin**: 40 curated species
- **Madagascar**: 40 curated species
- **Borneo**: 40 curated species
- **Arctic Terrestrial**: 40 curated species (now includes Muskox, Snowy Owl, Walrus!)

**Total**: 240 curated species with high-quality images and descriptions

---

**Status**: Migration ready to apply ✅
**File**: `supabase/migrations/20251014000005_add_is_curated_flag.sql`
