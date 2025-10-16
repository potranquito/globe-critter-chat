#!/usr/bin/env python3
"""
Import IUCN species from database_species_with_images.csv
This imports the 814 IUCN species with images
"""

import os
import sys
import csv
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

CSV_FILE = "database_species_with_images.csv"

# Helper Functions
def classify_species_type(class_name):
    """Classify species into UI-friendly types"""
    if not class_name:
        return 'Invertebrate', 'Animals'

    class_name = class_name.upper()

    if class_name == 'MAMMALIA':
        return 'Mammal', 'Animals'
    if class_name == 'AVES':
        return 'Bird', 'Birds'
    if class_name in ['REPTILIA', 'TESTUDINES']:
        return 'Reptile', 'Animals'
    if class_name == 'AMPHIBIA':
        return 'Amphibian', 'Animals'
    if class_name in ['ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII', 'SARCOPTERYGII']:
        return 'Fish', 'Animals'
    if class_name in ['ANTHOZOA', 'HYDROZOA']:
        return 'Coral', 'Plants & Corals'
    if 'PLANT' in class_name or class_name in ['MAGNOLIOPSIDA', 'LILIOPSIDA', 'POLYPODIOPSIDA']:
        return 'Plant', 'Plants & Corals'

    return 'Invertebrate', 'Animals'

def get_trophic_role(class_name, common_name):
    """Determine trophic role"""
    if not class_name:
        return 'Predator'

    class_name = class_name.upper()
    common_name_lower = (common_name or '').lower()

    if class_name in ['ANTHOZOA', 'HYDROZOA']:
        return 'Filter-feeder'
    if 'PLANT' in class_name or class_name in ['MAGNOLIOPSIDA', 'LILIOPSIDA']:
        return 'Producer'

    if any(word in common_name_lower for word in ['deer', 'elephant', 'gorilla', 'turtle', 'dugong']):
        return 'Herbivore'
    if any(word in common_name_lower for word in ['shark', 'whale', 'dolphin', 'tiger', 'leopard', 'eagle', 'hawk']):
        return 'Predator'
    if any(word in common_name_lower for word in ['whale shark', 'manta', 'clam']):
        return 'Filter-feeder'

    if class_name in ['MAMMALIA', 'AVES', 'REPTILIA']:
        return 'Omnivore'
    if class_name in ['ACTINOPTERYGII', 'CHONDRICHTHYES']:
        return 'Predator'

    return 'Omnivore'

def get_ecoregion_id_by_name(ecoregion_name):
    """Get ecoregion UUID by name"""
    result = supabase.from_('ecoregions').select('id').eq('name', ecoregion_name).execute()
    if result.data:
        return result.data[0]['id']
    return None

