import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
          variant="outline"
          size="sm"
          className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 gap-2"
        >
          Open Standalone Scoreboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;