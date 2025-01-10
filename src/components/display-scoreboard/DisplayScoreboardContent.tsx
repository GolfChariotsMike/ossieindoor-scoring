import { Match, Score, SetScores } from "@/types/volleyball";
import { LoadingSpinner } from "../scoreboard/LoadingSpinner";
import { MatchHeader } from "../scoreboard/MatchHeader";

interface DisplayScoreboardContentProps {
  match: Match | undefined;
  isLoading: boolean;
  currentScore: Score;
  setScores: SetScores;
  isTeamsSwitched: boolean;
  timeLeft: number;
  isBreak: boolean;
}

export const DisplayScoreboardContent = ({
  match,
  isLoading,
  currentScore,
  setScores,
  isTeamsSwitched,
  timeLeft,
  isBreak,
}: DisplayScoreboardContentProps) => {
  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto h-screen p-6">
        <div className="flex flex-col justify-between h-full">
          <MatchHeader
            court={match.court}
            startTime={match.startTime}
            division={match.division}
          />

          <div className={`font-score text-[12rem] tracking-[0.2em] leading-none mb-2 text-center ${isBreak ? 'text-blue-400' : 'text-white'} [text-shadow:_4px_4px_0_rgb(0_0_0)]`}>
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
            {/* Home Team */}
            <div className="text-center flex flex-col items-center">
              <div className="font-display text-white uppercase tracking-[0.2em] mb-8 w-[450px] h-24 flex items-center justify-center [text-shadow:_4px_4px_0_rgb(0_0_0)] text-7xl">
                {homeTeam.name}
              </div>
              <div className="w-[450px] h-[400px] text-[16rem] bg-volleyball-black text-white font-score rounded-3xl mb-8">
                {currentScore.home}
              </div>
            </div>

            {/* Set Scores */}
            <div className="w-64">
              <div className="flex flex-col items-center">
                <div className="text-white font-sets text-4xl uppercase tracking-[0.2em] mb-6">
                  SETS
                </div>
                {Array.from({ length: 3 }, (_, i) => ({
                  home: isTeamsSwitched ? (setScores.away[i] ?? 0) : (setScores.home[i] ?? 0),
                  away: isTeamsSwitched ? (setScores.home[i] ?? 0) : (setScores.away[i] ?? 0),
                  number: i + 1
                })).map((set) => (
                  <div 
                    key={set.number}
                    className="grid grid-cols-2 gap-3 w-[110%] mb-4"
                  >
                    <div className="bg-volleyball-black rounded-2xl p-8 flex items-center justify-center">
                      <span className="text-white text-7xl font-score">
                        {set.home}
                      </span>
                    </div>
                    <div className="bg-volleyball-black rounded-2xl p-8 flex items-center justify-center">
                      <span className="text-white text-7xl font-score">
                        {set.away}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center flex flex-col items-center">
              <div className="font-display text-white uppercase tracking-[0.2em] mb-8 w-[450px] h-24 flex items-center justify-center [text-shadow:_4px_4px_0_rgb(0_0_0)] text-7xl">
                {awayTeam.name}
              </div>
              <div className="w-[450px] h-[400px] text-[16rem] bg-volleyball-black text-white font-score rounded-3xl mb-8">
                {currentScore.away}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};