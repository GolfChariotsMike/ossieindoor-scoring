
import { useState } from "react";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
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

  const recordFirstSetProgress = async (match: Match | Fixture, homeScore: number, awayScore: number) => {
    try {
      console.log('Starting recordFirstSetProgress with match:', match);
      
      // Determine if we're dealing with a Match or Fixture type
      const isFixture = 'DateTime' in match;
      
      // Extract date
      const matchDate = isFixture 
        ? new Date(match.DateTime)
        : new Date(match.startTime);
      
      console.log('Match date parsed:', matchDate);

      // Extract court number
      const courtNumber = isFixture
        ? parseInt(match.PlayingAreaName.replace('Court ', ''))
        : match.court;
      
      console.log('Court number parsed:', courtNumber);
      
      const formattedDate = format(matchDate, 'yyyyMMdd-HHmm');
      const matchCode = `${courtNumber}-${formattedDate}`;

      console.log('Generated match code:', matchCode);

      // Extract team names
      const homeTeamName = isFixture ? match.HomeTeam : match.homeTeam.name;
      const awayTeamName = isFixture ? match.AwayTeam : match.awayTeam.name;
      const division = isFixture ? match.DivisionName : match.division;

      const insertData = {
        match_code: matchCode,
        court_number: courtNumber,
        division: division,
        home_team_name: homeTeamName,
        away_team_name: awayTeamName,
        start_time: matchDate.toISOString(),
        first_set_home_score: homeScore,
        first_set_away_score: awayScore,
        has_final_score: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to insert match progress with data:', insertData);

      const { data, error } = await supabase
        .from('match_progress')
        .insert(insertData);

      if (error) {
        console.error('Supabase error inserting match progress:', error);
        throw error;
      }

      console.log('Successfully recorded first set progress:', data);
      
      toast({
        title: "First Set Recorded",
        description: "The first set scores have been saved",
      });
    } catch (error) {
      console.error('Error in recordFirstSetProgress:', error);
      toast({
        title: "Error Recording Set",
        description: "Failed to save the first set scores",
        variant: "destructive",
      });
    }
  };

  const handleTimerComplete = (match?: any) => {
    console.log('handleTimerComplete called with match:', match);
    console.log('Current state:', {
      isBreak,
      currentScore,
      isTeamsSwitched,
      firstSetRecorded,
      setScores
    });

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
        console.log('Match complete, saving final scores');
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
              
              console.log('Updating match progress with has_final_score=true for match code:', matchCode);
              
              const { error } = await supabase
                .from('match_progress')
                .update({ has_final_score: true })
                .eq('match_code', matchCode);

              if (error) {
                console.error('Error updating match progress:', error);
                throw error;
              }
              console.log('Successfully updated match progress has_final_score to true');
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
        console.log('Skipping timer complete - no scores recorded');
        return;
      }

      if (!firstSetRecorded && match) {
        console.log('Recording first set progress');
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

