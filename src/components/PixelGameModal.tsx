import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, RotateCcw, X } from 'lucide-react';
import PixelGame from './PixelGame';

interface PixelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalType: string;
  animalName: string;
  biomeType: string;
  ecoRegionId: string;
  onGameComplete?: (ecoRegionId: string) => void;
  onGameLose?: (ecoRegionId: string) => void;
}

type GameState = 'playing' | 'won' | 'lost';

const PixelGameModal = ({
  isOpen,
  onClose,
  animalType,
  animalName,
  biomeType,
  ecoRegionId,
  onGameComplete,
  onGameLose
}: PixelGameModalProps) => {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [restartKey, setRestartKey] = useState(0);

  const handleWin = () => {
    // Immediately close and continue conversation
    if (onGameComplete) {
      onGameComplete(ecoRegionId);
    }
    handleClose();
  };

  const handleLose = () => {
    setGameState('lost');
  };

  const handleRestart = () => {
    setGameState('playing');
    setRestartKey(prev => prev + 1);
  };

  const handleClose = () => {
    setGameState('playing');
    setRestartKey(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[900px] w-full p-0 bg-slate-900 border-2 border-cyan-500/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 px-6 py-4 border-b-2 border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300 mb-1">
                Save the {animalName}!
              </h2>
              <p className="text-sm text-cyan-100/70">
                Clean up all the poop pellets before time runs out!
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="h-8 w-8 rounded hover:bg-cyan-500/20 text-cyan-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative bg-black">
          {gameState === 'playing' ? (
            <PixelGame
              key={restartKey}
              animalType={animalType}
              biomeType={biomeType}
              onWin={handleWin}
              onLose={handleLose}
              onExit={handleClose}
            />
          ) : (
            /* Game Over Overlay */
            <div className="flex flex-col items-center justify-center h-[600px] bg-gradient-to-b from-slate-900 to-black">
              {gameState === 'won' ? (
                <>
                  <Trophy className="w-32 h-32 text-yellow-400 mb-6 animate-bounce" />
                  <h3 className="text-4xl font-bold text-yellow-400 mb-2">
                    VICTORY!
                  </h3>
                  <p className="text-xl text-cyan-300 mb-6">
                    You cleaned up all the poop!
                  </p>
                  <p className="text-lg text-emerald-400 mb-8 text-center max-w-md px-4">
                    The {animalName} is safe and the eco-region is protected!<br/>
                    The Guardian AI can now see clearly again.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleRestart}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 text-lg"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Play Again
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/20 px-6 py-3 text-lg"
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Skull className="w-32 h-32 text-red-400 mb-6" />
                  <h3 className="text-4xl font-bold text-red-400 mb-2">
                    GAME OVER!
                  </h3>
                  <p className="text-xl text-cyan-300 mb-6">
                    The poop got you!
                  </p>
                  <p className="text-lg text-slate-400 mb-8 text-center max-w-md px-4">
                    Don't give up! The {animalName} needs your help to clean the eco-region.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        if (onGameLose) {
                          onGameLose(ecoRegionId);
                        }
                        handleClose();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Start Over
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Instructions Footer */}
        {gameState === 'playing' && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 border-t-2 border-cyan-500/50">
            <div className="text-xs text-cyan-100/70 space-y-1">
              <p><strong className="text-cyan-300">How to Play:</strong> Use arrow keys to move. Collect all pellets. Avoid poop enemies!</p>
              <p><strong className="text-yellow-400">Golden Pellets:</strong> Make you powerful for 8 seconds. Eat the poops while they're blue!</p>
              <p><strong className="text-red-400">Watch Out:</strong> You have 3 lives. Don't let time run out (3 minutes)!</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixelGameModal;
