#!/usr/bin/env python3
"""
Add Wikipedia images to Madagascar ecoregion and parks
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
    "name": "Madagascar",
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Madagascar_topo.jpg",
    "image_attribution": "Land cover and topography of Madagascar (Wikimedia Commons)"
}

# Park data with Wikipedia images
parks_data = [
    {
        "name": "Masoala National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/01/Masoala_park_map.png",
        "image_attribution": "Map of Masoala National Park (Wikimedia Commons)"
    },
    {
        "name": "Ranomafana National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Sign_At_Entrance_To_Ranomafana_National_Park.jpg",
        "image_attribution": "Entrance sign to Ranomafana National Park (Wikimedia Commons)"
    },
    {
        "name": "Andasibe-Mantadia National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Madagascar_physical_map.svg",
        "image_attribution": "Location of Andasibe-Mantadia National Park in Madagascar (Wikimedia Commons)"
    }
]

def update_ecoregion_image():
    """Update Madagascar ecoregion with Wikipedia image"""

    print("🌍 Updating Madagascar ecoregion image...\n")

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

    print("🖼️  Updating Madagascar park images from Wikipedia...\n")

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
