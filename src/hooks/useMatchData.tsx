import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from '@supabase/auth-helpers-react';

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();
  const session = useSession();

  return useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      if (fixture) {
        const match: Match = {
          id: fixture.Id || crypto.randomUUID(),
          court: parseInt(courtId),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId || 'unknown', name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId || 'unknown', name: fixture.AwayTeam },
        };

        const { error } = await supabase
          .from('matches')
          .insert({
            id: match.id,
            court_number: match.court,
            start_time: match.startTime,
            division: match.division,
            home_team_id: match.homeTeam.id,
            home_team_name: match.homeTeam.name,
            away_team_id: match.awayTeam.id,
            away_team_name: match.awayTeam.name,
          });

        if (error) {
          console.error('Error creating match:', error);
          toast({
            title: "Error",
            description: "Failed to create match",
            variant: "destructive",
          });
          throw error;
        }

        return match;
      }

      const defaultMatch: Match = {
        id: crypto.randomUUID(),
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: 'unknown', name: 'Team A' },
        awayTeam: { id: 'unknown', name: 'Team B' },
      };

      const { error } = await supabase
        .from('matches')
        .insert({
          id: defaultMatch.id,
          court_number: defaultMatch.court,
          start_time: defaultMatch.startTime,
          home_team_id: defaultMatch.homeTeam.id,
          home_team_name: defaultMatch.homeTeam.name,
          away_team_id: defaultMatch.awayTeam.id,
          away_team_name: defaultMatch.awayTeam.name,
        });

      if (error) {
        console.error('Error creating default match:', error);
        toast({
          title: "Error",
          description: "Failed to create default match",
          variant: "destructive",
        });
        throw error;
      }

      return defaultMatch;
    },
  });
};