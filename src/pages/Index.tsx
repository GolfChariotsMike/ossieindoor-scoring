import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleStandaloneScoreboard = () => {
    navigate('/scoreboard/0', { state: { standalone: true } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-volleyball-red">
      <div className="w-full max-w-4xl p-4 flex flex-col items-center gap-4">
        <Button 
          onClick={handleStandaloneScoreboard}
          variant="outline"
          size="sm"
          className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 gap-2"
        >
          Open Standalone Scoreboard
          <ArrowRight className="h-4 w-4" />
        </Button>
        {/* This is where the courts would be rendered */}
      </div>
    </div>
  );
};

export default Index;