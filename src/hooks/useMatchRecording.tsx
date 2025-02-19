
import { Match, Fixture } from "@/types/volleyball";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export const useMatchRecording = (isTeamsSwitched: boolean) => {
  const generateTeamId = (teamName: string) => {
    return `team_${teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  };

  const recordFirstSetProgress = async (match: Match | Fixture, homeScore: number, awayScore: number) => {
    try {
      console.log('Recording first set progress:', {
        match,
        homeScore,
        awayScore,
        isTeamsSwitched
      });
      
      const matchDate = 'DateTime' in match 
        ? new Date(match.DateTime)
        : new Date(match.startTime);
      
      const courtNumber = 'PlayingAreaName' in match
        ? parseInt(match.PlayingAreaName.replace('Court ', ''))
        : match.court;
      
      const homeTeamName = 'HomeTeam' in match ? match.HomeTeam : match.homeTeam.name;
      const awayTeamName = 'AwayTeam' in match ? match.AwayTeam : match.awayTeam.name;
      const division = 'DivisionName' in match ? match.DivisionName : match.division;

      const finalHomeScore = isTeamsSwitched ? awayScore : homeScore;
      const finalAwayScore = isTeamsSwitched ? homeScore : awayScore;

      const homeTeamId = 'id' in match.homeTeam ? match.homeTeam.id : generateTeamId(homeTeamName);
      const awayTeamId = 'id' in match.awayTeam ? match.awayTeam.id : generateTeamId(awayTeamName);

      const formattedDate = format(matchDate, 'yyyyMMdd-HHmm');
      const matchCode = `${courtNumber}-${formattedDate}`;

      // First ensure we have the match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches_v2')
        .upsert({
          match_code: matchCode,
          court_number: courtNumber,
          division: division,
          home_team_name: homeTeamName,
          away_team_name: awayTeamName,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          start_time: matchDate.toISOString(),
          match_status: 'in_progress',
          home_sets_won: 0,
          away_sets_won: 0,
          home_bonus_points: 0,
          away_bonus_points: 0,
          home_total_points: 0,
          away_total_points: 0,
          set1_home_score: 0,
          set1_away_score: 0,
          set2_home_score: 0,
          set2_away_score: 0,
          set3_home_score: 0,
          set3_away_score: 0,
          fixture_start_time: matchDate.toISOString()
        }, {
          onConflict: 'match_code'
        })
        .select()
        .single();

      if (matchError) {
        console.error('Error recording match:', matchError);
        throw matchError;
      }

      // Now try to find any existing match data record
      const { data: existingData } = await supabase
        .from('match_data_v2')
        .select()
        .eq('match_id', matchData.id)
        .maybeSingle();

      const matchDataRecord = {
        match_id: matchData.id,
        court_number: courtNumber,
        division: division,
        home_team_name: homeTeamName,
        away_team_name: awayTeamName,
        set1_home_score: finalHomeScore,
        set1_away_score: finalAwayScore,
        match_date: matchDate.toISOString(),
        fixture_start_time: matchData.fixture_start_time,
        has_final_score: false
      };

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('match_data_v2')
          .update(matchDataRecord)
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating match data:', updateError);
          throw updateError;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('match_data_v2')
          .insert(matchDataRecord);

        if (insertError) {
          console.error('Error inserting match data:', insertError);
          throw insertError;
        }
      }

      console.log('Successfully recorded first set progress');
      return true;
      
    } catch (error) {
      console.error('Error in recordFirstSetProgress:', error);
      toast({
        title: "Error Recording Set",
        description: "Failed to save the first set scores",
        variant: "destructive",
      });
      return false;
    }
  };

  return { recordFirstSetProgress };
};
