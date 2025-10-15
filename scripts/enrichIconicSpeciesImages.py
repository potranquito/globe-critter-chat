#!/usr/bin/env python3
"""
Enrich images for iconic species that already have common names.
This targets the famous animals we added earlier.
"""

import os
import time
import requests
from supabase import create_client
from urllib.parse import quote

# Load environment variables
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# User-Agent header required by Wikimedia APIs
HEADERS = {
    'User-Agent': 'GlobeCritterChat/1.0 (Educational biodiversity app; https://github.com/example)'
}

# List of iconic species we added
ICONIC_SPECIES = [
    'Gorilla gorilla',
    'Pan troglodytes',
    'Loxodonta cyclotis',
    'Okapia johnstoni',
    'Panthera pardus',
    'Syncerus caffer',
    'Crocodylus niloticus',
    'Python sebae',
    'Ceratogymna atrata',
    'Musophaga rossae',
    'Panthera onca',
    'Tapirus terrestris',
    'Bradypus tridactylus',
    'Ara ararauna',
    'Harpia harpyja',
    'Ramphastos toco',
    'Morpho menelaus',
    'Dendrobates tinctorius',
    'Eunectes murinus',
    'Arapaima gigas',
    'Pongo pygmaeus',
    'Nasalis larvatus',
    'Dicerorhinus sumatrensis',
    'Elephas maximus',
    'Buceros rhinoceros',
    'Argusianus argus',
    'Python reticulatus',
    'Rafflesia arnoldii',
    'Lemur catta',
    'Propithecus verreauxi',
    'Indri indri',
    'Daubentonia madagascariensis',
    'Cryptoprocta ferox',
    'Furcifer pardalis',
    'Uroplatus phantasticus',
    'Adansonia grandidieri',
    'Coua cristata',
    'Ursus maritimus',
    'Rangifer tarandus',
    'Ovibos moschatus',
    'Vulpes lagopus',
    'Lepus arcticus',
    'Gulo gulo',
    'Bubo scandiacus',
    'Plectrophenax nivalis',
    'Odobenus rosmarus',
    'Chelonia mydas',
    'Manta birostris',
    'Rhincodon typus',
    'Amphiprion ocellaris',
    'Hippocampus bargibanti',
    'Pterapogon kauderni',
    'Synchiropus splendidus',
]

def fetch_wikimedia_image(search_term: str, preferred_size: int = 800) -> dict:
    """Fetch image from Wikimedia Commons or Wikipedia"""
    try:
        # Step 1: Try Wikimedia Commons search
        commons_search_url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={quote(search_term)}&srnamespace=6&format=json&origin=*"

        response = requests.get(commons_search_url, headers=HEADERS, timeout=10)
        data = response.json()

        if 'query' in data and 'search' in data['query'] and len(data['query']['search']) > 0:
            # Get the first result
            page_title = data['query']['search'][0]['title']

            # Fetch image info
            image_info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={quote(page_title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth={preferred_size}&format=json&origin=*"

            image_response = requests.get(image_info_url, headers=HEADERS, timeout=10)
            image_data = image_response.json()

            pages = image_data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    info = page_data['imageinfo'][0]
                    return {
                        'url': info.get('thumburl', info.get('url')),
                        'source': 'wikimedia_commons',
                        'attribution': info.get('extmetadata', {}).get('Artist', {}).get('value', '')
                    }

        # Step 2: Fallback to Wikipedia page image
        wikipedia_search_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote(search_term)}&prop=pageimages&pithumbsize={preferred_size}&format=json&origin=*"

        wiki_response = requests.get(wikipedia_search_url, headers=HEADERS, timeout=10)
        wiki_data = wiki_response.json()

        pages = wiki_data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if 'thumbnail' in page_data:
                return {
                    'url': page_data['thumbnail']['source'],
                    'source': 'wikipedia',
                    'attribution': f"Wikipedia article: {search_term}"
                }

        # Step 3: Try iNaturalist as additional fallback
        inat_url = f"https://api.inaturalist.org/v1/taxa/autocomplete?q={quote(search_term)}&per_page=1"

        inat_response = requests.get(inat_url, headers=HEADERS, timeout=10)
        inat_data = inat_response.json()

        if 'results' in inat_data and len(inat_data['results']) > 0:
            result = inat_data['results'][0]
            if 'default_photo' in result and result['default_photo']:
                return {
                    'url': result['default_photo']['medium_url'],
                    'source': 'inaturalist',
                    'attribution': f"iNaturalist"
                }

        return None

    except Exception as e:
        print(f"  Error fetching image: {e}")
        return None

def enrich_iconic_species():
    """Enrich images for iconic species"""

    print("=== Enriching Iconic Species with Images ===\n")

    enriched_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, scientific_name in enumerate(ICONIC_SPECIES, 1):
        print(f"[{idx}/{len(ICONIC_SPECIES)}] {scientific_name}")

        # Get species from database
        response = supabase.table('species').select('id, scientific_name, common_name, image_url').eq('scientific_name', scientific_name).execute()

        if not response.data:
            print(f"  ⚠️  Not found in database")
            failed_count += 1
            continue

        species = response.data[0]

        # Skip if already has image
        if species['image_url']:
            print(f"  ✓ Already has image")
            skipped_count += 1
            continue

        # Try to fetch image using common name (better results than scientific name)
        search_term = species['common_name'] if species['common_name'] else scientific_name

        print(f"  Searching for: {search_term}")
        image_data = fetch_wikimedia_image(search_term)

        if image_data:
            # Update database
            supabase.table('species').update({
                'image_url': image_data['url'],
                'image_source': image_data['source'],
                'image_attribution': image_data['attribution']
            }).eq('id', species['id']).execute()

            print(f"  ✓ Updated with image from {image_data['source']}")
            enriched_count += 1
        else:
            print(f"  ✗ No image found")
            failed_count += 1

        time.sleep(0.5)  # Rate limiting

    print(f"\n=== Summary ===")
    print(f"Enriched: {enriched_count}")
    print(f"Skipped (already have images): {skipped_count}")
    print(f"Failed: {failed_count}")
    print(f"\n✅ Iconic species image enrichment complete!")

if __name__ == '__main__':
    enrich_iconic_species()
