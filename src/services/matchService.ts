import { supabase } from "@/integrations/supabase/client";
import { Match, Fixture } from "@/types/volleyball";
import { generateMatchCode } from "@/utils/matchCodeGenerator";
import { format, parse } from "date-fns";

export const findExistingMatch = async (matchCode: string) => {
  const { data, error } = await supabase
    .from('matches_v2')
    .select()
    .eq('match_code', matchCode)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing match:', error);
    throw error;
  }

  return data;
};

export const createNewMatch = async (
  courtId: string,
  fixture?: Fixture,
  matchCode?: string
) => {
  const code = matchCode || generateMatchCode(courtId, fixture);
  
  // Parse and format the date to ensure it's in the correct PostgreSQL format
  let formattedStartTime;
  if (fixture?.DateTime) {
    try {
      const parsedDate = parse(fixture.DateTime, 'dd/MM/yyyy HH:mm', new Date());
      formattedStartTime = format(parsedDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
      console.log('Formatted start time:', formattedStartTime);
    } catch (error) {
      console.error('Error parsing date:', error);
      formattedStartTime = new Date().toISOString();
    }
  } else {
    formattedStartTime = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('matches_v2')
    .insert({
      match_code: code,
      court_number: parseInt(courtId),
      start_time: formattedStartTime,
      division: fixture?.DivisionName,
      home_team_id: fixture?.HomeTeamId || 'unknown',
      home_team_name: fixture?.HomeTeam || 'Team A',
      away_team_id: fixture?.AwayTeamId || 'unknown',
      away_team_name: fixture?.AwayTeam || 'Team B',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating match:', error);
    throw error;
  }

  return data;
};

export const transformToMatch = (data: any): Match => ({
  id: data.id,
  court: data.court_number,
  startTime: data.start_time,
  division: data.division,
  homeTeam: { id: data.home_team_id, name: data.home_team_name },
  awayTeam: { id: data.away_team_id, name: data.away_team_name },
});