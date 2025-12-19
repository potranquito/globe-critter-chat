#!/usr/bin/env python3
"""
Clear incorrectly imported curated species from the database
This will delete all curated species and their ecoregion links
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

print("🗑️  Clearing incorrectly imported curated species...\n")

# Count current species
count_result = supabase.from_('species').select('*', count='exact').eq('is_curated', True).execute()
curated_count = count_result.count or 0

print(f"📊 Found {curated_count} curated species to delete")

# Delete all curated species (CASCADE will handle species_ecoregions links)
delete_result = supabase.from_('species').delete().eq('is_curated', True).execute()

print(f"✅ Deleted all curated species")

# Verify deletion
verify_result = supabase.from_('species').select('*', count='exact').execute()
remaining_count = verify_result.count or 0

print(f"\n📊 Remaining species in database: {remaining_count}")
print("   (These should be IUCN species if any remain)")

# Reset global health
print("\n🔄 Resetting global health...")
supabase.from_('global_health').update({
    'total_species': remaining_count,
    'critically_endangered': 0,
    'endangered': 0,
    'vulnerable': 0,
    'near_threatened': 0,
    'health_score': 0.0
}).eq('id', 1).execute()

print("✅ Global health reset")
print("\n🎯 Ready for IUCN import!")
