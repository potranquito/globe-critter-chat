#!/usr/bin/env python3
"""
Run the database migration to rename found_in column to habitat_info
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

print('🔧 Running database migration: rename found_in to habitat_info...\n')

# Read the migration file
with open('rename_found_in_to_habitat_info.sql', 'r') as f:
    sql = f.read()

try:
    # Execute the migration
    result = supabase.rpc('exec_sql', {'query': sql}).execute()
    print('✅ Migration completed successfully!')
    print('   Column found_in → habitat_info')
except Exception as e:
    # If exec_sql RPC doesn't exist, try using PostgREST directly
    print(f'⚠️  Could not use RPC method: {e}')
    print('📝 Please run the SQL migration manually in Supabase SQL Editor:')
    print('   1. Go to https://supabase.com/dashboard')
    print('   2. Navigate to SQL Editor')
    print('   3. Run the contents of: rename_found_in_to_habitat_info.sql')
    sys.exit(1)
