
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
            <TableHead className="text-center">Drawn</TableHead>
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
            <TableRow key={stat.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{stat.team.team_name}</TableCell>
              <TableCell className="text-center">{stat.games_played}</TableCell>
              <TableCell className="text-center">{stat.wins}</TableCell>
              <TableCell className="text-center">{stat.losses}</TableCell>
              <TableCell className="text-center">{stat.draws}</TableCell>
              <TableCell className="text-center">{stat.points_for}</TableCell>
              <TableCell className="text-center">{stat.points_against}</TableCell>
              <TableCell className="text-center">{stat.points_percentage.toFixed(1)}%</TableCell>
              <TableCell className="text-center">{stat.bonus_points}</TableCell>
              <TableCell className="text-center font-bold">{stat.total_points}</TableCell>
              <TableCell>
                <Button
                  onClick={() => onTeamClick(stat.team_id)}
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
