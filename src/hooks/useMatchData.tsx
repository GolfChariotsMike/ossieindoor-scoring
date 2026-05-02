
import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { useToast } from "@/hooks/use-toast";
import { findExistingMatch, createNewMatch, transformToMatch } from "@/services/matchService";
import { generateMatchCode } from "@/utils/matchCodeGenerator";
import { findCachedMatch, createCachedMatch, ensureMatchCacheSchema } from "@/services/db/operations/matchCacheOperations";
import { resetConnection } from "@/services/db/connection";
import { isOffline } from "@/utils/offlineMode";

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
        
        // First, try to find the match in local cache
        try {
          const cachedMatch = await findCachedMatch(matchCode);
          if (cachedMatch) {
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
        
        // If not in cache and we're not in offline mode, try Supabase
        if (!isOffline()) {
          try {
            const existingMatch = await findExistingMatch(matchCode);
            if (existingMatch) {
              
              // Try to cache the Supabase match locally for future offline use
              try {
                await createCachedMatch(courtId, fixture, matchCode);
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
        
        
        const transformedMatch = transformToMatch(newMatch);
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
