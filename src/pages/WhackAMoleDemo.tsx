import { useState } from 'react';
import { WhackAMoleGameModal } from '@/components/WhackAMoleGameModal';
import { Button } from '@/components/ui/button';

/**
 * Demo page for testing Whack-A-Mole game in isolation
 */
const WhackAMoleDemo = () => {
  const [showGame, setShowGame] = useState(false);

  const handleWin = (ecoRegionId: string) => {
    console.log('🎉 Game won!', ecoRegionId);
    alert('You won! Eco-region complete!');
  };

  const handleLose = (ecoRegionId: string) => {
    console.log('💀 Game lost!', ecoRegionId);
    alert('Time\'s up! Try again!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-green-400">
          🎯 Whack-A-Mole Demo
        </h1>
        <p className="text-xl text-green-200">
          Test the game independently
        </p>

        <Button
          onClick={() => setShowGame(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-2xl"
        >
          Launch Game
        </Button>

        <div className="mt-8 text-sm text-green-100/70 space-y-2">
          <p><strong className="text-green-300">Goal:</strong> Score 100 points in 60 seconds</p>
          <p><strong className="text-yellow-400">Controls:</strong> Click moles as they pop up</p>
          <p><strong className="text-red-400">Challenge:</strong> Game speeds up after each hit!</p>
        </div>
      </div>

      <WhackAMoleGameModal
        isOpen={showGame}
        onClose={() => setShowGame(false)}
        animalType="fox"
        animalName="Arctic Fox"
        biomeType="tundra"
        ecoRegionId="demo-region"
        onGameComplete={handleWin}
        onGameLose={handleLose}
      />
    </div>
  );
};

export default WhackAMoleDemo;
