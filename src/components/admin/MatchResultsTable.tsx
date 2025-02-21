
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

      return data as MatchResult[];
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

  // Group matches by date
  const groupedMatches = matches?.reduce((groups, match) => {
    const date = formatDate(match.fixture_start_time || match.match_date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {} as Record<string, MatchResult[]>);

  // Sort dates in reverse chronological order (newest first)
  const sortedDates = Object.keys(groupedMatches || {}).sort((a, b) => {
    const dateA = parseISO(a.split('/').reverse().join('-'));
    const dateB = parseISO(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  // Sort matches within each date group by time and court
  sortedDates.forEach(date => {
    groupedMatches![date].sort((a, b) => {
      const timeA = a.fixture_start_time ? new Date(a.fixture_start_time) : new Date(a.match_date);
      const timeB = b.fixture_start_time ? new Date(b.fixture_start_time) : new Date(b.match_date);
      const timeCompare = timeA.getTime() - timeB.getTime();
      if (timeCompare !== 0) return timeCompare;
      return a.court_number - b.court_number;
    });
  });

  return (
    <div className="rounded-lg border bg-card space-y-6">
      {sortedDates.map(date => (
        <div key={date} className="space-y-2">
          <h2 className="text-lg font-semibold px-4">{date}</h2>
          <Table>
            <TableHeader>
              <TableRow>
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
              {groupedMatches![date].map((match) => (
                <TableRow key={match.id}>
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
      ))}
    </div>
  );
};
