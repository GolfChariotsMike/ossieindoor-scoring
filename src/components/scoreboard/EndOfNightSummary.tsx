
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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

interface EndOfNightSummaryProps {
  courtId: string;
  onBack: () => void;
}

export const EndOfNightSummary = ({ courtId, onBack }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-summary", courtId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('match_data_v2')
        .select('*')
        .eq('court_number', courtId)
        .eq('is_active', true)
        .gte('match_date', today.toISOString())
        .order('match_date', { ascending: true });

      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      return data || [];
    },
  });

  const handleSaveAll = async () => {
    try {
      if (!matches || matches.length === 0) {
        toast({
          title: "No matches to save",
          description: "There are no matches recorded for today.",
          variant: "default",
        });
        return;
      }

      const { error } = await supabase
        .from('match_data_v2')
        .update({ has_final_score: true })
        .in('id', matches.map(m => m.id));

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "All match scores have been verified and saved.",
      });

      navigate('/');
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
            Verify & Save All Scores
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
                        {match.has_final_score ? 'Verified' : 'Pending'}
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
      </div>
    </div>
  );
};
