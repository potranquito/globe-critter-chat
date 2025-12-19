# 🔧 Fix Dietary Category Filtering - Apply Now

## Problem Found
The filter buttons weren't working because the database functions (`get_balanced_ecoregion_species` and `get_balanced_spatial_species`) were NOT returning the new `dietary_category` field to the frontend.

## Solution
A new migration that updates these functions to include all classification fields.

---

## 🚀 Quick Fix (2 steps)

### Step 1: Apply Database Migration

**Go to Supabase Dashboard SQL Editor:**
https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql

**Copy and paste this entire file:**
```
supabase/migrations/20251016000002_add_dietary_fields_to_functions.sql
```

**Run it** ✅

---

### Step 2: Restart Dev Server

```bash
# Kill current dev server
pkill -f "vite"

# Restart
npm run dev
```

Then test:
1. Open http://localhost:5173
2. Search for an ecoregion (e.g., "Arctic")
3. Check left sidebar - should show new emojis: 🥩 🌱 🍽️ ☀️
4. Click each filter button
5. Species carousel should update with filtered results

---

## What Changed

### New Emojis ✨
- 🥩 **Carnivores** (meat-eaters)
- 🌱 **Herbivores** (plant-eaters)
- 🍽️ **Omnivores** (mixed diet)
- ☀️ **Producers** (plants & corals)

### Database Functions Fixed
Both functions now return:
- `species_type`
- `ui_group`
- `trophic_role`
- `dietary_category` ← **This was missing!**

---

## Verification

After applying the migration, run this query in SQL Editor:

```sql
-- Test the function returns dietary_category
SELECT
  common_name,
  class,
  dietary_category,
  trophic_role
FROM get_balanced_ecoregion_species(
  (SELECT id FROM ecoregions LIMIT 1),
  3,
  ARRAY[]::TEXT[]
)
LIMIT 10;
```

You should see `dietary_category` populated with values like:
- Carnivore
- Herbivore
- Omnivore
- Producer

---

## If Filtering Still Doesn't Work

Check browser console for errors:
```bash
# Open browser DevTools (F12)
# Check Console tab for errors
```

Common issues:
1. **Hard refresh needed**: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Edge Function not redeployed**: `supabase functions deploy discover-region-species`
3. **TypeScript errors**: `npm install && npm run dev`

---

## Next Steps After Fix Works

1. ✅ Verify filtering works locally
2. Deploy Edge Function: `supabase functions deploy discover-region-species`
3. Build frontend: `npm run build`
4. Deploy to production

---

🎉 **Once you apply the migration, filtering should work immediately!**
