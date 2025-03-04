
import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";
import { findCachedMatch, createCachedMatch, ensureMatchCacheSchema } from "@/services/db/operations/matchCacheOperations";

// Ensure the match cache schema is set up when this module loads
ensureMatchCacheSchema();

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId, fixture?.HomeTeam, fixture?.AwayTeam],
    queryFn: async () => {
      try {
        // Generate the match code
        const matchCode = generateMatchCode(courtId, fixture);
        console.log('Generated match code:', matchCode);
        
        // First, try to find the match in local cache
        const cachedMatch = await findCachedMatch(matchCode);
        if (cachedMatch) {
          console.log('Found cached match in local storage:', cachedMatch);
          return transformToMatch(cachedMatch);
        }
        
        // If not in cache and we're online, try Supabase
        if (navigator.onLine) {
          try {
            const existingMatch = await findExistingMatch(matchCode);
            if (existingMatch) {
              console.log('Found existing match in Supabase:', existingMatch);
              return transformToMatch(existingMatch);
            }
          } catch (error) {
            console.error('Error checking Supabase for match:', error);
            // Continue to local creation
          }
        }

        // If not found online or we're offline, create locally
        console.log(navigator.onLine ? 'Creating new match locally:' : 'Offline - Creating match locally:', fixture);
        const newMatch = await createCachedMatch(courtId, fixture, matchCode);
        
        // If we're online, also try to save to Supabase (but don't wait for it)
        if (navigator.onLine) {
          createNewMatch(courtId, fixture, matchCode)
            .then(serverMatch => {
              console.log('Successfully created match in Supabase as well:', serverMatch);
            })
            .catch(error => {
              console.error('Failed to create match in Supabase, but local match was created:', error);
            });
        }
        
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
          homeTeam: { id: "team-1", name: fixture?.HomeTeam || "Team A" },
          awayTeam: { id: "team-2", name: fixture?.AwayTeam || "Team B" },
          division: fixture?.DivisionName
        };
      }
    },
    retry: 2,             // Retry failed requests up to 2 times
    staleTime: 30000,     // Consider data fresh for 30 seconds
    gcTime: 60000,        // Keep unused data in garbage collection for 1 minute
  });
};
