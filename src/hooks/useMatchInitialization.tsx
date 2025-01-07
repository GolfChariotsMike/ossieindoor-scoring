import { useEffect } from "react";
import { useMatchData } from "./useMatchData";
import { Fixture } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";

export const useMatchInitialization = (
  courtId: string, 
  fixture: Fixture | undefined,
  resetGameState: () => void,
) => {
  const { data: match, isLoading, refetch } = useMatchData(courtId, fixture);

  // Reset game state and refetch match data when fixture changes
  useEffect(() => {
    console.log('Match initialization - Fixture changed:', fixture?.Id);
    
    // Force a complete reset of the game state
    resetGameState();
    
    if (fixture?.Id) {
      // Force refetch of match data
      refetch().then(() => {
        console.log('Match data refreshed for fixture:', fixture.Id);
        toast({
          title: "Match Started",
          description: `${fixture.HomeTeam} vs ${fixture.AwayTeam}`,
        });
      }).catch(error => {
        console.error('Error refreshing match data:', error);
        toast({
          title: "Error",
          description: "Failed to load match data",
          variant: "destructive",
        });
      });
    }
  }, [fixture?.Id, resetGameState, refetch, fixture]);

  return { match, isLoading, refetch };
};