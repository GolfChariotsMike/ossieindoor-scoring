
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
          
          const existingMatch = await findExistingMatch(matchCode);
          if (existingMatch) {
            console.log('Found existing match:', existingMatch);
            return transformToMatch(existingMatch);
          }

          console.log('Creating new match with fixture:', fixture);
          const newMatch = await createNewMatch(courtId, fixture, matchCode);
          return transformToMatch(newMatch);
        }

        // Handle case without fixture
        const matchCode = generateMatchCode(courtId);
        console.log('Generated match code for no fixture:', matchCode);
        const existingMatch = await findExistingMatch(matchCode);
        
        if (existingMatch) {
          console.log('Found existing match without fixture:', existingMatch);
          return transformToMatch(existingMatch);
        }

        console.log('Creating new match without fixture for court:', courtId);
        const newMatch = await createNewMatch(courtId);
        const transformedMatch = transformToMatch(newMatch);
        console.log('Created and transformed new match:', transformedMatch);
        return transformedMatch;

      } catch (error) {
        console.error('Error in useMatchData:', error);
        toast({
          title: "Error",
          description: "Failed to load match data. Using default match.",
          variant: "destructive",
        });

        // Return a default match as fallback
        return {
          id: `fallback-${courtId}-${Date.now()}`,
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: "team-1", name: "Team A" },
          awayTeam: { id: "team-2", name: "Team B" },
        };
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 60000, // Keep unused data in cache for 1 minute
  });
};
