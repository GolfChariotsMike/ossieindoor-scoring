import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { format, parse } from "date-fns";
import { Fixture } from "@/types/volleyball";
import { ScoreInput } from "./ScoreInput";

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
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="font-semibold">{match.HomeTeam}</div>
        <div className="text-gray-500">vs</div>
        <div className="font-semibold">{match.AwayTeam}</div>
      </TableCell>
      <TableCell>{match.PlayingAreaName}</TableCell>
      <TableCell>{match.DivisionName}</TableCell>
      <TableCell>
        {format(parse(match.DateTime, 'dd/MM/yyyy HH:mm', new Date()), 'h:mm a')}
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