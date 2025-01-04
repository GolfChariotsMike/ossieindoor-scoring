import { useEffect, useState } from 'react';
import { FireworkParticle } from './FireworkParticle';
import { FireworkLaunch } from './FireworkLaunch';
import { FIREWORK_COLORS } from './fireworksUtils';

export const Fireworks = () => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const createFirework = () => {
      const centerX = Math.random() * window.innerWidth;
      const centerY = window.innerHeight;
      const targetY = Math.random() * (window.innerHeight * 0.4) + window.innerHeight * 0.2;
      const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

      const handleExplode = () => {
        const newParticles = Array.from({ length: 50 }, () => (
          <FireworkParticle
            key={Date.now() + Math.random()}
            x={centerX}
            y={targetY}
            color={color}
          />
        ));
        setParticles(prev => [...prev, ...newParticles]);
      };

      return (
        <FireworkLaunch
          key={Date.now()}
          x={centerX}
          y={centerY}
          targetY={targetY}
          onExplode={handleExplode}
        />
      );
    };

    const interval = setInterval(() => {
      setParticles(prev => [...prev, createFirework()]);
    }, 800);

    const cleanup = setInterval(() => {
      setParticles(prev => prev.slice(-200));
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 9999 }}>
      <style>
        {`
          @keyframes launch {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(calc(-1 * var(--target-y)));
              opacity: 0;
            }
          }

          @keyframes particle {
            0% {
              transform: translate(0, 0);
              opacity: 1;
            }
            15% {
              transform: translate(
                calc(cos(var(--angle)) * var(--velocity) * var(--spread)),
                calc(sin(var(--angle)) * var(--velocity) * var(--spread))
              );
              opacity: 1;
            }
            100% {
              transform: translate(
                calc(cos(var(--angle)) * var(--velocity) * var(--spread)),
                calc(sin(var(--angle)) * var(--velocity) * var(--spread) + 1000px)
              );
              opacity: 0;
            }
          }
        `}
      </style>
      {particles}
    </div>
  );
};