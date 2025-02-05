
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fixture } from "@/types/volleyball";
import { MatchRow } from "./MatchRow";

interface MatchesTableProps {
  matches: Fixture[];
  scores: {
    [key: string]: {
      home: number[];
      away: number[];
    };
  };
  onScoreChange: (matchId: string, team: 'home' | 'away', setIndex: number, value: string) => void;
  onSave: (match: Fixture) => void;
}

export const MatchesTable = ({ matches, scores, onScoreChange, onSave }: MatchesTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Teams</TableHead>
            <TableHead className="w-[120px]">Court</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[120px]">Time</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="text-center">Set 1</TableHead>
            <TableHead className="text-center">Set 2</TableHead>
            <TableHead className="text-center">Set 3</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match: Fixture) => (
            <MatchRow
              key={match.Id}
              match={match}
              scores={scores[match.Id] || { home: [0, 0, 0], away: [0, 0, 0] }}
              onScoreChange={onScoreChange}
              onSave={onSave}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
