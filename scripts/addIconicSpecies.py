#!/usr/bin/env python3
"""
Add iconic/famous species to each ecoregion with common names.
These are well-known animals that people expect to see in these regions.
"""

import os
import re
import time
import requests
from supabase import create_client
from urllib.parse import quote

# Load environment variables
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# User-Agent header required by Wikimedia APIs
HEADERS = {
    'User-Agent': 'GlobeCritterChat/1.0 (Educational biodiversity app; https://github.com/example)'
}

# Iconic species for each ecoregion - these are famous animals people know
ICONIC_SPECIES = {
    'Congo Basin': [
        ('Gorilla gorilla', 'Western Gorilla', 'MAMMALIA'),
        ('Pan troglodytes', 'Chimpanzee', 'MAMMALIA'),
        ('Loxodonta cyclotis', 'Forest Elephant', 'MAMMALIA'),
        ('Okapia johnstoni', 'Okapi', 'MAMMALIA'),
        ('Panthera pardus', 'Leopard', 'MAMMALIA'),
        ('Syncerus caffer', 'African Buffalo', 'MAMMALIA'),
        ('Crocodylus niloticus', 'Nile Crocodile', 'REPTILIA'),
        ('Python sebae', 'African Rock Python', 'REPTILIA'),
        ('Ceratogymna atrata', 'Black-casqued Hornbill', 'AVES'),
        ('Musophaga rossae', 'Ross\'s Turaco', 'AVES'),
    ],
    'Amazon and Guianas': [
        ('Panthera onca', 'Jaguar', 'MAMMALIA'),
        ('Tapirus terrestris', 'Lowland Tapir', 'MAMMALIA'),
        ('Bradypus tridactylus', 'Three-toed Sloth', 'MAMMALIA'),
        ('Ara ararauna', 'Blue-and-yellow Macaw', 'AVES'),
        ('Harpia harpyja', 'Harpy Eagle', 'AVES'),
        ('Ramphastos toco', 'Toco Toucan', 'AVES'),
        ('Morpho menelaus', 'Blue Morpho Butterfly', 'INSECTA'),
        ('Dendrobates tinctorius', 'Dyeing Poison Frog', 'AMPHIBIA'),
        ('Eunectes murinus', 'Green Anaconda', 'REPTILIA'),
        ('Arapaima gigas', 'Arapaima', 'ACTINOPTERYGII'),
    ],
    'Borneo': [
        ('Pongo pygmaeus', 'Bornean Orangutan', 'MAMMALIA'),
        ('Nasalis larvatus', 'Proboscis Monkey', 'MAMMALIA'),
        ('Panthera pardus', 'Clouded Leopard', 'MAMMALIA'),
        ('Dicerorhinus sumatrensis', 'Sumatran Rhinoceros', 'MAMMALIA'),
        ('Elephas maximus', 'Asian Elephant', 'MAMMALIA'),
        ('Buceros rhinoceros', 'Rhinoceros Hornbill', 'AVES'),
        ('Argusianus argus', 'Great Argus', 'AVES'),
        ('Python reticulatus', 'Reticulated Python', 'REPTILIA'),
        ('Rafflesia arnoldii', 'Corpse Flower', 'MAGNOLIOPSIDA'),
    ],
    'Madagascar': [
        ('Lemur catta', 'Ring-tailed Lemur', 'MAMMALIA'),
        ('Propithecus verreauxi', 'Verreaux\'s Sifaka', 'MAMMALIA'),
        ('Indri indri', 'Indri', 'MAMMALIA'),
        ('Daubentonia madagascariensis', 'Aye-aye', 'MAMMALIA'),
        ('Cryptoprocta ferox', 'Fossa', 'MAMMALIA'),
        ('Furcifer pardalis', 'Panther Chameleon', 'REPTILIA'),
        ('Uroplatus phantasticus', 'Satanic Leaf-tailed Gecko', 'REPTILIA'),
        ('Adansonia grandidieri', 'Grandidier\'s Baobab', 'MAGNOLIOPSIDA'),
        ('Coua cristata', 'Crested Coua', 'AVES'),
    ],
    'Arctic Terrestrial': [
        ('Ursus maritimus', 'Polar Bear', 'MAMMALIA'),
        ('Rangifer tarandus', 'Caribou', 'MAMMALIA'),
        ('Ovibos moschatus', 'Muskox', 'MAMMALIA'),
        ('Vulpes lagopus', 'Arctic Fox', 'MAMMALIA'),
        ('Lepus arcticus', 'Arctic Hare', 'MAMMALIA'),
        ('Gulo gulo', 'Wolverine', 'MAMMALIA'),
        ('Bubo scandiacus', 'Snowy Owl', 'AVES'),
        ('Plectrophenax nivalis', 'Snow Bunting', 'AVES'),
        ('Odobenus rosmarus', 'Walrus', 'MAMMALIA'),
    ],
    'Coral Triangle': [
        ('Chelonia mydas', 'Green Sea Turtle', 'REPTILIA'),
        ('Manta birostris', 'Giant Manta Ray', 'CHONDRICHTHYES'),
        ('Rhincodon typus', 'Whale Shark', 'CHONDRICHTHYES'),
        ('Amphiprion ocellaris', 'Clownfish', 'ACTINOPTERYGII'),
        ('Acropora millepora', 'Staghorn Coral', 'ANTHOZOA'),
        ('Hippocampus bargibanti', 'Pygmy Seahorse', 'ACTINOPTERYGII'),
        ('Pterapogon kauderni', 'Banggai Cardinalfish', 'ACTINOPTERYGII'),
        ('Synchiropus splendidus', 'Mandarinfish', 'ACTINOPTERYGII'),
    ]
}

