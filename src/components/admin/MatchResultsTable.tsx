
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isValid } from "date-fns";
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

interface GroupedMatches {
  [key: string]: MatchResult[];
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
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '';
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'h:mmaa').toLowerCase() : '';
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return '';
    }
  };

  const groupMatchesByDay = (matches: MatchResult[] | undefined): GroupedMatches => {
    if (!matches) return {};

    const grouped = matches.reduce((acc: GroupedMatches, match) => {
      const dateString = formatDate(match.fixture_start_time || match.match_date);
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(match);
      return acc;
    }, {});

    // Sort matches within each day by time and court number
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = new Date(a.fixture_start_time || a.match_date).getTime();
        const timeB = new Date(b.fixture_start_time || b.match_date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.court_number - b.court_number;
      });
    });

    return grouped;
  };

  const groupedMatches = groupMatchesByDay(matches);
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => {
    const dateA = parseISO(a.split('/').reverse().join('-'));
    const dateB = parseISO(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading match results...</div>;
  }

  return (
    <div className="space-y-8">
      {sortedDates.map(date => (
        <div key={date} className="rounded-lg border bg-card">
          <div className="px-4 py-2 font-semibold text-lg border-b">
            {date}
          </div>
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
              {groupedMatches[date].map((match) => (
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
