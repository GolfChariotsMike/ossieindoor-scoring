
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, parse, isPast } from "date-fns";
import { Fixture } from "@/types/volleyball";
import { ScoreInput } from "./ScoreInput";
import { Badge } from "@/components/ui/badge";

interface MatchRowProps {
  match: Fixture;
  scores: {
    home: number[];
    away: number[];
  };
  onScoreChange: (matchId: string, team: 'home' | 'away', setIndex: number, value: string) => void;
  onSave: (match: Fixture) => void;
}

export const MatchRow = ({ match, scores, onScoreChange, onSave }: MatchRowProps) => {
  const matchDate = parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date());
  const hasScores = scores?.home?.some(score => score > 0) || scores?.away?.some(score => score > 0);
  const isMatchComplete = hasScores && scores.home.length === 3 && scores.away.length === 3;
  const isPastMatch = isPast(matchDate);

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="font-semibold">{match.HomeTeam}</div>
        <div className="text-gray-500">vs</div>
        <div className="font-semibold">{match.AwayTeam}</div>
      </TableCell>
      <TableCell>{match.PlayingAreaName}</TableCell>
      <TableCell>{format(matchDate, 'dd/MM/yyyy')}</TableCell>
      <TableCell>{format(matchDate, 'h:mm a')}</TableCell>
      <TableCell>
        {isPastMatch ? (
          hasScores ? (
            <Badge variant="default" className="bg-green-500">Scores Saved</Badge>
          ) : (
            <Badge variant="destructive">No Scores</Badge>
          )
        ) : (
          <Badge variant="secondary">Future Match</Badge>
        )}
      </TableCell>
      {[0, 1, 2].map((setIndex) => (
        <TableCell key={setIndex} className="text-center">
          <div className="flex flex-col space-y-2">
            <ScoreInput
              value={scores?.home[setIndex] || 0}
              onChange={(value) => onScoreChange(match.Id, 'home', setIndex, value)}
            />
            <ScoreInput
              value={scores?.away[setIndex] || 0}
              onChange={(value) => onScoreChange(match.Id, 'away', setIndex, value)}
            />
          </div>
        </TableCell>
      ))}
      <TableCell>
        <Button
          onClick={() => onSave(match)}
          className="w-full bg-volleyball-red hover:bg-volleyball-red/90 text-white"
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
};
