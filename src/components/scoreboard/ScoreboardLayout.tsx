import { Timer } from "./Timer";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { Match, Score, SetScores } from "@/types/volleyball";

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
    <div className="flex flex-col justify-between h-full">
      <div>
        <Timer
          initialMinutes={isBreak ? 1 : initialMinutes}
          onComplete={onTimerComplete}
          onSwitchTeams={onSwitchTeams}
          isBreak={isBreak}
          isMatchComplete={isMatchComplete}
          className={isBreak ? 'text-volleyball-black [text-shadow:_2px_2px_0_rgb(255,255,255),_-2px_-2px_0_rgb(255,255,255),_2px_-2px_0_rgb(255,255,255),_-2px_2px_0_rgb(255,255,255)]' : 'text-volleyball-cream'}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
        <TeamScore
          teamName={homeTeam.name}
          score={currentScore.home}
          onScoreUpdate={() => onScoreUpdate("home")}
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
          onScoreUpdate={() => onScoreUpdate("away")}
        />
      </div>
    </div>
  );
};