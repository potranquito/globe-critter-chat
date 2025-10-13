# Migration Guide: Mac → Linux

Complete guide to migrate the IUCN species import to your Linux PC for faster processing.

---

## Part 1: Commit & Push from Mac

### 1.1 Commit Current Work
```bash
# Add all relevant files
git add scripts/processIUCNShapefiles.py
git add scripts/check_duplicates.py
git add scripts/check_species_stats.py
git add scripts/clear_species.py
git add scripts/monitor_import.sh
git add scripts/quick_count.py
git add supabase/migrations/20250112000007_remove_species_variant_unique_constraint.sql

# Commit
git commit -m "feat: Remove deduplication to keep all geographic polygons for species

- Remove in-memory deduplication logic from processIUCNShapefiles.py
- Drop species_variant_unique constraint to allow multiple polygons per variant
- Add utility scripts for monitoring and database management
- This enables better species-to-park matching with comprehensive geographic coverage

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin feature/species-filter-banner
```

---

## Part 2: Download IUCN Shapefiles on Linux

You'll need to download the 26 ZIP files again (or transfer them if you have fast network storage).

### Option A: Re-download from IUCN
1. Go to https://www.iucnredlist.org/resources/spatial-data-download
2. Download these files to `~/Downloads/Animal Zips/`:
   - MAMMALS.zip (4.4GB)
   - AMPHIBIANS.zip (1.7GB)
   - REPTILES.zip (1.4GB)
   - Plus all 23 other files (fish, invertebrates, etc.)
   - **Total: ~13GB**

### Option B: Transfer from Mac (Faster if on same network)
```bash
# On Mac - compress and transfer
cd ~/Downloads
tar -czf animal_zips.tar.gz "Animal Zips"
scp animal_zips.tar.gz user@linux-pc:~/Downloads/
```

On Linux:
```bash
cd ~/Downloads
tar -xzf animal_zips.tar.gz
```

---

## Part 3: Setup on Linux

### 3.1 Install Prerequisites

```bash
# Update package manager
sudo apt update  # Debian/Ubuntu
# OR
sudo dnf update  # Fedora

# Install Python 3.11+
sudo apt install python3 python3-pip  # Debian/Ubuntu
# OR
sudo dnf install python3 python3-pip  # Fedora

# Install Git (if not already installed)
sudo apt install git  # Debian/Ubuntu
# OR
sudo dnf install git  # Fedora
```

### 3.2 Clone Repository
```bash
cd ~/repos
git clone https://github.com/YourUsername/globe-critter-chat.git
cd globe-critter-chat
git checkout feature/species-filter-banner
git pull origin feature/species-filter-banner
```

### 3.3 Install Python Dependencies
```bash
pip3 install fiona shapely supabase python-dotenv
```

### 3.4 Verify .env File
Your `.env` file should sync via git if it's tracked, but check it exists:

```bash
cat .env
```

If missing, create `.env` in the project root:

```env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_SERVICE_KEY=your_service_key_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.5 Update Shapefile Path (if needed)
Check `scripts/processIUCNShapefiles.py` line 34:

```python
SHAPEFILE_DIR = Path.home() / 'Downloads' / 'Animal Zips'
```

This should work on Linux with the same path structure.

---

## Part 4: Clear Database & Run Import

### 4.1 Clear Existing Data
```bash
# Clear the database (removes partial Mac import)
python3 scripts/clear_species.py
```

### 4.2 Start Import
```bash
# Run the import (with logging)
python3 scripts/processIUCNShapefiles.py 2>&1 | tee import.log
```

### 4.3 Monitor Progress
Open a second terminal:
```bash
# Check progress
python3 scripts/quick_count.py

# Or use the monitoring script
bash scripts/monitor_import.sh
```

---

## Part 5: What to Expect

### What You Should See:
```
📁 Found 26 shapefile archives
📊 Current species in database: 0

[1/26] Processing: ABALONES... ✓
[2/26] Processing: AMPHIBIANS (5251 features)...
  ↳ Inserting 5251 species records (all geographic regions)...
  ✓ Inserted 5251/5251 records  <-- NO deduplication!
```

**Key difference:** You should see the FULL feature count being inserted (e.g., 5251/5251 for amphibians, not 4526 like before).

**Estimated time:** 20-30 minutes (may be faster depending on CPU)

---

## Part 6: Verify Success

After import completes:

```bash
# Check final count
python3 scripts/quick_count.py
```

**Expected result:** ~35,000-40,000 records (vs 21,194 with deduplication)

Run detailed stats:
```bash
python3 scripts/check_species_stats.py
```

You should see:
- MAMMALS: ~13,178 records (not 3,602)
- AMPHIBIANS: ~5,251 records (not 4,526)
- REPTILES: ~6,927 records (not 5,155)

---

## Part 7: Troubleshooting

### Error: "Module not found: fiona"
```bash
pip3 install fiona shapely supabase python-dotenv
```

### Error: "Cannot find shapefile directory"
Update line 34 in `scripts/processIUCNShapefiles.py` with correct path.

### Error: "Missing Supabase credentials"
Check your `.env` file exists and has correct values.

### Error: "duplicate key value violates unique constraint"
The migration wasn't applied. Run in Supabase SQL Editor:
```sql
ALTER TABLE species DROP CONSTRAINT IF EXISTS species_variant_unique;
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Clone repo | `git clone <url>` |
| Pull latest | `git pull origin feature/species-filter-banner` |
| Install deps | `pip3 install fiona shapely supabase python-dotenv` |
| Clear database | `python3 scripts/clear_species.py` |
| Run import | `python3 scripts/processIUCNShapefiles.py` |
| Check progress | `python3 scripts/quick_count.py` |
| View stats | `python3 scripts/check_species_stats.py` |

---

## Summary Checklist

- [ ] 1. Commit & push from Mac
- [ ] 2. Download/transfer IUCN shapefiles (13GB)
- [ ] 3. Install Python & pip on Linux
- [ ] 4. Clone repo on Linux
- [ ] 5. Pull latest changes
- [ ] 6. Install Python dependencies
- [ ] 7. Verify `.env` file exists
- [ ] 8. Clear database
- [ ] 9. Run import
- [ ] 10. Wait 20-30 minutes
- [ ] 11. Verify ~35,000-40,000 records

**Questions?** Check the troubleshooting section or the main HANDOFF.md file.
