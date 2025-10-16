#!/usr/bin/env python3
"""
Tool to manage curated species - mark species as curated or uncurated.
"""
import os
import sys
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def search_species(search_term):
    """Search for species by name."""
    result = supabase.from_('species').select('id, common_name, scientific_name, is_curated, image_url, class').or_(
        f'common_name.ilike.%{search_term}%,scientific_name.ilike.%{search_term}%'
    ).limit(10).execute()

    return result.data

def mark_curated(species_id, curated=True):
    """Mark a species as curated or uncurated."""
    result = supabase.from_('species').update({'is_curated': curated}).eq('id', species_id).execute()
    return result

def show_species_details(species_id):
    """Show details of a specific species."""
    result = supabase.from_('species').select('*').eq('id', species_id).execute()
    if result.data:
        sp = result.data[0]
        print(f"\n=== SPECIES DETAILS ===")
        print(f"ID: {sp['id']}")
        print(f"Common Name: {sp.get('common_name', 'N/A')}")
        print(f"Scientific Name: {sp['scientific_name']}")
        print(f"Class: {sp.get('class', 'N/A')}")
        print(f"Curated: {sp.get('is_curated', False)}")
        print(f"Image URL: {sp.get('image_url', 'N/A')}")
        return sp
    return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Search: python manage_curated_species.py search 'reindeer'")
        print("  Curate: python manage_curated_species.py curate <species_id>")
        print("  Uncurate: python manage_curated_species.py uncurate <species_id>")
        print("  Details: python manage_curated_species.py show <species_id>")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'search':
        if len(sys.argv) < 3:
            print("Please provide a search term")
            sys.exit(1)

        search_term = sys.argv[2]
        results = search_species(search_term)

        print(f"\n=== SEARCH RESULTS FOR '{search_term}' ===\n")
        for sp in results:
            curated = '✓' if sp.get('is_curated') else '✗'
            img_ok = '✓' if sp.get('image_url') and 'DAB_list' not in sp.get('image_url', '') else '✗'
            print(f"{sp.get('common_name', 'N/A'):<35} Curated:{curated} Image:{img_ok}")
            print(f"  ID: {sp['id']}")
            print(f"  Scientific: {sp['scientific_name']}")
            if sp.get('image_url'):
                print(f"  Image: {sp['image_url'][:80]}")
            print()

    elif command == 'curate':
        if len(sys.argv) < 3:
            print("Please provide a species ID")
            sys.exit(1)

        species_id = sys.argv[2]
        sp = show_species_details(species_id)

        if sp:
            confirm = input(f"\nMark '{sp.get('common_name')}' as CURATED? (y/n): ")
            if confirm.lower() == 'y':
                mark_curated(species_id, True)
                print("✓ Species marked as curated!")

    elif command == 'uncurate':
        if len(sys.argv) < 3:
            print("Please provide a species ID")
            sys.exit(1)

        species_id = sys.argv[2]
        sp = show_species_details(species_id)

        if sp:
            confirm = input(f"\nMark '{sp.get('common_name')}' as UNCURATED? (y/n): ")
            if confirm.lower() == 'y':
                mark_curated(species_id, False)
                print("✓ Species marked as uncurated!")

    elif command == 'show':
        if len(sys.argv) < 3:
            print("Please provide a species ID")
            sys.exit(1)

        species_id = sys.argv[2]
        show_species_details(species_id)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
