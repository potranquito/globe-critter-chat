#!/usr/bin/env python3
"""
Species Data Enrichment Script

Fetches common names and image URLs for species in the database using free APIs:
- Wikipedia API for common names and images
- iNaturalist API for high-quality wildlife images
- GBIF API for additional metadata

Requirements:
    pip install requests supabase python-dotenv

Usage:
    python3 scripts/enrichSpeciesData.py
"""

import os
import sys
import time
import requests
from typing import Optional, Dict, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BATCH_SIZE = 50  # Process 50 species at a time
RATE_LIMIT_DELAY = 0.5  # Seconds between API calls to be respectful

# API endpoints
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
INATURALIST_API = "https://api.inaturalist.org/v1"
GBIF_API = "https://api.gbif.org/v1"


def init_supabase() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

    if not url or not key:
        print('❌ Error: Missing Supabase credentials')
        print('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env')
        sys.exit(1)

    return create_client(url, key)


def fetch_wikipedia_data(scientific_name: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetch common name and image URL from Wikipedia
    Returns: (common_name, image_url)
    """
    try:
        # Search for the page
        search_params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': scientific_name,
            'srlimit': 1
        }

        response = requests.get(WIKIPEDIA_API, params=search_params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get('query', {}).get('search'):
            return None, None

        page_title = data['query']['search'][0]['title']

        # Get page content and images
        page_params = {
            'action': 'query',
            'format': 'json',
            'titles': page_title,
            'prop': 'pageimages|extracts',
            'piprop': 'original',
            'exintro': True,
            'explaintext': True,
            'exsentences': 1
        }

        response = requests.get(WIKIPEDIA_API, params=page_params, timeout=10)
        response.raise_for_status()
        data = response.json()

        pages = data.get('query', {}).get('pages', {})
        if not pages:
            return None, None

        page = list(pages.values())[0]
        common_name = page_title if page_title != scientific_name else None
        image_url = page.get('original', {}).get('source')

        return common_name, image_url

    except Exception as e:
        print(f"  ⚠️  Wikipedia error for {scientific_name}: {e}")
        return None, None


def fetch_inaturalist_data(scientific_name: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetch common name and high-quality image from iNaturalist
    Returns: (common_name, image_url)
    """
    try:
        # Search for taxon
        search_url = f"{INATURALIST_API}/taxa"
        params = {
            'q': scientific_name,
            'is_active': 'true',
            'order': 'desc',
            'order_by': 'observations_count'
        }

        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get('results'):
            return None, None

        taxon = data['results'][0]

        # Get common name (prefer English)
        common_name = None
        if 'preferred_common_name' in taxon:
            common_name = taxon['preferred_common_name']
        elif 'english_common_name' in taxon:
            common_name = taxon['english_common_name']

        # Get high-quality image
        image_url = None
        if 'default_photo' in taxon and taxon['default_photo']:
            # Use large size for better quality
            image_url = taxon['default_photo'].get('medium_url') or taxon['default_photo'].get('url')
        elif 'taxon_photos' in taxon and taxon['taxon_photos']:
            image_url = taxon['taxon_photos'][0].get('photo', {}).get('medium_url')

        return common_name, image_url

    except Exception as e:
        print(f"  ⚠️  iNaturalist error for {scientific_name}: {e}")
        return None, None


def fetch_gbif_data(scientific_name: str) -> Optional[str]:
    """
    Fetch common name from GBIF (Global Biodiversity Information Facility)
    Returns: common_name
    """
    try:
        # Search for species
        search_url = f"{GBIF_API}/species/match"
        params = {
            'name': scientific_name,
            'strict': 'true'
        }

        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('matchType') == 'NONE':
            return None

        # Get vernacular names
        species_key = data.get('usageKey')
        if not species_key:
            return None

        vernacular_url = f"{GBIF_API}/species/{species_key}/vernacularNames"
        response = requests.get(vernacular_url, timeout=10)
        response.raise_for_status()
        vernacular_data = response.json()

        # Prefer English vernacular names
        for result in vernacular_data.get('results', []):
            if result.get('language') == 'eng':
                return result.get('vernacularName')

        # Fallback to any vernacular name
        if vernacular_data.get('results'):
            return vernacular_data['results'][0].get('vernacularName')

        return None

    except Exception as e:
        print(f"  ⚠️  GBIF error for {scientific_name}: {e}")
        return None


def enrich_species(species: Dict) -> Dict:
    """
    Enrich a single species with common name and image URL
    """
    scientific_name = species['scientific_name']
    print(f"\n🔍 Enriching: {scientific_name}")

    # Skip if already has both common name and image
    if species.get('common_name') and species.get('image_url'):
        print(f"  ✅ Already enriched")
        return {}

    updates = {}

    # Try to get common name and image from iNaturalist first (best quality)
    if not species.get('common_name') or not species.get('image_url'):
        print(f"  📡 Checking iNaturalist...")
        common_name, image_url = fetch_inaturalist_data(scientific_name)

        if common_name and not species.get('common_name'):
            updates['common_name'] = common_name
            print(f"  ✅ Common name: {common_name}")

        if image_url and not species.get('image_url'):
            updates['image_url'] = image_url
            updates['image_source'] = 'inaturalist'
            print(f"  ✅ Image: {image_url[:60]}...")

        time.sleep(RATE_LIMIT_DELAY)

    # Try Wikipedia if still missing data
    if not updates.get('common_name') or not updates.get('image_url'):
        print(f"  📡 Checking Wikipedia...")
        wiki_common, wiki_image = fetch_wikipedia_data(scientific_name)

        if wiki_common and not updates.get('common_name'):
            updates['common_name'] = wiki_common
            print(f"  ✅ Common name: {wiki_common}")

        if wiki_image and not updates.get('image_url'):
            updates['image_url'] = wiki_image
            updates['image_source'] = 'wikipedia'
            print(f"  ✅ Image: {wiki_image[:60]}...")

        time.sleep(RATE_LIMIT_DELAY)

    # Try GBIF as last resort for common name
    if not updates.get('common_name'):
        print(f"  📡 Checking GBIF...")
        gbif_common = fetch_gbif_data(scientific_name)

        if gbif_common:
            updates['common_name'] = gbif_common
            print(f"  ✅ Common name: {gbif_common}")

        time.sleep(RATE_LIMIT_DELAY)

    if not updates:
        print(f"  ⚠️  No additional data found")

    return updates


def main():
    """Main enrichment process"""
    print("🌿 Species Data Enrichment Script")
    print("=" * 60)

    # Initialize Supabase
    supabase = init_supabase()
    print("✅ Connected to Supabase\n")

    # Get species that need enrichment (missing common_name or image_url)
    print("📊 Fetching species that need enrichment...")
    response = supabase.table('species').select('id, scientific_name, common_name, image_url').or_(
        'common_name.is.null,image_url.is.null'
    ).limit(100).execute()

    species_list = response.data
    print(f"Found {len(species_list)} species to enrich\n")

    if not species_list:
        print("✅ All species are already enriched!")
        return

    # Process in batches
    enriched_count = 0
    failed_count = 0

    for i, species in enumerate(species_list, 1):
        print(f"\n[{i}/{len(species_list)}]", end=" ")

        try:
            updates = enrich_species(species)

            if updates:
                # Update database
                supabase.table('species').update(updates).eq('id', species['id']).execute()
                enriched_count += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed_count += 1

        # Progress update every 10 species
        if i % 10 == 0:
            print(f"\n📈 Progress: {enriched_count} enriched, {failed_count} failed")

    # Final summary
    print("\n" + "=" * 60)
    print("✅ Enrichment Complete!")
    print(f"📊 Statistics:")
    print(f"   - Total processed: {len(species_list)}")
    print(f"   - Successfully enriched: {enriched_count}")
    print(f"   - Failed: {failed_count}")
    print(f"   - Success rate: {enriched_count / len(species_list) * 100:.1f}%")


if __name__ == '__main__':
    main()
