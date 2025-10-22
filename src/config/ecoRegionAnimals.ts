/**
 * ASCII Animal Animations for Eco-Regions
 * Custom-generated ASCII art for each of the 6 eco-regions
 */

export interface AnimalFrames {
  name: string;
  frames: string[];
}

export const ecoRegionAnimals: Record<string, AnimalFrames> = {
  // 🐻‍❄️ Arctic Terrestrial - Polar Bear (with progress bar)
  'arctic-terrestrial': {
    name: 'Polar Bear',
    frames: [
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[░░░░░░░░░░] 0%`,
      `  ʕᵕᴥᵕʔ＿\n /|___|\\n   / \\\n[▓░░░░░░░░░] 10%`,
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[▓▓░░░░░░░░] 20%`,
      `  ʕᵕᴥᵕʔ＿\n /|___|\\n   / \\\n[▓▓▓░░░░░░░] 30%`,
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[▓▓▓▓░░░░░░] 40%`,
      `  ʕᵕᴥᵕʔ＿\n /|___|\\n   / \\\n[▓▓▓▓▓░░░░░] 50%`,
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[▓▓▓▓▓▓░░░░] 60%`,
      `  ʕᵕᴥᵕʔ＿\n /|___|\\n   / \\\n[▓▓▓▓▓▓▓░░░] 70%`,
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[▓▓▓▓▓▓▓▓░░] 80%`,
      `  ʕᵕᴥᵕʔ＿\n /|___|\\n   / \\\n[▓▓▓▓▓▓▓▓▓░] 90%`,
      `  ʕᵔᴥᵔʔ＿\n /|___|\\n  /   \\\n[▓▓▓▓▓▓▓▓▓▓] 100%`,
    ],
  },

  // 🦜 Amazon and Guianas - Parrot Flying
  'amazon-and-guianas': {
    name: 'Parrot',
    frames: [
      `    \\\\//\n    (oo)\n  <(    )>\n     ||`,
      `    //\\\\\n    (oo)\n  <(    )>\n     ||`,
      `    \\\\//\n    (oo)\n   <(  )>\n     ||`,
      `    //\\\\\n    (oo)\n   <(  )>\n     ||`,
    ],
  },

  // 🐘 Borneo - Elephant
  borneo: {
    name: 'Elephant',
    frames: [
      `    ___\n   /   \\\\_\n  |  O  |_\\_\n   \\___/| |\n    | | | |\n    |_| |_|`,
      `    ___\n   /   \\\\_\n  |  O  |_\\_\n   \\___/  |\n    | |_| |\n    |_|   |`,
      `    ___\n   /   \\\\_\n  |  -  |_\\_\n   \\___/| |\n    | | | |\n    |_| |_|`,
      `    ___\n   /   \\\\_\n  |  O  |_\\_\n   \\___/  |\n    |_| | |\n    |   |_|`,
    ],
  },

  // 🦍 Congo Basin - Gorilla
  'congo-basin': {
    name: 'Gorilla',
    frames: [
      `    ||\n   (OO)\n   /||\\\\  \n  ( )( )\n   || ||`,
      `    ||\n   (oo)\n   /||\\\\  \n  (-)(-)\n   || ||`,
      `    ||\n   (OO)\n   /||\\\\  \n  ( )( )\n   || ||`,
      `    ||\n   (@@)\n   /||\\\\  \n  (=)(=)\n   || ||`,
    ],
  },

  // 🐟 Coral Triangle - Lionfish
  'coral-triangle': {
    name: 'Lionfish',
    frames: [
      `  /\\~/\\\n ><(((*>\n  \\/~\\/`,
      `  /\\~/\\\n><(((*>\n  \\/~\\/`,
      `  /~\\~/\n ><(((*>\n  \\~\\/`,
      `  /\\~/\\\n><(((*>\n  \\/~\\/`,
    ],
  },

  // 🦎 Madagascar - Chameleon
  madagascar: {
    name: 'Chameleon',
    frames: [
      `   __\n  /oo\\\n <(  )>\n  \\/\\/`,
      `   __\n  /oo\\\n <(  )>\n  /\\/\\`,
      `   __\n  /--\\\n <(  )>\n  \\/\\/`,
      `   __\n  /oo\\\n <(  )>\n  /\\/\\`,
    ],
  },

  // 🦉 Default/Fallback - Owl
  default: {
    name: 'Owl',
    frames: [
      `  (o,o)\n  (   )\n  -"-"-`,
      `  (O,O)\n  (   )\n  -"-"-`,
      `  (o,o)\n  (   )\n  -"-"-`,
      `  (-,-)\n  (   )\n  -"-"-`,
    ],
  },
};

/**
 * Get animal frames for a specific eco-region
 * Falls back to default owl if region not found
 */
export function getAnimalForRegion(regionName: string): AnimalFrames {
  // Normalize region name (lowercase, replace spaces with hyphens)
  const normalizedName = regionName.toLowerCase().replace(/\s+/g, '-');

  // Direct match
  if (ecoRegionAnimals[normalizedName]) {
    return ecoRegionAnimals[normalizedName];
  }

  // Partial match (e.g., "Amazon" matches "amazon-and-guianas")
  for (const [key, animal] of Object.entries(ecoRegionAnimals)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return animal;
    }
  }

  // Default fallback
  return ecoRegionAnimals.default;
}
