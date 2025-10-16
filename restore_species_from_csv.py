#!/usr/bin/env python3
"""
STEP 2: Import Curated Species from CSV to Supabase
Run this after running RESTORE_DATABASE_STEP_1.sql

This script:
1. Reads curated_species_database_enriched.csv
2. Imports all 247 species to Supabase
3. Links species to their ecoregions
4. Classifies species (Mammal, Bird, etc.)
5. Updates global health stats
"""

import os
import csv
import sys
from supabase import create_client

# ============================================================================
# Configuration
# ============================================================================

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    print("\nSet them in your shell:")
    print('   export VITE_SUPABASE_URL="https://jqirupugxgsqgydxaebt.supabase.co"')
    print('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

CSV_FILE = "curated_species_database_enriched.csv"

# ============================================================================
# Helper Functions
# ============================================================================

def classify_species_type(class_name):
    """Classify species into UI-friendly types"""
    if not class_name:
        return 'Invertebrate', 'Animals'

    class_name = class_name.upper()

    # Mammals
    if class_name == 'MAMMALIA':
        return 'Mammal', 'Animals'

    # Birds
    if class_name == 'AVES':
        return 'Bird', 'Birds'

    # Reptiles
    if class_name in ['REPTILIA', 'TESTUDINES']:
        return 'Reptile', 'Animals'

    # Amphibians
    if class_name == 'AMPHIBIA':
        return 'Amphibian', 'Animals'

    # Fish
    if class_name in ['ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII', 'SARCOPTERYGII']:
        return 'Fish', 'Animals'

    # Corals
    if class_name in ['ANTHOZOA', 'HYDROZOA']:
        return 'Coral', 'Plants & Corals'

    # Plants
    if 'PLANT' in class_name or class_name in ['MAGNOLIOPSIDA', 'LILIOPSIDA', 'POLYPODIOPSIDA']:
        return 'Plant', 'Plants & Corals'

    # Default to invertebrate
    return 'Invertebrate', 'Animals'

def get_trophic_role(class_name, common_name):
    """Determine trophic role"""
    if not class_name:
        return 'Predator'

    class_name = class_name.upper()
    common_name_lower = (common_name or '').lower()

    # Corals and plants
    if class_name in ['ANTHOZOA', 'HYDROZOA']:
        return 'Filter-feeder'
    if 'PLANT' in class_name or class_name in ['MAGNOLIOPSIDA', 'LILIOPSIDA']:
        return 'Producer'

    # Herbivores
    if any(word in common_name_lower for word in ['deer', 'elephant', 'gorilla', 'turtle', 'dugong']):
        return 'Herbivore'

    # Predators
    if any(word in common_name_lower for word in ['shark', 'whale', 'dolphin', 'tiger', 'leopard', 'eagle', 'hawk']):
        return 'Predator'

    # Filter feeders
    if any(word in common_name_lower for word in ['whale shark', 'manta', 'clam']):
        return 'Filter-feeder'

    # Default
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

# ============================================================================
# Main Import Function
# ============================================================================

def import_species():
    """Import all species from CSV"""

    print("🚀 Starting species import from CSV...\n")

    if not os.path.exists(CSV_FILE):
        print(f"❌ Error: {CSV_FILE} not found")
        print(f"   Current directory: {os.getcwd()}")
        sys.exit(1)

    # Read CSV
    species_data = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            species_data.append(row)

    print(f"📊 Found {len(species_data)} species in CSV\n")

    # Track stats
    imported_count = 0
    error_count = 0
    ecoregion_links = {}

    for i, row in enumerate(species_data, 1):
        try:
            # Extract data
            ecoregion_name = row['ecoregion']
            scientific_name = row['scientific_name']
            common_name = row['common_name']
            class_name = row['class']
            conservation_status = row['conservation_status']
            image_url = row.get('image_url', '')
            attribution = row.get('attribution', '')
            description = row.get('description', '')

            # Classify species
            species_type, ui_group = classify_species_type(class_name)
            trophic_role = get_trophic_role(class_name, common_name)

            # Determine habitat type
            is_marine = 'Coral Triangle' in ecoregion_name or class_name in ['CHONDRICHTHYES', 'ANTHOZOA']
            is_terrestrial = not is_marine

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
                'common_name': common_name,
                'class': class_name,
                'conservation_status': conservation_status,
                'conservation_status_full': conservation_status_full,
                'species_type': species_type,
                'ui_group': ui_group,
                'trophic_role': trophic_role,
                'is_marine': is_marine,
                'is_terrestrial': is_terrestrial,
                'is_curated': True,
                'image_url': image_url if image_url else None,
                'image_attribution': attribution if attribution else None,
                'description': description if description else None,
                'image_source': 'wikimedia' if 'wikimedia' in (image_url or '').lower() else 'wikipedia'
            }

            # Try to insert
            result = supabase.from_('species').insert(species_insert).execute()

            if result.data:
                species_id = result.data[0]['id']
                imported_count += 1

                # Track for ecoregion linking
                if ecoregion_name not in ecoregion_links:
                    ecoregion_links[ecoregion_name] = []
                ecoregion_links[ecoregion_name].append(species_id)

                # Progress indicator
                if imported_count % 25 == 0:
                    print(f"  ✓ Imported {imported_count} species...")
            else:
                error_count += 1
                print(f"  ⚠️  Failed to import: {common_name}")

        except Exception as e:
            error_count += 1
            print(f"  ❌ Error importing {row.get('common_name', 'unknown')}: {str(e)}")

    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported_count} species")
    print(f"   Errors: {error_count}")

    # Link species to ecoregions
    print(f"\n🔗 Linking species to ecoregions...")
    link_count = 0

    for ecoregion_name, species_ids in ecoregion_links.items():
        ecoregion_id = get_ecoregion_id_by_name(ecoregion_name)

        if not ecoregion_id:
            print(f"  ⚠️  Ecoregion not found: {ecoregion_name}")
            continue

        for species_id in species_ids:
            try:
                supabase.from_('species_ecoregions').insert({
                    'species_id': species_id,
                    'ecoregion_id': ecoregion_id,
                    'is_primary_habitat': True
                }).execute()
                link_count += 1
            except Exception as e:
                print(f"  ⚠️  Failed to link species to {ecoregion_name}: {str(e)}")

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

    print(f"\n🎉 Database restoration complete!")
    print(f"   Your app should now show all 6 ecoregions with species!")

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    import_species()
