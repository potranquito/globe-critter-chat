#!/usr/bin/env python3
"""Delete species with NULL sample_points (old records before the fix)"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🗑️  Deleting species with NULL sample_points\n')
print('=' * 60)

# Get count before
before = supabase.table('species').select('*', count='exact', head=True).execute()
print(f'\n📊 Species before: {before.count}')

# Count NULL records
null_count = supabase.table('species')\
    .select('*', count='exact', head=True)\
    .is_('sample_points', 'null')\
    .execute()
print(f'   NULL sample_points: {null_count.count}')
print(f'   Valid sample_points: {before.count - null_count.count}')

if null_count.count == 0:
    print('\n✅ No NULL records to delete!')
    exit(0)

print(f'\n⚠️  Deleting {null_count.count} species with NULL sample_points')
print('   These are old records from before the JSONB fix')

# Delete all NULL records in one operation
# (Service role bypasses RLS and should handle large deletes)
print('\n🔄 Deleting records (this may take a minute)...')

try:
    result = supabase.table('species')\
        .delete()\
        .is_('sample_points', 'null')\
        .execute()

    print(f'✅ Deletion complete!')
except Exception as e:
    print(f'❌ Error during deletion: {e}')
    print('   The delete may have timed out. Checking remaining records...')

# Get count after
after = supabase.table('species').select('*', count='exact', head=True).execute()
print(f'\n📊 Species after: {after.count}')
print(f'   Deleted: {before.count - after.count}')

print('\n' + '=' * 60)
print('✅ Ready to continue IUCN import!')
