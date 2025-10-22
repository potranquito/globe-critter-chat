import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import WhackAMoleGame from './WhackAMoleGame';

interface WhackAMoleGameModalProps {
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

export const WhackAMoleGameModal = ({
  isOpen,
  onClose,
  animalType,
  animalName,
  biomeType,
  ecoRegionId,
  onGameComplete,
  onGameLose
}: WhackAMoleGameModalProps) => {
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
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-black border-none flex flex-col">
        {/* Game Area */}
        <div className="relative bg-black flex-1">
          {gameState === 'playing' ? (
            <WhackAMoleGame
              key={restartKey}
              animalType={animalType}
              biomeType={biomeType}
              onWin={handleWin}
              onLose={handleLose}
              onExit={handleClose}
            />
          ) : (
            /* Game Over Overlay */
            <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-slate-900 to-black">
              {gameState === 'won' ? (
                <>
                  <Trophy className="w-32 h-32 text-yellow-400 mb-6 animate-bounce" />
                  <h3 className="text-4xl font-bold text-yellow-400 mb-2">
                    VICTORY!
                  </h3>
                  <p className="text-xl text-green-300 mb-6">
                    You protected the habitat!
                  </p>
                  <p className="text-lg text-emerald-400 mb-8 text-center max-w-md px-4">
                    🎉 ECO-REGION COMPLETE! 🎉<br/>
                    The {animalName} is safe and the habitat is protected!
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleRestart}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Play Again
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="border-green-500 text-green-300 hover:bg-green-500/20 px-6 py-3 text-lg"
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Skull className="w-32 h-32 text-red-400 mb-6" />
                  <h3 className="text-4xl font-bold text-red-400 mb-2">
                    TIME'S UP!
                  </h3>
                  <p className="text-xl text-green-300 mb-6">
                    Not enough points!
                  </p>
                  <p className="text-lg text-slate-400 mb-8 text-center max-w-md px-4">
                    You didn't score enough points in time. All progress for this eco-region will be reset!
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
      </DialogContent>
    </Dialog>
  );
};
