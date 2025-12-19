#!/usr/bin/env python3
"""
Copy data from found_in column to habitat_info column
"""

import os
import sys
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌ Missing Supabase credentials')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('🔄 Copying data from found_in to habitat_info...\n')

try:
    # Get all species where found_in has data but habitat_info is null
    result = supabase.table('species')\
        .select('id, common_name, scientific_name, found_in')\
        .not_.is_('found_in', 'null')\
        .is_('habitat_info', 'null')\
        .execute()

    species_list = result.data
    total = len(species_list)

    if total == 0:
        print('✅ No species to copy - all habitat_info already populated!')
        sys.exit(0)

    print(f'📝 Found {total} species to copy\n')

    success_count = 0
    error_count = 0

    for idx, species in enumerate(species_list, 1):
        species_id = species['id']
        common_name = species.get('common_name', 'Unknown')
        found_in = species['found_in']

        print(f'[{idx}/{total}] {common_name}... ', end='', flush=True)

        try:
            supabase.table('species')\
                .update({'habitat_info': found_in})\
                .eq('id', species_id)\
                .execute()

            print(f'✅ "{found_in}"')
            success_count += 1
        except Exception as e:
            print(f'❌ Failed: {e}')
            error_count += 1

    print(f'\n🎉 Copy complete!')
    print(f'   ✅ Success: {success_count}')
    print(f'   ❌ Errors: {error_count}')
    print(f'   📊 Total: {total}')

except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
