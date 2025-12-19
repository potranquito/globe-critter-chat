# 🚀 Dietary Category Filter - Deployment Checklist

## Quick Start (Choose ONE method)

### Option A: Supabase Dashboard (Easiest - Recommended)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr
   ```

2. **Apply Migration**
   - Go to SQL Editor
   - Click "New Query"
   - Copy entire contents of: `supabase/migrations/20251016000001_add_dietary_category.sql`
   - Paste and click "Run"
   - Wait for "Success" message

3. **Verify Migration**
   Run this query in SQL Editor:
   ```sql
   SELECT
     dietary_category,
     COUNT(*) as count
   FROM species
   WHERE dietary_category IS NOT NULL
   GROUP BY dietary_category;
   ```

   You should see:
   - Carnivore: ~1000-5000+
   - Herbivore: ~500-2000+
   - Omnivore: ~1000-3000+
   - Producer: ~200-1000+

4. **Done!** ✅ Skip to "Deploy Frontend" section below

---

### Option B: Supabase CLI (If installed)

```bash
# Push the migration
supabase db push

# Verify
supabase db pull
```

---

### Option C: Direct PostgreSQL Connection

```bash
# Connect to your database
psql postgresql://postgres:[YOUR-PASSWORD]@db.iwmbvpdqwekgxegaxrhr.supabase.co:5432/postgres

# Run migration
\i supabase/migrations/20251016000001_add_dietary_category.sql
```

---

## Deploy Frontend

```bash
# 1. Build the project
npm run build

# 2. Test locally first (optional but recommended)
npm run dev
# Open http://localhost:5173
# Check that the left filter shows 4 buttons: Carnivores, Herbivores, Omnivores, Producers

# 3. Deploy to your platform
# (Depends on your hosting - Netlify, Vercel, etc.)
npm run deploy
# OR
git push origin main  # If using CI/CD
```

---

## Deploy Edge Function

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref iwmbvpdqwekgxegaxrhr

# Deploy the function
supabase functions deploy discover-region-species
```

---

## Verification Tests

### Test 1: Check Database
```sql
-- Run in Supabase SQL Editor
SELECT
  dietary_category,
  common_name,
  class,
  trophic_role
FROM species
WHERE dietary_category IS NOT NULL
ORDER BY dietary_category, common_name
LIMIT 20;
```

### Test 2: Check Frontend
1. Open your deployed app
2. Search for any location (e.g., "Arctic")
3. Look at left sidebar - should show 4 filter buttons
4. Click each filter and verify species carousel updates

### Test 3: Check Edge Function
```bash
curl -X POST https://iwmbvpdqwekgxegaxrhr.supabase.co/functions/v1/discover-region-species \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bounds":{"centerLat":70,"centerLng":-150,"minLat":65,"maxLat":75,"minLng":-160,"maxLng":-140},"regionName":"Arctic","limit":5}'
```

Look for `dietaryCategory` field in the response.

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Column already exists! Check if data is populated:
```sql
SELECT COUNT(*) FROM species WHERE dietary_category IS NOT NULL;
```

### Issue: No species showing in filters
**Cause**: dietary_category field is NULL
**Solution**: Data wasn't backfilled. Run the backfill UPDATE:
```sql
UPDATE species
SET dietary_category = CASE
  WHEN trophic_role IN ('Producer', 'Mixotroph') OR species_type IN ('Plant', 'Coral') THEN 'Producer'
  WHEN trophic_role IN ('Predator', 'Scavenger', 'Parasite') THEN 'Carnivore'
  WHEN trophic_role IN ('Herbivore', 'Detritivore') THEN 'Herbivore'
  WHEN trophic_role IN ('Omnivore', 'Filter-feeder') THEN 'Omnivore'
  ELSE 'Omnivore'
END
WHERE dietary_category IS NULL;
```

### Issue: Frontend shows old 3 buttons
**Cause**: Browser cache
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: TypeScript errors
**Cause**: Type definitions out of sync
**Solution**:
```bash
rm -rf node_modules
npm install
npm run build
```

---

## Rollback (If Needed)

### Revert Database:
```sql
-- Remove column
ALTER TABLE species DROP COLUMN IF EXISTS dietary_category;

-- Drop new functions
DROP FUNCTION IF EXISTS classify_dietary_category;
DROP FUNCTION IF EXISTS classify_trophic_role_enhanced;
DROP FUNCTION IF EXISTS auto_classify_species_enhanced;
```

### Revert Frontend:
```bash
git revert HEAD
npm run build
npm run deploy
```

---

## Success Criteria ✅

- [ ] Database migration applied successfully
- [ ] All species have dietary_category populated
- [ ] Left filter shows 4 buttons (Carnivores, Herbivores, Omnivores, Producers)
- [ ] Clicking filters updates species carousel correctly
- [ ] Edge function returns dietary_category field
- [ ] No console errors in browser

---

## Support Files

- **Full Guide**: `DIETARY_CATEGORY_DEPLOYMENT.md`
- **Summary**: `DIETARY_FILTER_SUMMARY.md`
- **Migration**: `supabase/migrations/20251016000001_add_dietary_category.sql`
- **Backfill**: `backfill_dietary_categories.sql`

---

🎉 **You're ready to deploy!** Start with Option A (Supabase Dashboard) for the easiest experience.
