# 🚀 Backend Setup Instructions

## ✅ Step 1: Database URL Added
Your database URL has been added to `.env`:
```
SUPABASE_DB_URL=postgresql://postgres:Iloveanimals1234!!@@db.iwmbvpdqwekgxegaxrhr.supabase.co:5432/postgres
```

---

## 📋 Next Steps

### Option A: Using Supabase CLI (Recommended - No psql needed!)

**1. Install Supabase CLI**
```bash
npm install -g supabase
```

**2. Login to Supabase**
```bash
supabase login
```

**3. Link Your Project**
```bash
supabase link --project-ref iwmbvpdqwekgxegaxrhr
```
Enter your database password when prompted: `Iloveanimals1234!!@`

**4. Apply Migrations**
```bash
# This applies both migrations automatically
supabase db push
```

**5. Deploy Edge Function**
```bash
supabase functions deploy fetch-bird-call
```

**6. Done!** Restart your dev server and test bird calls 🎉

---

### Option B: Using Supabase Dashboard (Manual but works!)

**1. Apply Migration 1 (Species Classification)**

a. Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/editor
b. Click "SQL Editor" in left sidebar
c. Click "New Query"
d. Copy contents of `supabase/migrations/20251015000001_add_species_classification.sql`
e. Paste and click "Run"
f. Wait ~30 seconds (classifying 180,000 species)

**2. Apply Migration 2 (Bird Calls)**

a. Still in SQL Editor, click "New Query"
b. Copy contents of `supabase/migrations/20251015000002_add_bird_calls.sql`
c. Paste and click "Run"

**3. Deploy Edge Function**

a. Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/functions
b. Click "New Function"
c. Name: `fetch-bird-call`
d. Copy contents of `supabase/functions/fetch-bird-call/index.ts`
e. Paste and click "Deploy function"

**4. Done!** Test bird calls in your app 🎉

---

### Option C: Install PostgreSQL Client (Original Method)

**Install psql:**

**macOS:**
```bash
brew install postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

**Then run:**
```bash
./setup_complete_backend.sh
```

---

## 🧪 Testing After Setup

**1. Check Classifications**
Go to SQL Editor and run:
```sql
SELECT species_type, COUNT(*) as count
FROM species
WHERE species_type IS NOT NULL
GROUP BY species_type
ORDER BY count DESC;
```

You should see counts for Mammal, Bird, Fish, etc.

**2. Check Bird Calls Table**
```sql
SELECT COUNT(*) FROM bird_calls;
```

Should return 0 initially (will populate as users play bird calls).

**3. Test in App**
- Navigate to a region with birds
- Click filter: 🐦 Birds
- Click on a bird species card
- Look for 🔊 speaker icon next to "Ecological Role"
- Click to play bird call!

---

## 🎯 Quick Summary

| Method | Pros | Cons |
|--------|------|------|
| **Supabase CLI** | Easy, automated, official | Need to install CLI |
| **Dashboard** | No install, visual | Manual copy/paste |
| **PostgreSQL** | Direct access | Need psql installed |

**Recommended:** Use Supabase CLI (Option A)

---

## 🐛 Troubleshooting

**"supabase: command not found"**
```bash
npm install -g supabase
```

**"Login failed"**
- Make sure you're using the email you signed up with
- Check for verification email

**"Project not found"**
- Double-check project ref: `iwmbvpdqwekgxegaxrhr`
- Make sure you're logged in with the right account

**Bird calls not working**
1. Check edge function deployed: `supabase functions list`
2. Check browser console for errors
3. First call takes 3-5 seconds (fetching from API)
4. Subsequent calls are instant (cached)

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Species have classifications (`SELECT * FROM species LIMIT 1;` shows species_type column)
- [ ] Bird calls table exists (`SELECT * FROM bird_calls;` works)
- [ ] Edge function deployed (shows in dashboard)
- [ ] Speaker icon appears on bird cards
- [ ] Bird calls play when clicked

---

## 🎉 You're Almost Done!

Choose your preferred method above and complete the setup. The frontend is already 100% working - this just enables:
- ⚡ Faster filtering (database-side)
- 🐦 Bird calls playback
- 📊 Better performance with large datasets

**Next:** Pick Option A, B, or C above and follow the steps!

---

**Questions?** Check the main `IMPLEMENTATION_COMPLETE.md` for detailed documentation.
