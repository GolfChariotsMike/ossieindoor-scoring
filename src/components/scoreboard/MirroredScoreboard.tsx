import { useParams, useLocation } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { Timer } from "./Timer";
import { GameScores } from "./GameScores";
import { LoadingSpinner } from "./LoadingSpinner";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const MirroredScoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  const [currentScore, setCurrentScore] = useState({ home: 0, away: 0 });
  const [timeLeft, setTimeLeft] = useState(840); // 14 minutes in seconds
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);

  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  useEffect(() => {
    const channel = supabase.channel('scoreboard-updates')
      .on(
        'broadcast',
        { event: 'score-update' },
        ({ payload }) => {
          console.log('Received score update:', payload);
          setCurrentScore(payload.currentScore);
          setTimeLeft(payload.timeLeft);
          setIsBreak(payload.isBreak);
          setIsTeamsSwitched(payload.isTeamsSwitched);
          setIsMatchComplete(payload.isMatchComplete);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <div className="flex flex-col justify-between h-full transform rotate-180">
          <Timer
            initialMinutes={14}
            onComplete={() => {}}
            onSwitchTeams={() => {}}
            isBreak={isBreak}
            isMatchComplete={isMatchComplete}
            fixture={fixture}
            timeLeft={timeLeft}
            isReadOnly={true}
          />

          <GameScores
            currentScore={currentScore}
            setScores={{ home: [], away: [] }}
            match={match}
            isTeamsSwitched={!isTeamsSwitched} // Invert the teams for the mirrored display
            onScoreUpdate={() => {}} // Read-only mode
          />
        </div>
      </div>
    </div>
  );
};

export default MirroredScoreboard;