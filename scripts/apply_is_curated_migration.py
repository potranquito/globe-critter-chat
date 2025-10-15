#!/usr/bin/env python3
"""
Apply the is_curated flag migration to the database
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')

if not url or not key:
    print("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY")
    exit(1)

supabase = create_client(url, key)

print("🔧 Applying is_curated migration\n")

# Read the migration file
with open('supabase/migrations/20251014000005_add_is_curated_flag.sql', 'r') as f:
    migration_sql = f.read()

print("📄 Migration SQL:")
print("=" * 70)
print(migration_sql[:500] + "..." if len(migration_sql) > 500 else migration_sql)
print("=" * 70)

try:
    # Execute the migration
    print("\n⚙️  Executing migration...")
    result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
    print("✅ Migration applied successfully!")

except Exception as e:
    # If RPC doesn't exist, we'll need to execute it differently
    print(f"⚠️  Standard RPC failed: {e}")
    print("\n💡 Please apply this migration manually:")
    print("   1. Go to: https://app.supabase.com/project/iwmbvpdqwekgxegaxrhr/sql")
    print("   2. Copy the contents of: supabase/migrations/20251014000005_add_is_curated_flag.sql")
    print("   3. Paste and run in the SQL editor")
    print("\n   Or use the Supabase CLI:")
    print("   $ supabase db push")
