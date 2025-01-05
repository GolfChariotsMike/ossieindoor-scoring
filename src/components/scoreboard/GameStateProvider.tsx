import React, { createContext, useContext } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Match } from '@/types/volleyball';

interface GameStateContextType {
  currentScore: { home: number; away: number };
  setScores: { home: number[]; away: number[] };
  isBreak: boolean;
  isTeamsSwitched: boolean;
  isMatchComplete: boolean;
  hasGameStarted: boolean;
  stats: {
    home: { blocks: number; aces: number; blocksAgainst: number };
    away: { blocks: number; aces: number; blocksAgainst: number };
  };
  handleScore: (team: "home" | "away", increment: boolean) => void;
  handleStat: (team: "home" | "away", type: "block" | "ace") => void;
  handleTimerComplete: () => void;
  handleSwitchTeams: () => void;
  saveMatchScores: (matchId: string, homeScores: number[], awayScores: number[], homeStats: any, awayStats: any) => void;
  resetGameState: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gameState = useGameState();
  
  return (
    <GameStateContext.Provider value={gameState}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameStateContext = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameStateContext must be used within a GameStateProvider');
  }
  return context;
};