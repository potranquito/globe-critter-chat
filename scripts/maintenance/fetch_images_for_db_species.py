#!/usr/bin/env python3
"""
Fetch images for existing database species that don't have images.
Priority: CR > EN > VU species
"""
import sys
sys.path.append('/home/potranquito/repos/Local-Agents')

from wikipedia_image_fetcher import WikipediaImageFetcher
from supabase import create_client
import os
from dotenv import load_dotenv
import csv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Target: Get images for high-priority species in each ecoregion
TARGET_PER_ECOREGION_PER_STATUS = {
    'CR': 30,  # 30 Critically Endangered per ecoregion
    'EN': 40,  # 40 Endangered per ecoregion
    'VU': 50,  # 50 Vulnerable per ecoregion
    'NT': 30,  # 30 Near Threatened per ecoregion
    'LC': 50,  # 50 Least Concern per ecoregion (charismatic species)
}

print("🖼️  Fetching Images for Database Species\n")
print(f"Target: {sum(TARGET_PER_ECOREGION_PER_STATUS.values())} species per ecoregion")
print(f"Total expected: {sum(TARGET_PER_ECOREGION_PER_STATUS.values()) * 6} species\n")

fetcher = WikipediaImageFetcher(rate_limit_delay=1.0)
results = []

ecoregions = supabase.table('ecoregions').select('id, name').execute()

for eco in sorted(ecoregions.data, key=lambda x: x['name']):
    print(f"\n{'='*70}")
    print(f"📍 {eco['name']}")
    print(f"{'='*70}\n")

    # Get species in this ecoregion
    species_links = supabase.table('species_ecoregions').select('species_id').eq('ecoregion_id', eco['id']).execute()
    species_ids = [s['species_id'] for s in species_links.data]

    if not species_ids:
        print("   No species found")
        continue

    for status, target_count in TARGET_PER_ECOREGION_PER_STATUS.items():
        print(f"\n   🚨 {status} species (target: {target_count})...")

        # Query species without images
        found_species = []
        batch_size = 100
        for i in range(0, len(species_ids), batch_size):
            batch = species_ids[i:i+batch_size]
            result = supabase.table('species').select('id, scientific_name, common_name, class, is_marine, is_terrestrial, is_freshwater').in_('id', batch).is_('image_url', 'null').eq('conservation_status', status).execute()
            found_species.extend(result.data)

        if not found_species:
            print(f"      ✓ All {status} species already have images!")
            continue

        print(f"      Found {len(found_species)} species without images, fetching {min(target_count, len(found_species))}...")

        # Fetch images for target_count species
        fetch_count = 0
        for species in found_species[:target_count]:
            # Try common name first, then scientific name
            search_terms = []
            if species.get('common_name'):
                search_terms.append(species['common_name'])
            search_terms.append(species['scientific_name'])

            image_data = None
            for term in search_terms:
                print(f"      [{fetch_count+1}/{target_count}] Trying: {term}...", end=' ')
                image_data = fetcher.fetch_image_from_wikipedia(term)
                if image_data:
                    print(f"✓")
                    break
                else:
                    print(f"✗")

            if image_data:
                # Determine habitat_type from flags
                habitat_type = ''
                if species.get('is_marine'):
                    habitat_type = 'Marine'
                elif species.get('is_freshwater'):
                    habitat_type = 'Freshwater'
                elif species.get('is_terrestrial'):
                    habitat_type = 'Terrestrial'

                results.append({
                    'ecoregion': eco['name'],
                    'scientific_name': species['scientific_name'],
                    'common_name': species.get('common_name', ''),
                    'class': species.get('class', ''),
                    'conservation_status': status,
                    'habitat_type': habitat_type,
                    'image_url': image_data['image_url'],
                    'attribution': image_data['attribution'],
                    'description': image_data.get('description', ''),
                    'species_id': species['id']  # Keep track of DB ID for updates
                })
                fetch_count += 1

                if fetch_count >= target_count:
                    break

        print(f"      ✅ Fetched {fetch_count} images for {status} species")

# Save results to CSV
output_file = 'database_species_with_images.csv'
print(f"\n{'='*70}")
print(f"💾 Saving {len(results)} species to {output_file}")
print(f"{'='*70}\n")

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    if results:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

print(f"✅ Complete! Fetched images for {len(results)} species")
print(f"\nNext steps:")
print(f"1. Review {output_file}")
print(f"2. Update species in database with image URLs")
