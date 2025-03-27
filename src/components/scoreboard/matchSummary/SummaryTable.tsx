
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MatchSummary } from "@/services/db/types";
import { format, parseISO } from "date-fns";

interface SummaryTableProps {
  matches: MatchSummary[];
}

export const SummaryTable = ({ matches }: SummaryTableProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-36">Time</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead className="w-24 text-center">Set 1</TableHead>
            <TableHead className="w-24 text-center">Set 2</TableHead>
            <TableHead className="w-24 text-center">Set 3</TableHead>
            <TableHead className="w-28 text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No matches to display
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.fixtureTime || (match.timestamp ? format(parseISO(match.timestamp), 'HH:mm') : 'Unknown')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{match.homeTeam}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-semibold">{match.awayTeam}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    <span>{match.homeScores[0] || 0}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{match.awayScores[0] || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    <span>{match.homeScores[1] || 0}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{match.awayScores[1] || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col">
                    <span>{match.homeScores[2] || 0}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{match.awayScores[2] || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {match.pendingUpload ? (
                    <Badge variant="secondary" className={
                      match.status === 'failed' 
                        ? "bg-red-100 text-red-800" 
                        : match.status === 'processing' 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-yellow-100 text-yellow-800"
                    }>
                      {match.status === 'failed' ? 'Failed' : match.status === 'processing' ? 'Processing' : 'Pending Upload'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Saved
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
