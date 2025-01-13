import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  const handleStandaloneScoreboard = () => {
    navigate('/scoreboard/0', { state: { standalone: true } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-volleyball-red">
      <div className="w-full max-w-4xl p-4 flex flex-col items-center gap-4">
        <button 
          onClick={handleStandaloneScoreboard}
          className="hover:opacity-80 transition-opacity"
        >
          <img 
            src="/lovable-uploads/1b9b6b64-0bcc-42d0-9d2b-dd0c359ad5d2.png" 
            alt="Volleyball Logo" 
            className="w-48 h-48 object-contain cursor-pointer"
          />
        </button>
        {/* This is where the courts would be rendered */}
      </div>
    </div>
  );
};

export default Index;