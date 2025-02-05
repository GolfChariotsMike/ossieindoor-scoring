
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // Fetch match progress data
  const { data: matchProgress = [], isLoading } = useQuery({
    queryKey: ["match-progress", selectedDay],
    queryFn: async () => {
      let query = supabase
        .from('match_progress')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedDay !== "all") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch match progress",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  const days = ["all", "Monday", "Tuesday", "Wednesday", "Thursday"];

  // Filter matches based on selected day
  const filteredMatches = selectedDay === "all" 
    ? matchProgress 
    : matchProgress.filter(match => {
        const matchDate = parseISO(match.start_time);
        return format(matchDate, 'EEEE') === selectedDay;
      });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-volleyball-cream p-8">
        <div className="text-volleyball-black text-2xl text-center animate-pulse">
          Loading matches...
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-volleyball-black">Match Progress Dashboard</h1>
              <div className="w-[120px]" />
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedDay}>
              <TabsList className="w-full justify-start bg-volleyball-cream mb-4">
                {days.map((day) => (
                  <TabsTrigger 
                    key={day} 
                    value={day}
                    className="data-[state=active]:bg-volleyball-black data-[state=active]:text-volleyball-cream"
                  >
                    {day === "all" ? "All Days" : day}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>First Set Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    {format(parseISO(match.start_time), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(match.start_time), 'EEEE')}
                  </TableCell>
                  <TableCell>Court {match.court_number}</TableCell>
                  <TableCell>{match.division || 'N/A'}</TableCell>
                  <TableCell>
                    {match.home_team_name} vs {match.away_team_name}
                  </TableCell>
                  <TableCell>
                    {match.first_set_home_score} - {match.first_set_away_score}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={match.has_final_score ? "default" : "secondary"}
                      className={match.has_final_score ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {match.has_final_score ? "Final Score Saved" : "Match In Progress"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
