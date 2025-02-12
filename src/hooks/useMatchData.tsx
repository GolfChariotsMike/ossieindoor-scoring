
import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId, fixture?.HomeTeam, fixture?.AwayTeam],
    queryFn: async () => {
      try {
        if (fixture) {
          const matchCode = generateMatchCode(courtId, fixture);
          console.log('Generated match code:', matchCode);
          
          try {
            const existingMatch = await findExistingMatch(matchCode);
            if (existingMatch) {
              return transformToMatch(existingMatch);
            }
          } catch (error) {
            console.error('Error checking existing match:', error);
            // Don't throw here, try to create new match instead
          }

          try {
            const newMatch = await createNewMatch(courtId, fixture, matchCode);
            return transformToMatch(newMatch);
          } catch (error) {
            console.error('Error creating new match:', error);
            // If both operations fail, return a fallback match
            return {
              id: matchCode,
              court: parseInt(courtId),
              startTime: fixture.DateTime,
              division: fixture.DivisionName,
              homeTeam: { id: fixture.HomeTeamId, name: fixture.HomeTeam },
              awayTeam: { id: fixture.AwayTeamId, name: fixture.AwayTeam },
            };
          }
        }

        // Handle case without fixture
        const matchCode = generateMatchCode(courtId);
        try {
          const existingMatch = await findExistingMatch(matchCode);
          if (existingMatch) {
            return transformToMatch(existingMatch);
          }
        } catch (error) {
          console.error('Error checking existing match without fixture:', error);
        }

        try {
          const newMatch = await createNewMatch(courtId);
          return transformToMatch(newMatch);
        } catch (error) {
          console.error('Error creating new match without fixture:', error);
          // Return fallback match data
          return {
            id: matchCode,
            court: parseInt(courtId),
            startTime: new Date().toISOString(),
            homeTeam: { id: "team-1", name: "Team A" },
            awayTeam: { id: "team-2", name: "Team B" },
          };
        }
      } catch (error) {
        console.error('Error in useMatchData:', error);
        toast({
          title: "Network Error",
          description: "Having trouble connecting to the server. Using offline mode.",
          variant: "destructive",
        });

        // Return fallback match data
        return {
          id: fixture ? generateMatchCode(courtId, fixture) : generateMatchCode(courtId),
          court: parseInt(courtId),
          startTime: fixture ? fixture.DateTime : new Date().toISOString(),
          division: fixture?.DivisionName,
          homeTeam: { 
            id: fixture?.HomeTeamId || "team-1", 
            name: fixture?.HomeTeam || "Team A" 
          },
          awayTeam: { 
            id: fixture?.AwayTeamId || "team-2", 
            name: fixture?.AwayTeam || "Team B" 
          },
        };
      }
    },
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
