# 🚀 Deploy Edge Function - Fix Missing dietary_category

## The Problem
The frontend code is updated, database is updated, but the **Edge Function hasn't been deployed** with the new code that returns `dietary_category`.

That's why all animals show as "omnivores" - the frontend is falling back to the default classification logic because it's not receiving the field from the API.

---

## Solution: Deploy the Edge Function

### Option 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref iwmbvpdqwekgxegaxrhr

# Deploy the function
supabase functions deploy discover-region-species
```

---

### Option 2: Supabase Dashboard

1. **Go to Edge Functions:**
   https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/functions

2. **Find `discover-region-species` function**

3. **Click "Deploy new version"**

4. **Copy the entire contents of:**
   `supabase/functions/discover-region-species/index.ts`

5. **Paste and deploy**

---

### Option 3: Manual API Deploy (Advanced)

If the above don't work, you can deploy via the Supabase API, but Option 1 or 2 is much easier.

---

## How to Verify It Worked

After deploying, test the Edge Function directly:

```bash
curl -X POST https://iwmbvpdqwekgxegaxrhr.supabase.co/functions/v1/discover-region-species \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "centerLat": 70,
      "centerLng": -150,
      "minLat": 65,
      "maxLat": 75,
      "minLng": -160,
      "maxLng": -140
    },
    "regionName": "Arctic Tundra",
    "limit": 5
  }'
```

**Look for `dietaryCategory` in the response:**
```json
{
  "species": [
    {
      "commonName": "Polar Bear",
      "dietaryCategory": "Carnivore",  // ← This should be present!
      ...
    }
  ]
}
```

---

## After Deployment

1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Search for an ecoregion** again
3. **Check the species carousel** - animals should now show correct dietary categories
4. **Click the filter buttons** - filtering should work correctly

---

## Why This Happens

The Edge Function is running in Supabase's cloud infrastructure. Even though we updated the code locally, it needs to be **deployed** to take effect.

Think of it like:
- ✅ Database updated (done)
- ✅ Frontend code updated (done)
- ❌ API/Backend deployed (needs to be done)

Once the Edge Function is deployed, the API will return `dietaryCategory` from the database, and the frontend will display it correctly!

---

🎯 **Deploy the Edge Function and the filtering will work perfectly!**
