
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
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
import { PlusCircle, Save } from "lucide-react";

interface EndOfNightSummaryProps {
  courtNumber: number;
}

export const EndOfNightSummary = ({ courtNumber }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ["today-matches", courtNumber],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('match_data_v2')
        .select('*')
        .eq('court_number', courtNumber)
        .eq('is_active', true)
        .gte('match_date', format(today, 'yyyy-MM-dd'))
        .lt('match_date', format(new Date(today.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
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

      // Update all matches to has_final_score = true
      const { error } = await supabase
        .from('match_data_v2')
        .update({ has_final_score: true })
        .in('id', matches.map(m => m.id));

      if (error) {
        throw error;
      }

      toast({
        title: "Scores Saved Successfully",
        description: "All match scores have been verified and saved.",
      });

      // Return to court selection
      navigate('/');
    } catch (error) {
      console.error('Error saving scores:', error);
      toast({
        title: "Error Saving Scores",
        description: "There was a problem saving the match scores. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Court {courtNumber} - End of Night Summary</h1>
          <div className="space-x-4">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Match
            </Button>
            <Button 
              onClick={handleSaveAll}
            >
              <Save className="w-4 h-4 mr-2" />
              Verify & Save All Scores
            </Button>
          </div>
        </div>

        {matches && matches.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Time</TableHead>
                <TableHead className="w-[200px]">Team A</TableHead>
                <TableHead className="text-center">Set 1</TableHead>
                <TableHead className="text-center">Set 2</TableHead>
                <TableHead className="text-center">Set 3</TableHead>
                <TableHead className="w-[200px]">Team B</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    {format(parseISO(match.match_date), 'HH:mm')}
                  </TableCell>
                  <TableCell>{match.home_team_name}</TableCell>
                  <TableCell className="text-center">
                    {match.set1_home_score} - {match.set1_away_score}
                  </TableCell>
                  <TableCell className="text-center">
                    {match.set2_home_score} - {match.set2_away_score}
                  </TableCell>
                  <TableCell className="text-center">
                    {match.set3_home_score} - {match.set3_away_score}
                  </TableCell>
                  <TableCell>{match.away_team_name}</TableCell>
                  <TableCell>
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
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No matches recorded today.</p>
          </div>
        )}
      </div>
    </div>
  );
};
