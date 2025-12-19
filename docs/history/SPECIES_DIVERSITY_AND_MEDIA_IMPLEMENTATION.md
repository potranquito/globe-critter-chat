# Species Diversity & Media Enrichment Implementation

## Summary

This implementation addresses three key requirements:

1. ✅ **Balanced Species Distribution** - Equal representation across taxonomic groups (mammals, birds, reptiles, amphibians, fish, plants)
2. ✅ **Wikimedia Image Integration** - Automatic image fetching for species, parks, and ecoregions
3. ✅ **Common Name Enrichment** - Automatic common name extraction for species

## What Was Implemented

### 1. Database Functions for Balanced Species Selection

**File:** `supabase/migrations/20251014000001_balanced_species_and_media.sql`

Created two new PostgreSQL functions:

#### `get_balanced_ecoregion_species()`
- Returns species from an ecoregion with balanced taxonomic representation
- Parameters:
  - `p_ecoregion_id`: UUID of the ecoregion
  - `p_species_per_class`: Number of species per taxonomic group (default: 3)
  - `p_exclude_species`: Optional species to exclude
- Returns equal numbers of: Mammals, Birds, Reptiles, Amphibians, Fish, Plants, Insects

#### `get_balanced_spatial_species()`
- Returns species from a geographic region with balanced taxonomic representation
- Parameters:
  - `p_region_lat`, `p_region_lng`: Center coordinates
  - `p_radius_degrees`: Search radius
  - `p_species_per_class`: Number of species per taxonomic group (default: 3)
  - `p_exclude_species`: Optional species to exclude
- Fallback when ecoregion data is unavailable

**Taxonomic Classification:**
- Mammals: MAMMALIA
- Birds: AVES
- Reptiles: REPTILIA
- Amphibians: AMPHIBIA
- Fish: ACTINOPTERYGII, CHONDRICHTHYES, ELASMOBRANCHII
- Plants: PLANTAE
- Insects: INSECTA
- Other: Everything else

### 2. Media Fields Added to Database

Added image and media columns to:

**Ecoregions Table:**
```sql
- image_url TEXT
- image_attribution TEXT
- image_license TEXT
- image_source TEXT (default: 'wikimedia')
- wikimedia_page_title TEXT
- image_cached_at TIMESTAMP
```

**Parks Table:**
```sql
- image_url TEXT
- image_attribution TEXT
- image_license TEXT
- image_source TEXT (default: 'wikimedia')
- wikimedia_page_title TEXT
- image_cached_at TIMESTAMP
```

**Species Table** (fields already existed, now utilized):
```sql
- image_url TEXT
- image_attribution TEXT
- image_license TEXT
- image_source TEXT
- image_cached_at TIMESTAMP
- common_name TEXT (now auto-populated)
```

### 3. Wikimedia Image Fetching Service

**File:** `supabase/functions/wikimedia-image-fetch/index.ts`

Edge Function for fetching images and common names:

**Features:**
- Multi-source image fetching (Wikimedia Commons → Wikipedia → iNaturalist)
- Common name extraction from Wikipedia/Wikidata
- Configurable image size (default: 800px)
- Proper attribution and license tracking

**Image Source Priority:**
1. **Wikimedia Commons** - High-quality, freely licensed images
2. **Wikipedia** - Article thumbnail images
3. **iNaturalist** - Community biodiversity photos

**Common Name Extraction:**
- Parses Wikipedia article introductions
- Uses pattern matching for "also known as", "commonly known as"
- Falls back to Wikidata descriptions

### 4. Python Enrichment Script

**File:** `scripts/enrichMediaFromWikimedia.py`

Batch processing script for enriching database records:

**Capabilities:**
- Enrich species with images and common names
- Enrich parks with Wikimedia images
- Enrich ecoregions with landscape images
- Configurable limits and batch sizes
- Built-in rate limiting to avoid API throttling

**Usage:**
```bash
# Enrich species (default 100 items)
python scripts/enrichMediaFromWikimedia.py --type species --limit 100

# Enrich parks (limit 50)
python scripts/enrichMediaFromWikimedia.py --type parks --limit 50

# Enrich ecoregions (limit 50)
python scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 50

# Enrich everything
python scripts/enrichMediaFromWikimedia.py --type all --limit 100
```

### 5. Updated Discovery Function

**File:** `supabase/functions/discover-region-species/index.ts`

Updated to use balanced species selection:

**Changes:**
- Now calls `get_balanced_ecoregion_species()` for ecoregion-based discovery
- Falls back to `get_balanced_spatial_species()` for spatial queries
- Returns `taxonomicGroup` field for each species
- Includes `diversity` object showing species count per group

**New Response Format:**
```typescript
{
  success: true,
  species: [
    {
      scientificName: "Panthera tigris",
      commonName: "Tiger",
      animalType: "MAMMALIA",
      kingdom: "ANIMALIA",
      conservationStatus: "EN",
      imageUrl: "https://...",
      occurrenceCount: 85,
      taxonomicGroup: "Mammals"  // NEW
    }
    // ... more species across different groups
  ],
  diversity: {  // NEW
    "Mammals": 3,
    "Birds": 3,
    "Reptiles": 2,
    "Amphibians": 2,
    "Fish": 2,
    "Plants": 3
  },
  region: "Borneo",
  source: "iucn_database"
}
```

## How It Works

### Balanced Species Selection Flow

