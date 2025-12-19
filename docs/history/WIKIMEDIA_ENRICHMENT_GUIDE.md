# Wikimedia Image & Common Name Enrichment Guide

This guide explains how to enrich your species, parks, and ecoregions database with images from Wikimedia Commons and common names from Wikipedia.

## Overview

The system now includes:

1. **Balanced Species Selection** - Species lists are automatically balanced across taxonomic groups (mammals, birds, reptiles, amphibians, fish, plants, insects)
2. **Wikimedia Image Integration** - Automatic image fetching from Wikimedia Commons, Wikipedia, and iNaturalist
3. **Common Name Enrichment** - Automatic common name extraction from Wikipedia and Wikidata

## Features

### 1. Balanced Species Selection

The new database functions ensure diverse species representation:

- `get_balanced_ecoregion_species()` - Returns balanced species for an ecoregion
- `get_balanced_spatial_species()` - Returns balanced species for a geographic region

**Taxonomic groups included:**
- Mammals (MAMMALIA)
- Birds (AVES)
- Reptiles (REPTILIA)
- Amphibians (AMPHIBIA)
- Fish (ACTINOPTERYGII, CHONDRICHTHYES, ELASMOBRANCHII)
- Plants (PLANTAE)
- Insects (INSECTA)
- Other

The `discover-region-species` Edge Function now automatically uses balanced selection, so species diversity is improved across all regions.

### 2. Image Sources

Images are fetched in this priority order:

1. **Wikimedia Commons** - High-quality, freely licensed images
2. **Wikipedia** - Page thumbnail images
3. **iNaturalist** - Community-sourced biodiversity photos

### 3. Common Name Extraction

Common names are extracted from:

1. **Wikipedia** article introductions
2. **Wikidata** entity descriptions

## Database Schema Updates

### New Columns Added

**Species table** (already exists):
- `image_url` - URL to species image
- `image_attribution` - Photo credit
- `image_license` - License type
- `image_source` - Source identifier

**Ecoregions table** (new):
- `image_url` - URL to ecoregion image
- `image_attribution` - Photo credit
- `image_license` - License type
- `image_source` - Source identifier
- `wikimedia_page_title` - Wikimedia Commons page reference

**Parks table** (new):
- `image_url` - URL to park image
- `image_attribution` - Photo credit
- `image_license` - License type
- `image_source` - Source identifier
- `wikimedia_page_title` - Wikimedia Commons page reference

## Usage

### Apply Database Migration

First, apply the new migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file
psql -f supabase/migrations/20251014000001_balanced_species_and_media.sql
```

### Enrich Species with Images and Common Names

Use the Python enrichment script:

```bash
# Enrich species only (100 items, default)
python scripts/enrichMediaFromWikimedia.py --type species --limit 100

# Enrich species with custom batch size
python scripts/enrichMediaFromWikimedia.py --type species --limit 200 --batch-size 20

# Enrich parks only
python scripts/enrichMediaFromWikimedia.py --type parks --limit 50

# Enrich ecoregions only
python scripts/enrichMediaFromWikimedia.py --type ecoregions --limit 50

# Enrich everything (limited to prevent excessive API calls)
python scripts/enrichMediaFromWikimedia.py --type all --limit 100
```

### Using the Edge Function (Alternative)

You can also use the `wikimedia-image-fetch` Edge Function:

```typescript
const { data, error } = await supabase.functions.invoke('wikimedia-image-fetch', {
  body: {
    searchTerm: 'Panthera tigris',
    type: 'species',
    preferredSize: 800,
    fetchCommonNameFlag: true
  }
});

