import { useState, useEffect } from "react";
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

  const recordFirstSetProgress = async (match: Match | Fixture, homeScore: number, awayScore: number) => {
    try {
      console.log('Starting recordFirstSetProgress with:', {
        match,
        homeScore,
        awayScore,
        isTeamsSwitched
      });
      
      // Extract common data based on type
      const matchDate = 'DateTime' in match 
        ? new Date(match.DateTime)
        : new Date(match.startTime);
      
      const courtNumber = 'PlayingAreaName' in match
        ? parseInt(match.PlayingAreaName.replace('Court ', ''))
        : match.court;
      
      // Extract team names and division based on type
      const homeTeamName = 'HomeTeam' in match ? match.HomeTeam : match.homeTeam.name;
      const awayTeamName = 'AwayTeam' in match ? match.AwayTeam : match.awayTeam.name;
      const division = 'DivisionName' in match ? match.DivisionName : match.division;

      // Adjust scores based on team switching
      const finalHomeScore = isTeamsSwitched ? awayScore : homeScore;
      const finalAwayScore = isTeamsSwitched ? homeScore : awayScore;

      // Generate match code
      const formattedDate = format(matchDate, 'yyyyMMdd-HHmm');
      const matchCode = `${courtNumber}-${formattedDate}`;

      // Insert into matches_v2 first
      const { data: matchData, error: matchError } = await supabase
        .from('matches_v2')
        .insert({
          match_code: matchCode,
          court_number: courtNumber,
          division: division,
          home_team_id: 'Id' in match ? match.HomeTeamId : match.homeTeam.id,
          home_team_name: homeTeamName,
          away_team_id: 'Id' in match ? match.AwayTeamId : match.awayTeam.id,
          away_team_name: awayTeamName,
          start_time: matchDate.toISOString()
        })
        .select()
        .single();

      if (matchError) {
        console.error('Error inserting match:', matchError);
        throw matchError;
      }

      // Then insert into match_data_v2
      const { error: dataError } = await supabase
        .from('match_data_v2')
        .insert({
          match_id: matchData.id,
          court_number: courtNumber,
          division: division,
          home_team_name: homeTeamName,
          away_team_name: awayTeamName,
          set1_home_score: finalHomeScore,
          set1_away_score: finalAwayScore,
          match_date: matchDate.toISOString()
        });

      if (dataError) {
        console.error('Error inserting match data:', dataError);
        throw dataError;
      }

      console.log('Successfully recorded first set progress');
      setFirstSetRecorded(true);
      
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

  const handleScore = (team: "home" | "away", increment: boolean, match?: Match | Fixture) => {
    if (isMatchComplete) return;
    
    const wasGameStarted = hasGameStarted;
    setHasGameStarted(true);
    
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
    
    // If this is the first score of the game, record first set progress
    if (!wasGameStarted && increment && match) {
      console.log('First point scored, recording initial match progress');
      // We'll record the initial score after the state updates
      setTimeout(() => {
        recordFirstSetProgress(match, 
          team === 'home' ? 1 : 0, 
          team === 'away' ? 1 : 0
        );
      }, 0);
    }
  };

  const handleTimerComplete = (match?: Match | Fixture) => {
    console.log('handleTimerComplete called with:', {
      match,
      isBreak,
      currentScore,
      isTeamsSwitched,
      firstSetRecorded,
      hasGameStarted
    });

    if (!hasGameStarted) {
      console.log('Game has not started yet, skipping timer complete handling');
      return;
    }

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
      
      if (matchComplete && match) {
        console.log('Match complete, saving final scores');
        saveMatchScores(match.id, newSetScores.home, newSetScores.away);
      }
      
      toast({
        title: matchComplete ? "Match Complete" : "Break Time Over",
        description: matchComplete ? "The match has ended" : "Starting next set",
      });
    } else {
      setIsBreak(true);
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
