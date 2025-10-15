#!/usr/bin/env python3
"""
Import curated species from CSV for all ecoregions

Usage:
    python scripts/import_curated_species.py

This script:
1. Reads curated_species_database.csv
2. Adds species to the species table (if not exists)
3. Links species to their specified ecoregion(s)
4. Sets proper habitat flags (marine/terrestrial/freshwater)
"""

import os
import csv
from supabase import create_client
from dotenv import load_dotenv
import uuid

load_dotenv(override=True)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(url, key)

print("🌍 Importing Curated Species for All Ecoregions\n")

# Get all ecoregions from database
print("1️⃣ Loading ecoregions from database...")
ecoregions_result = supabase.table('ecoregions').select('id, name').execute()
ecoregions_map = {eco['name'].lower(): eco for eco in ecoregions_result.data}
print(f"   ✅ Found {len(ecoregions_map)} ecoregions in database\n")

# Read CSV file
csv_path = 'curated_species_database_enriched.csv'
print(f"2️⃣ Reading {csv_path}...")

species_to_import = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    species_to_import = list(reader)

print(f"   ✅ Found {len(species_to_import)} species in CSV")

# Group by ecoregion
ecoregion_species = {}
for species in species_to_import:
    eco_name = species.get('ecoregion_name', species.get('ecoregion', ''))
    if eco_name not in ecoregion_species:
        ecoregion_species[eco_name] = []
    ecoregion_species[eco_name].append(species)

print(f"   📊 Species distribution:")
for eco_name, species_list in ecoregion_species.items():
    print(f"      - {eco_name}: {len(species_list)} species")

# Import each species
print(f"\n3️⃣ Importing species to database...")
imported_count = 0
updated_count = 0
linked_count = 0
skipped_ecoregions = set()

for i, species in enumerate(species_to_import, 1):
    scientific_name = species['scientific_name']
    common_name = species['common_name']
    ecoregion_name = species.get('ecoregion_name', species.get('ecoregion', ''))

    print(f"\n   [{i}/{len(species_to_import)}] {common_name} ({scientific_name}) → {ecoregion_name}")

    # Find ecoregion
    ecoregion_key = ecoregion_name.lower()
    if ecoregion_key not in ecoregions_map:
        print(f"      ⚠️  Ecoregion '{ecoregion_name}' not found in database")
        skipped_ecoregions.add(ecoregion_name)
        continue

    ecoregion = ecoregions_map[ecoregion_key]
    ecoregion_id = ecoregion['id']

    # Check if species already exists
    existing = supabase.table('species').select('id').eq('scientific_name', scientific_name).execute()

    # Determine habitat flags based on habitat_type description
    habitat_type = species.get('habitat_type', '').lower()

    # Marine keywords
    is_marine = any(keyword in habitat_type for keyword in [
        'marine', 'ocean', 'reef', 'coastal', 'pelagic', 'sea',
        'saltwater', 'coral', 'seagrass', 'beach'
    ])

    # Freshwater keywords
    is_freshwater = any(keyword in habitat_type for keyword in [
        'river', 'stream', 'lake', 'pond', 'freshwater', 'swamp',
        'wetland', 'marsh', 'tributary'
    ])

    # Terrestrial keywords (or default if nothing matches)
    is_terrestrial = any(keyword in habitat_type for keyword in [
        'forest', 'jungle', 'rainforest', 'tree', 'canopy', 'understory',
        'terrestrial', 'land', 'ground', 'tundra', 'mountain', 'rocky',
        'savanna', 'grassland', 'desert', 'scrub', 'heath', 'bamboo'
    ]) or (not is_marine and not is_freshwater)  # Default to terrestrial if unclear

    if existing.data:
        species_id = existing.data[0]['id']
        print(f"      ℹ️  Species exists (ID: {species_id[:8]}...)")

        # Update species with better data
        update_data = {
            'common_name': common_name,
            'image_url': species.get('image_url'),
            'description': species.get('description'),
            'is_marine': is_marine,
            'is_terrestrial': is_terrestrial,
            'is_freshwater': is_freshwater,
            'is_curated': True,  # Mark as manually curated
        }

        supabase.table('species').update(update_data).eq('id', species_id).execute()
        print(f"      ✅ Updated species data")
        updated_count += 1
    else:
        # Insert new species
        species_data = {
            'id': str(uuid.uuid4()),
            'scientific_name': scientific_name,
            'common_name': common_name,
            'class': species.get('class', 'ACTINOPTERYGII'),
            'kingdom': 'ANIMALIA',
            'conservation_status': species.get('conservation_status', 'LC'),
            'image_url': species.get('image_url'),
            'description': species.get('description'),
            'is_marine': is_marine,
            'is_terrestrial': is_terrestrial,
            'is_freshwater': is_freshwater,
            'is_curated': True,  # Mark as manually curated
            'iucn_id': -1,  # Placeholder for manually curated species
        }

        result = supabase.table('species').insert(species_data).execute()
        species_id = result.data[0]['id']
        print(f"      ✅ Inserted new species (ID: {species_id[:8]}...)")
        imported_count += 1

    # Link to ecoregion
    existing_link = supabase.table('species_ecoregions').select('*').eq('species_id', species_id).eq('ecoregion_id', ecoregion_id).execute()

    if not existing_link.data:
        link_data = {
            'species_id': species_id,
            'ecoregion_id': ecoregion_id,
            'overlap_percentage': 100.0,  # Curated species are 100% in this region
        }
        supabase.table('species_ecoregions').insert(link_data).execute()
        print(f"      ✅ Linked to {ecoregion_name}")
        linked_count += 1
    else:
        print(f"      ℹ️  Already linked to {ecoregion_name}")

print("\n" + "="*70)
print("📊 IMPORT SUMMARY")
print("="*70)
print(f"✅ New species imported: {imported_count}")
print(f"♻️  Existing species updated: {updated_count}")
print(f"🔗 New ecoregion links created: {linked_count}")
print(f"📍 Total species processed: {len(species_to_import)}")

if skipped_ecoregions:
    print(f"\n⚠️  Ecoregions not found in database:")
    for eco in skipped_ecoregions:
        print(f"   - {eco}")
    print(f"\n💡 Available ecoregions:")
    for eco_name in sorted(ecoregions_map.keys()):
        print(f"   - {ecoregions_map[eco_name]['name']}")

print("\n💡 Tip: Add more species to curated_species_database.csv and run this script again!")
print("📝 CSV Format: ecoregion_name,scientific_name,common_name,class,conservation_status,image_url,image_attribution,description,habitat_type")
