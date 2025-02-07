
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchTeam, setSearchTeam] = useState<string>("");

  // Fetch match progress data from the new view
  const { data: matchProgress = [], isLoading } = useQuery({
    queryKey: ["match-progress", selectedDay],
    queryFn: async () => {
      console.log('AdminDashboard: Fetching match progress data');
      const { data, error } = await supabase
        .from('match_progress_view')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('AdminDashboard: Error fetching match progress:', error);
        toast({
          title: "Error",
          description: "Failed to fetch match progress",
          variant: "destructive",
        });
        throw error;
      }

      console.log('AdminDashboard: Raw match progress data:', data);
      return data || [];
    },
  });

  const days = ["all", "Monday", "Tuesday", "Wednesday", "Thursday"];

  // Filter matches based on selected day and search term
  const filteredMatches = matchProgress
    .filter(match => {
      // First apply day filter
      if (selectedDay !== "all") {
        if (!match.start_time) {
          console.log('AdminDashboard: Match missing start_time:', match);
          return false;
        }
        
        try {
          const matchDate = parseISO(match.start_time);
          const dayMatch = format(matchDate, 'EEEE') === selectedDay;
          if (!dayMatch) return false;
        } catch (error) {
          console.error('AdminDashboard: Error parsing date for match:', match, error);
          return false;
        }
      }
      
      // Then apply team search filter if there's a search term
      if (searchTeam) {
        const searchLower = searchTeam.toLowerCase();
        return (
          match.home_team_name.toLowerCase().includes(searchLower) ||
          match.away_team_name.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

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
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Courts
              </Button>
              <h1 className="text-3xl font-bold text-volleyball-black">Match Progress Dashboard</h1>
              <div className="w-[120px]" />
            </div>

            <div className="w-full flex flex-col space-y-4">
              <div className="relative w-full max-w-sm mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by team name..."
                  value={searchTeam}
                  onChange={(e) => setSearchTeam(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedDay}>
                <TabsList className="w-full justify-start bg-volleyball-cream">
                  {days.map((day) => (
                    <TabsTrigger 
                      key={day} 
                      value={day}
                      className="data-[state=active]:bg-volleyball-black data-[state=active]:text-volleyball-cream"
                    >
                      {day === "all" ? "All Days" : day}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="text-center">Set 1</TableHead>
                <TableHead className="text-center">Set 2</TableHead>
                <TableHead className="text-center">Set 3</TableHead>
                <TableHead className="text-center">Points Summary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    {format(parseISO(match.start_time), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(match.start_time), 'EEEE')}
                  </TableCell>
                  <TableCell>Court {match.court_number}</TableCell>
                  <TableCell>{match.division || 'N/A'}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{match.home_team_name}</div>
                      <div className="text-gray-500">vs</div>
                      <div className="font-semibold">{match.away_team_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span>{match.set1_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set1_away_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span>{match.set2_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set2_away_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span>{match.set3_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set3_away_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {match.has_final_score && (
                      <div className="flex flex-col text-sm">
                        <div className="mb-1">
                          <span className="font-semibold">{match.home_team_name}:</span>
                          <div className="text-xs">
                            <div>Set Points: {match.home_total_match_points - (match.home_bonus_points || 0)}</div>
                            <div>Bonus Points: {match.home_bonus_points || 0}</div>
                            <div className="font-semibold">Total: {match.home_total_match_points}</div>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">{match.away_team_name}:</span>
                          <div className="text-xs">
                            <div>Set Points: {match.away_total_match_points - (match.away_bonus_points || 0)}</div>
                            <div>Bonus Points: {match.away_bonus_points || 0}</div>
                            <div className="font-semibold">Total: {match.away_total_match_points}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={match.has_final_score ? "default" : "secondary"}
                      className={match.has_final_score ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {match.has_final_score ? "Final Score Saved" : "Match In Progress"}
                    </Badge>
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

