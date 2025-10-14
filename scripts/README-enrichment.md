# Species Data Enrichment

This script enriches your species database with common names and high-quality images from free APIs.

## Setup

1. Install dependencies:
```bash
pip install requests supabase python-dotenv
```

2. Make sure your `.env` file has Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_service_key
```

## Usage

Run the script:
```bash
python3 scripts/enrichSpeciesData.py
```

## What it does

1. **Fetches species** that are missing `common_name` or `image_url`
2. **Queries multiple APIs** in priority order:
   - **iNaturalist**: Best for wildlife images and common names
   - **Wikipedia**: Good for common names and general images
   - **GBIF**: Fallback for common names
3. **Updates database** with found data
4. **Rate-limits requests** to be respectful to APIs (0.5s delay)

## API Sources

All APIs used are **FREE** and **no authentication required**:

- **iNaturalist API**: High-quality wildlife photos from citizen science
- **Wikipedia API**: Common names and general images
- **GBIF API**: Global biodiversity database

## Output

The script will:
- Process up to 100 species per run
- Show progress in real-time
- Print statistics at the end
- Skip species that already have both common name and image

## Example Output

```
🌿 Species Data Enrichment Script
============================================================
✅ Connected to Supabase

📊 Fetching species that need enrichment...
Found 45 species to enrich

[1/45] 🔍 Enriching: Ursus maritimus
  📡 Checking iNaturalist...
  ✅ Common name: Polar Bear
  ✅ Image: https://inaturalist-open-data.s3.amazonaws.com/photos/...

[2/45] 🔍 Enriching: Panthera tigris
  📡 Checking iNaturalist...
  ✅ Common name: Tiger
  ✅ Image: https://static.inaturalist.org/photos/...

============================================================
✅ Enrichment Complete!
📊 Statistics:
   - Total processed: 45
   - Successfully enriched: 42
   - Failed: 3
   - Success rate: 93.3%
```

## Notes

- Run this script periodically as you add new species
- Images are stored as URLs (not downloaded) - zero storage cost!
- The script respects API rate limits
- Safe to run multiple times - skips already-enriched species
