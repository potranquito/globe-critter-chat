#!/usr/bin/env python3
"""
Delete bongo and forest elephant from Congo ecoregion.
"""
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Species IDs to delete
species_ids = [
    "a3e09d7c-c4aa-4a1b-a0f0-b2fcfb5b0475",  # Bongo
    "b21c2c6f-acb1-46aa-a0fd-2b29196e1577",  # Forest Elephant (Loxodonta cyclotis)
    "d1492fc0-dd0e-4b9c-be2b-c3faf7528270"   # African forest elephant
]

print("Deleting Congo species...")
print("=" * 60)

for species_id in species_ids:
    # Get species details first
    result = supabase.from_('species').select('common_name, scientific_name').eq('id', species_id).execute()

    if result.data:
        sp = result.data[0]
        print(f"\nDeleting: {sp.get('common_name', 'N/A')}")
        print(f"  Scientific: {sp['scientific_name']}")
        print(f"  ID: {species_id}")

        # Delete the species
        delete_result = supabase.from_('species').delete().eq('id', species_id).execute()
        print(f"  ✓ Deleted")
    else:
        print(f"\nSpecies {species_id} not found (may already be deleted)")

print(f"\n✓ Successfully deleted {len(species_ids)} species!")
