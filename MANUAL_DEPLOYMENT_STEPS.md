# 🚀 Manual Backend Deployment Steps

Since the automated script requires interactive browser login, please run these commands **in your terminal** (not through me):

---

## Step-by-Step Commands

### 1. Login to Supabase
```bash
npx supabase login
```
This will open your browser for authentication. Login with your Supabase account.

### 2. Link Your Project
```bash
npx supabase link --project-ref iwmbvpdqwekgxegaxrhr --password "Iloveanimals1234!!@"
```

### 3. Apply Database Migrations
```bash
npx supabase db push
```
This will:
- Add species_type, ui_group, trophic_role columns
- Classify all 180,000+ species
- Create bird_calls table
- Takes about 30 seconds

### 4. Deploy Edge Function
```bash
npx supabase functions deploy fetch-bird-call
```

### 5. Done! 🎉

---

## Expected Output

After step 3 (db push), you should see:
```
Applying migration 20251015000001_add_species_classification.sql...
Applying migration 20251015000002_add_bird_calls.sql...
Finished supabase db push.
```

After step 4 (functions deploy), you should see:
```
Deploying function fetch-bird-call...
Function deployed successfully!
```

---

## Verify It Worked

### Check Classifications
Run in Supabase SQL Editor:
```sql
SELECT species_type, COUNT(*)
FROM species
WHERE species_type IS NOT NULL
GROUP BY species_type
ORDER BY COUNT(*) DESC;
```

Should show counts like:
- Fish: ~90,000
- Bird: ~11,000
- Mammal: ~6,000
- etc.

### Check Bird Calls Table
```sql
SELECT COUNT(*) FROM bird_calls;
```
Should return 0 initially (will populate as users play calls).

### Check Edge Function
Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/functions

You should see `fetch-bird-call` listed.

---

## Test in App

1. Refresh your browser at http://localhost:8080
2. Navigate to a region
3. Filter by 🐦 Birds
4. Click on a bird species
5. Look for 🔊 speaker icon
6. Click to play bird call!

**First time:** 3-5 seconds (fetching from API)
**After that:** Instant! (cached)

---

## Troubleshooting

### "Login failed"
- Make sure you're logged into Supabase.com with the correct account
- Try: `npx supabase logout` then `npx supabase login` again

### "Project not found"
- Double check project ref: `iwmbvpdqwekgxegaxrhr`
- Verify you have access to this project

### "Migration failed"
- Check SQL Editor for errors
- Ensure you have database admin permissions

### "Bird calls not working"
- Check browser console for errors
- Verify edge function is deployed
- Make sure you're clicking on a bird species (filter by Birds)

---

## All 4 Commands in One Block

Copy and paste these one at a time:

```bash
# 1. Login (opens browser)
npx supabase login

# 2. Link project
npx supabase link --project-ref iwmbvpdqwekgxegaxrhr --password "Iloveanimals1234!!@"

# 3. Apply migrations
npx supabase db push

# 4. Deploy function
npx supabase functions deploy fetch-bird-call
```

---

## What You're Deploying

### Migration 1: Species Classification
- Adds 3 columns to species table
- Classifies all species by type (Mammal, Bird, Fish, etc.)
- Maps to UI groups (Animals, Birds, Plants & Corals)
- Determines ecological roles (Predator, Herbivore, etc.)

### Migration 2: Bird Calls
- Creates bird_calls caching table
- Stores Xeno-Canto recordings metadata
- Enables instant playback after first fetch

### Edge Function: fetch-bird-call
- Fetches bird calls from Xeno-Canto API
- Caches top 3 recordings per species
- Returns best quality recording
- Tracks playback statistics

---

## Time Estimate

- Login: 30 seconds
- Link: 10 seconds
- Migrations: 30-60 seconds (classifying 180k species)
- Function deploy: 20 seconds

**Total:** ~2 minutes

---

**Questions?** Check the browser console or Supabase logs for errors.

**Ready?** Run the 4 commands above in your terminal! 🚀
