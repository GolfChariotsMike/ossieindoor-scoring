
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchResultsTable } from "./MatchResultsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getPendingScores } from "@/services/indexedDB";
import { EndOfNightSummary } from "../scoreboard/EndOfNightSummary";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showPendingScores, setShowPendingScores] = useState(false);
  const [courtId, setCourtId] = useState<string>("1"); // Default court ID

  const handleCheckPendingScores = async () => {
    const pendingScores = await getPendingScores();
    if (pendingScores.length > 0) {
      setShowPendingScores(true);
    } else {
      alert("No pending scores found in storage");
    }
  };

  if (showPendingScores) {
    return (
      <EndOfNightSummary 
        courtId={courtId}
        onBack={() => setShowPendingScores(false)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courts
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleCheckPendingScores}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Check Pending Scores
        </Button>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Match Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results">
          <MatchResultsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
