#!/usr/bin/env python3
"""Clear all species from database before fresh import"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print("🗑️  Clearing species table...")

# Get current count
result = supabase.table('species').select('*', count='exact', head=True).execute()
print(f"   Current records: {result.count}")

# Delete all records
print("   Deleting all records...")
supabase.table('species').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

# Verify
result = supabase.table('species').select('*', count='exact', head=True).execute()
print(f"   Remaining records: {result.count}")

print("\n✅ Database cleared - ready for fresh import!")
