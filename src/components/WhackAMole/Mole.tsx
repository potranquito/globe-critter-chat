import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MoleContainer, MoleItem } from './MoleStyles';
import GAME_CONFIG from './constants';

interface MoleProps {
  mole: {
    id: string;
    delay: number;
    speed: number;
  };
  onMoleClick: () => void;
}

const Mole = ({ mole, onMoleClick }: MoleProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(2);
  const moleRef = useRef<gsap.core.Tween>();

  const [whacked, setIsWhacked] = useState(false);

  useEffect(() => {
    gsap.set(buttonRef.current, { yPercent: 100 });

    moleRef.current = gsap.to(buttonRef.current, {
      yPercent: 0,
      yoyo: true,
      repeat: -1,
      delay: mole.delay,
      duration: mole.speed,
      repeatDelay: mole.delay,
    });

    return () => {
      if (moleRef.current) moleRef.current.kill();
    };
  }, [mole.delay, mole.speed]);

  useEffect(() => {
    if (whacked) {
      moleRef.current?.pause();
      gsap.to(buttonRef.current, {
        yPercent: 100,
        duration: 0.1,
        onStart: () => {
          speedRef.current = speedRef.current * GAME_CONFIG.SPEED_INCREASE;
          const speed = gsap.utils.random(0.5, speedRef.current);

          moleRef.current?.duration(speed);
        },
        onComplete: () => {
          gsap.delayedCall(gsap.utils.random(1, 5), () => {
            setIsWhacked(false);
            moleRef.current?.restart();
          });
        },
      });
    }
  }, [whacked]);

  const handleOnMoleClick = () => {
    setIsWhacked(true);
    onMoleClick();
  };

  return (
    <MoleContainer>
      <div>
        <MoleItem
          ref={buttonRef}
          onClick={handleOnMoleClick}
          data-testid="mole"
        />
      </div>
    </MoleContainer>
  );
};

export default Mole;
