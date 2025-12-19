# Species Enrichment Guide

## Problem
Currently, some eco-regions have too few species per taxonomic group (e.g., only 4 reptiles in Amazon). We need **10-20 species per family group** (mammals, birds, reptiles, amphibians, fish, etc.) for each eco-region.

## Current System Overview

### Data Pipeline
1. **Source CSV**: `curated_species_database_enriched.csv`
2. **Python Scripts**: Multiple scripts for importing/updating species
3. **Database**: Supabase `species` table
4. **MCP Server**: Fetches species from database via `getRegionSpecies` tool
5. **Frontend**: Displays species in learning mode and games

### CSV Structure
```csv
ecoregion,scientific_name,common_name,class,conservation_status,habitat_type,image_url,attribution,description
```

## Solution: Multi-Strategy Species Enrichment

### Strategy 1: Automated GBIF/iNaturalist Import (RECOMMENDED)

Create a Python script to fetch species from GBIF (Global Biodiversity Information Facility) or iNaturalist API:

```python
#!/usr/bin/env python3
"""
Fetch species from GBIF API for specific eco-regions and taxonomic classes.
Ensures minimum 10-20 species per taxonomic group per region.
"""
import requests
import csv
import os
from supabase import create_client

# GBIF API endpoint
GBIF_API = "https://api.gbif.org/v1/species/search"

def fetch_species_by_taxon(ecoregion_name, taxon_class, min_count=15):
    """
    Fetch species for a specific taxonomic class in an eco-region.

    Args:
        ecoregion_name: e.g., "Amazon Rainforest"
        taxon_class: e.g., "REPTILIA", "AMPHIBIA", "MAMMALIA", "AVES"
        min_count: minimum species to fetch (default 15)
    """
    params = {
        'class': taxon_class,
        'limit': min_count,
        'offset': 0,
        'highertaxonKey': get_region_taxon_key(ecoregion_name)  # Custom logic needed
    }

    response = requests.get(GBIF_API, params=params)
    species_list = response.json()['results']

    enriched_species = []
    for sp in species_list:
        enriched_species.append({
            'ecoregion': ecoregion_name,
            'scientific_name': sp.get('scientificName'),
            'common_name': sp.get('vernacularName', sp.get('canonicalName')),
            'class': taxon_class,
            'conservation_status': fetch_iucn_status(sp.get('scientificName')),
            'habitat_type': infer_habitat(ecoregion_name),
            'image_url': fetch_wikimedia_image(sp.get('scientificName')),
            'attribution': 'Wikimedia Commons',
            'description': fetch_wikipedia_description(sp.get('scientificName'))
        })

    return enriched_species

# Run for each eco-region and taxon class
for ecoregion in ['Amazon Rainforest', 'Borneo Rainforest', 'Madagascar']:
    for taxon in ['REPTILIA', 'AMPHIBIA', 'MAMMALIA', 'AVES', 'ACTINOPTERYGII']:
        species = fetch_species_by_taxon(ecoregion, taxon, min_count=15)
        append_to_csv(species, 'curated_species_database_enriched.csv')
```

### Strategy 2: Manual CSV Enrichment with Wikipedia

**Step-by-step process**:

1. **Identify gaps** - Check which eco-regions lack species:
```python
python check_ecoregion_species_distribution.py
```

2. **Research species lists** for each eco-region:
   - Wikipedia articles (e.g., "Fauna of the Amazon")
   - Conservation websites (WWF, IUCN)
   - Field guides

3. **Create enrichment CSV**:
```csv
ecoregion,scientific_name,common_name,class,conservation_status
Amazon Rainforest,Boa constrictor,Boa constrictor,REPTILIA,LC
Amazon Rainforest,Caiman crocodilus,Spectacled caiman,REPTILIA,LC
Amazon Rainforest,Eunectes murinus,Green anaconda,REPTILIA,LC
Amazon Rainforest,Dendrobates tinctorius,Dyeing poison dart frog,AMPHIBIA,LC
... (add 10-20 per taxon)
```

4. **Enrich with images** using the existing script:
```bash
python update_species_with_images.py
```

This script:
- Fetches Wikipedia images via Wikimedia API
- Adds image URLs to CSV
- Includes attribution

5. **Import to database**:
```bash
python restore_species_from_csv.py curated_species_database_enriched.csv
```

### Strategy 3: Semi-Automated Wikipedia Scraping

Create a script that:
1. Scrapes Wikipedia "List of animals of [region]" pages
2. Extracts species tables
3. Fetches images from Wikimedia Commons API
4. Gets conservation status from IUCN Red List API
5. Generates descriptions using Wikipedia summaries

