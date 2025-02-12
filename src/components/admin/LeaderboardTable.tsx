
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface LeaderboardTableProps {
  stats: any[];
  onTeamClick: (teamId: string) => void;
}

export const LeaderboardTable = ({ stats, onTeamClick }: LeaderboardTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Played</TableHead>
            <TableHead className="text-center">Won</TableHead>
            <TableHead className="text-center">Lost</TableHead>
            <TableHead className="text-center">Points For</TableHead>
            <TableHead className="text-center">Points Against</TableHead>
            <TableHead className="text-center">%</TableHead>
            <TableHead className="text-center">Bonus Points</TableHead>
            <TableHead className="text-center">Total Points</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat, index) => (
            <TableRow key={stat.team_name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{stat.team_name}</TableCell>
              <TableCell className="text-center">{stat.matches_played}</TableCell>
              <TableCell className="text-center">{Number(stat.wins).toFixed(1)}</TableCell>
              <TableCell className="text-center">{Number(stat.losses).toFixed(1)}</TableCell>
              <TableCell className="text-center">{stat.total_points_for}</TableCell>
              <TableCell className="text-center">{stat.total_points_against}</TableCell>
              <TableCell className="text-center">{stat.points_percentage}%</TableCell>
              <TableCell className="text-center">{stat.bonus_points}</TableCell>
              <TableCell className="text-center font-bold">{stat.total_points}</TableCell>
              <TableCell>
                <Button
                  onClick={() => onTeamClick(stat.team_name)}
                  variant="outline"
                  size="sm"
                >
                  History
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
