import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CourtSelection = () => {
  const navigate = useNavigate();
  const courts = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="min-h-screen bg-volleyball-navy p-4">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Select Court
      </h1>
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {courts.map((court) => (
          <Button
            key={court}
            className="h-32 text-3xl bg-volleyball-darkBlue hover:bg-volleyball-lightBlue transition-colors"
            onClick={() => navigate(`/scoreboard/${court}`)}
          >
            Court {court}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CourtSelection;