```python
#!/usr/bin/env python3
"""
Scrape Wikipedia for species lists and enrich with images/data.
"""
import wikipediaapi
import requests
from bs4 import BeautifulSoup

def scrape_wikipedia_fauna_list(wiki_url):
    """
    Extract species from Wikipedia fauna list.
    Example: https://en.wikipedia.org/wiki/List_of_reptiles_of_Brazil
    """
    response = requests.get(wiki_url)
    soup = BeautifulSoup(response.content, 'html.parser')

    species_list = []
    tables = soup.find_all('table', class_='wikitable')

    for table in tables:
        rows = table.find_all('tr')[1:]  # Skip header
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 2:
                scientific_name = cells[0].get_text(strip=True)
                common_name = cells[1].get_text(strip=True)
                species_list.append({
                    'scientific_name': scientific_name,
                    'common_name': common_name
                })

    return species_list

# Usage
amazon_reptiles = scrape_wikipedia_fauna_list(
    'https://en.wikipedia.org/wiki/List_of_reptiles_of_Brazil'
)
```

## Implementation Plan

### Phase 1: Assess Current State (15 min)
```bash
# Check species distribution
python check_ecoregion_species_distribution.py

# Output example:
# Amazon Rainforest:
#   Mammals: 25 ✓
#   Birds: 18 ✓
#   Reptiles: 4 ✗ (need 10+)
#   Amphibians: 6 ✗ (need 10+)
#   Fish: 12 ✓
```

### Phase 2: Create Target Species List (30-60 min)

For each eco-region with gaps, create a CSV with target species:

**Amazon Rainforest - Reptiles** (need 11 more):
```csv
scientific_name,common_name,class
Boa constrictor,Boa constrictor,REPTILIA
Eunectes murinus,Green anaconda,REPTILIA
Caiman crocodilus,Spectacled caiman,REPTILIA
Melanosuchus niger,Black caiman,REPTILIA
Geochelone denticulata,Yellow-footed tortoise,REPTILIA
Podocnemis unifilis,Yellow-spotted river turtle,REPTILIA
Tupinambis teguixin,Gold tegu,REPTILIA
Corallus hortulanus,Amazon tree boa,REPTILIA
Paleosuchus palpebrosus,Cuvier's dwarf caiman,REPTILIA
Bothriopsis bilineata,Two-striped forest pit viper,REPTILIA
Lachesis muta,Bushmaster,REPTILIA
```

**Sources for research**:
- Wikipedia: "Fauna of the Amazon", "List of reptiles of Brazil"
- WWF: Amazon species lists
- IUCN Red List: Search by region and taxon

### Phase 3: Enrich with Images & Data (30-45 min)

```bash
# Run the Wikipedia image enrichment script
python update_species_with_images.py

# This will:
# 1. Search Wikimedia Commons for each species
# 2. Select best quality image (prefers photos over drawings)
# 3. Add image URL and attribution
# 4. Fetch Wikipedia description (first paragraph)
```

### Phase 4: Add Metadata (15-30 min)

Manually add or auto-infer:
- **Conservation status**: Use IUCN API or lookup table
- **Habitat type**: Infer from eco-region (e.g., "Tropical rainforest")
- **Dietary category**: Use classification logic in `import_iucn_species.py:50-75`

### Phase 5: Import to Database (5 min)

```bash
# Import enriched CSV to Supabase
python restore_species_from_csv.py curated_species_database_enriched.csv

# Verify import
python verify_species_import.py
```

### Phase 6: Test in Frontend (5 min)

1. Restart dev server
2. Navigate to Amazon eco-region
3. Start learning mode with `/reptiles` topic
4. Verify 10+ reptiles appear

## Quick Commands Reference

### Check current species distribution
```bash
python check_ecoregion_species_distribution.py
```

### Search for species
```bash
python manage_curated_species.py search "anaconda"
```

### Update images for new species
```bash
python update_species_with_images.py
```

### Import CSV to database
```bash
python restore_species_from_csv.py curated_species_database_enriched.csv
```

### Verify import success
```bash
python verify_species_import.py
```

## Best Practices

1. **Quality over quantity**: Better to have 10 species with good images than 20 with poor/missing images
2. **Taxonomic diversity**: Mix common and rare species for educational value
3. **Image attribution**: Always include proper attribution for Wikimedia images
4. **Conservation focus**: Prioritize endangered/vulnerable species for conservation education
5. **Regional accuracy**: Ensure species actually occur in the eco-region (check GBIF/iNaturalist ranges)

## Troubleshooting

### "No species showing in learning mode"
- Check MCP server is running: `http://localhost:3000/mcp`
- Verify species have `is_curated=true` in database
- Check species have valid images (no "DAB_list" URLs)

### "Images not loading"
- Verify image URLs are HTTPS (not HTTP)
- Check Wikimedia Commons URLs are direct file links
- Test URLs in browser first

### "Wrong species for eco-region"
- Verify `ecoregion` field matches exactly (case-sensitive)
- Check species-ecoregion linking table
- Run: `python investigate-ecoregion-species-matching.sql`

## Future Enhancements

1. **Automated GBIF integration**: Fetch species lists directly from GBIF API
2. **Image quality scoring**: Rank images by quality/resolution
3. **Multi-language support**: Add common names in multiple languages
4. **Habitat photos**: Add habitat/ecosystem images alongside species
5. **Audio clips**: Bird songs, mammal calls from Xeno-canto API
