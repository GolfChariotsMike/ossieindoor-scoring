import { CSSProperties } from 'react';
import { FireworkStyles } from './fireworksUtils';

interface FireworkParticleProps {
  x: number;
  y: number;
  color: string;
}

export const FireworkParticle = ({ x, y, color }: FireworkParticleProps) => {
  const createParticleStyle = (): CSSProperties => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 7 + 5;
    const size = Math.random() * 6 + 4;
    const duration = Math.random() * 2 + 8;
    const spread = Math.random() * 40 + 30;

    return {
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
    } as FireworkStyles;
  };

  return <div key={Date.now() + Math.random()} style={createParticleStyle()} />;
};