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

    const createFirework = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const spread = Math.min(window.innerWidth, window.innerHeight) * 1.2; // Increased spread
      const startX = centerX + (Math.random() - 0.5) * spread;
      const startY = centerY + (Math.random() - 0.5) * spread;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4; // Increased size between 4-12px
      const duration = Math.random() * 0.5 + 0.8;
      const id = Date.now() + Math.random();
      
      const translateX = (Math.random() - 0.5) * 400; // Increased translation range
      const translateY = (Math.random() - 0.5) * 400;
      
      const style: CSSProperties = {
        position: 'absolute',
        left: startX,
        top: startY,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 4}px ${size * 2}px ${color}`, // Increased glow effect
        animation: `firework ${duration}s ease-out forwards, fade-out ${duration}s ease-out forwards`,
        ['--tw-translate-x' as string]: `${translateX}px`,
        ['--tw-translate-y' as string]: `${translateY}px`,
        zIndex: 1, // Lower z-index to appear behind content
        transform: `translate(var(--tw-translate-x), var(--tw-translate-y))`,
        pointerEvents: 'none',
      };
      
      return (
        <div
          key={id}
          className="rounded-full opacity-80"
          style={style}
        />
      );
    };

    const interval = setInterval(() => {
      setFireworks(prev => [...prev, createFirework(), createFirework()]); // Create two fireworks at once
    }, 200);

    const cleanup = setInterval(() => {
      setFireworks(prev => prev.slice(-30)); // Keep last 30 fireworks
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      <style>
        {`
          @keyframes firework {
            0% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(0); }
            50% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(1.5); } /* Increased scale */
            100% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(1.2); }
          }
          @keyframes fade-out {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
          }
        `}
      </style>
      {fireworks}
    </div>
  );
};