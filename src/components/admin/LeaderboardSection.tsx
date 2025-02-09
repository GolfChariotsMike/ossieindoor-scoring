
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "./LeaderboardTable";
import { TeamScoreHistory } from "./TeamScoreHistory";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const LeaderboardSection = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  const { data: divisions = [], isLoading: isDivisionsLoading } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: teamStats = [], isLoading: isStatsLoading } = useQuery({
    queryKey: ["team-statistics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_statistics")
        .select(`
          *,
          team:teams(*)
        `)
        .order("total_points", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isDivisionsLoading || isStatsLoading) {
    return <div>Loading leaderboards...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-volleyball-black">League Standings</h2>
      
      <Tabs defaultValue={divisions[0]?.id} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start bg-volleyball-cream">
            {divisions.map((division) => (
              <TabsTrigger 
                key={division.id} 
                value={division.id}
                className="data-[state=active]:bg-volleyball-black data-[state=active]:text-volleyball-cream"
              >
                {division.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {divisions.map((division) => (
          <TabsContent key={division.id} value={division.id} className="space-y-6">
            <LeaderboardTable 
              stats={teamStats.filter(stat => stat.division_id === division.id)}
              onTeamClick={setSelectedTeamId}
            />
            
            {selectedTeamId && (
              <TeamScoreHistory 
                teamId={selectedTeamId} 
                onClose={() => setSelectedTeamId(null)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
