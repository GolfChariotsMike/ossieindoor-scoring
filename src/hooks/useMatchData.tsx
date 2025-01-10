import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";
import { supabase } from "@/integrations/supabase/client";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId, fixture?.HomeTeam, fixture?.AwayTeam],
    queryFn: async () => {
      try {
        console.log('Fetching match data for court:', courtId);
        
        // First try to find an active match for this court
        const { data: activeMatches, error } = await supabase
          .from('matches_v2')
          .select('*')
          .eq('court_number', parseInt(courtId))
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('Active matches found:', activeMatches);

        if (error) {
          throw error;
        }

        // If we found an active match, return it
        if (activeMatches && activeMatches.length > 0) {
          const match = activeMatches[0];
          return {
            id: match.id,
            court: match.court_number,
            startTime: match.start_time,
            division: match.division,
            homeTeam: {
              id: match.home_team_id,
              name: match.home_team_name
            },
            awayTeam: {
              id: match.away_team_id,
              name: match.away_team_name
            }
          } as Match;
        }

        // If no active match is found and we have a fixture, create a new one
        if (fixture) {
          const matchCode = generateMatchCode(courtId, fixture);
          console.log('No active match found, generating new match with code:', matchCode);
          
          const existingMatch = await findExistingMatch(matchCode);
          if (existingMatch) {
            return transformToMatch(existingMatch);
          }

          const newMatch = await createNewMatch(courtId, fixture, matchCode);
          return transformToMatch(newMatch);
        }

        // If no active match and no fixture, return null
        console.log('No active match or fixture found for court:', courtId);
        return null;

      } catch (error) {
        console.error('Error in useMatchData:', error);
        toast({
          title: "Error",
          description: "Failed to load match data",
          variant: "destructive",
        });
        throw error;
      }
    },
  });
};