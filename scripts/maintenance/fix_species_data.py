#!/usr/bin/env python3
"""
Fix species data - update trophic roles to be more accurate
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_correct_trophic_role(class_name, common_name, scientific_name):
    """Determine accurate trophic role based on taxonomy and common name"""

    class_name = (class_name or '').upper()
    common_name_lower = (common_name or '').lower()
    scientific_name_lower = (scientific_name or '').lower()

    # AMPHIBIANS - Most are insectivores/carnivores (eat insects)
    if class_name == 'AMPHIBIA':
        # Tadpoles are herbivores, but adults eat insects
        if 'tadpole' in common_name_lower:
            return 'Herbivore'
        return 'Predator'  # Most frogs/salamanders eat insects/small animals

    # REPTILES
    if class_name in ['REPTILIA', 'TESTUDINES']:
        # Herbivorous reptiles
        if any(word in common_name_lower for word in ['tortoise', 'iguana', 'turtle']) and 'sea turtle' not in common_name_lower:
            # Land tortoises and iguanas are herbivores
            # But sea turtles vary
            return 'Herbivore'
        # Carnivorous reptiles
        if any(word in common_name_lower for word in ['crocodile', 'alligator', 'snake', 'lizard', 'gecko', 'komodo', 'monitor']):
            return 'Predator'
        # Sea turtles - mostly herbivores (eat seagrass/algae)
        if 'sea turtle' in common_name_lower or 'marine turtle' in common_name_lower:
            return 'Herbivore'
        return 'Omnivore'

    # BIRDS
    if class_name == 'AVES':
        # Raptors/birds of prey
        if any(word in common_name_lower for word in ['eagle', 'hawk', 'falcon', 'owl', 'vulture', 'condor', 'kite']):
            return 'Predator'
        # Herbivorous birds
        if any(word in common_name_lower for word in ['parrot', 'macaw', 'pigeon', 'dove', 'goose', 'finch', 'seed']):
            return 'Herbivore'
        # Insectivores
        if any(word in common_name_lower for word in ['woodpecker', 'warbler', 'flycatcher', 'swallow']):
            return 'Predator'
        # Omnivores
        if any(word in common_name_lower for word in ['crow', 'raven', 'jay', 'toucan', 'hornbill']):
            return 'Omnivore'
        return 'Omnivore'  # Default for birds

    # MAMMALS
    if class_name == 'MAMMALIA':
        # Carnivores
        if any(word in common_name_lower for word in ['tiger', 'lion', 'leopard', 'jaguar', 'wolf', 'fox', 'cat', 'weasel', 'otter', 'seal', 'whale', 'dolphin', 'bat']):
            # Most bats are insectivores
            if 'bat' in common_name_lower and 'fruit' not in common_name_lower:
                return 'Predator'
            # Marine mammals that eat fish
            if any(word in common_name_lower for word in ['seal', 'sea lion', 'dolphin', 'orca', 'whale']):
                # Filter feeders
                if any(word in common_name_lower for word in ['blue whale', 'humpback', 'right whale']):
                    return 'Filter-feeder'
                return 'Predator'
            return 'Predator'

        # Herbivores
        if any(word in common_name_lower for word in ['deer', 'elk', 'moose', 'antelope', 'buffalo', 'elephant', 'rhino', 'hippo', 'giraffe', 'zebra', 'gorilla', 'monkey', 'lemur', 'sloth', 'manatee', 'dugong', 'tapir', 'rabbit', 'hare', 'porcupine']):
            return 'Herbivore'

        # Omnivores
        if any(word in common_name_lower for word in ['bear', 'pig', 'boar', 'raccoon', 'squirrel', 'mouse', 'rat', 'chipmunk']):
            return 'Omnivore'

        return 'Omnivore'  # Default for mammals

    # FISH
    if class_name in ['ACTINOPTERYGII', 'CHONDRICHTHYES', 'ELASMOBRANCHII']:
        # Sharks are predators
        if 'shark' in common_name_lower:
            # Whale sharks and basking sharks are filter feeders
            if any(word in common_name_lower for word in ['whale shark', 'basking']):
                return 'Filter-feeder'
            return 'Predator'
        # Rays
        if 'ray' in common_name_lower or 'manta' in common_name_lower:
            return 'Filter-feeder'
        # Most fish are predators (eat smaller fish/insects)
        return 'Predator'

    # CORALS
    if class_name in ['ANTHOZOA', 'HYDROZOA']:
        return 'Filter-feeder'

    # PLANTS
    if 'PLANT' in class_name or class_name in ['MAGNOLIOPSIDA', 'LILIOPSIDA', 'POLYPODIOPSIDA']:
        return 'Producer'

    # INVERTEBRATES
    if class_name in ['INSECTA', 'ARACHNIDA']:
        return 'Predator'  # Most insects/spiders are predators

    if class_name in ['MALACOSTRACA']:
        return 'Scavenger'  # Crabs, lobsters

    return 'Omnivore'  # Default fallback

def main():
    print("🔧 Fixing species trophic roles...\n")

    # Get all species
    all_species = supabase.from_('species').select('id, scientific_name, common_name, class, trophic_role').execute()

    total = len(all_species.data)
    updated = 0

    print(f"📊 Processing {total} species...")

    for i, species in enumerate(all_species.data, 1):
        # Calculate correct trophic role
        correct_role = get_correct_trophic_role(
            species.get('class'),
            species.get('common_name'),
            species.get('scientific_name')
        )

        # Only update if different
        if species.get('trophic_role') != correct_role:
            supabase.from_('species').update({
                'trophic_role': correct_role
            }).eq('id', species['id']).execute()

            updated += 1

            if updated % 50 == 0:
                print(f"  ✓ Updated {updated} species...")

    print(f"\n✅ Fixed {updated} species trophic roles!")

    # Show distribution
    print("\n📊 Trophic role distribution:")
    roles = ['Predator', 'Herbivore', 'Omnivore', 'Filter-feeder', 'Producer', 'Scavenger']
    for role in roles:
        count = supabase.from_('species').select('*', count='exact').eq('trophic_role', role).execute().count or 0
        if count > 0:
            print(f"  {role}: {count} species")

if __name__ == '__main__':
    main()
