#!/usr/bin/env python3
"""
Quick diagnostic: Check species counts per taxonomic class for each eco-region.
Identifies which regions need more species enrichment.
"""
import os
from supabase import create_client
from collections import defaultdict

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Target minimum per taxonomic group
MIN_SPECIES_PER_GROUP = 10
GOOD_SPECIES_COUNT = 15

def get_species_distribution():
    """Fetch all curated species and group by ecoregion and class"""

    # Get all curated species with their ecoregion links
    result = supabase.from_('species_ecoregions') \
        .select('species:species_id(id,common_name,scientific_name,class,is_curated), ecoregions:ecoregion_id(name)') \
        .execute()

    # Organize by ecoregion and taxonomic class
    distribution = defaultdict(lambda: defaultdict(list))

    for item in result.data:
        if not item['species'] or not item['ecoregions']:
            continue

        species = item['species']
        if not species.get('is_curated', False):
            continue  # Skip uncurated species

        ecoregion = item['ecoregions']['name']
        taxon_class = species.get('class', 'Unknown')

        distribution[ecoregion][taxon_class].append(species)

    return distribution

def classify_taxon(class_name):
    """Map database class to user-friendly taxon name"""
    if not class_name:
        return 'Unknown'

    class_upper = class_name.upper()

    if class_upper == 'MAMMALIA':
        return 'Mammals'
    if class_upper == 'AVES':
        return 'Birds'
    if class_upper in ['REPTILIA', 'TESTUDINES']:
        return 'Reptiles'
    if class_upper == 'AMPHIBIA':
        return 'Amphibians'
    if class_upper in ['ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII']:
        return 'Fish'
    if 'PLANT' in class_upper or class_upper in ['MAGNOLIOPSIDA', 'LILIOPSIDA']:
        return 'Plants'
    if class_upper in ['ANTHOZOA', 'HYDROZOA']:
        return 'Corals'

    return class_name

def print_status_icon(count):
    """Return status icon based on count"""
    if count >= GOOD_SPECIES_COUNT:
        return '✅'
    elif count >= MIN_SPECIES_PER_GROUP:
        return '⚠️'
    else:
        return '❌'

def main():
    print("🔍 Analyzing species distribution across eco-regions...\n")

    distribution = get_species_distribution()

    # Sort eco-regions alphabetically
    sorted_ecoregions = sorted(distribution.items())

    for ecoregion, taxon_groups in sorted_ecoregions:
        print(f"\n{'='*60}")
        print(f"🌍 {ecoregion.upper()}")
        print(f"{'='*60}")

        # Group taxa by category for better display
        taxa_by_class = defaultdict(list)
        for class_name, species_list in taxon_groups.items():
            friendly_name = classify_taxon(class_name)
            taxa_by_class[friendly_name].extend(species_list)

        # Calculate total
        total_species = sum(len(species) for species in taxa_by_class.values())

        # Sort by count (ascending) to show gaps first
        sorted_taxa = sorted(taxa_by_class.items(), key=lambda x: len(x[1]))

        for taxon_name, species_list in sorted_taxa:
            count = len(species_list)
            status = print_status_icon(count)
            deficit = max(0, MIN_SPECIES_PER_GROUP - count)

            if deficit > 0:
                print(f"  {status} {taxon_name:<20} {count:>3} species  (need {deficit} more)")
            else:
                print(f"  {status} {taxon_name:<20} {count:>3} species")

        print(f"\n  📊 Total: {total_species} curated species")

        # Show which taxa are completely missing
        common_taxa = ['Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Fish', 'Plants']
        missing_taxa = [t for t in common_taxa if t not in taxa_by_class]
        if missing_taxa:
            print(f"  ⚠️  Missing taxa: {', '.join(missing_taxa)}")

    # Summary recommendations
    print(f"\n\n{'='*60}")
    print("📋 RECOMMENDATIONS")
    print(f"{'='*60}\n")

    needs_enrichment = []
    for ecoregion, taxon_groups in distribution.items():
        taxa_by_class = defaultdict(list)
        for class_name, species_list in taxon_groups.items():
            friendly_name = classify_taxon(class_name)
            taxa_by_class[friendly_name].extend(species_list)

        gaps = []
        for taxon_name, species_list in taxa_by_class.items():
            if len(species_list) < MIN_SPECIES_PER_GROUP:
                deficit = MIN_SPECIES_PER_GROUP - len(species_list)
                gaps.append(f"{taxon_name} ({deficit} needed)")

        if gaps:
            needs_enrichment.append((ecoregion, gaps))

    if needs_enrichment:
        for ecoregion, gaps in needs_enrichment:
            print(f"🌍 {ecoregion}:")
            for gap in gaps:
                print(f"   • Add {gap}")
            print()

        print("\n💡 Next steps:")
        print("   1. Create CSV with missing species")
        print("   2. Run: python update_species_with_images.py")
        print("   3. Run: python restore_species_from_csv.py curated_species_database_enriched.csv")
        print("\n   See SPECIES_ENRICHMENT_GUIDE.md for detailed instructions")
    else:
        print("✅ All eco-regions have adequate species coverage!")

    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    main()
