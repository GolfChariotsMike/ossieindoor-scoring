import { Match, Score, SetScores } from "@/types/volleyball";
import { TeamsDisplay } from "./TeamsDisplay";
import { Timer } from "./Timer";
import { GameScores } from "./GameScores";
import { SetScoresDisplay } from "./SetScoresDisplay";

interface ScoreboardLayoutProps {
  isBreak: boolean;
  currentScore: Score;
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
  isMatchComplete: boolean;
  onTimerComplete: () => void;
  onSwitchTeams: () => void;
  onScoreUpdate: (team: "home" | "away") => void;
  initialMinutes?: number;
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
  initialMinutes = 14,
}: ScoreboardLayoutProps) => {
  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className="h-full flex flex-col justify-between py-8">
      <TeamsDisplay
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={currentScore.home}
        awayScore={currentScore.away}
        onHomeScore={() => onScoreUpdate("home")}
        onAwayScore={() => onScoreUpdate("away")}
      />
      
      <Timer
        initialMinutes={isBreak ? 1 : initialMinutes}
        onComplete={onTimerComplete}
        onSwitchTeams={onSwitchTeams}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
      />

      <div className="space-y-8">
        <GameScores
          currentScore={currentScore}
          setScores={setScores}
          match={match}
          isTeamsSwitched={isTeamsSwitched}
          onScoreUpdate={onScoreUpdate}
        />
        
        <SetScoresDisplay
          setScores={setScores}
          match={match}
          isTeamsSwitched={isTeamsSwitched}
        />
      </div>
    </div>
  );
};