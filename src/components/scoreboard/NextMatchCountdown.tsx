
import { useState, useEffect } from 'react';

interface NextMatchCountdownProps {
  startTime: number;
  totalDuration: number;
}

export const NextMatchCountdown = ({ startTime, totalDuration }: NextMatchCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(totalDuration);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, totalDuration]);

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60));

  return (
    <div className="text-center mt-4">
      <p className="text-volleyball-black text-lg font-semibold">
        Next match starting in:
      </p>
      <div className="text-2xl font-score mt-2">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
