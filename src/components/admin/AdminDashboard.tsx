
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreInput } from "./ScoreInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MatchScore {
  set1_home_score: number;
  set1_away_score: number;
  set2_home_score: number;
  set2_away_score: number;
  set3_home_score: number;
  set3_away_score: number;
}

export const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchTeam, setSearchTeam] = useState<string>("");
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editedScores, setEditedScores] = useState<MatchScore | null>(null);

  // Fetch match progress data from the view
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

  // Mutation for updating scores
  const updateScoresMutation = useMutation({
    mutationFn: async (variables: { matchId: string; scores: MatchScore }) => {
      const { data, error } = await supabase
        .from('match_data_v2')
        .upsert({
          match_id: variables.matchId,
          ...variables.scores,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-progress"] });
      toast({
        title: "Success",
        description: "Match scores updated successfully",
      });
      setEditingMatchId(null);
      setEditedScores(null);
    },
    onError: (error) => {
      console.error('Error updating scores:', error);
      toast({
        title: "Error",
        description: "Failed to update match scores",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (match: any) => {
    setEditingMatchId(match.id);
    setEditedScores({
      set1_home_score: match.set1_home_score || 0,
      set1_away_score: match.set1_away_score || 0,
      set2_home_score: match.set2_home_score || 0,
      set2_away_score: match.set2_away_score || 0,
      set3_home_score: match.set3_home_score || 0,
      set3_away_score: match.set3_away_score || 0,
    });
  };

  const handleScoreChange = (setNumber: 1 | 2 | 3, team: 'home' | 'away', value: number) => {
    if (!editedScores) return;
    
    setEditedScores({
      ...editedScores,
      [`set${setNumber}_${team}_score`]: value,
    });
  };

  const handleSaveClick = (matchId: string) => {
    if (!editedScores) return;
    updateScoresMutation.mutate({ matchId, scores: editedScores });
  };

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
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                    <div className="flex flex-col space-y-2">
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set1_home_score || 0 : match.set1_home_score || 0}
                        onChange={(value) => handleScoreChange(1, 'home', value)}
                        isEditing={editingMatchId === match.id}
                      />
                      <span className="text-gray-500">-</span>
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set1_away_score || 0 : match.set1_away_score || 0}
                        onChange={(value) => handleScoreChange(1, 'away', value)}
                        isEditing={editingMatchId === match.id}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set2_home_score || 0 : match.set2_home_score || 0}
                        onChange={(value) => handleScoreChange(2, 'home', value)}
                        isEditing={editingMatchId === match.id}
                      />
                      <span className="text-gray-500">-</span>
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set2_away_score || 0 : match.set2_away_score || 0}
                        onChange={(value) => handleScoreChange(2, 'away', value)}
                        isEditing={editingMatchId === match.id}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set3_home_score || 0 : match.set3_home_score || 0}
                        onChange={(value) => handleScoreChange(3, 'home', value)}
                        isEditing={editingMatchId === match.id}
                      />
                      <span className="text-gray-500">-</span>
                      <ScoreInput
                        value={editingMatchId === match.id ? editedScores?.set3_away_score || 0 : match.set3_away_score || 0}
                        onChange={(value) => handleScoreChange(3, 'away', value)}
                        isEditing={editingMatchId === match.id}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={match.has_final_score ? "default" : "secondary"}
                      className={match.has_final_score ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {match.has_final_score ? "Final Score Saved" : "Match In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingMatchId === match.id ? (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleSaveClick(match.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingMatchId(null);
                            setEditedScores(null);
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleEditClick(match)}
                        className="bg-volleyball-red hover:bg-volleyball-red/90 text-white"
                      >
                        Edit
                      </Button>
                    )}
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