def fetch_common_name(scientific_name: str) -> str:
    """Fetch common name from Wikipedia/Wikidata"""
    try:
        # Try Wikipedia first
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote(scientific_name)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*"

        response = requests.get(wiki_url, headers=HEADERS, timeout=10)
        data = response.json()

        pages = data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if page_id != '-1' and 'extract' in page_data:
                extract = page_data['extract']

                # Try to extract common name from first sentence
                # Pattern: "The X" or "X is a"
                patterns = [
                    r'The\s+([A-Z][a-z]+(?:\s+[a-z]+){0,3})',
                    r'^([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+is\s+a',
                ]

                for pattern in patterns:
                    match = re.search(pattern, extract)
                    if match:
                        common_name = match.group(1)
                        # Clean up common names
                        if len(common_name) > 3 and len(common_name) < 50:
                            return common_name

        return None

    except Exception as e:
        print(f"  Error fetching common name: {e}")
        return None

def add_iconic_species():
    """Add iconic species to database with common names"""

    print("=== Adding Iconic Species to Ecoregions ===\n")

    # Get ecoregion IDs
    ecoregions_response = supabase.table('ecoregions').select('id, name').execute()
    ecoregions = {eco['name']: eco['id'] for eco in ecoregions_response.data}

    total_added = 0
    total_updated = 0

    for ecoregion_name, species_list in ICONIC_SPECIES.items():
        if ecoregion_name not in ecoregions:
            print(f"⚠️  Ecoregion '{ecoregion_name}' not found in database")
            continue

        ecoregion_id = ecoregions[ecoregion_name]
        print(f"\n=== {ecoregion_name} ===")

        for scientific_name, default_common_name, taxonomic_class in species_list:
            print(f"\n[{scientific_name}]")

            # Check if species exists
            species_response = supabase.table('species').select('id, common_name').eq('scientific_name', scientific_name).execute()

            if species_response.data:
                # Species exists - update if needed
                species = species_response.data[0]
                species_id = species['id']

                # Update common name if it's missing
                if not species['common_name']:
                    # Try to fetch from Wikipedia, fallback to default
                    fetched_name = fetch_common_name(scientific_name)
                    common_name = fetched_name or default_common_name

                    supabase.table('species').update({
                        'common_name': common_name
                    }).eq('id', species_id).execute()

                    print(f"  ✓ Updated common name: {common_name}")
                    total_updated += 1
                else:
                    print(f"  ✓ Already has common name: {species['common_name']}")

            else:
                # Species doesn't exist - add it
                fetched_name = fetch_common_name(scientific_name)
                common_name = fetched_name or default_common_name

                # Generate a unique IUCN ID for iconic species (use hash of name)
                iucn_id = abs(hash(scientific_name)) % (10**8)  # 8-digit integer

                insert_response = supabase.table('species').insert({
                    'iucn_id': iucn_id,
                    'scientific_name': scientific_name,
                    'common_name': common_name,
                    'class': taxonomic_class,
                }).execute()

                species_id = insert_response.data[0]['id']
                print(f"  ✓ Added species: {common_name}")
                total_added += 1

            # Link to ecoregion
            link_response = supabase.table('species_ecoregions').select('species_id').eq('species_id', species_id).eq('ecoregion_id', ecoregion_id).execute()

            if not link_response.data:
                supabase.table('species_ecoregions').insert({
                    'species_id': species_id,
                    'ecoregion_id': ecoregion_id
                }).execute()
                print(f"  ✓ Linked to {ecoregion_name}")

            time.sleep(0.5)  # Rate limiting

    print(f"\n=== Summary ===")
    print(f"Added: {total_added} species")
    print(f"Updated: {total_updated} species with common names")
    print(f"\n✅ Iconic species setup complete!")

if __name__ == '__main__':
    add_iconic_species()
