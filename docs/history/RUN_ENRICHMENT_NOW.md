# 🖼️ Run Image Enrichment - Simple Guide

## ✅ Everything is Working!

Your UX flow is **perfect** now:
- ✅ Click ecoregion → Shows ecoregion card
- ✅ Click park (green dot) → Shows park card
- ✅ Click species → Shows species card
- ✅ Cards replace each other properly

**Now let's add images!**

---

## 🚀 Quick Start (5-10 minutes)

### Step 1: Check Your Environment

You need:
- ✅ Python 3 installed
- ✅ `.env` file with Supabase credentials (already exists)
- ✅ Internet connection

### Step 2: Install Dependencies

```bash
pip3 install requests supabase python-dotenv
```

Or if using a virtual environment:
```bash
# Create virtual environment (one time only)
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install packages
pip install requests supabase python-dotenv
```

### Step 3: Run Enrichment Script

```bash
# Enrich species with images and common names (50 items, ~5-10 minutes)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50

# Enrich parks with images (25 items, ~3-5 minutes)
python3 scripts/enrichMediaFromWikimedia.py --type parks --limit 25

# Enrich ecoregions with images (25 items, ~3-5 minutes)
python3 scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 25
```

**Or do everything at once:**
```bash
python3 scripts/enrichMediaFromWikimedia.py --type all --limit 100
```

---

## 📊 What the Script Does

### For Species:
1. Searches Wikimedia Commons for species images
2. Falls back to Wikipedia page images
3. Falls back to iNaturalist biodiversity photos
4. Extracts common names from Wikipedia articles
5. Saves image URLs and common names to database

### For Parks:
1. Searches for park images in Wikimedia Commons
2. Tries variations like "[name] national park"
3. Falls back to Wikipedia images
4. Saves URLs with proper attribution

### For Ecoregions:
1. Searches for landscape images in Wikimedia
2. Tries "[name] ecoregion" variations
3. Gets high-quality images (1200px)
4. Saves with attribution and licensing info

---

## 🔍 Example Output

```
=== Wikimedia Image & Common Name Enrichment ===
Type: species, Limit: 50

=== Enriching species with images and common names ===
Found 50 species to potentially enrich

[1/50] Enriching: Panthera tigris
  Fetching image...
  ✓ Found image from wikimedia_commons
  Fetching common name...
  ✓ Found common name: Tiger
  ✓ Updated database

[2/50] Enriching: Aquila chrysaetos
  Fetching image...
  ✓ Found image from wikipedia
  Fetching common name...
  ✓ Found common name: Golden Eagle
  ✓ Updated database

...

=== Species enrichment complete ===
Enriched: 45, Skipped: 5
```

---

## 🎯 Immediate Results

**After enrichment completes:**

1. Refresh your browser at http://localhost:8080
2. Click on species from the carousel
3. **You'll see actual images** instead of emoji placeholders!
4. **Common names will be displayed** (e.g., "Tiger" instead of just "Panthera tigris")
5. Click on parks → See park images
6. Click on ecoregions → See landscape images

**Images appear instantly** - no restart needed!

---

## ⚙️ Script Options

### Adjust the Limit
```bash
# Start small (test with 10 items)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 10

# Medium batch (50 items)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50

# Large batch (200 items, ~20-30 minutes)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 200
```

### Adjust Batch Size (Rate Limiting)
```bash
# Slower but safer (fewer API calls per minute)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 100 --batch-size 5

# Default (good balance)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 100 --batch-size 10
```

---

## 📝 Image Sources (All FREE!)

### 1. Wikimedia Commons (Best Quality)
- ✅ Professional nature photography
- ✅ Properly licensed (Creative Commons)
- ✅ High resolution
- ✅ No API key needed

### 2. Wikipedia (Good Coverage)
- ✅ Article thumbnail images
- ✅ Widely available
- ✅ Various licenses
- ✅ No API key needed

### 3. iNaturalist (Community Photos)
- ✅ Biodiversity observations
- ✅ Community-sourced
- ✅ Good species coverage
- ✅ No API key needed

**All use CDN URLs** - No storage costs! 💰

---

## 🔧 Troubleshooting

### Error: "Module not found: requests"
```bash
pip3 install requests
```

### Error: "Module not found: supabase"
```bash
pip3 install supabase
```

