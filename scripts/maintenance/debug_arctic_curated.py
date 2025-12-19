#!/usr/bin/env python3
"""
Debug: Check which species the function is returning vs what's marked as curated.
"""
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Get Arctic ecoregion ID
arctic = supabase.from_('ecoregions').select('id, name').ilike('name', '%arctic%').execute().data[0]
print(f"Arctic ID: {arctic['id']}")

# Call the function
result = supabase.rpc(
    'get_curated_species_by_ecoregion_balanced',
    {'ecoregion_uuid': arctic['id'], 'max_per_class': 10}
).execute()

print(f"\n=== FUNCTION RETURNED {len(result.data)} SPECIES ===\n")

for i, sp in enumerate(result.data[:20], 1):
    has_img = "✓" if sp.get('image_url') else "✗"
    curated = "✓" if sp.get('is_curated') else "✗"
    marine = "🌊" if sp.get('is_marine') else ""
    terrestrial = "🌳" if sp.get('is_terrestrial') else ""

    print(f"{i:2}. {sp['common_name']:<30} (Curated:{curated} Img:{has_img} {marine}{terrestrial})")
