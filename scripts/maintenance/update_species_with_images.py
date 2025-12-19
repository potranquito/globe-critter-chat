#!/usr/bin/env python3
"""
Update database species with fetched images from CSV
"""
from supabase import create_client
import os
from dotenv import load_dotenv
import csv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

input_file = 'database_species_with_images.csv'

print(f"📥 Reading {input_file}...")

updates = []
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    updates = list(reader)

print(f"   Found {len(updates)} species with images to update\n")

print("🔄 Updating database...\n")

updated_count = 0
failed_count = 0

for i, update in enumerate(updates, 1):
    species_id = update['species_id']
    scientific_name = update['scientific_name']
    image_url = update['image_url']
    description = update.get('description', '')

    print(f"[{i}/{len(updates)}] {scientific_name}...", end=' ')

    try:
        # Update species with image
        result = supabase.table('species').update({
            'image_url': image_url,
            'description': description or None  # Only update if we have a description
        }).eq('id', species_id).execute()

        if result.data:
            print("✓")
            updated_count += 1
        else:
            print("✗ (no data returned)")
            failed_count += 1

    except Exception as e:
        print(f"✗ ({e})")
        failed_count += 1

print(f"\n{'='*70}")
print(f"📊 UPDATE SUMMARY")
print(f"{'='*70}")
print(f"✅ Successfully updated: {updated_count}")
print(f"❌ Failed: {failed_count}")
print(f"📍 Total processed: {len(updates)}")
print(f"\n💡 Image coverage should now be significantly improved!")
