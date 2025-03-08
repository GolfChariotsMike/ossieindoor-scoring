import { useState, useCallback, useRef } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { useToast } from "@/hooks/use-toast";
import { saveMatchScores } from "@/utils/matchDatabase";

interface GameState {
  currentScore: Score;
  setScores: SetScores;
  isBreak: boolean;
  isTeamsSwitched: boolean;
  isMatchComplete: boolean;
  hasGameStarted: boolean;
  handleScore: (team: "home" | "away", increment?: boolean) => void;
  handleTimerComplete: () => void;
  handleSwitchTeams: () => void;
  resetGameState: () => void;
  saveScoresLocally: (matchId: string, homeScores: number[], awayScores: number[]) => Promise<boolean>;
  startMatch: () => void;
}

const initialScore: Score = { home: 0, away: 0 };
const initialSetScores: SetScores = { home: [], away: [] };

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>(initialScore);
  const [setScores, setSetScores] = useState<SetScores>(initialSetScores);
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const { toast } = useToast();

  // useRef to hold the match object
  const match = useRef<any>(null);

  const handleScore = useCallback((team: "home" | "away", increment: boolean = true) => {
    if (isMatchComplete) return;
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
  }, [isMatchComplete]);

  const handleTimerComplete = useCallback(() => {
    if (isBreak) {
      setIsBreak(false);
      setCurrentScore(initialScore);
      setIsTeamsSwitched(!isTeamsSwitched);
      if (!isMatchComplete) {
        toast({
          title: "Break Time Over",
          description: "Starting next set",
        });
      }
    } else {
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

      const newSetScores = {
        home: [...setScores.home, currentScore.home],
        away: [...setScores.away, currentScore.away],
      };
      setSetScores(newSetScores);
      setIsBreak(true);

      if (newSetScores.home.length >= 3) {
        setIsMatchComplete(true);
        toast({
          title: "Match Complete",
          description: "The match has ended",
        });
      } else {
        toast({
          title: "Set Complete",
          description: "Starting 1 minute break",
        });
      }
    }
  }, [currentScore, isBreak, isMatchComplete, setScores, isTeamsSwitched, toast]);

  const handleSwitchTeams = useCallback(() => {
    if (isMatchComplete) return;
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
  }, [isMatchComplete, isTeamsSwitched]);

  const resetGameState = useCallback(() => {
    setCurrentScore(initialScore);
    setSetScores(initialSetScores);
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
  }, []);

  const saveScoresLocally = useCallback(async (matchId: string, homeScores: number[], awayScores: number[]) => {
    console.log('Saving scores locally:', { matchId, homeScores, awayScores });
    try {
      // Get the match data to extract fixture start time
      const fixtureStartTime = match?.current?.startTime || undefined;
      
      await saveMatchScores(matchId, homeScores, awayScores, false, fixtureStartTime);
      toast({
        title: "Scores Saved",
        description: "Match scores have been saved locally.",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error('Error saving scores locally:', error);
      toast({
        title: "Error Saving Scores",
        description: "There was a problem saving the match scores.",
        variant: "destructive",
      });
      return false;
    }
  }, [match?.current?.startTime, toast]);

  const startMatch = useCallback(() => {
    setHasGameStarted(true);
  }, []);

  return {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    hasGameStarted,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    resetGameState,
    saveScoresLocally,
    startMatch,
  };
};
