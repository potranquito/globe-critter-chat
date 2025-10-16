#!/usr/bin/env python3
"""
Check species distribution across ecoregions and identify ones needing more species.
"""
import os
from supabase import create_client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_species_distribution():
    """Check how many species each ecoregion has."""

    # Get all ecoregions
    ecoregions = supabase.from_('ecoregions').select('id, ecoregion_id, name').execute()

    eco_counts = []
    for eco in ecoregions.data:
        # Count species for this ecoregion
        species_count_result = supabase.from_('species_ecoregions').select(
            'species_id', count='exact'
        ).eq('ecoregion_id', eco['id']).execute()

        species_count = species_count_result.count if species_count_result.count else 0

        eco_counts.append({
            'ecoregion_id': eco['ecoregion_id'],
            'name': eco['name'],
            'id': eco['id'],
            'species_count': species_count
        })

    # Sort by species count
    eco_counts.sort(key=lambda x: x['species_count'])

    print("\n=== ECOREGIONS WITH LOWEST SPECIES COUNTS ===\n")
    print(f"{'Ecoregion':<50} {'Code':<15} {'Species'}")
    print("-" * 80)

    low_count_ecos = []
    for eco in eco_counts[:30]:  # Show bottom 30
        print(f"{eco['name']:<50} {eco['ecoregion_id']:<15} {eco['species_count']:>7}")
        if eco['species_count'] < 25:
            low_count_ecos.append(eco)

    print(f"\n\nTotal ecoregions with < 25 species: {len(low_count_ecos)}")

    # Get total stats
    total_ecos = len(eco_counts)
    avg_species = sum(e['species_count'] for e in eco_counts) / total_ecos if total_ecos > 0 else 0

    print(f"\n=== OVERALL STATISTICS ===")
    print(f"Total ecoregions: {total_ecos}")
    print(f"Average species per ecoregion: {avg_species:.1f}")
    print(f"Min species: {eco_counts[0]['species_count']} ({eco_counts[0]['name']})")
    print(f"Max species: {eco_counts[-1]['species_count']} ({eco_counts[-1]['name']})")

    return low_count_ecos

if __name__ == '__main__':
    check_species_distribution()
