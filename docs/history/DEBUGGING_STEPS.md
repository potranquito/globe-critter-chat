# 🐛 Debugging Bird Call Icon

## Issue
Bird call icon (🔊) not showing on bird species cards.

## Fixes Applied
1. ✅ Fixed icon disappearing after click
2. ✅ Added error recovery
3. ✅ Icon now persists and can be clicked multiple times

## Check Database

### Run in SQL Editor
Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/editor

Copy and run queries from: `CHECK_DATABASE.sql`

Key checks:
1. Do columns exist? (species_type, ui_group, trophic_role)
2. Are species classified? (species_type should not be NULL)
3. How many birds? (should be ~11,000+)

## Debug Icon Not Showing

### Step 1: Open Browser Console
- Press F12
- Go to "Console" tab
- Refresh page and navigate to a bird

### Step 2: Check for Errors
Look for errors related to:
- BirdCallPlayer
- fetch-bird-call
- Classification

### Step 3: Check Species Data
In console, when you click a bird card, you should see the species data.

Add this temporarily to RegionSpeciesCard.tsx after line 43:
```typescript
console.log('Species classification:', {
  scientificName,
  commonName,
  animalType,
  speciesType: classification.speciesType,
  shouldShowBirdCall: classification.speciesType === 'Bird'
});
```

### Step 4: Verify Edge Function
Run in terminal:
```bash
npx supabase functions list
```

Should show: `fetch-bird-call`

If not deployed:
```bash
npx supabase functions deploy fetch-bird-call
```

## Common Issues

### Issue 1: Edge Function Not Deployed
**Symptom:** Icon shows but clicking causes error
**Fix:** Deploy function
```bash
npx supabase functions deploy fetch-bird-call
```

### Issue 2: Database Not Migrated
**Symptom:** No icons show at all
**Fix:** Run migrations in SQL Editor
- Copy `APPLY_ALL_MIGRATIONS.sql`
- Paste in SQL Editor
- Run

### Issue 3: Classification Not Running
**Symptom:** species_type is NULL in database
**Fix:** Run classification UPDATE query
```sql
UPDATE species
SET
  species_type = CASE
    WHEN class ILIKE '%aves%' THEN 'Bird'
    WHEN class ILIKE '%mammalia%' THEN 'Mammal'
    WHEN class ILIKE '%actinopterygii%' OR class ILIKE '%chondrichthyes%' THEN 'Fish'
    WHEN class ILIKE '%reptilia%' THEN 'Reptile'
    WHEN class ILIKE '%amphibia%' THEN 'Amphibian'
    ELSE 'Invertebrate'
  END,
  ui_group = CASE
    WHEN class ILIKE '%aves%' THEN 'Birds'
    ELSE 'Animals'
  END
WHERE species_type IS NULL
LIMIT 10000;  -- Do in batches if needed
```

### Issue 4: Frontend Classification Not Working
**Symptom:** Console shows species_type !== 'Bird' for birds
**Fix:** Check animalType value
- If animalType is "Aves" or similar, classification should map it to "Bird"
- Check `src/utils/speciesClassification.ts` line 31-36

## Test Birds

Try these species (should all show speaker icon):
- Northern Cardinal (*Cardinalis cardinalis*)
- American Robin (*Turdus migratorius*)
- Blue Jay (*Cyanocitta cristata*)
- Common Loon (*Gavia immer*)
- Bald Eagle (*Haliaeetus leucocephalus*)

## Verification Checklist

- [ ] Database has species_type column
- [ ] Birds have species_type = 'Bird'
- [ ] Edge function is deployed
- [ ] Browser console shows no errors
- [ ] Icon appears on bird cards
- [ ] Clicking icon plays sound (or shows loading)
- [ ] Icon doesn't disappear after click

## What Should Happen

1. Navigate to region
2. Filter by 🐦 Birds
3. Click bird card
4. See 🔊 icon next to "Ecological Role: [role]"
5. Click icon → Loading spinner
6. After 3-5 seconds → Sound plays
7. Click again → Sound plays immediately (cached)

## Current Status

**Fixed:**
- ✅ Icon no longer disappears
- ✅ Can replay multiple times
- ✅ Better error handling

**To Verify:**
- ⏳ Database has correct data
- ⏳ Edge function deployed
- ⏳ Icon shows on birds

**Run the queries in CHECK_DATABASE.sql to verify database setup!**
