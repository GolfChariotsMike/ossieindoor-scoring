
import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/hooks/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";
import { findCachedMatch, createCachedMatch, ensureMatchCacheSchema } from "@/services/db/operations/matchCacheOperations";
import { resetConnection } from "@/services/db/connection";

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
        try {
          const cachedMatch = await findCachedMatch(matchCode);
          if (cachedMatch) {
            console.log('Found cached match in local storage:', cachedMatch);
            return transformToMatch(cachedMatch);
          }
        } catch (cacheError) {
          console.error('Error checking local cache for match:', cacheError);
          // Try to reset the connection for next operations
          try {
            await resetConnection();
          } catch (resetError) {
            console.error('Failed to reset connection:', resetError);
          }
        }
        
        // If not in cache and we're online, try Supabase
        if (navigator.onLine) {
          try {
            const existingMatch = await findExistingMatch(matchCode);
            if (existingMatch) {
              console.log('Found existing match in Supabase:', existingMatch);
              
              // Try to cache the Supabase match locally for future offline use
              try {
                await createCachedMatch(courtId, fixture, matchCode);
                console.log('Cached Supabase match locally');
              } catch (cachingError) {
                console.error('Failed to cache Supabase match locally:', cachingError);
              }
              
              return transformToMatch(existingMatch);
            }
          } catch (supabaseError) {
            console.error('Error checking Supabase for match:', supabaseError);
            // Continue to local creation
          }
        }

        // If not found online or we're offline, create locally
        console.log(navigator.onLine ? 'Creating new match locally:' : 'Offline - Creating match locally:', fixture);
        
        let newMatch;
        try {
          newMatch = await createCachedMatch(courtId, fixture, matchCode);
        } catch (createError) {
          console.error('Failed to create match in local cache:', createError);
          // Create a fallback match object directly
          newMatch = {
            id: `fallback-${courtId}-${Date.now()}`,
            court_number: parseInt(courtId),
            start_time: new Date().toISOString(),
            home_team_id: fixture?.HomeTeamId || 'unknown',
            home_team_name: fixture?.HomeTeam || 'Team A',
            away_team_id: fixture?.AwayTeamId || 'unknown',
            away_team_name: fixture?.AwayTeam || 'Team B',
            division: fixture?.DivisionName || 'Unknown',
            isLocal: true,
            isFallback: true
          };
        }
        
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
          division: fixture?.DivisionName || "Unknown"
        };
      }
    },
    retry: 2,             // Retry failed requests up to 2 times
    staleTime: 30000,     // Consider data fresh for 30 seconds
    gcTime: 60000,        // Keep unused data in garbage collection for 1 minute
  });
};
