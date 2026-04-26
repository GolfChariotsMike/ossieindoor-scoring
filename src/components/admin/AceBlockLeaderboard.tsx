import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Zap, Shield } from "lucide-react";

interface TeamStat {
  team_name: string;
  aces: number;
  blocks: number;
}

const medal = (i: number) => {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}.`;
};

export const AceBlockLeaderboard = () => {
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("match_data_v2")
        .select("home_team_name, away_team_name, home_aces, away_aces, home_blocks, away_blocks")
        .eq("has_final_score", true);

      if (error) {
        console.error("Error fetching ace/block stats:", error);
        setIsLoading(false);
        return;
      }

      const teamMap = new Map<string, { aces: number; blocks: number }>();

      for (const row of data ?? []) {
        const addTeam = (name: string, aces: number, blocks: number) => {
          if (!name) return;
          const existing = teamMap.get(name) ?? { aces: 0, blocks: 0 };
          teamMap.set(name, {
            aces: existing.aces + (aces || 0),
            blocks: existing.blocks + (blocks || 0),
          });
        };
        addTeam(row.home_team_name, row.home_aces ?? 0, row.home_blocks ?? 0);
        addTeam(row.away_team_name, row.away_aces ?? 0, row.away_blocks ?? 0);
      }

      const result: TeamStat[] = Array.from(teamMap.entries())
        .map(([team_name, { aces, blocks }]) => ({ team_name, aces, blocks }))
        .filter(t => t.aces > 0 || t.blocks > 0);

      setStats(result);
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const acesSorted = [...stats].sort((a, b) => b.aces - a.aces);
  const blocksSorted = [...stats].sort((a, b) => b.blocks - a.blocks);

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading stats...</div>;
  if (stats.length === 0) return <div className="text-center py-12 text-gray-400">No ace/block data recorded yet.</div>;

  const LeaderboardTable = ({
    title,
    icon,
    data,
    statKey,
    color,
    iconColor,
  }: {
    title: string;
    icon: React.ReactNode;
    data: TeamStat[];
    statKey: "aces" | "blocks";
    color: string;
    iconColor: string;
  }) => (
    <div className="space-y-3">
      <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}>
        {icon}
        {title}
      </h3>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-volleyball-black text-white">
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-4 py-3">Team</th>
              <th className={`text-center px-4 py-3 ${iconColor}`}>{title}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((team, i) => (
              <tr
                key={team.team_name}
                className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${i < 3 ? "font-semibold" : ""}`}
              >
                <td className="px-4 py-3 text-lg">{medal(i)}</td>
                <td className="px-4 py-3">{team.team_name}</td>
                <td className={`px-4 py-3 text-center font-bold ${color}`}>{team[statKey]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Leaderboards
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeaderboardTable
          title="Aces"
          icon={<Zap className="h-5 w-5" />}
          data={acesSorted}
          statKey="aces"
          color="text-yellow-600"
          iconColor="text-yellow-400"
        />
        <LeaderboardTable
          title="Blocks"
          icon={<Shield className="h-5 w-5" />}
          data={blocksSorted}
          statKey="blocks"
          color="text-blue-600"
          iconColor="text-blue-400"
        />
      </div>
    </div>
  );
};
