import { format } from "date-fns";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MatchScore, MatchProgressItem } from "./types";
import { MatchScoreEditor } from "./MatchScoreEditor";

export const MatchProgressSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchTeam, setSearchTeam] = useState<string>("");
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editedScores, setEditedScores] = useState<MatchScore | null>(null);
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);

  const { data: matchProgress = [], isLoading } = useQuery({
    queryKey: ["match-progress", selectedDay],
    queryFn: async () => {
      console.log('MatchProgressSection: Fetching match progress data');
      const { data, error } = await supabase
        .from('match_progress_view')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('MatchProgressSection: Error fetching match progress:', error);
        toast({
          title: "Error",
          description: "Failed to fetch match progress",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  const handleEditClick = (match: MatchProgressItem) => {
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

  const updateScoresMutation = useMutation({
    mutationFn: async (variables: { matchId: string; scores: MatchScore }) => {
      console.log('Updating match scores:', variables);
      
      const { error } = await supabase.rpc('handle_match_data_update', {
        p_match_id: variables.matchId,
        p_set1_home_score: variables.scores.set1_home_score,
        p_set1_away_score: variables.scores.set1_away_score,
        p_set2_home_score: variables.scores.set2_home_score,
        p_set2_away_score: variables.scores.set2_away_score,
        p_set3_home_score: variables.scores.set3_home_score,
        p_set3_away_score: variables.scores.set3_away_score
      });

      if (error) {
        console.error('Error in handle_match_data_update:', error);
        throw error;
      }
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
        description: "Failed to update match scores. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('match_data_v2')
        .update({ is_active: false })
        .eq('match_id', matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-progress"] });
      toast({
        title: "Success",
        description: "Match record deleted successfully",
      });
      setDeleteMatchId(null);
    },
    onError: (error) => {
      console.error('Error deleting match:', error);
      toast({
        title: "Error",
        description: "Failed to delete match record",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (matchId: string) => {
    setDeleteMatchId(matchId);
  };

  const confirmDelete = () => {
    if (deleteMatchId) {
      deleteMatchMutation.mutate(deleteMatchId);
    }
  };

  const days = ["all", "Monday", "Tuesday", "Wednesday", "Thursday"];

  const filteredMatches = matchProgress
    .filter(match => {
      if (selectedDay !== "all") {
        if (!match.start_time) {
          console.log('MatchProgressSection: Match missing start_time:', match);
          return false;
        }
        
        try {
          const matchDate = new Date(match.start_time);
          const dayMatch = format(matchDate, 'EEEE') === selectedDay;
          if (!dayMatch) return false;
        } catch (error) {
          console.error('MatchProgressSection: Error parsing date for match:', match, error);
          return false;
        }
      }
      
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
      <div className="text-volleyball-black text-2xl text-center animate-pulse">
        Loading matches...
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMatches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                {match.start_time ? format(new Date(match.start_time), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </TableCell>
              <TableCell>
                {match.start_time ? format(new Date(match.start_time), 'EEEE') : 'N/A'}
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
              {editingMatchId === match.id && editedScores ? (
                <MatchScoreEditor
                  matchId={match.id}
                  currentScores={editedScores}
                  isEditing={true}
                  onScoreChange={handleScoreChange}
                  onSave={() => handleSaveClick(match.id)}
                  onCancel={() => {
                    setEditingMatchId(null);
                    setEditedScores(null);
                  }}
                />
              ) : (
                <>
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <span>{match.set1_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set1_away_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <span>{match.set2_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set2_away_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col space-y-2">
                      <span>{match.set3_home_score || 0}</span>
                      <span className="text-gray-500">-</span>
                      <span>{match.set3_away_score || 0}</span>
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
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      onClick={() => handleEditClick(match)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteClick(match.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteMatchId} onOpenChange={() => setDeleteMatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the match record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
