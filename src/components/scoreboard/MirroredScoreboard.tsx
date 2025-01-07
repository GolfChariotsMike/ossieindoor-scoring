import { useParams, useLocation } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { Timer } from "./Timer";
import { GameScores } from "./GameScores";
import { LoadingSpinner } from "./LoadingSpinner";
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
  const [setScores, setSetScores] = useState({ home: [], away: [] });
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
          console.log('Display received update:', payload);
          setCurrentScore(payload.currentScore);
          // Convert time string (MM:SS) to seconds
          if (payload.timeLeft) {
            const [minutes, seconds] = payload.timeLeft.split(':').map(Number);
            setTimeLeft(minutes * 60 + seconds);
          }
          setIsBreak(payload.isBreak);
          setIsTeamsSwitched(payload.isTeamsSwitched);
          setIsMatchComplete(payload.isMatchComplete);
          if (payload.setScores) {
            setSetScores(payload.setScores);
          }
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
        <div className="origin-center rotate-180 h-full flex flex-col justify-between">
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
            setScores={setScores}
            match={match}
            isTeamsSwitched={!isTeamsSwitched}
            onScoreUpdate={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default MirroredScoreboard;