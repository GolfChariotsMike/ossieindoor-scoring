
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "./LeaderboardTable";
import { TeamScoreHistory } from "./TeamScoreHistory";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LeaderboardSection = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  
  const { data: divisions = [], isLoading: isDivisionsLoading } = useQuery({
    queryKey: ["divisions", selectedDay],
    queryFn: async () => {
      console.log('LeaderboardSection: Fetching divisions for day:', selectedDay);
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .eq("day_of_week", selectedDay)
        .order("name");
      
      if (error) {
        console.error('LeaderboardSection: Error fetching divisions:', error);
        throw error;
      }
      
      // Sort divisions in a natural order
      const sortedDivisions = data.sort((a, b) => {
        // Function to extract numeric value from division name
        const getNumericValue = (name: string) => {
          const match = name.match(/\d+/);
          return match ? parseInt(match[0]) : Infinity;
        };

        // Special handling for different division types
        const isDivA = a.name.startsWith('DIV');
        const isDivB = b.name.startsWith('DIV');
        const isMixA = a.name.includes('MIX');
        const isMixB = b.name.includes('MIX');
        const isDuoA = a.name.startsWith('DUO');
        const isDuoB = b.name.startsWith('DUO');

        // Sort by division type first
        if (isDivA && !isDivB) return -1;
        if (!isDivA && isDivB) return 1;
        if (isMixA && !isMixB) return -1;
        if (!isMixA && isMixB) return 1;
        if (isDuoA && !isDuoB) return -1;
        if (!isDuoA && isDuoB) return 1;

        // If both are numbered divisions, sort by number
        if ((isDivA && isDivB) || (isDuoA && isDuoB)) {
          return getNumericValue(a.name) - getNumericValue(b.name);
        }

        // For other cases, sort alphabetically
        return a.name.localeCompare(b.name);
      });

      console.log('LeaderboardSection: Sorted divisions:', sortedDivisions);
      return sortedDivisions;
    },
  });

  const { data: teamStats = [], isLoading: isStatsLoading } = useQuery({
    queryKey: ["team-statistics", selectedDay],
    queryFn: async () => {
      console.log('LeaderboardSection: Fetching team statistics');
      
      // First get distinct match IDs with their latest record
      const { data: latestMatchData, error: latestMatchError } = await supabase
        .from('match_data_v2')
        .select('match_id, created_at')
        .order('created_at', { ascending: false });

      if (latestMatchError) throw latestMatchError;

      // Get unique latest records for each match
      const latestMatchIds = Array.from(new Set(latestMatchData.map(m => m.match_id)));

      // Now fetch the team statistics using only the latest match records
      const { data, error } = await supabase
        .from("team_statistics")
        .select(`
          *,
          team:teams(*)
        `)
        .in('division_id', divisions.map(d => d.id))
        .order("total_points", { ascending: false });
      
      if (error) {
        console.error('LeaderboardSection: Error fetching team statistics:', error);
        throw error;
      }
      console.log('LeaderboardSection: Fetched team statistics:', data);
      return data;
    },
    enabled: divisions.length > 0,
  });

  if (isDivisionsLoading || isStatsLoading) {
    return <div>Loading leaderboards...</div>;
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-volleyball-black">League Standings</h2>
      
      <div className="w-full max-w-xs">
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a day" />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {divisions.length > 0 ? (
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
      ) : (
        <div className="text-center text-gray-500 py-8">
          No divisions found for {selectedDay}
        </div>
      )}
    </div>
  );
};
