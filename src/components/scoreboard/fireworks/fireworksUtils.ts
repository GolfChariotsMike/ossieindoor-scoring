export const FIREWORK_COLORS = [
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

export interface FireworkStyles {
  position: 'absolute';
  left: number;
  top: number;
  width: string;
  height: string;
  backgroundColor: string;
  borderRadius: string;
  boxShadow: string;
  animation: string;
  transform?: string;
  zIndex: number;
  pointerEvents: 'none';
  '--angle'?: string;
  '--velocity'?: string;
  '--spread'?: string;
  '--target-y'?: string;
}