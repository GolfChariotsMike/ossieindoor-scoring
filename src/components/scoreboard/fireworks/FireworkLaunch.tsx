import { CSSProperties } from 'react';
import { FireworkStyles } from './fireworksUtils';

interface FireworkLaunchProps {
  x: number;
  y: number;
  targetY: number;
  onExplode: () => void;
}

export const FireworkLaunch = ({ x, y, targetY, onExplode }: FireworkLaunchProps) => {
  const launchStyle: FireworkStyles = {
    position: 'absolute',
    left: x,
    top: y,
    width: '6px',
    height: '6px',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 0 8px 4px rgba(255, 255, 255, 0.8)',
    animation: 'launch 1.5s ease-out forwards',
    transform: 'translate(0, 0)',
    ['--target-y' as string]: `${targetY}px`,
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <div
      key={`launch-${Date.now()}`}
      style={launchStyle}
      onAnimationEnd={(e) => {
        if (e.animationName === 'launch') {
          onExplode();
        }
      }}
    />
  );
};