def import_species():
    """Import all IUCN species from CSV"""

    print("🌍 Starting IUCN species import from CSV...\n")

    if not os.path.exists(CSV_FILE):
        print(f"❌ Error: {CSV_FILE} not found")
        sys.exit(1)

    # Read CSV
    species_data = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            species_data.append(row)

    print(f"📊 Found {len(species_data)} IUCN species in CSV\n")

    # Track stats
    imported_count = 0
    error_count = 0
    ecoregion_links = {}

    # Track unique species (skip duplicates by species_id)
    seen_species_ids = set()

    for i, row in enumerate(species_data, 1):
        try:
            # Skip duplicate species_id entries
            species_id = row.get('species_id')
            if species_id and species_id in seen_species_ids:
                continue
            if species_id:
                seen_species_ids.add(species_id)

            # Extract data
            ecoregion_name = row['ecoregion']
            scientific_name = row['scientific_name']
            common_name = row.get('common_name', '')
            class_name = row['class']
            conservation_status = row['conservation_status']
            habitat_type = row.get('habitat_type', '')
            image_url = row.get('image_url', '')
            attribution = row.get('attribution', '')
            description = row.get('description', '')

            # Classify species
            species_type, ui_group = classify_species_type(class_name)
            trophic_role = get_trophic_role(class_name, common_name)

            # Determine habitat type
            is_marine = 'Marine' in habitat_type or 'Coral Triangle' in ecoregion_name
            is_terrestrial = 'Terrestrial' in habitat_type
            is_freshwater = 'Freshwater' in habitat_type

            # Expand conservation status
            status_map = {
                'CR': 'Critically Endangered',
                'EN': 'Endangered',
                'VU': 'Vulnerable',
                'NT': 'Near Threatened',
                'LC': 'Least Concern',
                'DD': 'Data Deficient',
                'EX': 'Extinct'
            }
            conservation_status_full = status_map.get(conservation_status, conservation_status)

            # Insert species
            species_insert = {
                'scientific_name': scientific_name,
                'common_name': common_name if common_name else None,
                'class': class_name,
                'conservation_status': conservation_status,
                'conservation_status_full': conservation_status_full,
                'species_type': species_type,
                'ui_group': ui_group,
                'trophic_role': trophic_role,
                'is_marine': is_marine,
                'is_terrestrial': is_terrestrial,
                'is_freshwater': is_freshwater,
                'is_curated': False,  # These are IUCN species, not hand-curated
                'image_url': image_url if image_url else None,
                'image_attribution': attribution if attribution else None,
                'description': description if description else None,
                'image_source': 'wikimedia' if 'wikimedia' in (image_url or '').lower() else 'wikipedia'
            }

            # Try to insert
            result = supabase.from_('species').insert(species_insert).execute()

            if result.data:
                new_species_id = result.data[0]['id']
                imported_count += 1

                # Track for ecoregion linking
                if ecoregion_name not in ecoregion_links:
                    ecoregion_links[ecoregion_name] = []
                ecoregion_links[ecoregion_name].append(new_species_id)

                # Progress indicator
                if imported_count % 50 == 0:
                    print(f"  ✓ Imported {imported_count} species...")
            else:
                error_count += 1

        except Exception as e:
            error_count += 1
            if error_count < 5:  # Only show first few errors
                print(f"  ⚠️  Error importing {row.get('common_name', row.get('scientific_name', 'unknown'))}: {str(e)}")

    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported_count} IUCN species")
    print(f"   Errors: {error_count}")

    # Link species to ecoregions
    print(f"\n🔗 Linking species to ecoregions...")
    link_count = 0

    for ecoregion_name, species_ids in ecoregion_links.items():
        ecoregion_id = get_ecoregion_id_by_name(ecoregion_name)

        if not ecoregion_id:
            print(f"  ⚠️  Ecoregion not found: {ecoregion_name}")
            continue

        for sp_id in species_ids:
            try:
                supabase.from_('species_ecoregions').insert({
                    'species_id': sp_id,
                    'ecoregion_id': ecoregion_id,
                    'is_primary_habitat': True
                }).execute()
                link_count += 1
            except Exception as e:
                pass  # Ignore duplicate link errors

    print(f"✅ Created {link_count} species-ecoregion links")

    # Update global health stats
    print(f"\n📊 Updating global health stats...")

    stats_query = supabase.from_('species').select('conservation_status', count='exact')
    total = stats_query.execute().count or 0

    cr_count = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'CR').execute().count or 0
    en_count = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'EN').execute().count or 0
    vu_count = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'VU').execute().count or 0
    nt_count = supabase.from_('species').select('*', count='exact').eq('conservation_status', 'NT').execute().count or 0

    # Calculate health score (0-100, lower is worse)
    health_score = 100 - (cr_count * 3 + en_count * 2 + vu_count * 1) / max(total, 1) * 100

    supabase.from_('global_health').update({
        'total_species': total,
        'critically_endangered': cr_count,
        'endangered': en_count,
        'vulnerable': vu_count,
        'near_threatened': nt_count,
        'health_score': round(health_score, 2)
    }).eq('id', 1).execute()

    print(f"✅ Global health updated:")
    print(f"   Total species: {total}")
    print(f"   CR: {cr_count}, EN: {en_count}, VU: {vu_count}, NT: {nt_count}")
    print(f"   Health score: {round(health_score, 2)}/100")

    print(f"\n🎉 IUCN species import complete!")

if __name__ == '__main__':
    import_species()
