
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { Save, ArrowLeft } from "lucide-react";
import { getPendingScores } from "@/services/indexedDB";
import { processPendingScores } from "@/utils/matchDatabase";

interface EndOfNightSummaryProps {
  courtId: string;
  onBack: () => void;
}

export const EndOfNightSummary = ({ courtId, onBack }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ["matches-summary", courtId],
    queryFn: async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const dateParam = searchParams.get('date');
      
      // Use the date from URL or default to today
      const targetDate = dateParam ? new Date(dateParam) : new Date();
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);
      
      console.log('Fetching matches for:', {
        courtId,
        dateParam,
        targetDate,
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString()
      });

      // First get any pending scores from IndexedDB
      const pendingScores = await getPendingScores();
      console.log('Found pending scores:', pendingScores.length);

      // Get match details for pending scores
      const pendingMatchDetails = await Promise.all(
        pendingScores.map(async (score) => {
          const { data: matchData } = await supabase
            .from('matches_v2')
            .select('*')
            .eq('id', score.matchId)
            .maybeSingle();
          return matchData;
        })
      );

      const { data: existingMatches, error } = await supabase
        .from('match_data_v2')
        .select('*')
        .eq('court_number', parseInt(courtId))
        .eq('is_active', true)
        .gte('match_date', dayStart.toISOString())
        .lte('match_date', dayEnd.toISOString())
        .order('match_date', { ascending: true });

      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      // Combine existing matches with pending scores
      const combinedMatches = existingMatches || [];
      
      // Only add pending scores that don't already exist in the database
      pendingScores.forEach((pendingScore, index) => {
        const matchExists = combinedMatches.some(
          m => m.match_id === pendingScore.matchId
        );
        
        const matchDetails = pendingMatchDetails[index];
        
        if (!matchExists && matchDetails) {
          combinedMatches.push({
            id: pendingScore.id,
            match_id: pendingScore.matchId,
            match_date: pendingScore.timestamp,
            court_number: parseInt(courtId),
            division: matchDetails.division || '',
            home_team_name: matchDetails.home_team_name,
            away_team_name: matchDetails.away_team_name,
            set1_home_score: pendingScore.homeScores[0] || 0,
            set1_away_score: pendingScore.awayScores[0] || 0,
            set2_home_score: pendingScore.homeScores[1] || 0,
            set2_away_score: pendingScore.awayScores[1] || 0,
            set3_home_score: pendingScore.homeScores[2] || 0,
            set3_away_score: pendingScore.awayScores[2] || 0,
            is_active: true,
            has_final_score: false,
            home_total_points: pendingScore.homeScores.reduce((a, b) => a + b, 0),
            away_total_points: pendingScore.awayScores.reduce((a, b) => a + b, 0),
            home_bonus_points: 0,
            away_bonus_points: 0,
            home_total_match_points: 0,
            away_total_match_points: 0,
            points_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            home_result: '',
            away_result: '',
            fixture_start_time: matchDetails.fixture_start_time
          });
        }
      });

      console.log('Total matches to display:', combinedMatches.length);
      return combinedMatches;
    },
  });

  const handleSaveAll = async () => {
    try {
      if (!matches || matches.length === 0) {
        toast({
          title: "No matches to save",
          description: "There are no matches recorded for this date.",
          variant: "default",
        });
        return;
      }

      toast({
        title: "Submitting scores",
        description: "Processing all match scores...",
      });

      // Process all pending scores with force flag
      const processedCount = await processPendingScores(true);
      
      // Mark all matches as having final scores
      const { error: updateError } = await supabase
        .from('match_data_v2')
        .update({ has_final_score: true })
        .in('id', matches.map(m => m.id));

      if (updateError) {
        throw updateError;
      }

      // Update refresh team stats
      const { error: statsError } = await supabase.rpc('refresh_team_statistics_safe');
      if (statsError) {
        console.error('Stats calculation error:', statsError);
        toast({
          title: "Warning",
          description: "Match scores saved but team statistics update failed. This will be fixed automatically later.",
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: `All match scores (${processedCount || matches.length}) have been verified and saved.`,
      });

      // Refresh the data
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["matches"] });

      // Navigate back home after a short delay to show the success message
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error saving scores:', error);
      toast({
        title: "Error",
        description: "There was a problem saving the match scores. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Court {courtId} - End of Night Summary</h1>
          </div>
          <Button 
            onClick={handleSaveAll}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Submit & Save All Scores
          </Button>
        </div>

        {matches && matches.length > 0 ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Time</TableHead>
                  <TableHead>Home Team</TableHead>
                  <TableHead className="text-center">Set 1</TableHead>
                  <TableHead className="text-center">Set 2</TableHead>
                  <TableHead className="text-center">Set 3</TableHead>
                  <TableHead>Away Team</TableHead>
                  <TableHead className="w-[100px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {format(new Date(match.match_date), 'HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{match.home_team_name}</TableCell>
                    <TableCell className="text-center">
                      {match.set1_home_score} - {match.set1_away_score}
                    </TableCell>
                    <TableCell className="text-center">
                      {match.set2_home_score} - {match.set2_away_score}
                    </TableCell>
                    <TableCell className="text-center">
                      {match.set3_home_score} - {match.set3_away_score}
                    </TableCell>
                    <TableCell className="font-medium">{match.away_team_name}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        match.has_final_score 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {match.has_final_score ? 'Submitted' : 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No matches recorded today.
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Important Information</h3>
          <p>All scores will be submitted to the central database when you click "Submit & Save All Scores". Please review the scores carefully before submitting.</p>
          <p className="mt-2">Once submitted, these scores will be used for official league standings.</p>
        </div>
      </div>
    </div>
  );
};
