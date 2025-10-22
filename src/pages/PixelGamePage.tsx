import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PixelGame from '@/components/PixelGame';
import { markPixelGameComplete, clearEcoRegionProgress } from '@/utils/ecoRegionProgress';

const PixelGamePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get game config from URL params
  const ecoRegionId = searchParams.get('ecoRegionId') || '';
  const animalType = searchParams.get('animalType') || '';
  const animalName = searchParams.get('animalName') || '';
  const biomeType = searchParams.get('biomeType') || '';

  useEffect(() => {
    // Prevent navigation away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleWin = () => {
    markPixelGameComplete(ecoRegionId);
    console.log('✅ Pixel Game completed for eco-region:', ecoRegionId);

    // Navigate back to trivia page with success flag
    navigate('/trivia?pixelGameWon=true&ecoRegionId=' + ecoRegionId, { replace: true });
  };

  const handleLose = () => {
    clearEcoRegionProgress(ecoRegionId);
    console.log('❌ Pixel Game lost - clearing progress for eco-region:', ecoRegionId);

    // Navigate back to trivia page with failure flag
    navigate('/trivia?pixelGameLost=true&ecoRegionId=' + ecoRegionId, { replace: true });
  };

  const handleExit = () => {
    // User pressed ESC - go back without saving
    navigate('/', { replace: true });
  };

  if (!ecoRegionId || !animalType) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontSize: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>⚠️ Missing game configuration</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PixelGame
        animalType={animalType}
        animalName={animalName}
        biomeType={biomeType}
        onWin={handleWin}
        onLose={handleLose}
        onExit={handleExit}
      />
    </div>
  );
};

export default PixelGamePage;
