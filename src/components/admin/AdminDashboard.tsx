import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fixture } from "@/types/volleyball";

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

  // Ensure matches is always an array
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
      <div className="min-h-screen bg-volleyball-red p-8">
        <div className="text-white text-2xl text-center">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-red p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <div className="mb-6">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        <div className="space-y-6">
          {matches.map((match: Fixture) => (
            <div key={match.Id} className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {match.HomeTeam} vs {match.AwayTeam}
                  </h3>
                  <p className="text-gray-600">
                    {match.PlayingAreaName} - {match.DivisionName}
                  </p>
                  <p className="text-gray-600">
                    {format(parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date()), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="font-semibold">Set</div>
                <div className="font-semibold">{match.HomeTeam}</div>
                <div className="font-semibold">{match.AwayTeam}</div>
                <div></div>

                {[0, 1, 2].map((setIndex) => (
                  <div key={setIndex} className="contents">
                    <div className="flex items-center">Set {setIndex + 1}</div>
                    <Input
                      type="number"
                      min="0"
                      value={scores[match.Id]?.home[setIndex] || 0}
                      onChange={(e) => handleScoreChange(match.Id, 'home', setIndex, e.target.value)}
                      className="text-center"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={scores[match.Id]?.away[setIndex] || 0}
                      onChange={(e) => handleScoreChange(match.Id, 'away', setIndex, e.target.value)}
                      className="text-center"
                    />
                    <div></div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => saveMatchScores(match)}
                className="bg-volleyball-black hover:bg-volleyball-black/90"
              >
                Save Scores
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};