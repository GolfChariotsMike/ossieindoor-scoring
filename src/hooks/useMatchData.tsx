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
            return transformToMatch(existingMatch);
          }

          const newMatch = await createNewMatch(courtId, fixture, matchCode);
          return transformToMatch(newMatch);
        }

        // Handle case without fixture
        const matchCode = generateMatchCode(courtId);
        const existingMatch = await findExistingMatch(matchCode);
        
        if (existingMatch) {
          return transformToMatch(existingMatch);
        }

        const newMatch = await createNewMatch(courtId);
        return transformToMatch(newMatch);

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