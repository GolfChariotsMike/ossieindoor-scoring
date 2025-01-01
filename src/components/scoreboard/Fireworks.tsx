import { useEffect, useState } from 'react';

export const Fireworks = () => {
  const [fireworks, setFireworks] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const createFirework = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const spread = 300; // Area around center where fireworks will appear
      const startX = centerX + (Math.random() - 0.5) * spread;
      const startY = centerY + (Math.random() - 0.5) * spread;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const id = Date.now() + Math.random();
      
      return (
        <div
          key={id}
          className="absolute w-4 h-4 rounded-full"
          style={{
            left: startX,
            top: startY,
            backgroundColor: color,
            animation: `firework 1s ease-out forwards, fade-out 1s ease-out forwards`,
            zIndex: 0,
          }}
        />
      );
    };

    const interval = setInterval(() => {
      setFireworks(prev => [...prev, createFirework()]);
    }, 300);

    // Cleanup old fireworks
    const cleanup = setInterval(() => {
      setFireworks(prev => prev.slice(-20)); // Keep only last 20 fireworks
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanup);
    };
  }, []);

  return <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">{fireworks}</div>;
};