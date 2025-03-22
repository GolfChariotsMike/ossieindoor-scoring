
import { format } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MatchSummary } from "@/services/db/types";

interface SummaryTableProps {
  matches: MatchSummary[];
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
              <TableCell>{format(new Date(match.timestamp), "HH:mm")}</TableCell>
              <TableCell className="font-medium">{match.homeTeam}</TableCell>
              <TableCell className="text-center">
                {match.homeScores[0] || 0} - {match.awayScores[0] || 0}
              </TableCell>
              <TableCell className="text-center">
                {match.homeScores[1] || 0} - {match.awayScores[1] || 0}
              </TableCell>
              <TableCell className="text-center">
                {match.homeScores[2] || 0} - {match.awayScores[2] || 0}
              </TableCell>
              <TableCell className="font-medium">{match.awayTeam}</TableCell>
              <TableCell className="text-right">{match.status || 'Pending'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
