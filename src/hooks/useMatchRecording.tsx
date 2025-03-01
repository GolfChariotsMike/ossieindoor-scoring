
import { Match, Fixture } from "@/types/volleyball";
import { toast } from "@/hooks/use-toast";

export const useMatchRecording = (isTeamsSwitched: boolean) => {
  const generateTeamId = (teamName: string) => {
    return `team_${teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  };

  return { generateTeamId };
};
