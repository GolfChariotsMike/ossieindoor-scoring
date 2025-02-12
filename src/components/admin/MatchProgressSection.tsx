
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MatchScore, MatchProgressItem } from "./types";
import { MatchScoreEditor } from "./MatchScoreEditor";

export const MatchProgressSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchTeam, setSearchTeam] = useState<string>("");
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editedScores, setEditedScores] = useState<MatchScore | null>(null);

  const { data: matchProgress = [], isLoading } = useQuery({
    queryKey: ["match-progress", selectedDay],
    queryFn: async () => {
      console.log('MatchProgressSection: Fetching match progress data');
      const { data, error } = await supabase
        .from('match_progress_view')
        .select('*')
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

  const updateScoresMutation = useMutation({
    mutationFn: async (variables: { matchId: string; scores: MatchScore }) => {
      const { data: matchData } = await supabase
        .from('matches_v2')
        .select('*')
        .eq('id', variables.matchId)
        .single();

      if (!matchData) throw new Error('Match not found');

      const { data, error } = await supabase
        .from('match_data_v2')
        .upsert({
          match_id: variables.matchId,
          court_number: matchData.court_number,
          division: matchData.division,
          home_team_name: matchData.home_team_name,
          away_team_name: matchData.away_team_name,
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
            <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <MatchScoreEditor
                      matchId={match.id}
                      currentScores={{
                        set1_home_score: match.set1_home_score || 0,
                        set1_away_score: match.set1_away_score || 0,
                        set2_home_score: match.set2_home_score || 0,
                        set2_away_score: match.set2_away_score || 0,
                        set3_home_score: match.set3_home_score || 0,
                        set3_away_score: match.set3_away_score || 0,
                      }}
                      isEditing={false}
                      onScoreChange={handleScoreChange}
                      onSave={() => {}}
                      onCancel={() => handleEditClick(match)}
                    />
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
