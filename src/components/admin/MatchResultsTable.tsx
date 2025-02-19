
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
  match_id: string;
  match_date: string;
  fixture_start_time: string | null;
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
        .select(`
          id,
          match_id,
          match_date,
          fixture_start_time,
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
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      // Sort matches by fixture date and court number
      const sortedMatches = data?.sort((a, b) => {
        // First sort by fixture date
        const dateA = a.fixture_start_time ? new Date(a.fixture_start_time) : new Date(a.match_date);
        const dateB = b.fixture_start_time ? new Date(b.fixture_start_time) : new Date(b.match_date);
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
        // Then by court number
        return a.court_number - b.court_number;
      });

      return sortedMatches as MatchResult[];
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
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
      return format(date, 'h:mmaa').toLowerCase();
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
          {matches?.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                {formatDate(match.fixture_start_time || match.match_date)}
              </TableCell>
              <TableCell>
                {formatTime(match.fixture_start_time || match.match_date)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
