
import { Timer } from "./Timer";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { Match, Score, SetScores, Fixture } from "@/types/volleyball";

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
  matchId?: string;
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
  matchId,
}: ScoreboardLayoutProps) => {
  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

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
    AwayTeamScore: '0'
  };

  console.log('ScoreboardLayout - Match data:', match);
  console.log('ScoreboardLayout - Current scores:', currentScore);
  console.log('ScoreboardLayout - Set scores:', setScores);

  return (
    <div className="flex flex-col justify-between h-full">
      <Timer
        initialMinutes={14}
        onComplete={onTimerComplete}
        onSwitchTeams={onSwitchTeams}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
        fixture={fixtureData}
        currentSetScores={setScores}
        matchId={matchId || match.id}
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
