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
        if (fixture) {
          // Create a match from fixture data
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

          if (insertError) {
            console.error('Error creating match:', insertError);
            throw insertError;
          }

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

        // If no fixture, try to fetch existing match
        const { data: existingMatch, error: fetchError } = await supabase
          .from('matches')
          .select()
          .eq('court_number', parseInt(courtId))
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching match:', fetchError);
          throw fetchError;
        }

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

          if (createError) {
            console.error('Error creating default match:', createError);
            throw createError;
          }

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
          description: "There was a problem loading the match data. Creating a default match.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });
};