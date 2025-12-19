#!/usr/bin/env python3
"""
Fetch images for curated species that don't have images yet.
"""
import os
import sys
from supabase import create_client
import requests
import time

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def fetch_wikipedia_image(species_name, search_terms):
    """Fetch image from Wikipedia/Wikimedia Commons."""

    for term in search_terms:
        try:
            # Search Wikipedia
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": term,
                "format": "json",
                "srlimit": 1
            }

            search_response = requests.get(search_url, params=search_params, timeout=10)
            search_data = search_response.json()

            if not search_data.get('query', {}).get('search'):
                continue

            page_title = search_data['query']['search'][0]['title']

            # Get page images
            image_url = "https://en.wikipedia.org/w/api.php"
            image_params = {
                "action": "query",
                "titles": page_title,
                "prop": "pageimages",
                "pithumbsize": 500,
                "format": "json"
            }

            image_response = requests.get(image_url, params=image_params, timeout=10)
            image_data = image_response.json()

            pages = image_data.get('query', {}).get('pages', {})
            for page_id, page_info in pages.items():
                if 'thumbnail' in page_info:
                    return page_info['thumbnail']['source']

        except Exception as e:
            print(f"    ⚠️  Error searching '{term}': {e}")
            continue

    return None

def main():
    print("🖼️  Fetching Missing Images for Curated Species\n")

    # Get curated species without images
    result = supabase.from_('species').select(
        'id, scientific_name, common_name, class'
    ).eq('is_curated', True).is_('image_url', 'null').execute()

    species_list = result.data

    print(f"Found {len(species_list)} curated species without images\n")

    if not species_list:
        print("✅ All curated species already have images!")
        return

    # Fetch images
    success_count = 0
    fail_count = 0

    for i, species in enumerate(species_list, 1):
        common = species['common_name'] or species['scientific_name']
        scientific = species['scientific_name']

        print(f"[{i}/{len(species_list)}] {common}...")

        # Try multiple search terms
        search_terms = [
            scientific,
            common,
            f"{common} {species.get('class', '')}".strip()
        ]

        image_url = fetch_wikipedia_image(common, search_terms)

        if image_url:
            # Update database
            try:
                supabase.from_('species').update({
                    'image_url': image_url
                }).eq('id', species['id']).execute()

                print(f"  ✅ Fetched image")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Failed to update database: {e}")
                fail_count += 1
        else:
            print(f"  ❌ No image found")
            fail_count += 1

        # Rate limiting
        time.sleep(0.5)

    print(f"\n✅ Complete!")
    print(f"  Success: {success_count}")
    print(f"  Failed: {fail_count}")

if __name__ == '__main__':
    main()
