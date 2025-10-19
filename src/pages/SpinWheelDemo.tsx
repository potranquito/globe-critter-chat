import { useState } from "react";
import { SpeciesSpinWheel } from "@/components/SpeciesSpinWheel";
import { Button } from "@/components/ui/button";
import { FoodWebSelectionBar } from "@/components/FoodWebSelectionBar";
import { RegionSpecies } from "@/data/ecoregions";

// Mock species data for demo
const MOCK_SPECIES: RegionSpecies[] = [
  {
    scientificName: "Loxodonta africana",
    commonName: "African Elephant",
    imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400",
    animalType: "Mammal",
    conservationStatus: "EN",
    dietaryCategory: "herbivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Panthera leo",
    commonName: "African Lion",
    imageUrl: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400",
    animalType: "Mammal",
    conservationStatus: "VU",
    dietaryCategory: "carnivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Gorilla gorilla",
    commonName: "Western Gorilla",
    imageUrl: "https://images.unsplash.com/photo-1551445689-f1f6c6e56c17?w=400",
    animalType: "Mammal",
    conservationStatus: "CR",
    dietaryCategory: "herbivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Equus quagga",
    commonName: "Plains Zebra",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
    animalType: "Mammal",
    conservationStatus: "NT",
    dietaryCategory: "herbivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Giraffa camelopardalis",
    commonName: "Giraffe",
    imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=400",
    animalType: "Mammal",
    conservationStatus: "VU",
    dietaryCategory: "herbivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Hippopotamus amphibius",
    commonName: "Hippopotamus",
    imageUrl: "https://images.unsplash.com/photo-1623940838181-72ee4f3548c4?w=400",
    animalType: "Mammal",
    conservationStatus: "VU",
    dietaryCategory: "herbivore",
    speciesType: "Mammal"
  },
  {
    scientificName: "Crocodylus niloticus",
    commonName: "Nile Crocodile",
    imageUrl: "https://images.unsplash.com/photo-1551927336-575d6b2e5b6f?w=400",
    animalType: "Reptile",
    conservationStatus: "LC",
    dietaryCategory: "carnivore",
    speciesType: "Reptile"
  },
  {
    scientificName: "Phoenicopterus roseus",
    commonName: "Greater Flamingo",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    animalType: "Bird",
    conservationStatus: "LC",
    dietaryCategory: "omnivore",
    speciesType: "Bird"
  }
];

export default function SpinWheelDemo() {
  const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState<{
    carnivore: RegionSpecies | null;
    herbivoreOmnivore: RegionSpecies | null;
    producer: RegionSpecies | null;
  }>({
    carnivore: null,
    herbivoreOmnivore: null,
    producer: null
  });
  const [currentSpin, setCurrentSpin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpinComplete = (species: RegionSpecies) => {
    console.log("✅ Spin complete! Selected:", species.commonName);

    // Add to the first empty slot
    setSelectedFoodWebSpecies(prev => {
      if (!prev.producer) return { ...prev, producer: species };
      if (!prev.herbivoreOmnivore) return { ...prev, herbivoreOmnivore: species };
      if (!prev.carnivore) return { ...prev, carnivore: species };
      return prev;
    });

    setCurrentSpin(prev => prev + 1);
    setIsSpinning(false);
  };

  const startSequence = () => {
    setSelectedFoodWebSpecies({
      carnivore: null,
      herbivoreOmnivore: null,
      producer: null
    });
    setCurrentSpin(0);
    setIsSpinning(true);
  };

  const addAnotherSpin = () => {
    setIsSpinning(true);
  };

  const selectedCount = [
    selectedFoodWebSpecies.producer,
    selectedFoodWebSpecies.herbivoreOmnivore,
    selectedFoodWebSpecies.carnivore
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎰 Species Spin Wheel Demo
          </h1>
          <p className="text-emerald-300">
            Watch the vertical slot machine select random species!
          </p>
        </div>

        {/* Food Web Selection Banner (like in main app) */}
        <div className="mb-8">
          <FoodWebSelectionBar
            selectedSpecies={selectedFoodWebSpecies}
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Spin Wheel - full width like main carousel */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left side - Spin Wheel Container */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col" style={{height: 'calc(100vh - 300px)', width: '280px'}}>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white">
                  🎰 Spin Wheel
                </h3>
                <p className="text-sm text-gray-400">
                  {isSpinning ? `Spinning... (${currentSpin + 1}/3)` : `${selectedCount}/3 selected`}
                </p>
              </div>

              <div className="flex-1 relative">
                <SpeciesSpinWheel
                  species={MOCK_SPECIES}
                  onSpinComplete={handleSpinComplete}
                  autoSpin={isSpinning}
                  disabled={!isSpinning}
                />
              </div>
            </div>

            {/* Right side - Controls and Info */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Controls - stacked vertically */}
              <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
                <Button
                  onClick={startSequence}
                  disabled={isSpinning}
                  size="lg"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                >
                  {isSpinning ? "SPINNING..." : selectedCount === 0 ? "START 3-SPIN SEQUENCE" : "RESTART"}
                </Button>

                {!isSpinning && selectedCount > 0 && selectedCount < 3 && (
                  <Button
                    onClick={addAnotherSpin}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    Spin Again ({selectedCount}/3)
                  </Button>
                )}
              </div>

              {/* Status Info */}
              <div className="glass-panel rounded-xl p-6 flex-1">
                <h3 className="text-lg font-bold text-white mb-4">
                  Game Status
                </h3>

                {selectedCount === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-xl mb-2">Ready to start!</p>
                    <p className="text-sm">Click "START 3-SPIN SEQUENCE" to begin</p>
                  </div>
                ) : selectedCount === 3 ? (
                  <div className="text-center py-8">
                    <div className="text-2xl font-bold text-yellow-400 animate-bounce mb-4">
                      🎉 All 3 Species Selected! 🎉
                    </div>
                    <p className="text-sm text-gray-300">
                      Now the AI would ask: "Which one is the African Lion?"
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Click the correct species in the banner above to answer!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-emerald-400 mb-2">
                      {selectedCount} of 3 species selected
                    </p>
                    <p className="text-sm text-gray-400">
                      Click "Spin Again" to select more
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
