import { useState } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const { toast } = useToast();

  const handleScore = (team: "home" | "away") => {
    if (isMatchComplete) return;
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  const saveMatchScores = async (fixtureId: string, homeScores: number[], awayScores: number[]) => {
    try {
      const response = await fetch(`/api/matches/${fixtureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          HomeTeamScore: JSON.stringify(homeScores),
          AwayTeamScore: JSON.stringify(awayScores),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save match scores');
      }

      toast({
        title: "Match scores saved",
        description: "The match scores have been successfully recorded",
      });
    } catch (error) {
      console.error('Error saving match scores:', error);
      toast({
        title: "Error saving scores",
        description: "There was a problem saving the match scores",
        variant: "destructive",
      });
    }
  };

  const handleTimerComplete = () => {
    if (isMatchComplete) return;

    if (isBreak) {
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      toast({
        title: "Break Time Over",
        description: "Starting next set",
      });
    } else {
      const updatedSetScores = {
        home: [...setScores.home, currentScore.home],
        away: [...setScores.away, currentScore.away],
      };
      
      console.log('Current scores being saved:', currentScore);
      console.log('Updated set scores:', updatedSetScores);
      
      setSetScores(updatedSetScores);
      setIsBreak(true);

      if (updatedSetScores.home.length >= 3) {
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
  };

  const handleSwitchTeams = () => {
    if (isMatchComplete) return;
    
    setIsTeamsSwitched(!isTeamsSwitched);
    
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
    
    setSetScores((prev) => {
      const homeScores = [...prev.home];
      const awayScores = [...prev.away];
      return {
        home: awayScores,
        away: homeScores
      };
    });
  };

  return {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
  };
};