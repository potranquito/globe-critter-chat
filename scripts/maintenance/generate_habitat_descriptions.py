#!/usr/bin/env python3
"""
Generate habitat descriptions for all species using OpenAI LLM
Populates the found_in column with brief habitat descriptions
"""

import os
import sys
from supabase import create_client
from openai import OpenAI
import time

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌ Missing Supabase credentials')
    sys.exit(1)

if not OPENAI_API_KEY:
    print('❌ Missing OPENAI_API_KEY')
    print('Set it in your .env file or environment')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def generate_habitat_description(species_data):
    """Generate a brief habitat description for a species"""
    common_name = species_data.get('common_name', '')
    scientific_name = species_data.get('scientific_name', '')
    animal_type = species_data.get('species_type', '')

    prompt = f"""You are a wildlife habitat expert. Generate a VERY BRIEF habitat description (maximum 8 words) for this species.

Species: {common_name} ({scientific_name})
Type: {animal_type}

Focus on WHERE this species is typically found. Examples:
- "Alpine tundra and rocky slopes"
- "Tropical reefs, 5-40m depth"
- "Ground floor in rainforests"
- "Arid savanna grasslands"
- "Temperate coniferous forests, 1000-3000m"
- "Coastal waters and estuaries"
- "Desert scrublands and rocky outcrops"

Keep it concise and specific. Start with the habitat type (no "Found in:"). Maximum 8 words."""

    try:
        response = openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3,
            max_tokens=30
        )

        description = response.choices[0].message.content.strip()
        # Remove common prefixes if present
        for prefix in ['Found in: ', 'Found in ', 'Habitat: ', 'Typically found in: ']:
            if description.startswith(prefix):
                description = description[len(prefix):]

        return description
    except Exception as e:
        print(f'  ❌ Error generating description: {e}')
        return None

def main():
    print('🚀 Generating habitat descriptions for all species...\n')

    # Check if habitat_info column exists (try habitat_info first, fallback to found_in)
    print('🔍 Checking for habitat_info column...')
    column_name = 'habitat_info'
    try:
        result = supabase.table('species').select('habitat_info').limit(1).execute()
        print('✅ Column habitat_info exists!\n')
    except Exception as e:
        # Fallback to found_in column
        try:
            result = supabase.table('species').select('found_in').limit(1).execute()
            column_name = 'found_in'
            print('⚠️  Using legacy column "found_in" (habitat_info not found)\n')
        except:
            print(f'❌ Neither habitat_info nor found_in columns exist.')
            sys.exit(1)

    # Get all species that don't have habitat descriptions yet
    print(f'📊 Fetching species without {column_name} descriptions...')
    try:
        result = supabase.table('species')\
            .select(f'id, common_name, scientific_name, species_type, {column_name}')\
            .is_(column_name, 'null')\
            .limit(1056)\
            .execute()

        species_list = result.data
        total = len(species_list)

        if total == 0:
            print('✅ All species already have habitat descriptions!')
            return

        print(f'📝 Found {total} species needing habitat descriptions\n')
    except Exception as e:
        print(f'❌ Error fetching species: {e}')
        sys.exit(1)

    # Process species in batches
    success_count = 0
    error_count = 0

    for idx, species in enumerate(species_list, 1):
        species_id = species['id']
        common_name = species.get('common_name', 'Unknown')

        print(f'[{idx}/{total}] {common_name}...', end=' ', flush=True)

        # Generate habitat description
        habitat = generate_habitat_description(species)

        if habitat:
            # Update database
            try:
                supabase.table('species')\
                    .update({column_name: habitat})\
                    .eq('id', species_id)\
                    .execute()

                print(f'✅ "{habitat}"')
                success_count += 1
            except Exception as e:
                print(f'❌ Failed to update: {e}')
                error_count += 1
        else:
            print('❌ Failed to generate')
            error_count += 1

        # Rate limit: 60 requests per minute for GPT-4o-mini
        if idx < total:
            time.sleep(1.1)  # ~55 requests per minute

    print(f'\n🎉 Complete!')
    print(f'   ✅ Success: {success_count}')
    print(f'   ❌ Errors: {error_count}')
    print(f'   📊 Total: {total}')

if __name__ == '__main__':
    main()
