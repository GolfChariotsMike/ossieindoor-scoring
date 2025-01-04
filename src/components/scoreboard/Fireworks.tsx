import { useEffect, useState } from 'react';

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
      const spread = Math.min(window.innerWidth, window.innerHeight) * 0.8; // Responsive spread
      const startX = centerX + (Math.random() - 0.5) * spread;
      const startY = centerY + (Math.random() - 0.5) * spread;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 4 + 2; // Random size between 2-6px
      const duration = Math.random() * 0.5 + 0.8; // Random duration between 0.8-1.3s
      const id = Date.now() + Math.random();
      
      const translateX = (Math.random() - 0.5) * 200;
      const translateY = (Math.random() - 0.5) * 200;
      
      return (
        <div
          key={id}
          className="absolute rounded-full opacity-80"
          style={{
            left: startX,
            top: startY,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            boxShadow: `0 0 ${size * 2}px ${size}px ${color}`,
            animation: `firework ${duration}s ease-out forwards, fade-out ${duration}s ease-out forwards`,
            '--tw-translate-x': `${translateX}px`,
            '--tw-translate-y': `${translateY}px`,
            zIndex: 0,
          }}
        />
      );
    };

    // Create fireworks more frequently
    const interval = setInterval(() => {
      setFireworks(prev => [...prev, createFirework(), createFirework()]); // Create two fireworks at once
    }, 200);

    // Cleanup old fireworks to prevent memory issues
    const cleanup = setInterval(() => {
      setFireworks(prev => prev.slice(-30)); // Keep last 30 fireworks
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">{fireworks}</div>;
};