#!/usr/bin/env python3
"""
Quick enrichment for Arctic Tundra species
"""

import os
import sys
import time
sys.path.append(os.path.dirname(__file__))

from enrichSpeciesData import (
    init_supabase,
    fetch_inaturalist_data,
    fetch_wikipedia_data,
    fetch_gbif_data,
    RATE_LIMIT_DELAY
)

# Target species from Arctic Tundra
TARGET_SPECIES = [
    'Rangifer tarandus',
    'Ranunculus allenii',
    'Claytonia tuberosa',
    'Schoenoplectus tabernaemontani'
]

def main():
    print("🌿 Arctic Tundra Species Enrichment")
    print("=" * 60)

    supabase = init_supabase()
    print("✅ Connected to Supabase\n")

    enriched_count = 0

    for scientific_name in TARGET_SPECIES:
        print(f"\n🔍 Enriching: {scientific_name}")

        # Get current species data
        response = supabase.table('species').select('id, scientific_name, common_name, image_url').eq(
            'scientific_name', scientific_name
        ).execute()

        if not response.data:
            print(f"  ⚠️  Species not found in database")
            continue

        for species in response.data:
            updates = {}

            # Try iNaturalist first
            if not species.get('common_name') or not species.get('image_url'):
                print(f"  📡 Checking iNaturalist...")
                common_name, image_url = fetch_inaturalist_data(scientific_name)

                if common_name and not species.get('common_name'):
                    updates['common_name'] = common_name
                    print(f"  ✅ Common name: {common_name}")

                if image_url and not species.get('image_url'):
                    updates['image_url'] = image_url
                    updates['image_source'] = 'inaturalist'
                    print(f"  ✅ Image found")

                time.sleep(RATE_LIMIT_DELAY)

            # Try Wikipedia if still missing
            if not updates.get('common_name') or not updates.get('image_url'):
                print(f"  📡 Checking Wikipedia...")
                wiki_common, wiki_image = fetch_wikipedia_data(scientific_name)

                if wiki_common and not updates.get('common_name'):
                    updates['common_name'] = wiki_common
                    print(f"  ✅ Common name: {wiki_common}")

                if wiki_image and not updates.get('image_url'):
                    updates['image_url'] = wiki_image
                    updates['image_source'] = 'wikipedia'
                    print(f"  ✅ Image found")

                time.sleep(RATE_LIMIT_DELAY)

            # Try GBIF for common name
            if not updates.get('common_name'):
                print(f"  📡 Checking GBIF...")
                gbif_common = fetch_gbif_data(scientific_name)

                if gbif_common:
                    updates['common_name'] = gbif_common
                    print(f"  ✅ Common name: {gbif_common}")

                time.sleep(RATE_LIMIT_DELAY)

            # Update database
            if updates:
                supabase.table('species').update(updates).eq('id', species['id']).execute()
                enriched_count += 1
                print(f"  ✅ Updated!")
            else:
                print(f"  ⚠️  No new data found")

    print("\n" + "=" * 60)
    print(f"✅ Complete! Enriched {enriched_count} species records")

if __name__ == '__main__':
    main()
