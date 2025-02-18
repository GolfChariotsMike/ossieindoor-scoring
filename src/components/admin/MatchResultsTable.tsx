
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
  fixture_date: string;
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
          court_number,
          home_team_name,
          away_team_name,
          set1_home_score,
          set1_away_score,
          set2_home_score,
          set2_away_score,
          set3_home_score,
          set3_away_score,
          division,
          matches_v2!match_data_v2_match_id_fkey (
            start_time,
            match_code
          )
        `)
        .eq('is_active', true)
        .not('matches_v2.start_time', 'is', null)
        .order('matches_v2.start_time', { ascending: true })  // Order by fixture time instead
        .order('court_number', { ascending: true });

      if (error) {
        console.error('Error fetching match results:', error);
        throw error;
      }

      // Transform and log each match for debugging
      const transformedData = data?.map(match => {
        const result = {
          ...match,
          fixture_date: match.matches_v2?.start_time
        };
        
        console.log('Match data:', {
          id: match.id,
          match_code: match.matches_v2?.match_code,
          recorded_date: match.match_date,
          fixture_date: match.matches_v2?.start_time,
          time_difference_minutes: match.match_date && match.matches_v2?.start_time ? 
            Math.round((new Date(match.match_date).getTime() - new Date(match.matches_v2.start_time).getTime()) / (1000 * 60))
            : null
        });
        
        return result;
      });

      const validMatches = transformedData?.filter(match => match.fixture_date);

      return validMatches as MatchResult[];
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
                {formatDate(match.fixture_date)}
              </TableCell>
              <TableCell>
                {formatTime(match.fixture_date)}
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
