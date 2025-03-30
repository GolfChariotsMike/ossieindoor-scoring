
import { MatchSummary } from "@/services/db/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, parseISO } from "date-fns";

interface SummaryTableProps {
  matches: MatchSummary[];
}

export const SummaryTable = ({ matches }: SummaryTableProps) => {
  const formatTimeDisplay = (timeString?: string) => {
    if (!timeString) return "N/A";
    
    // If it's already just a time (e.g., "19:30"), return it
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // If it's an ISO date string, format it to time only
    try {
      const date = parseISO(timeString);
      if (isValid(date)) {
        return format(date, "HH:mm");
      }
    } catch (error) {
      console.error("Error parsing date:", timeString);
    }
    
    return timeString;
  };

  return (
    <div className="w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Time</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead className="text-center">Set 1</TableHead>
            <TableHead className="text-center">Set 2</TableHead>
            <TableHead className="text-center">Set 3</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id} className="border-b">
              <TableCell className="font-medium">
                {formatTimeDisplay(match.fixtureTime)}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">{match.homeTeam}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{match.awayTeam}</span>
                  </div>
                </div>
              </TableCell>
              {/* Set 1 Scores */}
              <TableCell className="text-center">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">{match.homeScores[0] || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{match.awayScores[0] || 0}</span>
                  </div>
                </div>
              </TableCell>
              {/* Set 2 Scores */}
              <TableCell className="text-center">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">{match.homeScores[1] || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{match.awayScores[1] || 0}</span>
                  </div>
                </div>
              </TableCell>
              {/* Set 3 Scores */}
              <TableCell className="text-center">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">{match.homeScores[2] || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{match.awayScores[2] || 0}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {match.pendingUpload ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Uploaded
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
