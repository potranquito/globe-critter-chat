#!/usr/bin/env python3
"""Check species statistics in database"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print("📊 Species Database Statistics\n")
print("=" * 60)

# Total count
total = supabase.table('species').select('*', count='exact').execute()
print(f"\n🌍 Total species records (with variants): {total.count}")

# Unique species count (distinct iucn_id)
unique = supabase.table('species').select('iucn_id').execute()
unique_ids = set(record['iucn_id'] for record in unique.data)
print(f"🔢 Unique species (distinct iucn_id): {len(unique_ids)}")

# Count by class
print("\n📚 Breakdown by Class:")
classes = supabase.table('species').select('class').execute()
class_counts = {}
for record in classes.data:
    cls = record['class'] or 'Unknown'
    class_counts[cls] = class_counts.get(cls, 0) + 1

for cls, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"   {cls}: {count:,}")

# Mammals breakdown
print("\n🦁 Mammals Details:")
mammals = supabase.table('species').select('*').eq('class', 'MAMMALIA').execute()
print(f"   Total mammal records (with variants): {len(mammals.data)}")

# Unique mammals
unique_mammals = set(record['iucn_id'] for record in mammals.data)
print(f"   Unique mammal species: {len(unique_mammals)}")

# Count with subspecies
with_subspecies = [r for r in mammals.data if r.get('subspecies') and r['subspecies'] != '']
with_subpop = [r for r in mammals.data if r.get('subpopulation') and r['subpopulation'] != '']
print(f"   Mammals with subspecies data: {len(with_subspecies)}")
print(f"   Mammals with subpopulation data: {len(with_subpop)}")

# Conservation status breakdown
print("\n⚠️  Conservation Status (all species):")
statuses = supabase.table('species').select('conservation_status').execute()
status_counts = {}
for record in statuses.data:
    status = record['conservation_status'] or 'Unknown'
    status_counts[status] = status_counts.get(status, 0) + 1

status_order = ['CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'EX', 'EW']
for status in status_order:
    if status in status_counts:
        print(f"   {status}: {status_counts[status]:,}")

print("\n" + "=" * 60)
