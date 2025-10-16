#!/usr/bin/env python3
"""Find high-priority species that need images"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("🔍 Finding High-Priority Species Needing Images\n")

# For each ecoregion, find species without images
# Priority: CR > EN > VU > NT > LC

ecoregions = supabase.table('ecoregions').select('id, name').execute()

priority_order = ['CR', 'EN', 'VU', 'NT', 'LC']

for eco in sorted(ecoregions.data, key=lambda x: x['name']):
    print(f"\n{'='*60}")
    print(f"📍 {eco['name']}")
    print(f"{'='*60}")

    # Get species in this ecoregion without images
    species_ids = supabase.table('species_ecoregions').select('species_id').eq('ecoregion_id', eco['id']).execute()
    species_ids_list = [s['species_id'] for s in species_ids.data]

    if not species_ids_list:
        print("   No species found")
        continue

    # Query species without images, grouped by conservation status
    for status in priority_order:
        # Query in batches
        batch_size = 100
        species_list = []
        for i in range(0, len(species_ids_list), batch_size):
            batch = species_ids_list[i:i+batch_size]
            result = supabase.table('species').select('scientific_name, common_name, conservation_status').in_('id', batch).is_('image_url', 'null').eq('conservation_status', status).limit(10).execute()
            species_list.extend(result.data)

        if species_list:
            print(f"\n   🚨 {status} - {len(species_list)} species without images (showing first 10):")
            for sp in species_list[:10]:
                print(f"      • {sp['common_name'] or sp['scientific_name']}")
