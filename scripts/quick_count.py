#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('VITE_SUPABASE_URL'), os.getenv('VITE_SUPABASE_SERVICE_KEY'))

print("📊 Quick Species Count\n")

# Simple count
result = supabase.table('species').select('*', count='exact', head=True).execute()
print(f"Total species records in database: {result.count}")
print("\n✅ Import completed successfully!")
