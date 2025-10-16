# 🔄 Database Restoration Guide

Your Supabase database was reset, but **all your work is safe** in backup files! This guide will restore everything.

## 📋 What Will Be Restored

- ✅ 6 curated ecoregions (Arctic, Congo, Amazon, Madagascar, Borneo, Coral Triangle)
- ✅ 247 curated species with images and descriptions
- ✅ Species-to-ecoregion links
- ✅ All database tables, indexes, and functions
- ✅ Row Level Security (RLS) policies
- ✅ Global health statistics

## 🚀 Restoration Steps

### Step 1: Run SQL Script in Supabase

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/jqirupugxgsqgydxaebt/sql

2. **Click "New Query"**

3. **Copy the entire contents of:** `RESTORE_DATABASE_STEP_1.sql`

4. **Paste into the SQL Editor**

5. **Click "Run"**

6. **Wait for completion** (should take 5-10 seconds)

7. **Verify success** - You should see:
   ```
   ✅ Database structure created!
   ecoregions_count: 6
   ```

---

### Step 2: Get Supabase Service Role Key

You need the **Service Role Key** (not the publishable key) to import species.

1. **Go to:** https://supabase.com/dashboard/project/jqirupugxgsqgydxaebt/settings/api

2. **Scroll to "Project API keys"**

3. **Copy the "service_role" key** (starts with `eyJ...`)
   - ⚠️ **Keep this secret!** Don't commit it to Git

4. **Set environment variable:**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

---

### Step 3: Run Python Import Script

1. **Make sure you're in the project directory:**
   ```bash
   cd /home/potranquito/repos/globe-critter-chat
   ```

2. **Activate Python virtual environment (if you have one):**
   ```bash
   source venv/bin/activate
   ```

3. **Install required package (if not already installed):**
   ```bash
   pip install supabase
   ```

4. **Run the import script:**
   ```bash
   python3 restore_species_from_csv.py
   ```

5. **Watch the progress:**
   ```
   🚀 Starting species import from CSV...
   📊 Found 247 species in CSV
     ✓ Imported 25 species...
     ✓ Imported 50 species...
     ...
   ✅ Import complete!
   🔗 Linking species to ecoregions...
   ✅ Created 247 species-ecoregion links
   📊 Updating global health stats...
   🎉 Database restoration complete!
   ```

---

### Step 4: Verify in Your App

1. **Refresh your browser** at http://localhost:8081

2. **You should now see:**
   - ✅ 6 green ecoregion pins on the globe
   - ✅ Species data when you click an ecoregion
   - ✅ Images and descriptions for species
   - ✅ Conservation status colors

---

## 🔍 Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not found"

Make sure you exported the environment variable:
```bash
export VITE_SUPABASE_URL="https://jqirupugxgsqgydxaebt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### "ModuleNotFoundError: No module named 'supabase'"

Install the Supabase Python client:
```bash
pip install supabase
```

### "curated_species_database_enriched.csv not found"

Make sure you're in the project root directory:
```bash
cd /home/potranquito/repos/globe-critter-chat
ls -la curated_species_database_enriched.csv
```

### SQL Script Fails

If the SQL script fails:
1. Check if tables already exist - you may need to drop them first
2. The script includes `DROP TABLE` statements, so it should work even on existing databases
3. If still failing, manually delete tables in Supabase Table Editor first

### Import Script Shows Errors

If some species fail to import:
- The script will continue and import the rest
- Check the error messages for details
- Most errors are due to duplicate scientific names or constraint violations
- The script will still create links for successfully imported species

---

## 📊 Verification Queries

After restoration, run these in Supabase SQL Editor to verify:

```sql
-- Check ecoregions
SELECT ecoregion_id, name, realm FROM ecoregions ORDER BY name;

-- Check species count
SELECT COUNT(*) as total_species FROM species;

-- Check species by ecoregion
SELECT
  e.name as ecoregion,
  COUNT(s.id) as species_count
FROM ecoregions e
LEFT JOIN species_ecoregions se ON e.id = se.ecoregion_id
LEFT JOIN species s ON se.species_id = s.id
GROUP BY e.name
ORDER BY e.name;

-- Check species with images
SELECT COUNT(*) as species_with_images
FROM species
WHERE image_url IS NOT NULL;

-- Check global health
SELECT * FROM global_health;
```

Expected results:
- 6 ecoregions
- ~247 species (may be slightly less due to duplicates)
- All ecoregions should have species
- Most species should have images
- Global health should show conservation stats

---

## 🎯 What's Next

After restoration:

1. **Test the app** - Click on ecoregions, view species
2. **Check images** - Most species should have images from Wikimedia
3. **Test search** - Search for species names
4. **Verify conservation status colors** - CR=red, EN=orange, VU=yellow, etc.

---

## 🆘 Still Having Issues?

1. Check the browser console (F12) for errors
2. Verify Supabase connection in .env file
3. Make sure dev server is running: `npm run dev`
4. Check that ecoregions table has 6 rows
5. Check that species table has ~247 rows

---

## 📝 Files Created

- `RESTORE_DATABASE_STEP_1.sql` - SQL script to create all tables
- `restore_species_from_csv.py` - Python script to import species
- `DATABASE_RESTORATION_GUIDE.md` - This file

---

## 🔐 Security Reminder

**After restoration:**

1. ✅ Revoke the old exposed OpenAI API key at https://platform.openai.com/api-keys
2. ✅ Keep SUPABASE_SERVICE_ROLE_KEY secret (never commit to Git)
3. ✅ The .env file has been removed from GitHub
4. ✅ Your new OpenAI API key is safe in the local .env file

---

**Ready to restore? Start with Step 1!** 🚀
