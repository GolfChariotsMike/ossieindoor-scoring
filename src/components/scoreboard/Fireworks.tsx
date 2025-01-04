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
      const velocity = Math.random() * 30 + 20;
      const size = Math.random() * 6 + 3; // Increased particle size
      const duration = Math.random() * 1 + 1.5; // Slower particle animation
      const spread = Math.random() * 150 + 100; // Increased spread
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
        zIndex: 15,
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

      // Create launch particle with slower animation
      const launchStyle: CSSProperties = {
        position: 'absolute',
        left: centerX,
        top: centerY,
        width: '6px', // Slightly larger launch particle
        height: '6px',
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 0 8px 4px rgba(255, 255, 255, 0.8)',
        animation: `launch 2s ease-out forwards`, // Slower launch animation
        ['--target-y' as string]: `${targetY}px`,
        zIndex: 15,
        pointerEvents: 'none',
      };

      particles.push(
        <div
          key={`launch-${id}`}
          style={launchStyle}
          onAnimationEnd={(e) => {
            if (e.animationName === 'launch') {
              // Create more particles in the explosion
              const newParticles = Array.from({ length: 60 }, () =>
                createParticle(centerX, targetY, color)
              );
              setFireworks(prev => [...prev, ...newParticles]);
            }
          }}
        />
      );

      return particles;
    };

    // Launch fireworks more frequently
    const interval = setInterval(() => {
      setFireworks(prev => [...prev, ...createFirework()]);
    }, 800); // Reduced interval for more frequent launches

    const cleanup = setInterval(() => {
      setFireworks(prev => prev.slice(-300)); // Increased limit for more particles
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 15 }}>
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
            100% {
              transform: translate(
                calc(cos(var(--angle)) * var(--velocity) * var(--spread)),
                calc(sin(var(--angle)) * var(--velocity) * var(--spread) + 100px)
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