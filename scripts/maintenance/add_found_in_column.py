#!/usr/bin/env python3
"""
Add found_in column to species table
"""

import os
from supabase import create_client
import requests

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌ Missing Supabase credentials')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('🚀 Adding found_in column to species table...\n')

# Check if column already exists
print('🔍 Checking if found_in column exists...')
try:
    result = supabase.table('species').select('found_in').limit(1).execute()
    print('✅ Column found_in already exists!\n')
    exit(0)
except Exception as e:
    print(f'⚙️  Column doesn\'t exist yet, will create it...\n')

# Use Supabase REST API to execute raw SQL
sql_query = """
ALTER TABLE species ADD COLUMN IF NOT EXISTS found_in TEXT;
"""

print('📝 Executing SQL...')
# Using postgrest endpoint
try:
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    # Supabase exposes a query endpoint for raw SQL via the database URL
    # We'll use the REST API's RPC feature
    print('\n📋 Please apply the migration manually:')
    print('   1. Go to Supabase Dashboard > SQL Editor')
    print('   2. Run this SQL:')
    print('   ' + '-' * 50)
    print(f'   {sql_query}')
    print('   ' + '-' * 50)
    print('\n   OR copy from: add_found_in_column.sql')

except Exception as e:
    print(f'❌ Error: {e}')

print('\n✨ After applying, run this script again to verify!')
