import { useQuery } from "@tanstack/react-query";
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const generateMatchCode = (courtId: string, fixture?: Fixture): string => {
  const now = fixture ? new Date(fixture.DateTime) : new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${month}${day}${hour}${minute}${courtId.padStart(3, '0')}`;
};

export const useMatchData = (courtId: string, fixture?: Fixture) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (fixture) {
        const matchCode = generateMatchCode(courtId, fixture);
        
        const { data: existingMatch, error: checkError } = await supabase
          .from('matches_v2')
          .select()
          .eq('match_code', matchCode)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing match:', checkError);
          throw checkError;
        }

        if (existingMatch) {
          return {
            id: existingMatch.id,
            court: existingMatch.court_number,
            startTime: existingMatch.start_time,
            division: existingMatch.division,
            homeTeam: { id: existingMatch.home_team_id, name: existingMatch.home_team_name },
            awayTeam: { id: existingMatch.away_team_id, name: existingMatch.away_team_name },
          };
        }

        const { data: matchData, error } = await supabase
          .from('matches_v2')
          .insert({
            match_code: matchCode,
            court_number: parseInt(courtId),
            start_time: fixture.DateTime,
            division: fixture.DivisionName,
            home_team_id: fixture.HomeTeamId || 'unknown',
            home_team_name: fixture.HomeTeam,
            away_team_id: fixture.AwayTeamId || 'unknown',
            away_team_name: fixture.AwayTeam,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating match:', error);
          toast({
            title: "Error",
            description: "Failed to create match data",
            variant: "destructive",
          });
          throw error;
        }

        return {
          id: matchData.id,
          court: matchData.court_number,
          startTime: matchData.start_time,
          division: matchData.division,
          homeTeam: { id: matchData.home_team_id, name: matchData.home_team_name },
          awayTeam: { id: matchData.away_team_id, name: matchData.away_team_name },
        };
      }

      const { data: existingMatch, error } = await supabase
        .from('matches_v2')
        .select()
        .eq('court_number', parseInt(courtId))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching match:', error);
        toast({
          title: "Error",
          description: "Failed to fetch match data",
          variant: "destructive",
        });
        throw error;
      }

      if (!existingMatch) {
        const matchCode = generateMatchCode(courtId);
        const { data: newMatch, error: createError } = await supabase
          .from('matches_v2')
          .insert({
            match_code: matchCode,
            court_number: parseInt(courtId),
            home_team_id: 'unknown',
            home_team_name: 'Team A',
            away_team_id: 'unknown',
            away_team_name: 'Team B',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default match:', createError);
          throw createError;
        }

        return {
          id: newMatch.id,
          court: newMatch.court_number,
          startTime: newMatch.start_time,
          division: newMatch.division,
          homeTeam: { id: newMatch.home_team_id, name: newMatch.home_team_name },
          awayTeam: { id: newMatch.away_team_id, name: newMatch.away_team_name },
        };
      }

      return {
        id: existingMatch.id,
        court: existingMatch.court_number,
        startTime: existingMatch.start_time,
        division: existingMatch.division,
        homeTeam: { id: existingMatch.home_team_id, name: existingMatch.home_team_name },
        awayTeam: { id: existingMatch.away_team_id, name: existingMatch.away_team_name },
      };
    },
  });
};