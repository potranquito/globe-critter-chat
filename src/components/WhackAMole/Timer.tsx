import { useEffect, useState } from 'react';

interface TimerProps {
  onTimesUp: () => void;
  gameTime: number; // in seconds
}

/**
 * Countdown timer component
 * Simplified from gabrielgugelmin/whack-a-mole
 */
const Timer = ({ onTimesUp, gameTime }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(gameTime);

  useEffect(() => {
    // Countdown every second
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimesUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimesUp]);

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-2 border-white rounded text-white font-bold">
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <span className="text-lg">{formattedTime}</span>
    </div>
  );
};

export default Timer;
