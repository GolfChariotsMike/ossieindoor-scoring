import { useEffect, useState } from 'react';

export const Fireworks = () => {
  const [fireworks, setFireworks] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const createFirework = () => {
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY - Math.random() * 500;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const id = Date.now() + Math.random();
      
      return (
        <div
          key={id}
          className="absolute w-4 h-4 rounded-full"
          style={{
            left: startX,
            backgroundColor: color,
            animation: `firework 1s ease-out forwards, fade-out 1s ease-out forwards`,
            transform: `translate(${endX - startX}px, ${endY - startY}px)`,
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

  return <div className="fixed inset-0 pointer-events-none overflow-hidden">{fireworks}</div>;
};