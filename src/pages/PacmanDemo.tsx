import { useState } from 'react';
import PixelGame from '@/components/PixelGame';
import { Button } from '@/components/ui/button';

const PacmanDemo = () => {
  const [showGame, setShowGame] = useState(false);

  const handleWin = () => {
    console.log('🎉 You won!');
    alert('You won! 🎉');
    setShowGame(false);
  };

  const handleLose = () => {
    console.log('💀 Game over!');
    alert('Game over! 💀');
    setShowGame(false);
  };

  const handleExit = () => {
    setShowGame(false);
  };

  if (showGame) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <PixelGame
          animalType="default"
          biomeType="default"
          onWin={handleWin}
          onLose={handleLose}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-cyan-400">Pacman Game Demo</h1>
        <p className="text-lg text-cyan-200">Test the 2D Pixel Pacman game</p>

        <div className="space-y-4">
          <Button
            onClick={() => setShowGame(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 text-xl"
          >
            Launch Pacman Game
          </Button>

          <div className="text-sm text-slate-400 space-y-2">
            <p><strong>Controls:</strong> Arrow keys to move</p>
            <p><strong>Goal:</strong> Collect all 274 pellets</p>
            <p><strong>Power Pellets:</strong> Golden pellets let you eat the poop enemies</p>
            <p><strong>Lives:</strong> You have 3 lives</p>
            <p><strong>Time:</strong> 3 minutes to complete</p>
            <p><strong>Exit:</strong> Press ESC to go back</p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/20"
          >
            Back to Main App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PacmanDemo;
