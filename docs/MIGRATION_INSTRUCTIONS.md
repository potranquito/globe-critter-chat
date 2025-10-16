# Database Migration Instructions

## Problem Summary

The application is experiencing database query errors:
- **406 Error**: The `ecoregions` table query fails because Row Level Security (RLS) policies are missing or the table doesn't exist
- **400 Errors**: The spatial query functions `get_species_in_bounds` and `get_diverse_species_in_region` don't exist

## Solution: Apply Migrations to Supabase

### Step-by-Step Instructions

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr
   - Or go to: https://supabase.com and select your project "iwmbvpdqwekgxegaxrhr"
   - Navigate to: **SQL Editor** (in the left sidebar)

2. **Apply migrations in this exact order:**

   Each migration builds on the previous one, so order matters!

   #### Migration 1: Initial Schema
   ```
   File: supabase/migrations/20251010000001_initial_schema.sql
   ```
   This creates the base tables: users, regions, locations, species (old), lessons, etc.

   #### Migration 2: Species Database
   ```
   File: supabase/migrations/20251012000000_create_species_tables.sql
   ```
   This creates the new species tables with PostGIS support:
   - `species` (with geographic_range)
   - `ecoregions` ⚠️ This fixes the 406 error!
   - `species_ecoregions`
   - `parks`
   - `species_parks`
   - `enrichment_cache`

   #### Migration 3: WDPA Parks Update
   ```
   File: supabase/migrations/20251012000001_update_parks_for_wdpa.sql
   ```
   Adds WDPA-specific fields to parks table.

   #### Migration 4: Species Curation & Sessions
   ```
   File: supabase/migrations/20251013000001_species_curation_and_sessions.sql
   ```
   Adds user session tracking and curation features.

   #### Migration 5: Spatial Query Functions
   ```
   File: supabase/migrations/20251013000002_add_spatial_query_functions.sql
   ```
   ⚠️ This fixes the 400 errors!
   Creates the missing functions:
   - `get_species_in_bounds(bbox_wkt, max_results)`
   - `get_diverse_species_in_region(region_lat, region_lng, radius_degrees, ...)`

   #### Migration 6: RLS Policies (NEW)
   ```
   File: supabase/migrations/20251013000003_add_missing_rls_policies.sql
   ```
   ⚠️ This fixes the 406 error by enabling RLS policies!
   Enables Row Level Security on all new tables and allows public read access.

3. **How to apply each migration:**
   - Open the SQL file in your code editor
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success confirmation
   - Move to the next migration

4. **Verify the migrations worked:**
   - In Supabase Dashboard, go to **Table Editor**
   - Check that these tables exist:
     - `species`
     - `ecoregions` ⚠️
     - `parks`
     - `species_ecoregions`
     - `species_parks`
   - Go to **Database** → **Functions**
   - Check that these functions exist:
     - `get_species_in_bounds`
     - `get_diverse_species_in_region`

5. **Test the application:**
   - Refresh your browser
   - Click on an eco-region (green dot on globe)
   - The errors should be gone!
   - Species carousel should populate with data

## What Each Error Means

### 406 Error: "Not Acceptable"
- **Cause**: Supabase REST API rejects requests to tables without RLS policies
- **Fix**: Apply migrations 2, 3, and 6 to create tables and enable RLS

### 400 Error: "Bad Request"
- **Cause**: The RPC function doesn't exist in the database
- **Fix**: Apply migration 5 to create the spatial query functions

## Additional Migrations (Apply these too!)

You have other migrations that should also be applied to get the latest schema:

```
20250112000003_add_species_image_url.sql
20250112000005_simplify_species_schema.sql
20250112000006_accurate_species_geography.sql
20250112000007_add_subspecies_support.sql
20250112000007_remove_species_variant_unique_constraint.sql
```

Apply these AFTER the main migrations above, in chronological order (sorted by filename).

## Troubleshooting

**If you still see errors after applying migrations:**

1. Check that RLS is enabled on tables:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('species', 'ecoregions', 'parks');
   ```
   All should show `rowsecurity = true`

2. Check that policies exist:
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. Check that functions exist:
   ```sql
   SELECT proname, proargnames
   FROM pg_proc
   WHERE proname LIKE '%species%';
   ```

4. Check PostGIS extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'postgis';
   ```
   If not found, run: `CREATE EXTENSION postgis;`

## Alternative: One-Command Migration (Advanced)

If you have the Supabase CLI installed, you can apply all migrations at once:

```bash
supabase db push
```

This will apply all migrations in the `supabase/migrations` folder in order.
