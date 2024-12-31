import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      try {
        // If we have a fixture, check for existing match or create new one
        if (fixture) {
          const { data: existingMatch, error: fetchError } = await supabase
            .from('matches')
            .select()
            .eq('court_number', parseInt(courtId))
            .maybeSingle();

          if (fetchError) throw fetchError;

          // If match exists for this court, return it
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
            } as Match;
          }

          // Create new match from fixture
          const { data: newMatch, error: insertError } = await supabase
            .from('matches')
            .insert({
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

          if (insertError) throw insertError;

          return {
            id: newMatch.id,
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
          } as Match;
        }

        // Try to fetch existing match
        const { data: existingMatch, error: fetchError } = await supabase
          .from('matches')
          .select()
          .eq('court_number', parseInt(courtId))
          .maybeSingle();

        if (fetchError) throw fetchError;

        // If no match exists, create a default one
        if (!existingMatch) {
          const { data: defaultMatch, error: createError } = await supabase
            .from('matches')
            .insert({
              court_number: parseInt(courtId),
              home_team_id: 'default',
              home_team_name: 'Team A',
              away_team_id: 'default',
              away_team_name: 'Team B',
              start_time: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) throw createError;

          return {
            id: defaultMatch.id,
            court: defaultMatch.court_number,
            startTime: defaultMatch.start_time,
            division: defaultMatch.division,
            homeTeam: {
              id: defaultMatch.home_team_id,
              name: defaultMatch.home_team_name
            },
            awayTeam: {
              id: defaultMatch.away_team_id,
              name: defaultMatch.away_team_name
            },
          } as Match;
        }

        // Return existing match
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
        } as Match;
      } catch (error) {
        console.error('Error in useMatchData:', error);
        toast({
          title: "Error loading match",
          description: "There was a problem loading the match data",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
};