#!/usr/bin/env python3
"""
Fetch Wikipedia images for curated species without images in the database.
Uses the robust WikipediaImageFetcher from Local-Agents.
"""
import sys
sys.path.append('/home/potranquito/repos/Local-Agents')

from wikipedia_image_fetcher import WikipediaImageFetcher
from supabase import create_client
import os
import time

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def main():
    print("🖼️  Fetching Wikipedia Images for Database Species")
    print("=" * 70)

    # Get curated species without images
    result = supabase.from_('species').select(
        'id, scientific_name, common_name, class'
    ).eq('is_curated', True).is_('image_url', 'null').order('scientific_name').execute()

    species_list = result.data

    print(f"\n📊 Found {len(species_list)} curated species without images\n")

    if not species_list:
        print("✅ All curated species already have images!")
        return

    # Initialize fetcher
    fetcher = WikipediaImageFetcher(rate_limit_delay=0.5)

    # Fetch images
    success_count = 0
    fail_count = 0

    for i, species in enumerate(species_list, 1):
        common = species['common_name'] or species['scientific_name']
        scientific = species['scientific_name']

        print(f"\n[{i}/{len(species_list)}] {common} ({scientific})")

        try:
            # Use the robust search_alternative_names method
            image_data = fetcher.search_alternative_names(
                scientific,
                common if common != scientific else None
            )

            if image_data and image_data.get('image_url'):
                # Update database
                supabase.from_('species').update({
                    'image_url': image_data['image_url'],
                    'description': image_data.get('description') or None
                }).eq('id', species['id']).execute()

                print(f"  ✅ Fetched: {image_data['image_url'][:80]}...")
                success_count += 1
            else:
                print(f"  ❌ No image found")
                fail_count += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")
            fail_count += 1

        # Rate limiting
        time.sleep(0.3)

    print(f"\n{'=' * 70}")
    print(f"📊 SUMMARY")
    print(f"{'=' * 70}")
    print(f"✅ Successfully fetched: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"📍 Total processed: {len(species_list)}")
    print(f"\n💡 Refresh your browser to see the new species images!")

if __name__ == '__main__':
    main()
