import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (fixture) {
        const matchId = crypto.randomUUID();
        
        const { data: matchData, error } = await supabase
          .from('matches')
          .upsert({
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
          .maybeSingle();

        if (error) {
          console.error('Error creating match:', error);
          toast({
            title: "Error",
            description: "Failed to create match data",
            variant: "destructive",
          });
          throw error;
        }

        return {
          id: matchId,
          court: parseInt(courtId),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId || 'unknown', name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId || 'unknown', name: fixture.AwayTeam },
        };
      }

      const { data: existingMatch, error } = await supabase
        .from('matches')
        .select()
        .eq('court_number', parseInt(courtId))
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching match:', error);
        toast({
          title: "Error",
          description: "Failed to fetch match data",
          variant: "destructive",
        });
        throw error;
      }

      if (!existingMatch) {
        return {
          id: crypto.randomUUID(),
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: 'unknown', name: 'Team A' },
          awayTeam: { id: 'unknown', name: 'Team B' },
        };
      }

      return {
        id: existingMatch.id,
        court: existingMatch.court_number,
        startTime: existingMatch.start_time,
        division: existingMatch.division,
        homeTeam: { id: existingMatch.home_team_id, name: existingMatch.home_team_name },
        awayTeam: { id: existingMatch.away_team_id, name: existingMatch.away_team_name },
      };
    },
  });
};