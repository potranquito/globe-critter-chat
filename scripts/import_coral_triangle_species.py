#!/usr/bin/env python3
"""
Import curated Coral Triangle marine species from CSV

Usage:
    python scripts/import_coral_triangle_species.py

This script:
1. Reads coral_triangle_marine_species.csv
2. Adds species to the species table (if not exists)
3. Links species to Coral Triangle ecoregion
4. Sets proper marine habitat flags
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

print("🐠 Importing Coral Triangle Marine Species\n")

# Get Coral Triangle ecoregion
print("1️⃣ Finding Coral Triangle ecoregion...")
result = supabase.table('ecoregions').select('*').ilike('name', '%coral%').execute()
if not result.data:
    print("❌ Coral Triangle not found in database")
    exit(1)

coral_triangle = result.data[0]
ecoregion_id = coral_triangle['id']
print(f"   ✅ Found: {coral_triangle['name']} (ID: {ecoregion_id})\n")

# Read CSV file
csv_path = 'coral_triangle_marine_species.csv'
print(f"2️⃣ Reading {csv_path}...")

species_to_import = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    species_to_import = list(reader)

print(f"   ✅ Found {len(species_to_import)} species in CSV\n")

# Import each species
print("3️⃣ Importing species to database...")
imported_count = 0
skipped_count = 0
linked_count = 0

for i, species in enumerate(species_to_import, 1):
    scientific_name = species['scientific_name']
    common_name = species['common_name']

    print(f"\n   [{i}/{len(species_to_import)}] {common_name} ({scientific_name})")

    # Check if species already exists
    existing = supabase.table('species').select('id').eq('scientific_name', scientific_name).execute()

    if existing.data:
        species_id = existing.data[0]['id']
        print(f"      ℹ️  Species already exists (ID: {species_id})")

        # Update species with better data if provided
        update_data = {}
        if species.get('common_name'):
            update_data['common_name'] = species['common_name']
        if species.get('image_url'):
            update_data['image_url'] = species['image_url']
        if species.get('description'):
            update_data['description'] = species['description']

        # Ensure marine flags are set correctly
        update_data['is_marine'] = True
        update_data['is_terrestrial'] = False
        update_data['is_freshwater'] = False

        if update_data:
            supabase.table('species').update(update_data).eq('id', species_id).execute()
            print(f"      ✅ Updated species data")

        skipped_count += 1
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
            'is_marine': True,
            'is_terrestrial': False,
            'is_freshwater': False,
            'iucn_id': -1,  # Placeholder for manually curated species
        }

        result = supabase.table('species').insert(species_data).execute()
        species_id = result.data[0]['id']
        print(f"      ✅ Inserted new species (ID: {species_id})")
        imported_count += 1

    # Link to Coral Triangle ecoregion
    # Check if link already exists
    existing_link = supabase.table('species_ecoregions').select('*').eq('species_id', species_id).eq('ecoregion_id', ecoregion_id).execute()

    if not existing_link.data:
        link_data = {
            'species_id': species_id,
            'ecoregion_id': ecoregion_id,
            'overlap_percentage': 100.0,  # Curated species are 100% in this region
        }
        supabase.table('species_ecoregions').insert(link_data).execute()
        print(f"      ✅ Linked to Coral Triangle")
        linked_count += 1
    else:
        print(f"      ℹ️  Already linked to Coral Triangle")

print("\n" + "="*60)
print("📊 IMPORT SUMMARY")
print("="*60)
print(f"✅ New species imported: {imported_count}")
print(f"ℹ️  Existing species updated: {skipped_count}")
print(f"🔗 New ecoregion links created: {linked_count}")
print(f"📍 All species linked to: {coral_triangle['name']}")
print("\n💡 Tip: Run this script again anytime you add more species to the CSV!")
