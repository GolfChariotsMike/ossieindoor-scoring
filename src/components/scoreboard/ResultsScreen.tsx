import { Match, SetScores } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ResultsScreenProps {
  match: Match;
  setScores: SetScores;
  isTeamsSwitched: boolean;
  onStartNextMatch?: () => void;
}

export const ResultsScreen = ({ match, setScores, isTeamsSwitched, onStartNextMatch }: ResultsScreenProps) => {
  const calculateTeamResults = (teamScores: number[], opposingScores: number[], teamName: string) => {
    let setPoints = 0;
    let drawPoints = 0;
    
    teamScores.forEach((score, index) => {
      if (score > opposingScores[index]) {
        setPoints += 2;
      } else if (score === opposingScores[index]) {
        drawPoints += 1;
      }
    });
    
    const bonusPoints = teamScores.reduce((total, score) => total + Math.floor(score / 10), 0);
    
    return {
      name: teamName,
      setPoints,
      drawPoints,
      bonusPoints,
      totalPoints: setPoints + drawPoints + bonusPoints
    };
  };

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  const homeResults = calculateTeamResults(
    isTeamsSwitched ? setScores.away : setScores.home,
    isTeamsSwitched ? setScores.home : setScores.away,
    homeTeam.name
  );
  
  const awayResults = calculateTeamResults(
    isTeamsSwitched ? setScores.home : setScores.away,
    isTeamsSwitched ? setScores.away : setScores.home,
    awayTeam.name
  );

  const getWinnerText = () => {
    if (homeResults.totalPoints > awayResults.totalPoints) {
      return `${homeResults.name} Wins!`;
    } else if (awayResults.totalPoints > homeResults.totalPoints) {
      return `${awayResults.name} Wins!`;
    }
    return "It's a Draw!";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="absolute inset-0">
        <Fireworks />
      </div>
      <div className="relative w-[90%] max-w-7xl z-[10000]">
        <div className="bg-white/90 p-12 rounded-3xl shadow-2xl backdrop-blur-sm">
          <h1 className="text-8xl font-sets mb-16 text-black text-center animate-[scale_2s_ease-in-out_infinite]">
            {getWinnerText()}
          </h1>
          
          <div className="grid grid-cols-2 gap-16 mb-12">
            {[homeResults, awayResults].map((result) => (
              <div 
                key={result.name}
                className="bg-volleyball-black rounded-2xl p-10 flex flex-col items-center transition-transform hover:scale-105 duration-300"
              >
                <h2 className="text-6xl font-sets mb-10 text-white animate-fade-in">
                  {result.name}
                </h2>
                <div className="space-y-8 text-4xl font-score text-white">
                  <p className="animate-scale-in">Set Points: {result.setPoints}</p>
                  <p className="animate-scale-in delay-75">Draw Points: {result.drawPoints}</p>
                  <p className="animate-scale-in delay-150">Bonus Points: {result.bonusPoints}</p>
                  <div className="w-full h-px bg-white/20 my-8"></div>
                  <p className="text-5xl animate-[pulse_3s_ease-in-out_infinite]">
                    Total: {result.totalPoints}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {onStartNextMatch && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={onStartNextMatch}
                className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream text-xl py-6 px-8"
              >
                <ArrowRight className="w-6 h-6 mr-2" />
                Start Next Match
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};