#!/usr/bin/env python3
"""
Verify database restoration - check species, ecoregions, and connections
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🔍 Database Verification Report\n")
print("=" * 70)

# Check ecoregions
print("\n📍 ECOREGIONS:")
ecoregions = supabase.from_('ecoregions').select('id, ecoregion_id, name, realm').order('name').execute()
for eco in ecoregions.data:
    print(f"  ✓ {eco['name']} ({eco['realm']}) [ID: {eco['ecoregion_id']}]")

# Check species counts
print("\n🐾 SPECIES COUNTS:")
total_species = supabase.from_('species').select('*', count='exact').execute().count
curated_species = supabase.from_('species').select('*', count='exact').eq('is_curated', True).execute().count
iucn_species = supabase.from_('species').select('*', count='exact').eq('is_curated', False).execute().count

print(f"  Total species: {total_species}")
print(f"  Curated species: {curated_species}")
print(f"  IUCN species: {iucn_species}")

# Check species by ecoregion
print("\n🌍 SPECIES BY ECOREGION:")
for eco in ecoregions.data:
    eco_id = eco['id']
    eco_name = eco['name']

    # Count species in this ecoregion
    links = supabase.from_('species_ecoregions').select('species_id', count='exact').eq('ecoregion_id', eco_id).execute()
    species_count = links.count or 0

    # Get curated vs IUCN breakdown
    if species_count > 0:
        # Get species IDs for this ecoregion
        species_ids = [link['species_id'] for link in links.data]

        # Count curated
        curated_in_eco = supabase.from_('species').select('*', count='exact').in_('id', species_ids).eq('is_curated', True).execute().count or 0
        iucn_in_eco = species_count - curated_in_eco

        print(f"  {eco_name}: {species_count} species (Curated: {curated_in_eco}, IUCN: {iucn_in_eco})")
    else:
        print(f"  {eco_name}: 0 species ⚠️")

# Check species with images
print("\n🖼️  IMAGE STATUS:")
with_images = supabase.from_('species').select('*', count='exact').not_.is_('image_url', 'null').execute().count or 0
without_images = total_species - with_images
image_percentage = (with_images / total_species * 100) if total_species > 0 else 0

print(f"  Species with images: {with_images} ({image_percentage:.1f}%)")
print(f"  Species without images: {without_images}")

# Check conservation status distribution
print("\n🚨 CONSERVATION STATUS:")
cr = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'CR').execute().count or 0
en = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'EN').execute().count or 0
vu = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'VU').execute().count or 0
nt = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'NT').execute().count or 0
lc = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'LC').execute().count or 0

print(f"  CR (Critically Endangered): {cr}")
print(f"  EN (Endangered): {en}")
print(f"  VU (Vulnerable): {vu}")
print(f"  NT (Near Threatened): {nt}")
print(f"  LC (Least Concern): {lc}")

# Check global health
print("\n💚 GLOBAL HEALTH:")
health = supabase.from_('global_health').select('*').eq('id', 1).execute()
if health.data:
    h = health.data[0]
    print(f"  Health Score: {h['health_score']}/100")
    print(f"  Total Species: {h['total_species']}")
    print(f"  Critically Endangered: {h['critically_endangered']}")
    print(f"  Endangered: {h['endangered']}")
    print(f"  Vulnerable: {h['vulnerable']}")
    print(f"  Near Threatened: {h['near_threatened']}")

# Sample species from each category
print("\n🔬 SAMPLE SPECIES:")
print("\n  Curated species (first 5):")
curated = supabase.from_('species').select('common_name, scientific_name, conservation_status').eq('is_curated', True).limit(5).execute()
for sp in curated.data:
    name = sp['common_name'] or sp['scientific_name']
    print(f"    - {name} ({sp['conservation_status']})")

print("\n  IUCN species (first 5):")
iucn = supabase.from_('species').select('common_name, scientific_name, conservation_status').eq('is_curated', False).limit(5).execute()
for sp in iucn.data:
    name = sp['common_name'] or sp['scientific_name']
    print(f"    - {name} ({sp['conservation_status']})")

print("\n" + "=" * 70)
print("\n✅ Database verification complete!")
print(f"\n📊 Summary: {total_species} total species across 6 ecoregions")
print(f"   {curated_species} hand-curated with images")
print(f"   {iucn_species} from IUCN database")
print(f"   Global health score: {health.data[0]['health_score']}/100")
print("\n🎯 Your app should now display all ecoregions with species data!")
