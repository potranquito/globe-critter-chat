#!/usr/bin/env python3
"""
Update ecoregion names to match WWF/CSV naming convention
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🔄 Updating ecoregion names to match WWF/CSV convention...\n")

# Update the three ecoregions that need name changes
updates = [
    ('203', 'Amazon and Guianas'),
    ('204', 'Madagascar'),
    ('205', 'Borneo')
]

for ecoregion_id, new_name in updates:
    result = supabase.from_('ecoregions').update({'name': new_name}).eq('ecoregion_id', ecoregion_id).execute()
    if result.data:
        print(f"  ✓ Updated ecoregion {ecoregion_id} to '{new_name}'")
    else:
        print(f"  ❌ Failed to update ecoregion {ecoregion_id}")

# Verify all ecoregion names
print("\n📋 Current ecoregions:")
result = supabase.from_('ecoregions').select('ecoregion_id, name, realm').order('name').execute()

if result.data:
    for eco in result.data:
        print(f"  - {eco['name']} ({eco['realm']}) [ID: {eco['ecoregion_id']}]")

print("\n✅ Ecoregion names updated!")
