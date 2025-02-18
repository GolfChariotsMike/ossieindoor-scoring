
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
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
  start_time: string;
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
        .from('matches_v2')
        .select(`
          id,
          start_time,
          court_number,
          home_team_name,
          away_team_name,
          set1_home_score,
          set1_away_score,
          set2_home_score,
          set2_away_score,
          set3_home_score,
          set3_away_score,
          division
        `)
        .order('start_time', { ascending: true })
        .order('court_number', { ascending: true });

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      return data as MatchResult[];
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      // Use parseISO instead of new Date() for more reliable ISO date parsing
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mmaa');
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return '';
    }
  };

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
            <TableHead className="w-[200px]">Team A</TableHead>
            <TableHead className="text-center px-1">1st</TableHead>
            <TableHead className="text-center px-1">2nd</TableHead>
            <TableHead className="text-center px-1">3rd</TableHead>
            <TableHead className="w-[100px]"></TableHead>
            <TableHead className="text-center px-1">1st</TableHead>
            <TableHead className="text-center px-1">2nd</TableHead>
            <TableHead className="text-center px-1">3rd</TableHead>
            <TableHead className="w-[200px]">Team B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches?.map((match) => {
            console.log('Match start_time:', match.start_time); // Debug log
            return (
              <TableRow key={match.id}>
                <TableCell>
                  {formatDate(match.start_time)}
                </TableCell>
                <TableCell>
                  {formatTime(match.start_time)}
                </TableCell>
                <TableCell>
                  {match.court_number}
                </TableCell>
                <TableCell>{match.home_team_name}</TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set1_home_score}</span>
                </TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set2_home_score}</span>
                </TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set3_home_score}</span>
                </TableCell>
                <TableCell className="w-[100px]"></TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set1_away_score}</span>
                </TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set2_away_score}</span>
                </TableCell>
                <TableCell className="text-center px-1">
                  <span className="w-6 text-center">{match.set3_away_score}</span>
                </TableCell>
                <TableCell>{match.away_team_name}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
