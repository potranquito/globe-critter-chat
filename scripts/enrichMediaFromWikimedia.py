#!/usr/bin/env python3
"""
Enrich species, parks, and ecoregions with Wikimedia Commons images and common names
"""

import os
import sys
import time
import requests
from typing import Optional, Dict, Any, List
from urllib.parse import quote
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# User-Agent header required by Wikimedia APIs
HEADERS = {
    'User-Agent': 'GlobeCritterChat/1.0 (Educational biodiversity app; https://github.com/example)'
}

def fetch_wikimedia_image(search_term: str, preferred_size: int = 800) -> Dict[str, Any]:
    """
    Fetch image from Wikimedia Commons
    Returns dict with imageUrl, attribution, license, source
    """
    try:
        # Step 1: Try Wikimedia Commons search
        commons_search_url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={quote(search_term)}&srnamespace=6&format=json&origin=*"

        response = requests.get(commons_search_url, headers=HEADERS, timeout=10)
        data = response.json()

        if data.get("query", {}).get("search", []):
            page_title = data["query"]["search"][0]["title"]

            # Fetch image info
            image_info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={quote(page_title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth={preferred_size}&format=json&origin=*"

            image_response = requests.get(image_info_url, headers=HEADERS, timeout=10)
            image_data = image_response.json()

            pages = image_data.get("query", {}).get("pages", {})
            if pages:
                page_id = list(pages.keys())[0]
                image_info = pages[page_id].get("imageinfo", [{}])[0]

                if image_info:
                    metadata = image_info.get("extmetadata", {})

                    return {
                        "imageUrl": image_info.get("thumburl") or image_info.get("url"),
                        "attribution": metadata.get("Artist", {}).get("value") or metadata.get("Attribution", {}).get("value") or "Wikimedia Commons",
                        "license": metadata.get("LicenseShortName", {}).get("value") or metadata.get("License", {}).get("value") or "Unknown",
                        "source": "wikimedia_commons"
                    }

        # Step 2: Fallback to Wikipedia page image
        wikipedia_search_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote(search_term)}&prop=pageimages&pithumbsize={preferred_size}&format=json&origin=*"

        wiki_response = requests.get(wikipedia_search_url, headers=HEADERS, timeout=10)
        wiki_data = wiki_response.json()

        wiki_pages = wiki_data.get("query", {}).get("pages", {})
        if wiki_pages:
            wiki_page_id = list(wiki_pages.keys())[0]
            thumbnail = wiki_pages[wiki_page_id].get("thumbnail", {})

            if thumbnail.get("source"):
                return {
                    "imageUrl": thumbnail["source"],
                    "attribution": "Wikipedia",
                    "license": "Various (see Wikipedia)",
                    "source": "wikipedia"
                }

        # Step 3: Try iNaturalist as additional fallback
        inat_url = f"https://api.inaturalist.org/v1/taxa/autocomplete?q={quote(search_term)}&per_page=1"

        inat_response = requests.get(inat_url, headers=HEADERS, timeout=10)
        inat_data = inat_response.json()

        if inat_data.get("results", []) and inat_data["results"][0].get("default_photo"):
            photo = inat_data["results"][0]["default_photo"]
            return {
                "imageUrl": photo.get("medium_url") or photo.get("url"),
                "attribution": photo.get("attribution") or "iNaturalist",
                "license": photo.get("license_code") or "Unknown",
                "source": "inaturalist"
            }

        return {"error": "No images found", "source": "none"}

    except Exception as e:
        print(f"Error fetching image for '{search_term}': {e}")
        return {"error": str(e), "source": "error"}

def fetch_common_name(scientific_name: str) -> Optional[str]:
    """
    Fetch common name for a species from Wikipedia/Wikidata
    """
    try:
        # Try Wikipedia API first
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote(scientific_name)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*"

        response = requests.get(wiki_url, headers=HEADERS, timeout=10)
        data = response.json()

        pages = data.get("query", {}).get("pages", {})
        if pages:
            page_id = list(pages.keys())[0]
            extract = pages[page_id].get("extract", "")

            if extract:
                # Try to extract common name from first sentence
                import re
                patterns = [
                    r"also (?:known|called) as (?:the )?([A-Z][a-z]+(?:\s+[a-z]+)*)",
                    r"commonly known as (?:the )?([A-Z][a-z]+(?:\s+[a-z]+)*)",
                    r"is (?:a|an) ([A-Z][a-z]+(?:\s+[a-z]+)*)",
                ]

                for pattern in patterns:
                    match = re.search(pattern, extract, re.IGNORECASE)
                    if match:
                        return match.group(1)

        # Try Wikidata as fallback
        wikidata_search_url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={quote(scientific_name)}&language=en&format=json&origin=*"

        wikidata_response = requests.get(wikidata_search_url, headers=HEADERS, timeout=10)
        wikidata_data = wikidata_response.json()

        if wikidata_data.get("search", []):
            description = wikidata_data["search"][0].get("description", "")
            if "species" in description:
                match = re.search(r"species of (.+)", description, re.IGNORECASE)
                if match:
                    return match.group(1)

        return None

    except Exception as e:
        print(f"Error fetching common name for '{scientific_name}': {e}")
        return None

def enrich_species(limit: int = 100, batch_size: int = 10):
    """
    Enrich species with Wikimedia images and common names
    """
    print(f"\n=== Enriching species with images and common names ===")

    # Get species without images or common names
    response = supabase.table("species").select("id, scientific_name, common_name, image_url").limit(limit).execute()

    species_list = response.data
    print(f"Found {len(species_list)} species to potentially enrich")

    enriched_count = 0
    skipped_count = 0

    for i, species in enumerate(species_list):
        species_id = species["id"]
        scientific_name = species["scientific_name"]
        current_common_name = species.get("common_name")
        current_image = species.get("image_url")

        # Skip if already has both
        if current_image and current_common_name:
            skipped_count += 1
            continue

        print(f"\n[{i+1}/{len(species_list)}] Enriching: {scientific_name}")

        updates = {}

        # Fetch image if missing
        if not current_image:
            print(f"  Fetching image...")
            image_result = fetch_wikimedia_image(scientific_name)

            if not image_result.get("error"):
                updates["image_url"] = image_result.get("imageUrl")
                updates["image_attribution"] = image_result.get("attribution")
                updates["image_license"] = image_result.get("license")
                updates["image_source"] = image_result.get("source")
                print(f"  ✓ Found image from {image_result.get('source')}")
            else:
                print(f"  ✗ No image found")

        # Fetch common name if missing
        if not current_common_name:
            print(f"  Fetching common name...")
            common_name = fetch_common_name(scientific_name)

            if common_name:
                updates["common_name"] = common_name
                print(f"  ✓ Found common name: {common_name}")
            else:
                print(f"  ✗ No common name found")

        # Update database if we have changes
        if updates:
            try:
                supabase.table("species").update(updates).eq("id", species_id).execute()
                enriched_count += 1
                print(f"  ✓ Updated database")
            except Exception as e:
                print(f"  ✗ Error updating database: {e}")

        # Rate limiting
        if (i + 1) % batch_size == 0:
            print(f"\n  ... Pausing for rate limiting ...")
            time.sleep(2)

    print(f"\n=== Species enrichment complete ===")
    print(f"Enriched: {enriched_count}, Skipped: {skipped_count}")

def enrich_parks(limit: int = 50):
    """
    Enrich parks with Wikimedia images
    """
    print(f"\n=== Enriching parks with images ===")

    # Get parks without images
    response = supabase.table("parks").select("id, name, image_url").is_("image_url", "null").limit(limit).execute()

    parks_list = response.data
    print(f"Found {len(parks_list)} parks to enrich")

    enriched_count = 0

    for i, park in enumerate(parks_list):
        park_id = park["id"]
        park_name = park["name"]

        print(f"\n[{i+1}/{len(parks_list)}] Enriching: {park_name}")

        # Try variations of the park name
        search_terms = [
            park_name,
            f"{park_name} national park",
            f"{park_name} nature reserve"
        ]

        image_result = None
        for term in search_terms:
            print(f"  Trying: {term}")
            result = fetch_wikimedia_image(term)
            if not result.get("error"):
                image_result = result
                break
            time.sleep(0.5)

        if image_result and not image_result.get("error"):
            updates = {
                "image_url": image_result.get("imageUrl"),
                "image_attribution": image_result.get("attribution"),
                "image_license": image_result.get("license"),
                "image_source": image_result.get("source")
            }

            try:
                supabase.table("parks").update(updates).eq("id", park_id).execute()
                enriched_count += 1
                print(f"  ✓ Updated with image from {image_result.get('source')}")
            except Exception as e:
                print(f"  ✗ Error updating database: {e}")
        else:
            print(f"  ✗ No image found")

        time.sleep(1)  # Rate limiting

    print(f"\n=== Parks enrichment complete ===")
    print(f"Enriched: {enriched_count}/{len(parks_list)} parks")

def enrich_ecoregions(limit: int = 50):
    """
    Enrich ecoregions with Wikimedia images
    """
    print(f"\n=== Enriching ecoregions with images ===")

    # Get ecoregions without images
    response = supabase.table("ecoregions").select("id, name, image_url").is_("image_url", "null").limit(limit).execute()

    ecoregions_list = response.data
    print(f"Found {len(ecoregions_list)} ecoregions to enrich")

    enriched_count = 0

    for i, ecoregion in enumerate(ecoregions_list):
        ecoregion_id = ecoregion["id"]
        ecoregion_name = ecoregion["name"]

        print(f"\n[{i+1}/{len(ecoregions_list)}] Enriching: {ecoregion_name}")

        # Try variations of the ecoregion name
        search_terms = [
            ecoregion_name,
            f"{ecoregion_name} ecoregion",
            f"{ecoregion_name} landscape"
        ]

        image_result = None
        for term in search_terms:
            print(f"  Trying: {term}")
            result = fetch_wikimedia_image(term, preferred_size=1200)
            if not result.get("error"):
                image_result = result
                break
            time.sleep(0.5)

        if image_result and not image_result.get("error"):
            updates = {
                "image_url": image_result.get("imageUrl"),
                "image_attribution": image_result.get("attribution"),
                "image_license": image_result.get("license"),
                "image_source": image_result.get("source")
            }

            try:
                supabase.table("ecoregions").update(updates).eq("id", ecoregion_id).execute()
                enriched_count += 1
                print(f"  ✓ Updated with image from {image_result.get('source')}")
            except Exception as e:
                print(f"  ✗ Error updating database: {e}")
        else:
            print(f"  ✗ No image found")

        time.sleep(1)  # Rate limiting

    print(f"\n=== Ecoregions enrichment complete ===")
    print(f"Enriched: {enriched_count}/{len(ecoregions_list)} ecoregions")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Enrich database with Wikimedia images and common names")
    parser.add_argument("--type", choices=["species", "parks", "ecoregions", "all"], default="all",
                        help="Type of entity to enrich (default: all)")
    parser.add_argument("--limit", type=int, default=100, help="Number of items to process (default: 100)")
    parser.add_argument("--batch-size", type=int, default=10, help="Batch size for species processing (default: 10)")

    args = parser.parse_args()

    print("=== Wikimedia Image & Common Name Enrichment ===")
    print(f"Type: {args.type}, Limit: {args.limit}")

    if args.type == "species" or args.type == "all":
        enrich_species(limit=args.limit, batch_size=args.batch_size)

    if args.type == "parks" or args.type == "all":
        enrich_parks(limit=min(args.limit, 50))  # Limit parks to avoid excessive API calls

    if args.type == "ecoregions" or args.type == "all":
        enrich_ecoregions(limit=min(args.limit, 50))  # Limit ecoregions to avoid excessive API calls

    print("\n=== All enrichment tasks complete ===")
