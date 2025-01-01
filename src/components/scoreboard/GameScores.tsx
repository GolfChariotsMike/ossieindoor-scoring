import { Score, SetScores, Match } from "@/types/volleyball";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";

interface GameScoresProps {
  currentScore: Score;
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
  onScoreUpdate: (team: "home" | "away", increment?: boolean) => void;
}

export const GameScores = ({
  currentScore,
  setScores,
  match,
  isTeamsSwitched,
  onScoreUpdate,
}: GameScoresProps) => {
  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
      <TeamScore
        teamName={homeTeam.name}
        score={currentScore.home}
        onScoreUpdate={() => onScoreUpdate("home", false)}
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
        onScoreUpdate={() => onScoreUpdate("away", false)}
      />
    </div>
  );
};