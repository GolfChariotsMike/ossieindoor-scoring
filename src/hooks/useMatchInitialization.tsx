import { useEffect } from "react";
import { Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";

export const useMatchInitialization = (
  courtId: string,
  fixture: Fixture | undefined,
  resetGameState: () => void
) => {
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", courtId, fixture?.Id],
    queryFn: async () => {
      console.log('Creating new match data for:', { courtId, fixtureId: fixture?.Id });
      
      if (fixture) {
        return {
          id: fixture.Id,
          court: parseInt(courtId),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId, name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId, name: fixture.AwayTeam },
        } as Match;
      }

      // For non-fixture matches, create a default match
      return {
        id: `court-${courtId}-${Date.now()}`,
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        division: "Default",
        homeTeam: { id: "team-a", name: "Team A" },
        awayTeam: { id: "team-b", name: "Team B" },
      } as Match;
    },
    staleTime: Infinity, // Prevent automatic refetching
  });

  useEffect(() => {
    if (fixture?.Id) {
      console.log('Match initialization - Fixture changed:', fixture.Id);
      resetGameState();
    }
  }, [fixture?.Id, resetGameState]);

  return { match, isLoading };
};