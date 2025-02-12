
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface TeamScoreHistoryProps {
  teamId: string;
  onClose: () => void;
}

export const TeamScoreHistory = ({ teamId, onClose }: TeamScoreHistoryProps) => {
  const { toast } = useToast();

  const { data: team, isError: isTeamError } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      console.log('TeamScoreHistory: Fetching team data for ID:', teamId);
      const { data, error } = await supabase
        .from("teams")
        .select("*, division:divisions(*)")
        .eq("id", teamId)
        .maybeSingle();
      
      if (error) {
        console.error('TeamScoreHistory: Error fetching team:', error);
        throw error;
      }

      if (!data) {
        console.log('TeamScoreHistory: No team found for ID:', teamId);
        toast({
          title: "Team not found",
          description: "The selected team could not be found.",
          variant: "destructive",
        });
        onClose();
        return null;
      }
      
      console.log('TeamScoreHistory: Found team:', data);
      return data;
    },
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      if (!team?.division?.name) {
        console.log('TeamScoreHistory: No division found for team');
        return [];
      }

      console.log('TeamScoreHistory: Fetching matches for team:', team.team_name, 'in division:', team.division.name);
      const { data, error } = await supabase
        .from("match_data_v2")
        .select("*")
        .eq("division", team.division.name)
        .or(`home_team_name.eq.${team.team_name},away_team_name.eq.${team.team_name}`)
        .order("match_date", { ascending: false });
      
      if (error) {
        console.error('TeamScoreHistory: Error fetching matches:', error);
        throw error;
      }

      console.log('TeamScoreHistory: Found matches:', data);
      return data;
    },
    enabled: !!team?.division?.name,
  });

  if (isTeamError) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Match History - {team?.team_name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading match history...</div>
        ) : matches.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="text-center">Set 1</TableHead>
                <TableHead className="text-center">Set 2</TableHead>
                <TableHead className="text-center">Set 3</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead className="text-center">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                const isHomeTeam = match.home_team_name === team?.team_name;
                const result = isHomeTeam ? match.home_result : match.away_result;
                const points = isHomeTeam ? match.home_total_match_points : match.away_total_match_points;
                
                return (
                  <TableRow key={match.id}>
                    <TableCell>
                      {format(new Date(match.match_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className={isHomeTeam ? "font-bold" : ""}>
                        {match.home_team_name}
                      </div>
                      <div className="text-gray-500">vs</div>
                      <div className={!isHomeTeam ? "font-bold" : ""}>
                        {match.away_team_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {match.set1_home_score} - {match.set1_away_score}
                    </TableCell>
                    <TableCell className="text-center">
                      {match.set2_home_score} - {match.set2_away_score}
                    </TableCell>
                    <TableCell className="text-center">
                      {match.set3_home_score} - {match.set3_away_score}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {result}
                    </TableCell>
                    <TableCell className="text-center">
                      {points}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No match history found for this team.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
