#!/usr/bin/env python3
"""
Fix scientific names in the database using AI to look up proper Latin binomial names.
This script finds species with common names in the scientific_name field and fixes them.
"""

import os
import json
from supabase import create_client
from openai import OpenAI

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    print("   export SUPABASE_URL='https://your-project.supabase.co'")
    print("   export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# OpenAI setup
OPENAI_API_KEY = os.getenv("VITE_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("⚠️  OPENAI_API_KEY not set. Please set it:")
    print("   export OPENAI_API_KEY='your-key-here'")
    print("   or it will use VITE_OPENAI_API_KEY from .env")
    exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

def is_proper_scientific_name(name):
    """Check if a name looks like a proper scientific name (Genus species)"""
    parts = name.strip().split()
    if len(parts) != 2:
        return False

    # First word should be capitalized, second should be LOWERCASE
    # Scientific names never have multiple capitalized words
    return parts[0][0].isupper() and parts[1][0].islower() and parts[1] == parts[1].lower()

def get_scientific_name_from_ai(common_name, animal_class=None):
    """Use OpenAI to look up the correct scientific name"""

    context = f"Animal class: {animal_class}" if animal_class else ""

    prompt = f"""You are a taxonomist. Given a common name for a species, provide ONLY the scientific name (Latin binomial) with no explanation.

Common name: {common_name}
{context}

Reply with ONLY the scientific name in the format "Genus species" (e.g., "Panthera leo"). If you're not certain, reply with "UNCERTAIN"."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=50,
            messages=[{"role": "user", "content": prompt}]
        )

        scientific_name = response.choices[0].message.content.strip()

        # Validate the response
        if scientific_name == "UNCERTAIN" or not is_proper_scientific_name(scientific_name):
            return None

        return scientific_name

    except Exception as e:
        print(f"   ❌ AI Error: {e}")
        return None

def find_species_needing_fix():
    """Find all curated species (they have common names in scientific_name field)"""

    print("🔍 Finding curated species (is_curated = true)...")

    # Get curated species only - these are the ones with common names
    response = supabase.table('species').select('id, scientific_name, common_name, class, is_curated').eq('is_curated', True).execute()

    print(f"   Found {len(response.data)} curated species to fix\n")
    return response.data

def fix_species(species, dry_run=True):
    """Fix a single species scientific name"""

    current_name = species['scientific_name']
    common_name = species['common_name']
    animal_class = species.get('class')

    print(f"❌ Current: {current_name}")
    print(f"   Common: {common_name}")
    print(f"   Class: {animal_class}")

    # Get correct scientific name from AI
    correct_name = get_scientific_name_from_ai(common_name, animal_class)

    if not correct_name:
        print(f"   ⚠️  Could not determine scientific name\n")
        return False

    print(f"   ✅ Correct: {correct_name}")

    if dry_run:
        print(f"   🔹 DRY RUN - Would update to: {correct_name}\n")
        return True
    else:
        try:
            supabase.table('species').update({
                'scientific_name': correct_name
            }).eq('id', species['id']).execute()

            print(f"   ✅ UPDATED!\n")
            return True
        except Exception as e:
            print(f"   ❌ Update failed: {e}\n")
            return False

def main():
    import sys

    dry_run = '--apply' not in sys.argv

    print("=" * 80)
    print("🔬 Scientific Name Fixer")
    print("=" * 80)

    if dry_run:
        print("ℹ️  DRY RUN MODE - No changes will be made")
        print("   Run with --apply to actually update the database\n")
    else:
        print("⚠️  LIVE MODE - Database will be updated!\n")

    # Find species needing fixes
    species_list = find_species_needing_fix()

    if not species_list:
        print("✅ All species have proper scientific names!")
        return

    # Process each species
    fixed = 0
    failed = 0

    limit = len(species_list) if '--all' in sys.argv else 50

    for i, species in enumerate(species_list[:limit], 1):
        print(f"[{i}/{min(len(species_list), limit)}]")

        if fix_species(species, dry_run):
            fixed += 1
        else:
            failed += 1

    # Summary
    print("=" * 80)
    print("📊 Summary")
    print("=" * 80)
    print(f"Total species scanned: {len(species_list)}")
    print(f"✅ Successfully processed: {fixed}")
    print(f"❌ Failed: {failed}")

    if dry_run:
        print("\n💡 Run with --apply to actually update the database")
    else:
        print("\n✅ Database updated!")

if __name__ == "__main__":
    main()
