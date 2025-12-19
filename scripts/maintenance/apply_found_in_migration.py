#!/usr/bin/env python3
"""
Apply the found_in column migration to Supabase database
"""

import os
import sys
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌ Missing Supabase credentials')
    print('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
    sys.exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print('🚀 Applying found_in column migration...\n')

    # Read the SQL file
    with open('add_found_in_column.sql', 'r') as f:
        sql_commands = f.read()

    # Split into individual commands (simple approach)
    commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip() and not cmd.strip().startswith('--')]

    # Execute each command
    for idx, command in enumerate(commands, 1):
        if 'ALTER TABLE' in command or 'COMMENT ON' in command:
            print(f'📝 Executing command {idx}...')
            try:
                result = supabase.rpc('exec_sql', {'sql': command}).execute()
                print(f'✅ Command {idx} executed successfully')
            except Exception as e:
                # Try using postgrest directly
                print(f'⚠️  Standard execution failed, trying alternative method...')
                print(f'   Error: {e}')
                print('\n📋 Please apply the migration manually using Supabase Dashboard:')
                print('   1. Go to https://supabase.com/dashboard')
                print('   2. Open SQL Editor')
                print('   3. Copy contents of add_found_in_column.sql')
                print('   4. Paste and run')
                return

    # Verify the column was added
    print('\n🔍 Verifying column exists...')
    try:
        result = supabase.table('species').select('found_in').limit(1).execute()
        print('✅ Column found_in exists!\n')
        print('🎉 Migration completed successfully!')
    except Exception as e:
        print(f'❌ Verification failed: {e}')

if __name__ == '__main__':
    main()
