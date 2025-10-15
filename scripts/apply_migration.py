#!/usr/bin/env python3
"""Apply SQL migration using Supabase service role key"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def apply_migration(migration_file: str):
    """Apply a SQL migration file"""
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY')

    if not url or not key:
        print('❌ Error: Missing Supabase credentials')
        sys.exit(1)

    # Read migration file
    migration_path = Path(migration_file)
    if not migration_path.exists():
        print(f'❌ Error: Migration file not found: {migration_file}')
        sys.exit(1)

    sql = migration_path.read_text()
    print(f'📄 Applying migration: {migration_path.name}')
    print(f'   SQL size: {len(sql)} bytes')

    # Create client
    supabase = create_client(url, key)

    # Execute SQL via RPC (if available) or direct query
    try:
        # Try using the SQL editor endpoint via postgrest
        print('   Executing SQL...')

        # Split SQL into individual statements
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

        for i, statement in enumerate(statements):
            if not statement:
                continue
            print(f'   [{i+1}/{len(statements)}] Executing statement...')
            result = supabase.rpc('exec_sql', {'sql': statement}).execute()

        print('✅ Migration applied successfully!')
        return True

    except Exception as e:
        print(f'❌ Error applying migration: {e}')
        print('\n⚠️  The Supabase Python client may not support direct SQL execution.')
        print('   You need to either:')
        print('   1. Use Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql)')
        print('   2. Use psql with direct database connection')
        print('   3. Install and use Supabase CLI')
        print(f'\n📋 SQL to execute:\n')
        print(sql)
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 apply_migration.py <migration-file>')
        sys.exit(1)

    apply_migration(sys.argv[1])