console.log(data);
// {
//   success: true,
//   imageUrl: 'https://...',
//   attribution: '...',
//   license: '...',
//   source: 'wikimedia_commons',
//   commonName: 'Tiger'
// }
```

## API Response Format

The `discover-region-species` function now returns enhanced species data:

```json
{
  "success": true,
  "species": [
    {
      "scientificName": "Panthera tigris",
      "commonName": "Tiger",
      "animalType": "MAMMALIA",
      "kingdom": "ANIMALIA",
      "conservationStatus": "EN",
      "imageUrl": "https://...",
      "occurrenceCount": 85,
      "taxonomicGroup": "Mammals"
    },
    {
      "scientificName": "Aquila chrysaetos",
      "commonName": "Golden Eagle",
      "animalType": "AVES",
      "kingdom": "ANIMALIA",
      "conservationStatus": "LC",
      "imageUrl": "https://...",
      "occurrenceCount": 72,
      "taxonomicGroup": "Birds"
    }
    // ... balanced across taxonomic groups
  ],
  "diversity": {
    "Mammals": 3,
    "Birds": 3,
    "Reptiles": 2,
    "Amphibians": 2,
    "Plants": 3,
    "Fish": 2
  },
  "source": "iucn_database"
}
```

## Best Practices

### Rate Limiting

The enrichment script includes built-in rate limiting:
- 2-second pause every 10 species
- 1-second pause between parks/ecoregions
- API timeouts set to 10 seconds

### Image Quality

- Default image size: 800px for species
- Larger images (1200px) for ecoregions/parks
- Images are served from CDN URLs (no storage cost)

### Common Names

Common names are extracted using pattern matching from Wikipedia:
- "also known as [common name]"
- "commonly known as [common name]"
- "is a [common name]"

If no pattern matches, Wikidata descriptions are used as fallback.

### Error Handling

The script gracefully handles:
- Missing images (skips to next source)
- API timeouts (continues to next item)
- Database errors (logs and continues)

## Monitoring

### Check Enrichment Status

```sql
-- Check species with images
SELECT
  COUNT(*) as total_species,
  COUNT(image_url) as with_images,
  COUNT(common_name) as with_common_names,
  ROUND(100.0 * COUNT(image_url) / COUNT(*), 2) as image_percentage
FROM species;

-- Check image sources
SELECT
  image_source,
  COUNT(*) as count
FROM species
WHERE image_url IS NOT NULL
GROUP BY image_source;

-- Check parks with images
SELECT
  COUNT(*) as total_parks,
  COUNT(image_url) as with_images
FROM parks;

-- Check ecoregions with images
SELECT
  COUNT(*) as total_ecoregions,
  COUNT(image_url) as with_images
FROM ecoregions;
```

### View Taxonomic Diversity

```sql
-- See balanced species for a specific ecoregion
SELECT * FROM get_balanced_ecoregion_species(
  p_ecoregion_id := '123e4567-e89b-12d3-a456-426614174000',
  p_species_per_class := 3
);

-- Check diversity distribution
SELECT
  CASE
    WHEN class = 'MAMMALIA' THEN 'Mammals'
    WHEN class = 'AVES' THEN 'Birds'
    WHEN class = 'REPTILIA' THEN 'Reptiles'
    WHEN class = 'AMPHIBIA' THEN 'Amphibians'
    WHEN class IN ('ACTINOPTERYGII', 'CHONDRICHTHYES') THEN 'Fish'
    WHEN kingdom = 'PLANTAE' THEN 'Plants'
    ELSE 'Other'
  END as taxonomic_group,
  COUNT(*) as species_count
FROM species
WHERE image_url IS NOT NULL
GROUP BY taxonomic_group
ORDER BY species_count DESC;
```

## Troubleshooting

### No images found for species

1. Check if the scientific name is correct
2. Try adding the species manually to Wikimedia Commons
3. Use iNaturalist as alternative source

### Common name not extracted

1. Check if Wikipedia article exists for the species
2. Check if the article introduction follows standard patterns
3. Manually update the common_name field if needed

### Rate limiting errors

1. Reduce batch size: `--batch-size 5`
2. Reduce limit: `--limit 50`
3. Run script at different times to avoid API throttling

## License Compliance

All images are fetched with attribution and license information:

- **Wikimedia Commons**: Various Creative Commons licenses
- **Wikipedia**: Various licenses (check attribution)
- **iNaturalist**: Community licenses (CC BY, CC BY-NC)

Always display attribution when showing images in the UI.

## Next Steps

1. Run the migration to add new columns
2. Run the enrichment script for species
3. Run the enrichment script for parks and ecoregions
4. Monitor the diversity of species returned by the API
5. Update UI components to display images and common names

## Support

For issues or questions:
- Check the script logs for error messages
- Verify API endpoints are accessible
- Check Supabase logs for Edge Function errors
- Review the migration file for schema changes
