import { useEffect } from "react";
import { Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";

export const useMatchInitialization = (
  courtId: string,
  fixture: Fixture | undefined,
  resetGameState: () => void
) => {
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", courtId, fixture?.Id],
    queryFn: async () => {
      console.log('Fetching match data for:', { courtId, fixtureId: fixture?.Id });
      if (fixture) {
        // Pass selectedDate as undefined since it's optional
        const data = await fetchMatchData(courtId, undefined);
        return {
          id: fixture.Id,
          court: parseInt(courtId),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId, name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId, name: fixture.AwayTeam },
        } as Match;
      }
      const data = await fetchMatchData(courtId);
      if (Array.isArray(data)) {
        throw new Error("Invalid match data received");
      }
      return data as Match;
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