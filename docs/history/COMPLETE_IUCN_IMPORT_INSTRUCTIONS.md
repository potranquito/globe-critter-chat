# Complete IUCN Import Instructions

## Status
✅ **The script fix is working!** Sample_points are now correctly stored as JSONB arrays.

- Current species: 62,757
- Valid (with JSONB sample_points): 9,108
- Old (NULL sample_points): 53,649

## Problem
The old NULL records can't be bulk-deleted due to Supabase timeout limits.

## Solution: Manual Truncate + Fresh Import

### Step 1: Truncate via Supabase Dashboard (2 minutes)

1. Go to: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql

2. Copy and run this SQL:
```sql
TRUNCATE TABLE species CASCADE;
SELECT COUNT(*) FROM species;  -- Should return 0
```

3. Verify it shows 0 records

### Step 2: Run Fresh Import (30 minutes)

```bash
cd ~/repos/globe-critter-chat
source venv/bin/activate
python3 -u scripts/processIUCNShapefiles.py > iucn_import_final.log 2>&1 &
```

### Step 3: Monitor Progress

```bash
# Check status anytime
./check_import_status.sh

# Or watch live
tail -f iucn_import_final.log
```

Expected output:
```
[1/30] ✓ Completed ABALONES (54 species)
[2/30] ✓ Completed AMPHIBIANS (5,251 species)
[3/30] ✓ Completed CONE_SNAILS (639 species)
...
[30/30] ✓ Completed

Final species: ~53,000+
Duration: ~30 minutes
```

### Step 4: Verify Sample Points

```bash
python3 scripts/check_sample_points.py
```

Should show:
- All species have JSONB array sample_points
- No NULL sample_points remain

## Alternative: Skip Truncate and Accept Duplicates

If you don't want to truncate, you can run the import now and it will add ~53K new species on top of the 62K existing. You'll have ~115K total species (with ~53K duplicates having NULL sample_points).

Later you can clean up duplicates with:
```sql
DELETE FROM species WHERE sample_points IS NULL;
```

But the truncate approach is cleaner and faster.

## Files Ready
- ✅ `scripts/processIUCNShapefiles.py` - Fixed to store JSONB
- ✅ `scripts/check_sample_points.py` - Verify data
- ✅ `check_import_status.sh` - Monitor progress
- ✅ `TRUNCATE_SPECIES.sql` - SQL to run in dashboard
