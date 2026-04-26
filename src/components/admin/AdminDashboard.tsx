
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchResultsTable } from "./MatchResultsTable";
import { TimerSettings } from "./TimerSettings";
import { AceBlockLeaderboard } from "./AceBlockLeaderboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getPendingScores } from "@/services/indexedDB";
import { EndOfNightSummary } from "../scoreboard/EndOfNightSummary";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showPendingScores, setShowPendingScores] = useState(false);
  const [courtId, setCourtId] = useState<string>("1"); // Default court ID

  const handleClearLocalData = async () => {
    if (!confirm('Clear ALL local data? This will wipe scores, pending uploads, and cached match data from this device. Cannot be undone.')) return;
    
    // Clear IndexedDB
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('volleyball_scores');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    
    // Clear localStorage (court state)
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('ossie_court_'));
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    alert(`Local data cleared (${keysToRemove.length} court states + IndexedDB). Reloading...`);
    window.location.reload();
  };

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
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleCheckPendingScores}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Check Pending Scores
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearLocalData}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Local Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Match Results</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results">
          <MatchResultsTable />
        </TabsContent>

        <TabsContent value="leaderboard">
          <AceBlockLeaderboard />
        </TabsContent>

        <TabsContent value="settings">
          <TimerSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
