#!/usr/bin/env python3
"""
Fetch seabirds from the Coral Triangle region using GBIF API.
"""
import requests
import json

# Coral Triangle bounding box (approximate)
# Philippines, Indonesia, Papua New Guinea
CORAL_TRIANGLE_BOX = {
    'min_lat': -10.0,  # South
    'max_lat': 15.0,   # North
    'min_lon': 95.0,   # West
    'max_lon': 145.0   # East
}

# Target seabird families
SEABIRD_FAMILIES = [
    'Laridae',        # Gulls, terns, noddies
    'Sulidae',        # Boobies, gannets
    'Fregatidae',     # Frigatebirds
    'Phaethontidae',  # Tropicbirds
    'Phalacrocoracidae',  # Cormorants
    'Sternidae',      # Terns (sometimes separate from Laridae)
]

def search_gbif_seabirds(family_name, limit=5):
    """Search GBIF for seabirds in a family within Coral Triangle."""

    url = "https://api.gbif.org/v1/occurrence/search"

    params = {
        'familyKey': None,  # Will look up family key first
        'decimalLatitude': f"{CORAL_TRIANGLE_BOX['min_lat']},{CORAL_TRIANGLE_BOX['max_lat']}",
        'decimalLongitude': f"{CORAL_TRIANGLE_BOX['min_lon']},{CORAL_TRIANGLE_BOX['max_lon']}",
        'mediaType': 'StillImage',  # Only species with images
        'limit': limit,
        'hasCoordinate': True,
        'hasGeospatialIssue': False,
    }

    # First, get the family key
    family_url = f"https://api.gbif.org/v1/species/match?name={family_name}"
    family_response = requests.get(family_url)

    if family_response.status_code != 200:
        print(f"Could not find family: {family_name}")
        return []

    family_data = family_response.json()
    family_key = family_data.get('familyKey')

    if not family_key:
        print(f"No family key for: {family_name}")
        return []

    params['familyKey'] = family_key

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print(f"Error fetching {family_name}: {response.status_code}")
        return []

    data = response.json()
    return data.get('results', [])

def extract_species_info(occurrence):
    """Extract relevant info from GBIF occurrence."""

    return {
        'common_name': occurrence.get('vernacularName', occurrence.get('species', 'Unknown')),
        'scientific_name': occurrence.get('species', 'Unknown'),
        'family': occurrence.get('family', 'Unknown'),
        'genus': occurrence.get('genus', ''),
        'species_key': occurrence.get('speciesKey'),
        'has_image': bool(occurrence.get('media')),
        'image_url': occurrence.get('media', [{}])[0].get('identifier') if occurrence.get('media') else None,
        'country': occurrence.get('country', ''),
        'locality': occurrence.get('locality', ''),
    }

if __name__ == '__main__':
    print("=== SEARCHING FOR SEABIRDS IN CORAL TRIANGLE ===\n")

    all_seabirds = []
    seen_species = set()

    for family in SEABIRD_FAMILIES:
        print(f"Searching {family}...")
        occurrences = search_gbif_seabirds(family, limit=10)

        for occ in occurrences:
            species_key = occ.get('speciesKey')

            # Avoid duplicates
            if species_key and species_key not in seen_species:
                info = extract_species_info(occ)

                if info['has_image']:
                    all_seabirds.append(info)
                    seen_species.add(species_key)

                    print(f"  ✓ {info['common_name']} ({info['scientific_name']})")
                    if info['image_url']:
                        print(f"    Image: {info['image_url'][:70]}...")

    print(f"\n=== TOTAL SEABIRDS FOUND: {len(all_seabirds)} ===\n")

    # Save to JSON
    with open('coral_triangle_seabirds.json', 'w') as f:
        json.dump(all_seabirds, f, indent=2)

    print("✓ Saved to coral_triangle_seabirds.json")

    # Show summary
    print("\n=== SPECIES BY FAMILY ===")
    family_counts = {}
    for bird in all_seabirds:
        family = bird['family']
        family_counts[family] = family_counts.get(family, 0) + 1

    for family, count in family_counts.items():
        print(f"  {family}: {count}")
