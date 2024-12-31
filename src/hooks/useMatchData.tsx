import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  return useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (fixture) {
        const matchId = crypto.randomUUID();
        
        // First check if a match already exists for this court
        const { data: existingMatch, error: fetchError } = await supabase
          .from('matches')
          .select('*')
          .eq('court_number', parseInt(courtId))
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking existing match:', fetchError);
          throw fetchError;
        }

        // If match exists, return it
        if (existingMatch) {
          return {
            id: existingMatch.id,
            court: existingMatch.court_number,
            startTime: existingMatch.start_time,
            division: existingMatch.division,
            homeTeam: { 
              id: existingMatch.home_team_id, 
              name: existingMatch.home_team_name 
            },
            awayTeam: { 
              id: existingMatch.away_team_id, 
              name: existingMatch.away_team_name 
            },
          };
        }

        // If no match exists, create a new one
        const { data: matchData, error: insertError } = await supabase
          .from('matches')
          .insert({
            id: matchId,
            court_number: parseInt(courtId),
            start_time: fixture.DateTime,
            division: fixture.DivisionName,
            home_team_id: fixture.HomeTeamId || 'unknown',
            home_team_name: fixture.HomeTeam,
            away_team_id: fixture.AwayTeamId || 'unknown',
            away_team_name: fixture.AwayTeam,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating match:', insertError);
          throw insertError;
        }

        return {
          id: matchId,
          court: parseInt(courtId),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { 
            id: fixture.HomeTeamId || 'unknown', 
            name: fixture.HomeTeam 
          },
          awayTeam: { 
            id: fixture.AwayTeamId || 'unknown', 
            name: fixture.AwayTeam 
          },
        };
      }

      // If no fixture provided, try to fetch existing match
      const { data: existingMatch, error } = await supabase
        .from('matches')
        .select('*')
        .eq('court_number', parseInt(courtId))
        .order('created_at', { ascending: false })
        .single();

      if (error) {
        console.error('Error fetching match:', error);
        throw error;
      }

      if (!existingMatch) {
        throw new Error("No match found for this court");
      }

      return {
        id: existingMatch.id,
        court: existingMatch.court_number,
        startTime: existingMatch.start_time,
        division: existingMatch.division,
        homeTeam: { 
          id: existingMatch.home_team_id, 
          name: existingMatch.home_team_name 
        },
        awayTeam: { 
          id: existingMatch.away_team_id, 
          name: existingMatch.away_team_name 
        },
      };
    },
  });
};