
import { format } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Match = {
  id: string;
  match_id: string;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  set1_home_score: number;
  set1_away_score: number;
  set2_home_score: number;
  set2_away_score: number;
  set3_home_score: number;
  set3_away_score: number;
  [key: string]: any;
};

interface SummaryTableProps {
  matches: Match[];
}

export const SummaryTable = ({ matches }: SummaryTableProps) => {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Time</TableHead>
            <TableHead>Home Team</TableHead>
            <TableHead className="text-center">Set 1</TableHead>
            <TableHead className="text-center">Set 2</TableHead>
            <TableHead className="text-center">Set 3</TableHead>
            <TableHead>Away Team</TableHead>
            <TableHead className="w-[100px] text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{format(new Date(match.match_date), "HH:mm")}</TableCell>
              <TableCell className="font-medium">{match.home_team_name}</TableCell>
              <TableCell className="text-center">{match.set1_home_score} - {match.set1_away_score}</TableCell>
              <TableCell className="text-center">{match.set2_home_score} - {match.set2_away_score}</TableCell>
              <TableCell className="text-center">{match.set3_home_score} - {match.set3_away_score}</TableCell>
              <TableCell className="font-medium">{match.away_team_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
