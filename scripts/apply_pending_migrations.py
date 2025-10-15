#!/usr/bin/env python3
"""
Apply pending migrations to Supabase Cloud
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase = create_client(url, key)

# Key migrations to apply for the education chat feature
critical_migrations = [
    '20251013000003_add_missing_rls_policies.sql',
    '20251014000003_optimize_balanced_species.sql',
]

migrations_dir = Path(__file__).parent.parent / 'supabase' / 'migrations'

print("🚀 Applying critical migrations for education chat...\n")

for migration_file in critical_migrations:
    migration_path = migrations_dir / migration_file

    if not migration_path.exists():
        print(f"⚠️  Migration not found: {migration_file}")
        continue

    print(f"📄 Reading: {migration_file}")
    with open(migration_path, 'r') as f:
        sql = f.read()

    print(f"   Executing migration...")
    try:
        # Execute the SQL directly
        # Note: Supabase Python client doesn't have a direct SQL execution method
        # So we'll use the PostgREST /rpc endpoint with a custom function
        # For now, print instructions for manual application
        print(f"   ℹ️  This migration needs to be applied manually via Supabase Dashboard")
        print(f"   📋 Go to: {url.replace('/rest/v1', '')}/project/default/sql")
        print(f"   📝 Copy and paste the contents of: {migration_path}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()

print("="*60)
print("📊 MIGRATION INSTRUCTIONS:")
print("="*60)
print("To apply these migrations:")
print("1. Go to Supabase Dashboard → SQL Editor")
print(f"2. URL: {url.replace('/rest/v1', '')}/project/default/sql")
print("3. Copy/paste each migration file content")
print("4. Run the SQL")
print()
print("Or use the Supabase CLI:")
print("  npx supabase db push")
