
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardSection } from "./LeaderboardSection";
import { MatchProgressSection } from "./MatchProgressSection";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<string>("matches");

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

            <Tabs value={selectedSection} onValueChange={setSelectedSection} className="w-full">
              <TabsList className="w-full justify-start bg-volleyball-cream">
                <TabsTrigger 
                  value="matches"
                  className="data-[state=active]:bg-volleyball-black data-[state=active]:text-volleyball-cream"
                >
                  Match Progress
                </TabsTrigger>
                <TabsTrigger 
                  value="leaderboards"
                  className="data-[state=active]:bg-volleyball-black data-[state=active]:text-volleyball-cream"
                >
                  Leaderboards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matches">
                <MatchProgressSection />
              </TabsContent>

              <TabsContent value="leaderboards">
                <LeaderboardSection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
