import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const generateMatchCode = (courtId: string, fixture?: Fixture): string => {
  const now = fixture ? new Date(fixture.DateTime) : new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${month}${day}${hour}${minute}${courtId.padStart(3, '0')}`;
};

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId, fixture?.Id],
    queryFn: async () => {
      console.log('Fetching match data for:', { courtId, fixtureId: fixture?.Id });
      
      if (fixture) {
        const matchCode = generateMatchCode(courtId, fixture);
        
        // First, try to find an existing match
        const { data: existingMatch, error: findError } = await supabase
          .from('matches_v2')
          .select()
          .eq('match_code', matchCode)
          .maybeSingle();

        if (findError) {
          console.error('Error finding existing match:', findError);
          throw findError;
        }

        // If match exists, return it
        if (existingMatch) {
          console.log('Found existing match:', existingMatch);
          return {
            id: existingMatch.id,
            court: existingMatch.court_number,
            startTime: existingMatch.start_time,
            division: existingMatch.division,
            homeTeam: { id: existingMatch.home_team_id, name: existingMatch.home_team_name },
            awayTeam: { id: existingMatch.away_team_id, name: existingMatch.away_team_name },
          };
        }

        // If no match exists, create a new one
        const { data: matchData, error } = await supabase
          .from('matches_v2')
          .insert({
            match_code: matchCode,
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

        if (error) {
          console.error('Error creating match:', error);
          toast({
            title: "Error",
            description: "Failed to create match data",
            variant: "destructive",
          });
          throw error;
        }

        console.log('Created new match:', matchData);
        return {
          id: matchData.id,
          court: matchData.court_number,
          startTime: matchData.start_time,
          division: matchData.division,
          homeTeam: { id: matchData.home_team_id, name: matchData.home_team_name },
          awayTeam: { id: matchData.away_team_id, name: matchData.away_team_name },
        };
      }

      // For non-fixture matches, create a default match
      const matchCode = generateMatchCode(courtId);
      const { data: matchData, error } = await supabase
        .from('matches_v2')
        .insert({
          match_code: matchCode,
          court_number: parseInt(courtId),
          home_team_id: 'unknown',
          home_team_name: 'Team A',
          away_team_id: 'unknown',
          away_team_name: 'Team B',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default match:', error);
        throw error;
      }

      return {
        id: matchData.id,
        court: matchData.court_number,
        startTime: matchData.start_time,
        division: matchData.division,
        homeTeam: { id: matchData.home_team_id, name: matchData.home_team_name },
        awayTeam: { id: matchData.away_team_id, name: matchData.away_team_name },
      };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
  });
};