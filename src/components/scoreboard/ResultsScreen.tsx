import { Match, SetScores } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";

interface ResultsScreenProps {
  match: Match;
  setScores: SetScores;
  isTeamsSwitched: boolean;
}

export const ResultsScreen = ({ match, setScores, isTeamsSwitched }: ResultsScreenProps) => {
  const calculateTeamResults = (teamScores: number[], opposingScores: number[], teamName: string) => {
    let setPoints = 0;
    
    teamScores.forEach((score, index) => {
      if (score > opposingScores[index]) {
        setPoints += 2;
      }
    });
    
    const bonusPoints = teamScores.reduce((total, score) => total + Math.floor(score / 10), 0);
    
    return {
      name: teamName,
      setPoints,
      bonusPoints,
      totalPoints: setPoints + bonusPoints
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
        
        <div className="grid grid-cols-2 gap-16 w-full mb-8">
          {[homeResults, awayResults].map((result) => (
            <div 
              key={result.name}
              className="bg-volleyball-black rounded-2xl p-8 flex flex-col items-center transition-transform hover:scale-105 duration-300"
            >
              <h2 className="text-5xl font-sets mb-8 text-volleyball-cream animate-fade-in">
                {result.name}
              </h2>
              <div className="space-y-6 text-3xl font-score text-volleyball-cream">
                <p className="text-4xl animate-scale-in">Set Points: {result.setPoints}</p>
                <p className="text-4xl animate-scale-in delay-150">Bonus Points: {result.bonusPoints}</p>
                <p className="text-5xl mt-8 animate-[pulse_3s_ease-in-out_infinite]">
                  Total: {result.totalPoints}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};