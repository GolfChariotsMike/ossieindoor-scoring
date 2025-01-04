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
    <>
      <Fireworks />
      <div className="flex flex-col items-center justify-center h-full text-volleyball-black bg-white/90 w-4/5 mx-auto relative z-10">
        <h1 className="text-8xl font-sets mb-12 text-black animate-[scale_2s_ease-in-out_infinite]">
          {getWinnerText()}
        </h1>
        
        <div className="grid grid-cols-2 gap-16 w-full max-w-[1600px] mb-8">
          {[homeResults, awayResults].map((result) => (
            <div 
              key={result.name}
              className="bg-volleyball-black rounded-2xl p-12 flex flex-col items-center transition-transform hover:scale-105 duration-300 z-50 shadow-2xl min-h-[600px]"
            >
              <h2 className="text-6xl font-sets mb-12 text-white animate-fade-in">
                {result.name}
              </h2>
              <div className="space-y-8 text-4xl font-score text-white w-full">
                <p className="text-5xl animate-scale-in flex justify-between">
                  <span>Set Points:</span>
                  <span>{result.setPoints}</span>
                </p>
                <p className="text-5xl animate-scale-in delay-75 flex justify-between">
                  <span>Draw Points:</span>
                  <span>{result.drawPoints}</span>
                </p>
                <p className="text-5xl animate-scale-in delay-150 flex justify-between">
                  <span>Bonus Points:</span>
                  <span>{result.bonusPoints}</span>
                </p>
                <p className="text-7xl mt-12 animate-[pulse_3s_ease-in-out_infinite] flex justify-between border-t-4 border-white/20 pt-8">
                  <span>Total:</span>
                  <span>{result.totalPoints}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {onStartNextMatch && (
          <Button
            variant="outline"
            size="lg"
            onClick={onStartNextMatch}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream mt-4"
          >
            <ArrowRight className="w-6 h-6 mr-2" />
            Start Next Match
          </Button>
        )}
      </div>
    </>
  );
};