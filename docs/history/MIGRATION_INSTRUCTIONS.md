# Apply Subspecies Support Migration

## Step 1: Apply the Migration

Go to your Supabase SQL Editor:
https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql/new

Copy and paste the entire contents of:
`supabase/migrations/20250112000007_add_subspecies_support.sql`

Then click "Run" to execute the migration.

## Step 2: Run the Import

Once the migration is applied, run:

```bash
caffeinate -i python3 scripts/processIUCNShapefiles.py > /tmp/mammals_final_import.log 2>&1 &
```

Monitor progress with:
```bash
tail -f /tmp/mammals_final_import.log
```

## What This Does

### Database Changes:
- Adds `subspecies`, `subpopulation`, `presence`, `seasonal`, `source`, `distribution_comments` columns
- Changes primary key from just `iucn_id` to composite key: `(iucn_id, subspecies, subpopulation, presence, seasonal)`
- This allows multiple variants of the same species (e.g., different killer whale populations)

### Import Changes:
- Now captures subspecies/subpopulation data from IUCN shapefiles
- Will import ALL 13,178+ mammal records including all variants
- No more deduplication - keeps Southern Resident killer whales separate from Transient killer whales, etc.

## Expected Result

- **Current**: 493 species
- **After import**: ~6,500+ unique species with variants (13,178+ total records)
- Mammals will include all subspecies and regional populations
