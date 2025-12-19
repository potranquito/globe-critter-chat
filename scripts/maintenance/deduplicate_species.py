#!/usr/bin/env python3
"""
Remove duplicate species from the database, keeping only the oldest entry for each scientific name.
"""
import os
from supabase import create_client
from collections import defaultdict

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def deduplicate_species():
    """Remove duplicate species, keeping the oldest entry."""

    print("🔍 Finding duplicate species...")

    # Get all curated species
    result = supabase.from_('species').select(
        'id, scientific_name, common_name, is_curated, created_at, image_url'
    ).eq('is_curated', True).order('scientific_name, created_at').execute()

    # Group by scientific name
    by_name = defaultdict(list)
    for sp in result.data:
        by_name[sp['scientific_name']].append(sp)

    # Find duplicates
    duplicates = {name: species for name, species in by_name.items() if len(species) > 1}

    print(f"\n📊 Statistics:")
    print(f"  Total curated species: {len(result.data)}")
    print(f"  Unique scientific names: {len(by_name)}")
    print(f"  Duplicate species: {len(duplicates)} names")
    print(f"  Total duplicates to remove: {sum(len(v) - 1 for v in duplicates.values())}")

    if not duplicates:
        print("\n✅ No duplicates found!")
        return

    # Ask for confirmation
    response = input(f"\n⚠️  This will DELETE {sum(len(v) - 1 for v in duplicates.values())} duplicate species. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Aborted")
        return

    # Delete duplicates (keep oldest)
    deleted_count = 0
    kept_count = 0

    for name, species in duplicates.items():
        # Sort by created_at (oldest first)
        species_sorted = sorted(species, key=lambda x: x['created_at'])

        # Keep the first (oldest)
        keep = species_sorted[0]
        to_delete = species_sorted[1:]

        print(f"\n📝 {name}:")
        print(f"  ✅ KEEP: {keep['id'][:8]}... (created: {keep['created_at'][:19]})")

        for sp in to_delete:
            try:
                # Delete the species (CASCADE will handle foreign keys)
                supabase.from_('species').delete().eq('id', sp['id']).execute()
                print(f"  ❌ DELETED: {sp['id'][:8]}... (created: {sp['created_at'][:19]})")
                deleted_count += 1
            except Exception as e:
                print(f"  ⚠️  ERROR deleting {sp['id'][:8]}...: {e}")

        kept_count += 1

    print(f"\n✅ Deduplication complete!")
    print(f"  Kept: {kept_count} species")
    print(f"  Deleted: {deleted_count} duplicates")

    # Verify final count
    final_result = supabase.from_('species').select('id', count='exact').eq('is_curated', True).execute()
    print(f"  Final curated species count: {final_result.count}")

if __name__ == '__main__':
    deduplicate_species()
