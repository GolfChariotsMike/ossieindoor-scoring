
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchProgressSection } from "./MatchProgressSection";

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-volleyball-cream">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Courts
              </Button>
              <h1 className="text-3xl font-bold text-volleyball-black">Admin Dashboard</h1>
              <div className="w-[120px]" />
            </div>

            <MatchProgressSection />
          </div>
        </div>
      </div>
    </div>
  );
};
