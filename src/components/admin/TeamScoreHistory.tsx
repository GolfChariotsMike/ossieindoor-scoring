
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

interface TeamScoreHistoryProps {
  teamId: string;
  onClose: () => void;
}

export const TeamScoreHistory = ({ teamId, onClose }: TeamScoreHistoryProps) => {
  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_data_v2")
        .select("*")
        .or(`home_team_name.eq.${team?.team_name},away_team_name.eq.${team?.team_name}`)
        .order("match_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!team,
  });

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Match History - {team?.team_name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading match history...</div>
        ) : (
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
                    <TableCell>{format(parseISO(match.match_date), "dd/MM/yyyy")}</TableCell>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