1. User clicks on a region in the app
2. `discover-region-species` Edge Function is called
3. Function finds the ecoregion ID by name
4. Calls `get_balanced_ecoregion_species()` with:
   - Ecoregion ID
   - Species per class = `limit / 6` (distributes across ~6 groups)
5. Database function:
   - Iterates through each taxonomic group (Mammals, Birds, etc.)
   - Selects top species from each group based on:
     - Species with common names (prioritized)
     - Higher overlap percentage with ecoregion
     - Conservation status (endangered first)
     - Random variation for variety
   - Returns equal numbers from each available group
6. Response includes species list + diversity breakdown

### Image Enrichment Flow

1. Run Python script: `python scripts/enrichMediaFromWikimedia.py`
2. Script queries database for records without images
3. For each record:
   - Searches Wikimedia Commons API
   - Falls back to Wikipedia page images
   - Falls back to iNaturalist (species only)
   - Extracts common name from Wikipedia (species only)
4. Updates database with:
   - Image URL
   - Attribution text
   - License information
   - Source identifier
   - Common name (if found)
5. Rate limiting ensures no API throttling

## Benefits

### 1. Improved Species Diversity
- **Before:** Species lists dominated by one taxonomic group
- **After:** Balanced representation across mammals, birds, reptiles, amphibians, fish, and plants

### 2. Visual Richness
- All species, parks, and ecoregions can have images
- Images are properly attributed and licensed
- No storage costs (uses external CDN URLs)

### 3. Better User Experience
- Common names make species more relatable
- Visual content makes exploration more engaging
- Diverse species lists are more educational

### 4. Scalability
- Batch processing with rate limiting
- Efficient database queries with proper indexing
- Edge Functions handle API integration

## Example: Borneo Ecoregion

**Before (unbalanced):**
```
15 mammals, 3 birds, 1 reptile, 1 plant
```

**After (balanced):**
```
3 mammals, 3 birds, 3 reptiles, 3 amphibians, 3 plants, 3 fish = 18 species
```

Each species now has:
- Scientific name (always available)
- Common name (fetched from Wikipedia)
- Image URL (from Wikimedia/iNaturalist)
- Attribution and license info
- Taxonomic group label

## Testing

### Test Balanced Species Selection

```sql
-- Test for a specific ecoregion
SELECT
  taxonomic_group,
  COUNT(*) as species_count,
  array_agg(scientific_name) as species_names
FROM get_balanced_ecoregion_species(
  p_ecoregion_id := (SELECT id FROM ecoregions WHERE name ILIKE '%borneo%' LIMIT 1),
  p_species_per_class := 3
)
GROUP BY taxonomic_group;
```

### Test Image Enrichment

```bash
# Test with 5 species
python scripts/enrichMediaFromWikimedia.py --type species --limit 5

# Check results
SELECT
  scientific_name,
  common_name,
  image_source,
  LEFT(image_url, 50) as image_url_preview
FROM species
WHERE image_url IS NOT NULL
LIMIT 5;
```

### Test API Response

```bash
# Call the discover function
curl -X POST 'https://your-project.supabase.co/functions/v1/discover-region-species' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "bounds": {
      "minLat": 0,
      "maxLat": 7,
      "minLng": 109,
      "maxLng": 119,
      "centerLat": 3.5,
      "centerLng": 114
    },
    "regionName": "Borneo",
    "limit": 18
  }' | jq '.diversity'
```

## Deployment Checklist

- [ ] Apply database migration: `supabase db push`
- [ ] Deploy Edge Functions: `supabase functions deploy wikimedia-image-fetch`
- [ ] Deploy updated discover function: `supabase functions deploy discover-region-species`
- [ ] Run enrichment for species: `python scripts/enrichMediaFromWikimedia.py --type species --limit 200`
- [ ] Run enrichment for parks: `python scripts/enrichMediaFromWikimedia.py --type parks --limit 50`
- [ ] Run enrichment for ecoregions: `python scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 50`
- [ ] Test API responses for balanced diversity
- [ ] Update UI to display taxonomicGroup and images
- [ ] Update UI to show species diversity breakdown

## Files Created/Modified

### New Files
1. `supabase/migrations/20251014000001_balanced_species_and_media.sql` - Database functions and schema
2. `supabase/functions/wikimedia-image-fetch/index.ts` - Image fetching Edge Function
3. `scripts/enrichMediaFromWikimedia.py` - Batch enrichment script
4. `WIKIMEDIA_ENRICHMENT_GUIDE.md` - Detailed usage guide
5. `SPECIES_DIVERSITY_AND_MEDIA_IMPLEMENTATION.md` - This document

### Modified Files
1. `supabase/functions/discover-region-species/index.ts` - Updated to use balanced selection

## Next Steps

1. **Deploy the changes:**
   ```bash
   supabase db push
   supabase functions deploy wikimedia-image-fetch
   supabase functions deploy discover-region-species
   ```

2. **Run initial enrichment:**
   ```bash
   python scripts/enrichMediaFromWikimedia.py --type all --limit 100
   ```

3. **Update frontend components:**
   - Display `taxonomicGroup` badges on species cards
   - Show diversity breakdown in region summary
   - Display images with proper attribution
   - Show common names prominently

4. **Monitor and optimize:**
   - Track image availability percentage
   - Monitor API response times
   - Adjust species_per_class based on user feedback
   - Add more taxonomic groups if needed

## Support

For questions or issues:
- See `WIKIMEDIA_ENRICHMENT_GUIDE.md` for detailed usage
- Check Supabase logs for Edge Function errors
- Review migration file for schema details
- Test with small limits first before bulk enrichment
