
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { fetchMatchSummary } from "./matchSummary/FetchMatchesLogic";
import { SummaryTable } from "./matchSummary/SummaryTable";
import { useEffect } from "react";

interface EndOfNightSummaryProps {
  courtId: string;
  onBack: () => void;
}

export const EndOfNightSummary = ({ courtId, onBack }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("EndOfNightSummary mounted for court:", courtId);
    
    // Check for pending scores in localStorage as a fallback
    const localStorageKeys = Object.keys(localStorage);
    const scoreKeys = localStorageKeys.filter(key => key.includes('score') || key.includes('match'));
    
    if (scoreKeys.length > 0) {
      console.log("Found potential score-related items in localStorage:", scoreKeys);
    } else {
      console.log("No score-related items found in localStorage");
    }
    
    return () => {
      console.log("EndOfNightSummary unmounting");
    };
  }, [courtId]);

  const { data: matches, isLoading, error, refetch } = useQuery({
    queryKey: ["matches-summary", courtId],
    queryFn: fetchMatchSummary,
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
  
  useEffect(() => {
    if (error) {
      console.error("Query error in EndOfNightSummary:", error);
    }
    
    if (matches) {
      console.log(`EndOfNightSummary received ${matches.length} matches from query`);
    }
  }, [matches, error]);

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
          <Button variant="outline" onClick={() => refetch()}>
            Refresh Data
          </Button>
        </div>

        {matches && matches.length > 0 ? (
          <SummaryTable matches={matches} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No matches recorded today.</p>
            <p className="mt-4 text-sm">
              This could be because no matches have been completed, 
              or because the scores haven't been saved properly.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
