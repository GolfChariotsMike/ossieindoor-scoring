import { Score, SetScores, Match } from "@/types/volleyball";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { Button } from "@/components/ui/button";
import { Award, Shield } from "lucide-react";

interface GameScoresProps {
  currentScore: Score;
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
  onScoreUpdate: (team: "home" | "away", increment: boolean) => void;
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
    <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-start mb-8">
      <div className="flex flex-col items-center gap-8">
        <div className="flex gap-2 mb-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => console.log('Home team block')}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => console.log('Home team ace')}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
          >
            <Award className="h-4 w-4" />
          </Button>
        </div>
        <TeamScore
          teamName={homeTeam.name}
          score={currentScore.home}
          onScoreUpdate={(increment) => onScoreUpdate("home", increment)}
        />
      </div>

      <div className="w-64">
        <SetScoresDisplay 
          setScores={setScores} 
          match={match}
          isTeamsSwitched={isTeamsSwitched}
        />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex gap-2 mb-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => console.log('Away team block')}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => console.log('Away team ace')}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
          >
            <Award className="h-4 w-4" />
          </Button>
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