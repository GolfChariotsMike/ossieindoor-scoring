import { useNavigate } from "react-router-dom";
import CourtSelection from "@/components/CourtSelection";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-volleyball-red p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Select a Court</h1>
          <Button 
            onClick={() => navigate('/standalone-scoreboard')}
            className="bg-volleyball-black text-white hover:bg-volleyball-black/90"
          >
            Standalone Scoreboard
          </Button>
        </div>
        <CourtSelection />
      </div>
    </div>
  );
};

export default Index;