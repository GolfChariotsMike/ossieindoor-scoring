import { useEffect, useState, CSSProperties } from 'react';

export const Fireworks = () => {
  const [fireworks, setFireworks] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const colors = [
      '#ff0000', // Red
      '#ffd700', // Gold
      '#ff1493', // Deep Pink
      '#00ff00', // Lime
      '#00ffff', // Cyan
      '#ff4500', // Orange Red
      '#ff00ff', // Magenta
      '#ffff00', // Yellow
      '#87ceeb', // Sky Blue
      '#ff69b4', // Hot Pink
    ];

    const createParticle = (x: number, y: number, color: string) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 7 + 5;
      const size = Math.random() * 6 + 4;
      const duration = Math.random() * 2 + 8; // Changed from 18 to 8 seconds base duration
      const spread = Math.random() * 40 + 30;
      const id = Date.now() + Math.random();

      const style: CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 ${size * 4}px ${size}px ${color}`,
        animation: `particle ${duration}s ease-out forwards`,
        ['--angle' as string]: `${angle}rad`,
        ['--velocity' as string]: `${velocity}`,
        ['--spread' as string]: `${spread}px`,
        transform: 'translate(0, 0)',
        zIndex: 9999,
        pointerEvents: 'none',
      };

      return (
        <div
          key={id}
          style={style}
        />
      );
    };

    const createFirework = () => {
      const particles: JSX.Element[] = [];
      const centerX = Math.random() * window.innerWidth;
      const centerY = window.innerHeight;
      const targetY = Math.random() * (window.innerHeight * 0.4) + window.innerHeight * 0.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const id = Date.now();

      const launchStyle: CSSProperties = {
        position: 'absolute',
        left: centerX,
        top: centerY,
        width: '6px',
        height: '6px',
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 0 8px 4px rgba(255, 255, 255, 0.8)',
        animation: `launch 1.5s ease-out forwards`,
        ['--target-y' as string]: `${targetY}px`,
        zIndex: 9999,
        pointerEvents: 'none',
      };

      particles.push(
        <div
          key={`launch-${id}`}
          style={launchStyle}
          onAnimationEnd={(e) => {
            if (e.animationName === 'launch') {
              const newParticles = Array.from({ length: 50 }, () =>
                createParticle(centerX, targetY, color)
              );
              setFireworks(prev => [...prev, ...newParticles]);
            }
          }}
        />
      );

      return particles;
    };

    const interval = setInterval(() => {
      setFireworks(prev => [...prev, ...createFirework()]);
    }, 800);

    const cleanup = setInterval(() => {
      setFireworks(prev => prev.slice(-200));
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
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
      {fireworks}
    </div>
  );
};