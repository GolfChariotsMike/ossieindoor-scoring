import { useQuery } from "@tanstack/react-query";
import { format, parse, isBefore, startOfDay } from "date-fns";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { supabase } from "@/integrations/supabase/client";
import { Fixture } from "@/types/volleyball";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const UnscoredMatchesSection = () => {
  const navigate = useNavigate();
  const today = new Date();

  const { data: allMatches = [], isLoading } = useQuery({
    queryKey: ["all-matches"],
    queryFn: () => fetchMatchData(),
  });

  const { data: scoredMatches = [] } = useQuery({
    queryKey: ["scored-matches"],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches_v2')
        .select('match_code');
      return data || [];
    },
  });

  const scoredMatchCodes = new Set(scoredMatches.map(match => match.match_code));

  const unscoredPastMatches = allMatches.filter((match: Fixture) => {
    const matchDate = parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date());
    const matchCode = `${match.PlayingAreaName.replace('Court ', '')}-${format(matchDate, 'yyyyMMdd-HHmm')}`;
    return isBefore(matchDate, startOfDay(today)) && !scoredMatchCodes.has(matchCode);
  });

  if (isLoading) {
    return (
      <div className="animate-pulse text-center p-4">
        Loading unscored matches...
      </div>
    );
  }

  if (unscoredPastMatches.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800">
        All past matches have been scored! 🎉
      </div>
    );
  }

  const handleDateSelect = (date: string) => {
    const formattedDate = format(parse(date, 'dd/MM/yyyy HH:mm', new Date()), 'yyyy-MM-dd');
    navigate(`/admin?date=${formattedDate}`);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
      <h2 className="text-xl font-semibold text-yellow-800 mb-4">
        Unscored Past Matches ({unscoredPastMatches.length})
      </h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unscoredPastMatches.map((match: Fixture) => (
              <TableRow key={match.Id}>
                <TableCell>{match.DateTime.split(' ')[0]}</TableCell>
                <TableCell>{match.PlayingAreaName}</TableCell>
                <TableCell>
                  <div className="font-medium">{match.HomeTeam}</div>
                  <div className="text-gray-500">vs</div>
                  <div className="font-medium">{match.AwayTeam}</div>
                </TableCell>
                <TableCell>{match.DivisionName}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDateSelect(match.DateTime)}
                    variant="outline"
                    className="w-full"
                  >
                    Add Scores
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};