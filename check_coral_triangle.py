#!/usr/bin/env python3
"""
Check Coral Triangle species - ensure all marine.
"""
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_coral_triangle():
    """Check Coral Triangle species."""

    # Get Coral Triangle ecoregion
    coral = supabase.from_('ecoregions').select('*').ilike('name', '%coral%triangle%').execute()

    if not coral.data:
        print("No Coral Triangle ecoregion found!")
        return

    coral_region = coral.data[0]
    print(f"\n=== CORAL TRIANGLE ECOREGION ===")
    print(f"Name: {coral_region['name']}")
    print(f"ID: {coral_region['id']}")
    print(f"Realm: {coral_region.get('realm', 'N/A')}")

    # Get curated species
    result = supabase.rpc(
        'get_curated_species_by_ecoregion_balanced',
        {'ecoregion_uuid': coral_region['id'], 'max_per_class': 10}
    ).execute()

    species = result.data or []

    print(f"\n=== CURRENT CURATED SPECIES: {len(species)} ===\n")

    # Separate marine and non-marine
    marine_species = [s for s in species if s.get('is_marine')]
    non_marine = [s for s in species if not s.get('is_marine')]
    terrestrial = [s for s in species if s.get('is_terrestrial')]
    freshwater = [s for s in species if s.get('is_freshwater')]

    print(f"Marine species: {len(marine_species)}")
    print(f"Non-marine species: {len(non_marine)}")
    print(f"  - Terrestrial: {len(terrestrial)}")
    print(f"  - Freshwater only: {len([s for s in freshwater if not s.get('is_marine')])}")

    if non_marine:
        print(f"\n=== NON-MARINE SPECIES TO REMOVE ===\n")
        for s in non_marine:
            marine = '🌊' if s.get('is_marine') else ''
            terr = '🌳' if s.get('is_terrestrial') else ''
            fresh = '💧' if s.get('is_freshwater') else ''
            print(f"  {s.get('common_name', 'N/A'):<35} {marine}{terr}{fresh}")
            print(f"    Class: {s.get('class')}")

    # Check image quality
    print(f"\n=== IMAGE QUALITY CHECK ===\n")
    bad_images = []
    for s in species:
        img_url = s.get('image_url', '')
        if not img_url or 'DAB_list' in img_url or 'gray.svg' in img_url:
            bad_images.append(s)
            print(f"  ✗ {s.get('common_name', 'N/A')}: {img_url[:60] if img_url else 'NO IMAGE'}")

    if not bad_images:
        print("  ✓ All species have valid images")

    # Show class breakdown
    print(f"\n=== SPECIES BY CLASS ===\n")
    classes = {}
    for s in species:
        cls = s.get('class', 'Unknown')
        classes[cls] = classes.get(cls, 0) + 1

    for cls, count in sorted(classes.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cls}: {count}")

    print(f"\n=== MARINE SPECIES LIST ({len(marine_species)}) ===\n")
    for i, s in enumerate(marine_species, 1):
        cons = s.get('conservation_status', 'NE')
        print(f"{i:2}. {s.get('common_name', 'N/A'):<35} ({cons})")

if __name__ == '__main__':
    check_coral_triangle()
