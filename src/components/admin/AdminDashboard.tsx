import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fixture } from "@/types/volleyball";
import { DateSelector } from "./DateSelector";
import { MatchesTable } from "./MatchesTable";

interface MatchScores {
  [key: string]: {
    home: number[];
    away: number[];
  };
}

export const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const [scores, setScores] = useState<MatchScores>({});

  const { data: matchesData = [], isLoading } = useQuery({
    queryKey: ["matches", selectedDate],
    queryFn: () => fetchMatchData(undefined, parse(selectedDate, 'yyyy-MM-dd', new Date())),
  });

  const matches = Array.isArray(matchesData) ? matchesData : [];

  useEffect(() => {
    const fetchExistingScores = async () => {
      for (const match of matches) {
        const matchDate = parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date());
        const matchCode = `${match.PlayingAreaName.replace('Court ', '')}-${format(matchDate, 'yyyyMMdd-HHmm')}`;
        
        const { data: existingMatch } = await supabase
          .from('matches_v2')
          .select('id')
          .eq('match_code', matchCode)
          .maybeSingle();

        if (existingMatch) {
          const { data: matchData } = await supabase
            .from('match_data_v2')
            .select('*')
            .eq('match_id', existingMatch.id)
            .maybeSingle();

          if (matchData) {
            setScores(prev => ({
              ...prev,
              [match.Id]: {
                home: [
                  matchData.set1_home_score || 0,
                  matchData.set2_home_score || 0,
                  matchData.set3_home_score || 0
                ],
                away: [
                  matchData.set1_away_score || 0,
                  matchData.set2_away_score || 0,
                  matchData.set3_away_score || 0
                ]
              }
            }));
          }
        }
      }
    };

    if (matches.length > 0) {
      fetchExistingScores();
    }
  }, [matches]);

  const handleScoreChange = (matchId: string, team: 'home' | 'away', setIndex: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [matchId]: {
        home: team === 'home' 
          ? Object.assign([...prev[matchId]?.home || [0, 0, 0]], { [setIndex]: numValue })
          : [...prev[matchId]?.home || [0, 0, 0]],
        away: team === 'away'
          ? Object.assign([...prev[matchId]?.away || [0, 0, 0]], { [setIndex]: numValue })
          : [...prev[matchId]?.away || [0, 0, 0]],
      }
    }));
  };

  const saveMatchScores = async (match: Fixture) => {
    console.log("Attempting to save match scores...");
    
    if (!scores[match.Id]) {
      console.log("No scores to save");
      toast({
        title: "No changes",
        description: "No scores have been modified for this match",
        variant: "default",
      });
      return;
    }

    const matchScores = scores[match.Id];
    console.log("Match scores to save:", matchScores);

    try {
      const matchDate = parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date());
      const matchCode = `${match.PlayingAreaName.replace('Court ', '')}-${format(matchDate, 'yyyyMMdd-HHmm')}`;
      
      let { data: existingMatch, error: fetchError } = await supabase
        .from('matches_v2')
        .select('id')
        .eq('match_code', matchCode)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing match:', fetchError);
        toast({
          title: "Error",
          description: `Failed to check existing match: ${fetchError.message}`,
          variant: "destructive",
        });
        return;
      }

      let matchId;
      if (existingMatch) {
        matchId = existingMatch.id;
      } else {
        const { data: newMatch, error: createError } = await supabase
          .from('matches_v2')
          .insert({
            match_code: matchCode,
            court_number: parseInt(match.PlayingAreaName.replace('Court ', '')),
            start_time: matchDate.toISOString(),
            division: match.DivisionName,
            home_team_id: match.HomeTeamId || match.HomeTeam,
            home_team_name: match.HomeTeam,
            away_team_id: match.AwayTeamId || match.AwayTeam,
            away_team_name: match.AwayTeam,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating match:', createError);
          toast({
            title: "Error",
            description: `Failed to create match: ${createError.message}`,
            variant: "destructive",
          });
          return;
        }
        matchId = newMatch.id;
      }

      const { data: existingData, error: existingError } = await supabase
        .from('match_data_v2')
        .select('id')
        .eq('match_id', matchId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing match data:', existingError);
        toast({
          title: "Error",
          description: `Failed to check existing match data: ${existingError.message}`,
          variant: "destructive",
        });
        return;
      }

      const scoreData = {
        match_id: matchId,
        court_number: parseInt(match.PlayingAreaName.replace('Court ', '')),
        division: match.DivisionName,
        home_team_name: match.HomeTeam,
        away_team_name: match.AwayTeam,
        set1_home_score: matchScores.home[0],
        set1_away_score: matchScores.away[0],
        set2_home_score: matchScores.home[1],
        set2_away_score: matchScores.away[1],
        set3_home_score: matchScores.home[2],
        set3_away_score: matchScores.away[2],
        match_date: matchDate.toISOString(),
      };

      let upsertError;
      if (existingData) {
        console.log("Updating existing match data");
        const { error: updateError } = await supabase
          .from('match_data_v2')
          .update(scoreData)
          .eq('id', existingData.id);
        
        upsertError = updateError;
      } else {
        console.log("Inserting new match data");
        const { error: insertError } = await supabase
          .from('match_data_v2')
          .insert(scoreData);
        
        upsertError = insertError;
      }

      if (upsertError) {
        console.error('Error saving match scores:', upsertError);
        toast({
          title: "Error",
          description: `Failed to save match scores: ${upsertError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully saved match scores");
      toast({
        title: "Success",
        description: `Scores saved successfully for ${match.HomeTeam} vs ${match.AwayTeam}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error saving match scores:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the scores",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-volleyball-cream p-8">
        <div className="text-volleyball-black text-2xl text-center animate-pulse">
          Loading matches...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-cream">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-volleyball-black">Admin Dashboard</h1>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        </div>

        <MatchesTable
          matches={matches}
          scores={scores}
          onScoreChange={handleScoreChange}
          onSave={saveMatchScores}
        />
      </div>
    </div>
  );
};