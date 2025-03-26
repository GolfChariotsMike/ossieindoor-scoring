
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MatchSummary } from "@/services/db/types";
import { getTeamName } from "./TeamNameUtils";
import { useEffect, useState } from "react";

interface SummaryTableProps {
  matches: MatchSummary[];
}

export const SummaryTable = ({ matches }: SummaryTableProps) => {
  const [matchesWithTeamNames, setMatchesWithTeamNames] = useState<MatchSummary[]>(matches);

  // Load team names when matches change
  useEffect(() => {
    const loadTeamNames = async () => {
      try {
        const updatedMatches = await Promise.all(
          matches.map(async (match) => {
            // Only try to fetch team names if they're not already set properly
            if (match.homeTeam === "Home Team" || match.awayTeam === "Away Team" || !match.homeTeam || !match.awayTeam) {
              const homeTeamName = await getTeamName(match.matchId, true);
              const awayTeamName = await getTeamName(match.matchId, false);
              
              return {
                ...match,
                homeTeam: homeTeamName || match.homeTeam || "Home Team",
                awayTeam: awayTeamName || match.awayTeam || "Away Team"
              };
            }
            return match;
          })
        );
        
        setMatchesWithTeamNames(updatedMatches);
      } catch (error) {
        console.error("Error loading team names:", error);
      }
    };

    loadTeamNames();
  }, [matches]);

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Time</TableHead>
          <TableHead>Home Team</TableHead>
          <TableHead className="text-center">Set 1</TableHead>
          <TableHead className="text-center">Set 2</TableHead>
          <TableHead className="text-center">Set 3</TableHead>
          <TableHead>Away Team</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matchesWithTeamNames.map((match) => (
          <TableRow key={match.id}>
            <TableCell className="font-mono">
              {match.fixtureTime || ""}
            </TableCell>
            <TableCell className="font-medium">{match.homeTeam}</TableCell>
            <TableCell className="text-center">
              {match.homeScores[0]} - {match.awayScores[0]}
            </TableCell>
            <TableCell className="text-center">
              {match.homeScores[1]} - {match.awayScores[1]}
            </TableCell>
            <TableCell className="text-center">
              {match.homeScores[2]} - {match.awayScores[2]}
            </TableCell>
            <TableCell>{match.awayTeam}</TableCell>
            <TableCell className="text-right">
              <span className={`px-2 py-1 rounded-full text-xs ${
                match.status === 'failed' 
                  ? 'bg-red-100 text-red-800' 
                  : match.pendingUpload 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {match.status === 'failed' ? 'failed' : match.pendingUpload ? 'pending' : 'uploaded'}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
