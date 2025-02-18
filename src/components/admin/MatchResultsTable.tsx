
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatchResult {
  id: string;
  match_date: string;
  court_number: number;
  home_team_name: string;
  away_team_name: string;
  set1_home_score: number;
  set1_away_score: number;
  set2_home_score: number;
  set2_away_score: number;
  set3_home_score: number;
  set3_away_score: number;
  division: string;
}

export const MatchResultsTable = () => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["match-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_data_v2')
        .select('*')
        .order('match_date', { ascending: true })
        .order('court_number', { ascending: true });

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      return data as MatchResult[];
    },
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading match results...</div>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[100px]">Time</TableHead>
            <TableHead className="w-[80px]">Court</TableHead>
            <TableHead className="w-[200px]">Team 1</TableHead>
            <TableHead className="text-center">1st Set</TableHead>
            <TableHead className="text-center">2nd Set</TableHead>
            <TableHead className="text-center">3rd Set</TableHead>
            <TableHead className="w-[200px]">Team 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches?.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                {format(new Date(match.match_date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                {format(new Date(match.match_date), 'h:mmaa')}
              </TableCell>
              <TableCell>
                {match.court_number}
              </TableCell>
              <TableCell>{match.home_team_name}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1">
                  <span className="w-8 text-center">{match.set1_home_score}</span>
                  <span>-</span>
                  <span className="w-8 text-center">{match.set1_away_score}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1">
                  <span className="w-8 text-center">{match.set2_home_score}</span>
                  <span>-</span>
                  <span className="w-8 text-center">{match.set2_away_score}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1">
                  <span className="w-8 text-center">{match.set3_home_score}</span>
                  <span>-</span>
                  <span className="w-8 text-center">{match.set3_away_score}</span>
                </div>
              </TableCell>
              <TableCell>{match.away_team_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
