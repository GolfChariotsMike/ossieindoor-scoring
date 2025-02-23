
import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId, fixture?.Id], // Changed to use fixture.Id instead of team names
    queryFn: async () => {
      try {
        console.log('useMatchData - Starting match data fetch:', { courtId, fixture });

        // Generate match code based on whether we have a fixture
        const matchCode = generateMatchCode(courtId, fixture);
        console.log('Generated match code:', matchCode);
        
        // Try to find existing match first
        const existingMatch = await findExistingMatch(matchCode);
        if (existingMatch) {
          console.log('Found existing match:', existingMatch);
          return transformToMatch(existingMatch);
        }

        // If we have a fixture, create match with fixture data
        if (fixture) {
          console.log('Creating new match with fixture:', fixture);
          const newMatch = await createNewMatch(courtId, fixture, matchCode);
          console.log('Created new match with fixture:', newMatch);
          return transformToMatch(newMatch);
        }

        // Handle case without fixture
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
        const fallbackMatch = {
          id: `fallback-${courtId}-${Date.now()}`,
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: "team-1", name: "Team A" },
          awayTeam: { id: "team-2", name: "Team B" },
        } as Match;

        console.log('Returning fallback match:', fallbackMatch);
        return fallbackMatch;
      }
    },
    retry: false, // Disable retries to prevent multiple attempts with invalid data
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep unused data for 1 minute
  });
};