### Error: "Missing SUPABASE_URL"
Check your `.env` file exists and has:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_SERVICE_KEY=...
```

### Script runs but finds no images
This is normal! Not every species has images. The script will:
- Try multiple sources
- Skip if nothing found
- Continue to next item
- Report success rate at the end

Typical success rate: 60-80% for species

### Rate limiting errors
If you see "Too many requests":
```bash
# Use smaller batches with delays
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50 --batch-size 5
```

---

## 📊 Check Results

### In Browser (Easiest)
1. Go to http://localhost:8080
2. Click on species → See images and common names!

### In Database (SQL)
```sql
-- Check species with images
SELECT
  COUNT(*) as total,
  COUNT(image_url) as with_images,
  COUNT(common_name) as with_names,
  ROUND(100.0 * COUNT(image_url) / COUNT(*), 2) as image_pct
FROM species;

-- See image sources
SELECT
  image_source,
  COUNT(*) as count
FROM species
WHERE image_url IS NOT NULL
GROUP BY image_source;

-- Check specific species
SELECT
  scientific_name,
  common_name,
  image_source,
  LEFT(image_url, 50) as image_preview
FROM species
WHERE image_url IS NOT NULL
LIMIT 10;
```

---

## 🎨 Example Results

### Before Enrichment:
```
Species Card:
┌──────────────────┐
│   🦁 (emoji)     │
│                  │
│ Panthera tigris  │
│ Mammal           │
│ Status: EN       │
└──────────────────┘
```

### After Enrichment:
```
Species Card:
┌──────────────────┐
│  [Tiger Photo]   │  ← Actual image!
│                  │
│ Tiger            │  ← Common name!
│ Panthera tigris  │
│ Mammal           │
│ Status: EN       │
└──────────────────┘
```

---

## ⏱️ Time Estimates

| Task | Items | Time | What You Get |
|------|-------|------|--------------|
| Test run | 10 species | 2 min | Quick preview |
| Small batch | 50 species | 5-10 min | Good coverage |
| Medium batch | 100 species | 10-15 min | Better coverage |
| Large batch | 200 species | 20-30 min | Excellent coverage |
| All types | 100 total | 15-20 min | Complete enrichment |

**Built-in rate limiting prevents API throttling!**

---

## 🚀 Recommended Workflow

### Step 1: Test Run (2 minutes)
```bash
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 10
```
✓ Verify it works
✓ See immediate results in browser

### Step 2: Species Batch (10 minutes)
```bash
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50
```
✓ Enrich most common species
✓ Get common names

### Step 3: Parks & Ecoregions (5 minutes each)
```bash
python3 scripts/enrichMediaFromWikimedia.py --type parks --limit 25
python3 scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 25
```
✓ Beautiful park images
✓ Landscape photos for regions

### Step 4: Expand Later (optional)
```bash
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 200
```
✓ Cover more species over time

---

## 💡 Pro Tips

1. **Start small** - Test with 10 items first
2. **Run during off-hours** - Less likely to hit rate limits
3. **Check results in browser** - See images immediately
4. **Re-run safely** - Script skips already-enriched items
5. **No API keys needed** - Everything is public APIs

---

## ✅ Success Checklist

After running enrichment:

- [ ] Script completed without errors
- [ ] Browser shows species images (not just emojis)
- [ ] Common names displayed (e.g., "Tiger" instead of scientific name only)
- [ ] Park images appear on park cards
- [ ] Ecoregion images show beautiful landscapes
- [ ] Attribution info stored in database

---

## 🎉 Next Steps

1. **Run the enrichment** (start with 10 items to test)
2. **Refresh browser** and see the images
3. **Expand gradually** (50, 100, 200 items)
4. **Enjoy your beautiful app!**

---

## 📞 Quick Reference

### Run Commands:
```bash
# Test (2 min)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 10

# Species (10 min)
python3 scripts/enrichMediaFromWikimedia.py --type species --limit 50

# Parks (5 min)
python3 scripts/enrichMediaFromWikimedia.py --type parks --limit 25

# Ecoregions (5 min)
python3 scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 25

# Everything (20 min)
python3 scripts/enrichMediaFromWikimedia.py --type all --limit 100
```

### Check Results:
- **Browser:** http://localhost:8080
- **Database:** See SQL queries above

### Get Help:
- Script logs show detailed progress
- Check browser console for image URLs
- See `WIKIMEDIA_ENRICHMENT_GUIDE.md` for details

---

## 🎊 You're Ready!

Run the enrichment and watch your app come to life with beautiful images! 🖼️✨

**Start with:** `python3 scripts/enrichMediaFromWikimedia.py --type species --limit 10`
