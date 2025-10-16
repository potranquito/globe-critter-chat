#!/usr/bin/env python3
"""
Delete specific Borneo species that don't have images.
"""
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Species names to delete
species_to_delete = [
    "Hose's langur",
    "Bornean rainbow toad",
    "Ansonia latidisca",
    "Bornean clouded leopard",
    "Sunda clouded leopard",
    "Bornean flat-headed frog",
    "Barbourula kalimantanensis"
]

print("Searching for species to delete...")
print("=" * 60)

species_ids = []

for name in species_to_delete:
    # Search by both common name and scientific name
    result = supabase.from_('species').select('id, common_name, scientific_name, image_url').or_(
        f'common_name.ilike.%{name}%,scientific_name.ilike.%{name}%'
    ).execute()

    if result.data:
        for sp in result.data:
            print(f"\nFound: {sp.get('common_name', 'N/A')}")
            print(f"  Scientific: {sp['scientific_name']}")
            print(f"  ID: {sp['id']}")
            print(f"  Image: {sp.get('image_url', 'None')[:80] if sp.get('image_url') else 'None'}")
            species_ids.append(sp['id'])

print(f"\n\n{'=' * 60}")
print(f"Found {len(species_ids)} species to delete")
print(f"IDs: {species_ids}")
print(f"{'=' * 60}\n")

if species_ids:
    # Remove duplicates
    unique_ids = list(set(species_ids))
    print(f"\nDeleting {len(unique_ids)} unique species...")

    for species_id in unique_ids:
        print(f"Deleting species ID {species_id}...")
        result = supabase.from_('species').delete().eq('id', species_id).execute()
        print(f"  ✓ Deleted")

    print(f"\n✓ Successfully deleted {len(unique_ids)} species!")
else:
    print("No species found to delete.")
