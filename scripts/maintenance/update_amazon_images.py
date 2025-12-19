#!/usr/bin/env python3
"""
Add Wikipedia images to Amazon and Guianas ecoregion and parks
"""

import os
from supabase import create_client, Client

# Supabase connection
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Ecoregion data
ecoregion_data = {
    "name": "Amazon and Guianas",
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/02/Amazonriverbasin_basemap.png",
    "image_attribution": "Amazon River Basin drainage map (Wikimedia Commons)"
}

# Park data with Wikipedia images
parks_data = [
    {
        "name": "Jaú National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/60/Jau_National_Park.jpg",
        "image_attribution": "Flooded forest in Jaú National Park (Wikimedia Commons)"
    },
    {
        "name": "Manu National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/3/3c/Manu_riverbank.jpg",
        "image_attribution": "Riverbank in Manu National Park (Wikimedia Commons)"
    }
]

def update_ecoregion_image():
    """Update Amazon and Guianas ecoregion with Wikipedia image"""

    print("🌎 Updating Amazon and Guianas ecoregion image...\n")

    # Find the ecoregion by name
    result = supabase.table('ecoregions').select('id, name').ilike('name', f'%{ecoregion_data["name"]}%').execute()

    if not result.data:
        print(f"❌ Ecoregion not found: {ecoregion_data['name']}")
        return

    ecoregion_id = result.data[0]['id']
    found_name = result.data[0]['name']

    # Update the ecoregion with image data
    update_result = supabase.table('ecoregions').update({
        'image_url': ecoregion_data['image_url'],
        'image_attribution': ecoregion_data['image_attribution']
    }).eq('id', ecoregion_id).execute()

    if update_result.data:
        print(f"✅ Updated ecoregion: {found_name}")
        print(f"   Image: {ecoregion_data['image_url']}")
        print(f"   Attribution: {ecoregion_data['image_attribution']}\n")
    else:
        print(f"❌ Failed to update ecoregion: {found_name}\n")

def update_park_images():
    """Update parks with Wikipedia images"""

    print("🖼️  Updating Amazon park images from Wikipedia...\n")

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
            print(f"   Image: {park_data['image_url']}")
            print(f"   Attribution: {park_data['image_attribution']}\n")
        else:
            print(f"❌ Failed to update: {found_name}\n")

    print("✨ Done! Park images updated.")

if __name__ == "__main__":
    update_ecoregion_image()
    update_park_images()
