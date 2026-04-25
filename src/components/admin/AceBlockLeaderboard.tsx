import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Zap, Shield } from "lucide-react";

interface TeamStat {
  team_name: string;
  aces: number;
  blocks: number;
  total: number;
}

export const AceBlockLeaderboard = () => {
  const [stats, setStats] = useState<TeamStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"total" | "aces" | "blocks">("total");

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

      // Aggregate per team
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
        .map(([team_name, { aces, blocks }]) => ({
          team_name,
          aces,
          blocks,
          total: aces + blocks,
        }))
        .filter(t => t.total > 0);

      setStats(result);
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const sorted = [...stats].sort((a, b) => b[sortBy] - a[sortBy]);

  const medal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}.`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ace & Block Leaderboard
        </h2>
        <div className="flex gap-2">
          {(["total", "aces", "blocks"] as const).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 rounded text-sm font-medium border transition-colors ${
                sortBy === key
                  ? "bg-volleyball-black text-white border-volleyball-black"
                  : "bg-white text-volleyball-black border-gray-300 hover:border-volleyball-black"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading stats...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No ace/block data recorded yet.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-volleyball-black text-white">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Team</th>
                <th className="text-center px-4 py-3">
                  <span className="flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-400" /> Aces
                  </span>
                </th>
                <th className="text-center px-4 py-3">
                  <span className="flex items-center justify-center gap-1">
                    <Shield className="h-4 w-4 text-blue-400" /> Blocks
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, i) => (
                <tr
                  key={team.team_name}
                  className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                    i < 3 ? "font-semibold" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-lg">{medal(i)}</td>
                  <td className="px-4 py-3">{team.team_name}</td>
                  <td className="px-4 py-3 text-center text-yellow-600">{team.aces}</td>
                  <td className="px-4 py-3 text-center text-blue-600">{team.blocks}</td>
                  <td className="px-4 py-3 text-center font-bold">{team.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
