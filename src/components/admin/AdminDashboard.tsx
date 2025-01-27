import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fixture } from "@/types/volleyball";
import { Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatchScores {
  [key: string]: {
    home: number[];
    away: number[];
  };
}

export const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const [scores, setScores] = useState<MatchScores>({});

  const { data: matchesData = [], isLoading } = useQuery({
    queryKey: ["matches", selectedDate],
    queryFn: () => fetchMatchData(undefined, parse(selectedDate, 'yyyy-MM-dd', new Date())),
  });

  const matches = Array.isArray(matchesData) ? matchesData : [];

  const handleScoreChange = (matchId: string, team: 'home' | 'away', setIndex: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [matchId]: {
        home: team === 'home' 
          ? Object.assign([...prev[matchId]?.home || [0, 0, 0]], { [setIndex]: numValue })
          : [...prev[matchId]?.home || [0, 0, 0]],
        away: team === 'away'
          ? Object.assign([...prev[matchId]?.away || [0, 0, 0]], { [setIndex]: numValue })
          : [...prev[matchId]?.away || [0, 0, 0]],
      }
    }));
  };

  const saveMatchScores = async (match: Fixture) => {
    if (!scores[match.Id]) {
      toast({
        title: "No changes",
        description: "No scores have been modified for this match",
      });
      return;
    }

    const matchScores = scores[match.Id];

    try {
      const { error } = await supabase
        .from('match_data_v2')
        .upsert({
          match_id: match.Id,
          court_number: parseInt(match.PlayingAreaName.replace('Court ', '')),
          division: match.DivisionName,
          home_team_name: match.HomeTeam,
          away_team_name: match.AwayTeam,
          set1_home_score: matchScores.home[0],
          set1_away_score: matchScores.away[0],
          set2_home_score: matchScores.home[1],
          set2_away_score: matchScores.away[1],
          set3_home_score: matchScores.home[2],
          set3_away_score: matchScores.away[2],
          match_date: match.DateTime,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Match scores have been saved",
      });
    } catch (error) {
      console.error('Error saving match scores:', error);
      toast({
        title: "Error",
        description: "Failed to save match scores",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-volleyball-cream p-8">
        <div className="text-volleyball-black text-2xl text-center animate-pulse">
          Loading matches...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-cream">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-volleyball-black">Admin Dashboard</h1>
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-2">
              <Calendar className="text-volleyball-red h-5 w-5" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Teams</TableHead>
                <TableHead className="w-[120px]">Court</TableHead>
                <TableHead className="w-[120px]">Division</TableHead>
                <TableHead className="w-[120px]">Time</TableHead>
                <TableHead className="text-center">Set 1</TableHead>
                <TableHead className="text-center">Set 2</TableHead>
                <TableHead className="text-center">Set 3</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match: Fixture) => (
                <TableRow key={match.Id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="font-semibold">{match.HomeTeam}</div>
                    <div className="text-gray-500">vs</div>
                    <div className="font-semibold">{match.AwayTeam}</div>
                  </TableCell>
                  <TableCell>{match.PlayingAreaName}</TableCell>
                  <TableCell>{match.DivisionName}</TableCell>
                  <TableCell>
                    {format(parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date()), 'h:mm a')}
                  </TableCell>
                  {[0, 1, 2].map((setIndex) => (
                    <TableCell key={setIndex} className="text-center">
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="number"
                          min="0"
                          value={scores[match.Id]?.home[setIndex] || 0}
                          onChange={(e) => handleScoreChange(match.Id, 'home', setIndex, e.target.value)}
                          className="text-center w-16 mx-auto"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={scores[match.Id]?.away[setIndex] || 0}
                          onChange={(e) => handleScoreChange(match.Id, 'away', setIndex, e.target.value)}
                          className="text-center w-16 mx-auto"
                        />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      onClick={() => saveMatchScores(match)}
                      className="w-full bg-volleyball-red hover:bg-volleyball-red/90 text-white"
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};