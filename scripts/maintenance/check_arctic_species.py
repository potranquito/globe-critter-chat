#!/usr/bin/env python3
"""
Check Arctic species - both total and curated with images.
"""
import os
from supabase import create_client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_arctic_species():
    """Check Arctic species breakdown."""

    # Get Arctic ecoregion
    arctic_result = supabase.from_('ecoregions').select('*').ilike('name', '%arctic%').execute()

    if not arctic_result.data:
        print("No Arctic ecoregion found!")
        return

    arctic = arctic_result.data[0]
    print(f"\n=== ARCTIC ECOREGION ===")
    print(f"Name: {arctic['name']}")
    print(f"ID: {arctic['id']}")
    print(f"Ecoregion ID: {arctic['ecoregion_id']}")

    # Get ALL species linked to Arctic (not just curated)
    all_species_result = supabase.from_('species_ecoregions').select(
        'species!inner(id, scientific_name, common_name, is_curated, image_url, class, is_marine, is_terrestrial, is_freshwater)',
        count='exact'
    ).eq('ecoregion_id', arctic['id']).execute()

    all_species = all_species_result.data
    total_count = all_species_result.count

    print(f"\n=== TOTAL SPECIES IN ARCTIC ===")
    print(f"Total species: {total_count}")

    # Count curated species
    curated_species = [s for s in all_species if s['species']['is_curated']]
    print(f"Curated species: {len(curated_species)}")

    # Count species with images
    with_images = [s for s in curated_species if s['species'].get('image_url')]
    print(f"Curated species with images: {len(with_images)}")

    # Count species without images
    without_images = [s for s in curated_species if not s['species'].get('image_url')]
    print(f"Curated species WITHOUT images: {len(without_images)}")

    if without_images:
        print("\n=== CURATED SPECIES MISSING IMAGES ===")
        for s in without_images[:10]:  # Show first 10
            sp = s['species']
            print(f"  - {sp.get('common_name', 'N/A'):<30} ({sp['scientific_name']})")

    # Breakdown by class
    print(f"\n=== CURATED SPECIES BY CLASS ===")
    class_counts = {}
    for s in curated_species:
        cls = s['species'].get('class', 'Unknown')
        class_counts[cls] = class_counts.get(cls, 0) + 1

    for cls, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cls}: {count}")

    # Habitat breakdown
    print(f"\n=== CURATED SPECIES BY HABITAT ===")
    marine = [s for s in curated_species if s['species'].get('is_marine')]
    terrestrial = [s for s in curated_species if s['species'].get('is_terrestrial')]
    freshwater = [s for s in curated_species if s['species'].get('is_freshwater')]

    print(f"  Marine: {len(marine)}")
    print(f"  Terrestrial: {len(terrestrial)}")
    print(f"  Freshwater: {len(freshwater)}")

    # Test the balanced function directly
    print(f"\n=== TESTING get_curated_species_by_ecoregion_balanced ===")
    balanced_result = supabase.rpc(
        'get_curated_species_by_ecoregion_balanced',
        {
            'ecoregion_uuid': arctic['id'],
            'max_per_class': 10
        }
    ).execute()

    if balanced_result.data:
        print(f"Returned species: {len(balanced_result.data)}")

        # Show breakdown
        class_counts = {}
        for sp in balanced_result.data:
            cls = sp.get('class', 'Unknown')
            class_counts[cls] = class_counts.get(cls, 0) + 1

        print("Breakdown by class:")
        for cls, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {cls}: {count}")

        # Check habitat filtering
        marine_count = len([s for s in balanced_result.data if s.get('is_marine')])
        terrestrial_count = len([s for s in balanced_result.data if s.get('is_terrestrial')])
        print(f"\nHabitat breakdown:")
        print(f"  Marine: {marine_count}")
        print(f"  Terrestrial: {terrestrial_count}")
    else:
        print("ERROR: No species returned from balanced function")
        print(f"Error: {balanced_result}")

if __name__ == '__main__':
    check_arctic_species()
