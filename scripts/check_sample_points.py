#!/usr/bin/env python3
"""Check if sample_points are properly stored as JSONB"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔍 Checking sample_points in database\n')
print('=' * 60)

# Get a few species with sample_points
result = supabase.table('species')\
    .select('scientific_name, common_name, sample_points')\
    .not_.is_('sample_points', 'null')\
    .limit(5)\
    .execute()

if result.data:
    print(f'\n✅ Found {len(result.data)} species with sample_points\n')
    for species in result.data:
        name = species.get('scientific_name') or species.get('common_name', 'Unknown')
        sample_points = species.get('sample_points')
        print(f'📍 {name}')
        print(f'   Type: {type(sample_points).__name__}')
        if isinstance(sample_points, list):
            print(f'   ✅ JSONB array with {len(sample_points)} points')
            if sample_points:
                print(f'   Sample: {sample_points[0]}')
        elif isinstance(sample_points, str):
            print(f'   ❌ STRING (should be JSONB array!)')
            print(f'   Value: {sample_points[:100]}...')
        else:
            print(f'   ⚠️  Unexpected type')
        print()
else:
    print('\n❌ No species found with sample_points')

# Get total count
count_result = supabase.table('species').select('*', count='exact', head=True).execute()
print(f'📊 Total species in database: {count_result.count}')

# Count species with NULL sample_points
null_result = supabase.table('species')\
    .select('*', count='exact', head=True)\
    .is_('sample_points', 'null')\
    .execute()
print(f'   With NULL sample_points: {null_result.count}')
print(f'   With valid sample_points: {count_result.count - null_result.count}')

print('\n' + '=' * 60)
