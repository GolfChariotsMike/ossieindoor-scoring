
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { ArrowLeft, Save } from "lucide-react";
import { fetchMatchSummary } from "./matchSummary/FetchMatchesLogic";
import { SummaryTable } from "./matchSummary/SummaryTable";
import { processPendingScores } from "@/utils/matchDatabase";
import { useState } from "react";

interface EndOfNightSummaryProps {
  courtId: string;
  onBack: () => void;
}

export const EndOfNightSummary = ({ courtId, onBack }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ["matches-summary", courtId],
    queryFn: fetchMatchSummary,
    // Remove the onError property and use onSettled for handling errors
    meta: {
      onError: (error: Error) => {
        console.error("Error loading matches:", error);
        toast({
          title: "Error loading matches",
          description: "There was a problem loading the match data. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSaveAllScores = async () => {
    setIsSaving(true);
    try {
      const count = await processPendingScores(true);
      toast({
        title: "Scores Saved",
        description: `Successfully uploaded ${count} match scores to the server.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error uploading scores:", error);
      toast({
        title: "Error Saving Scores",
        description: "There was a problem uploading the scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Court {courtId} - End of Night Summary</h1>
          </div>
          <Button 
            variant="default" 
            onClick={handleSaveAllScores}
            disabled={isSaving || !matches || matches.length === 0}
            className="gap-2"
          >
            {isSaving ? "Saving..." : "Save All Scores"}
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {matches && matches.length > 0 ? (
          <SummaryTable matches={matches} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">No matches recorded today.</div>
        )}
      </div>
    </div>
  );
};
