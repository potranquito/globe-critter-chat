#!/usr/bin/env python3
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("🖼️  Image Coverage by Ecoregion:\n")

ecoregions = supabase.table('ecoregions').select('id, name').execute()
coverage_data = []

for eco in ecoregions.data:
    # Total species
    total = supabase.table('species_ecoregions').select('species_id', count='exact').eq('ecoregion_id', eco['id']).execute()

    # Species with images in this ecoregion
    species_ids = supabase.table('species_ecoregions').select('species_id').eq('ecoregion_id', eco['id']).execute()
    species_ids_list = [s['species_id'] for s in species_ids.data]

    with_images = 0
    if species_ids_list:
        # Query in batches to avoid URL length limits
        batch_size = 100
        for i in range(0, len(species_ids_list), batch_size):
            batch = species_ids_list[i:i+batch_size]
            result = supabase.table('species').select('id', count='exact').in_('id', batch).not_.is_('image_url', 'null').execute()
            with_images += result.count

    percentage = (with_images / total.count * 100) if total.count > 0 else 0
    coverage_data.append({
        'name': eco['name'],
        'total': total.count,
        'with_images': with_images,
        'percentage': percentage
    })

# Sort by percentage ascending (lowest coverage first)
coverage_data.sort(key=lambda x: x['percentage'])

for data in coverage_data:
    print(f"{data['name']:25s}: {data['with_images']:4d}/{data['total']:5d} ({data['percentage']:5.1f}%) have images")

print(f"\n💡 Priority ecoregions (lowest image coverage):")
for data in coverage_data[:3]:
    print(f"   1. {data['name']}: {data['percentage']:.1f}%")
