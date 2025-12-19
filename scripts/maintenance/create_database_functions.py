#!/usr/bin/env python3
"""
Create missing database functions via Supabase API
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🔧 Creating missing database functions...\n")

# Read the SQL file
with open('create_species_functions.sql', 'r') as f:
    sql_content = f.read()

print("📝 SQL function to create:")
print("=" * 70)
print(sql_content)
print("=" * 70)

print("\n⚠️  Note: This SQL needs to be run in Supabase SQL Editor")
print(f"   Go to: https://supabase.com/dashboard/project/{os.environ.get('VITE_SUPABASE_PROJECT_ID')}/sql")
print("\n   Copy the contents of create_species_functions.sql and run it there.")

print("\n✅ SQL file ready: create_species_functions.sql")
