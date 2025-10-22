import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import Mole from './WhackAMole/Mole';
import Timer from './WhackAMole/Timer';
import GAME_CONFIG from './WhackAMole/constants';
import { BattlefieldContainer, Field, Score, Header } from './WhackAMole/GameStyles';

interface MoleType {
  id: string;
  delay: number;
  speed: number;
}

interface WhackAMoleGameProps {
  animalType: string;
  biomeType: string;
  onWin: () => void;
  onLose: () => void;
  onExit?: () => void;
}

/**
 * Main Whack-A-Mole game component
 * Based on gabrielgugelmin/whack-a-mole with styled-components
 */
const WhackAMoleGame = ({ onWin, onLose }: WhackAMoleGameProps) => {
  const [moles, setMoles] = useState<MoleType[]>([]);
  const [score, setScore] = useState(0);
  const [hasTimeLeft, setHasTimeLeft] = useState(true);

  // Sound effects (optional - can be silent)
  const sounds = {
    whack: new Howl({
      src: ['/sounds/whackamole/whack.mp3'],
      volume: 0.3,
      onloaderror: () => {}, // Silent fail
    }),
    win: new Howl({
      src: ['/sounds/whackamole/win.mp3'],
      volume: 0.5,
      onloaderror: () => {},
    }),
  };

  // Generate moles on mount
  useEffect(() => {
    const molesArray = Array.from(Array(GAME_CONFIG.MOLES_COUNT).keys()).map(
      () => ({
        delay: gsap.utils.random(0.5, 5),
        id: uuidv4(),
        speed: gsap.utils.random(0.5, 2),
      })
    );
    setMoles(molesArray);
  }, []);

  // Handle mole click
  const onMoleClick = () => {
    const newScore = score + GAME_CONFIG.INCREMENT_SCORE_BY;
    setScore(newScore);
    sounds.whack.play();

    // Check win condition
    if (newScore >= GAME_CONFIG.WIN_SCORE) {
      setHasTimeLeft(false);
      sounds.win.play();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => onWin(), 1500);
    }
  };

  // Handle time's up
  const onTimesUp = () => {
    setHasTimeLeft(false);

    if (score >= GAME_CONFIG.WIN_SCORE) {
      sounds.win.play();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => onWin(), 1500);
    } else {
      setTimeout(() => onLose(), 1000);
    }
  };

  return (
    <BattlefieldContainer>
      {hasTimeLeft && (
        <>
          <Header>
            <Score>score: {score}</Score>
            <div style={{
              color: 'white',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '0.25rem' }}>Target: {GAME_CONFIG.WIN_SCORE}</p>
              <div style={{
                width: '12rem',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '9999px',
                height: '0.75rem',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    backgroundColor: '#facc15',
                    height: '100%',
                    transition: 'all 300ms',
                    width: `${Math.min((score / GAME_CONFIG.WIN_SCORE) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <Timer
              onTimesUp={onTimesUp}
              gameTime={GAME_CONFIG.GAME_TIME_SECONDS}
            />
          </Header>
          <Field>
            {moles.map((mole) => (
              <Mole key={mole.id} mole={mole} onMoleClick={onMoleClick} />
            ))}
          </Field>
        </>
      )}
    </BattlefieldContainer>
  );
};

export default WhackAMoleGame;
