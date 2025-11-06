
import { Timer } from "./Timer";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { Match, Score, SetScores, Fixture } from "@/types/volleyball";
import { parseISO, format, parse } from "date-fns";
import { useTimerSettings } from "@/hooks/useTimerSettings";

interface ScoreboardLayoutProps {
  isBreak: boolean;
  currentScore: Score;
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
  isMatchComplete: boolean;
  onTimerComplete: () => void;
  onSwitchTeams: () => void;
  onScoreUpdate: (team: "home" | "away", increment: boolean) => void;
  onAceBlock: (team: "home" | "away", type: "ace" | "block") => void;
}

export const ScoreboardLayout = ({
  isBreak,
  currentScore,
  setScores,
  match,
  isTeamsSwitched,
  isMatchComplete,
  onTimerComplete,
  onSwitchTeams,
  onScoreUpdate,
  onAceBlock,
}: ScoreboardLayoutProps) => {
  const { settings } = useTimerSettings();
  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  // Format time part only if it's in a date string format
  const formatFixtureTime = (dateStr?: string) => {
    if (!dateStr) return undefined;
    
    // If it contains a date in format dd/MM/yyyy HH:mm
    if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(dateStr)) {
      // Extract just the time part
      return dateStr.split(' ')[1];
    }
    
    return dateStr;
  };

  // Convert dd/MM/yyyy HH:mm format to ISO date string for database
  const convertToISODate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    
    // If it contains a date in format dd/MM/yyyy HH:mm
    if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(dateStr)) {
      try {
        // Parse the date using date-fns
        const parsedDate = parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
        return parsedDate.toISOString();
      } catch (error) {
        console.error('Error parsing fixture date:', dateStr, error);
        return undefined;
      }
    }
    
    // If it's already an ISO string, return as is
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
      return dateStr;
    }
    
    return undefined;
  };

  // Transform Match type to Fixture type
  const fixtureData: Fixture = {
    Id: match.id,
    DateTime: match.startTime,
    PlayingAreaName: `Court ${match.court}`,
    DivisionName: match.division || '',
    HomeTeam: match.homeTeam.name,
    AwayTeam: match.awayTeam.name,
    HomeTeamId: match.homeTeam.id,
    AwayTeamId: match.awayTeam.id,
    HomeTeamScore: '0',
    AwayTeamScore: '0',
    // Store both formats - full date string and time-only
    fixture_start_time: convertToISODate(match.startTime),
    // Extract time-only for display
    fixtureTime: formatFixtureTime(match.startTime)
  };

  console.log('ScoreboardLayout - Creating fixture data from match:', {
    id: match.id,
    DateTime: match.startTime,
    PlayingAreaName: `Court ${match.court}`,
    HomeTeam: match.homeTeam.name,
    AwayTeam: match.awayTeam.name,
    fixtureTime: fixtureData.fixtureTime,
    fixture_start_time: fixtureData.fixture_start_time
  });

  return (
    <div className="flex flex-col justify-between h-full">
      <Timer
        initialMinutes={settings.set_duration_minutes}
        breakDurationSeconds={settings.break_duration_minutes * 60}
        onComplete={onTimerComplete}
        onSwitchTeams={onSwitchTeams}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
        fixture={fixtureData}
        onAceBlock={onAceBlock}
        isTeamsSwitched={isTeamsSwitched}
      />

      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
        <TeamScore
          teamName={homeTeam.name}
          score={currentScore.home}
          onScoreUpdate={(increment) => onScoreUpdate("home", increment)}
        />

        <div className="w-64">
          <SetScoresDisplay 
            setScores={setScores} 
            match={match}
            isTeamsSwitched={isTeamsSwitched}
          />
        </div>

        <TeamScore
          teamName={awayTeam.name}
          score={currentScore.away}
          onScoreUpdate={(increment) => onScoreUpdate("away", increment)}
        />
      </div>
    </div>
  );
};
