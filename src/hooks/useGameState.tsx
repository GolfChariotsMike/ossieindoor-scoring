
import { useState } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { isMatchCompleted } from "@/utils/scoringLogic";
import { saveMatchScores } from "@/utils/matchDatabase";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [firstSetRecorded, setFirstSetRecorded] = useState(false);

  const resetGameState = () => {
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
  };

  const handleScore = (team: "home" | "away", increment: boolean) => {
    if (isMatchComplete) return;
    setHasGameStarted(true);
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
  };

  const recordFirstSetProgress = async (match: any, homeScore: number, awayScore: number) => {
    try {
      // Create a match code that matches exactly how it's stored in matches_v2
      const matchDate = new Date(match.DateTime || match.startTime);
      const courtNumber = match.PlayingAreaName 
        ? parseInt(match.PlayingAreaName.replace('Court ', '')) 
        : match.court;
      
      const formattedDate = format(matchDate, 'yyyyMMdd-HHmm');
      const matchCode = `${courtNumber}-${formattedDate}`;

      console.log('Recording first set progress:', {
        matchCode,
        courtNumber,
        startTime: matchDate.toISOString(),
        homeScore,
        awayScore
      });

      const { error } = await supabase.from('match_progress').insert({
        match_code: matchCode,
        court_number: courtNumber,
        division: match.DivisionName || match.division,
        home_team_name: match.HomeTeam || match.homeTeam.name,
        away_team_name: match.AwayTeam || match.awayTeam.name,
        start_time: matchDate.toISOString(),
        first_set_home_score: homeScore,
        first_set_away_score: awayScore,
        has_final_score: false
      });

      if (error) {
        console.error('Error recording first set progress:', error);
        throw error;
      }

      console.log('First set progress recorded successfully');
    } catch (error) {
      console.error('Error recording first set progress:', error);
    }
  };

  const handleTimerComplete = (match?: any) => {
    if (isBreak) {
      const newSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      setSetScores(newSetScores);
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      
      const matchComplete = isMatchCompleted(newSetScores);
      setIsMatchComplete(matchComplete);
      
      if (matchComplete) {
        saveMatchScores(match?.id, newSetScores.home, newSetScores.away);
        
        // Update match_progress to indicate final scores are saved
        if (match) {
          const updateMatchProgress = async () => {
            try {
              const matchDate = new Date(match.DateTime || match.startTime);
              const courtNumber = match.PlayingAreaName 
                ? parseInt(match.PlayingAreaName.replace('Court ', '')) 
                : match.court;
              const formattedDate = format(matchDate, 'yyyyMMdd-HHmm');
              const matchCode = `${courtNumber}-${formattedDate}`;
              
              const { error } = await supabase
                .from('match_progress')
                .update({ has_final_score: true })
                .eq('match_code', matchCode);

              if (error) {
                console.error('Error updating match progress:', error);
              }
            } catch (error) {
              console.error('Error updating match progress:', error);
            }
          };
          updateMatchProgress();
        }
      }
      
      toast({
        title: matchComplete ? "Match Complete" : "Break Time Over",
        description: matchComplete ? "The match has ended" : "Starting next set",
      });
    } else {
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

      if (!firstSetRecorded && match) {
        setFirstSetRecorded(true);
        recordFirstSetProgress(
          match,
          isTeamsSwitched ? currentScore.away : currentScore.home,
          isTeamsSwitched ? currentScore.home : currentScore.away
        );
      }
      
      setIsBreak(true);
      setHasGameStarted(true);
      toast({
        title: "Set Complete",
        description: "Starting 1 minute break",
      });
    }
  };

  const handleSwitchTeams = () => {
    if (isMatchComplete) return;
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
  };

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
    saveMatchScores,
    resetGameState,
  };
};

