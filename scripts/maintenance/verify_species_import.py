#!/usr/bin/env python3
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("🔍 Verifying Species Import\n")

# Get species count by ecoregion
print("📊 Species by Ecoregion:")
ecoregions = supabase.table('ecoregions').select('id, name').execute()
for eco in ecoregions.data:
    links = supabase.table('species_ecoregions').select('species_id', count='exact').eq('ecoregion_id', eco['id']).execute()
    print(f"   {eco['name']}: {links.count} species")

# Get total species
total = supabase.table('species').select('id', count='exact').execute()
print(f"\n🌍 Total species in database: {total.count}")

# Get species by conservation status
print("\n🚨 Conservation Status Breakdown:")
for status in ['CR', 'EN', 'VU', 'NT', 'LC', 'DD']:
    count = supabase.table('species').select('id', count='exact').eq('conservation_status', status).execute()
    if count.count > 0:
        print(f"   {status}: {count.count}")

# Get species with images
with_images = supabase.table('species').select('id', count='exact').not_.is_('image_url', 'null').execute()
print(f"\n🖼️  Species with images: {with_images.count}/{total.count}")

# Sample some newly imported species
print("\n📋 Sample of Newly Imported Species:")
samples = supabase.table('species').select('common_name, class, conservation_status').eq('iucn_id', -1).limit(10).execute()
for sp in samples.data:
    print(f"   • {sp['common_name']} ({sp['class']}) - {sp['conservation_status']}")

print("\n✅ Verification complete!")
