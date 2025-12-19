#!/usr/bin/env python3
"""
Check which column exists: found_in or habitat_info
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

print('🔍 Checking database column names...\n')

# Try querying for habitat_info
print('1. Trying to select habitat_info column...')
try:
    result = supabase.table('species').select('id, habitat_info').limit(1).execute()
    print('   ✅ Column "habitat_info" exists!')
    if result.data:
        print(f'   Sample: {result.data[0]}')
except Exception as e:
    print(f'   ❌ Column "habitat_info" does not exist: {e}')

print()

# Try querying for found_in
print('2. Trying to select found_in column...')
try:
    result = supabase.table('species').select('id, found_in').limit(1).execute()
    print('   ✅ Column "found_in" exists!')
    if result.data:
        print(f'   Sample: {result.data[0]}')
except Exception as e:
    print(f'   ❌ Column "found_in" does not exist: {e}')

print('\n📋 Summary:')
print('If both exist: Something is wrong!')
print('If only habitat_info exists: Migration already done ✓')
print('If only found_in exists: Need to run migration')
