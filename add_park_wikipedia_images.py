#!/usr/bin/env python3
"""
Add Wikipedia images to Arctic parks
"""

import os
from supabase import create_client, Client

# Supabase connection
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Park data with Wikipedia images
parks_data = [
    {
        "name": "Quttinirpaaq National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Quttinirtaaq_6_1997-08-05.jpg",
        "image_attribution": "Aerial view of Quttinirpaaq National Park, 1997 (Wikimedia Commons)"
    },
    {
        "name": "Northeast Greenland National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Franz_Josef_Fjord%2C_glacier.jpg",
        "image_attribution": "Franz Josef Fjord, glacier (Wikimedia Commons)"
    },
    {
        "name": "Vatnajökull National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Hvannadalshnjukur-Vatnajokull_National_Park.JPG",
        "image_attribution": "Hikers journey to Hvannadalshnjúkur, the high peak of Öræfajökull (Wikimedia Commons)"
    }
]

def update_park_images():
    """Update parks with Wikipedia images"""

    print("🖼️  Updating Arctic park images from Wikipedia...\n")

    for park_data in parks_data:
        park_name = park_data["name"]

        # Find the park by name
        result = supabase.table('parks').select('id, name').ilike('name', f'%{park_name}%').execute()

        if not result.data:
            print(f"❌ Park not found: {park_name}")
            continue

        park_id = result.data[0]['id']
        found_name = result.data[0]['name']

        # Update the park with image data
        update_result = supabase.table('parks').update({
            'image_url': park_data['image_url'],
            'image_attribution': park_data['image_attribution']
        }).eq('id', park_id).execute()

        if update_result.data:
            print(f"✅ Updated: {found_name}")
            print(f"   Image: {park_data['image_url'][:60]}...")
            print(f"   Attribution: {park_data['image_attribution']}\n")
        else:
            print(f"❌ Failed to update: {found_name}\n")

    print("✨ Done! Park images updated.")

if __name__ == "__main__":
    update_park_images()
