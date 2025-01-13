import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  const handleStandaloneScoreboard = () => {
    navigate('/scoreboard/0', { state: { standalone: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-volleyball-red">
      <div className="text-center space-y-8">
        <Button 
          onClick={handleStandaloneScoreboard}
          className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 text-xl px-8 py-6"
        >
          Open Standalone Scoreboard
        </Button>
      </div>
    </div>
  );
};

export default Index;