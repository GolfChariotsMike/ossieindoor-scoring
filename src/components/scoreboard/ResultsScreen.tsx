import { Match, SetScores } from "@/types/volleyball";

interface ResultsScreenProps {
  match: Match;
  setScores: SetScores;
  isTeamsSwitched: boolean;
}

interface TeamResult {
  name: string;
  totalPoints: number;
  setPoints: number;
  bonusPoints: number;
}

export const ResultsScreen = ({ match, setScores, isTeamsSwitched }: ResultsScreenProps) => {
  const calculateTeamResults = (homeScores: number[], awayScores: number[], teamName: string, isHomeTeam: boolean): TeamResult => {
    let setPoints = 0;
    const scores = isHomeTeam ? homeScores : awayScores;
    const opposingScores = isHomeTeam ? awayScores : homeScores;
    
    // Calculate set points (2 points for each set won)
    scores.forEach((score, index) => {
      if (score > opposingScores[index]) {
        setPoints += 2;
      }
    });
    
    // Calculate bonus points (1 point per 10 points scored)
    const bonusPoints = scores.reduce((total, score) => total + Math.floor(score / 10), 0);
    
    return {
      name: teamName,
      setPoints,
      bonusPoints,
      totalPoints: setPoints + bonusPoints
    };
  };

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  const homeResults = calculateTeamResults(setScores.home, setScores.away, homeTeam.name, true);
  const awayResults = calculateTeamResults(setScores.home, setScores.away, awayTeam.name, false);

  const getWinnerText = () => {
    if (homeResults.totalPoints > awayResults.totalPoints) {
      return `${homeResults.name} Wins!`;
    } else if (awayResults.totalPoints > homeResults.totalPoints) {
      return `${awayResults.name} Wins!`;
    }
    return "It's a Draw!";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-volleyball-cream w-4/5 mx-auto">
      <h1 className="text-[180px] font-sets mb-12">{getWinnerText()}</h1>
      
      <div className="grid grid-cols-2 gap-16 w-full">
        {[homeResults, awayResults].map((result) => (
          <div 
            key={result.name}
            className="bg-volleyball-black rounded-2xl p-8 flex flex-col items-center"
          >
            <h2 className="text-4xl font-sets mb-6">{result.name}</h2>
            <div className="space-y-4 text-2xl font-score">
              <p>Set Points: {result.setPoints}</p>
              <p>Bonus Points: {result.bonusPoints}</p>
              <p className="text-3xl mt-6">Total: {result.totalPoints}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};