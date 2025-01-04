import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { Timer } from "./scoreboard/Timer";
import { BackButton } from "./scoreboard/BackButton";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";
import { GameScores } from "./scoreboard/GameScores";
import { LoadingSpinner } from "./scoreboard/LoadingSpinner";
import { ResultsScreen } from "./scoreboard/ResultsScreen";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";

const parseFixtureDate = (dateStr: string) => {
  try {
    return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

const Scoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const previousFixtureIdRef = useRef<string | null>(null);

  const {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
    hasGameStarted,
    resetGameState
  } = useGameState();

  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  const { data: nextMatches = [] } = useQuery({
    queryKey: ["matches", fixture?.DateTime ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const queryDate = fixture?.DateTime ? parseFixtureDate(fixture.DateTime) : new Date();
      const result = await fetchMatchData(undefined, queryDate);
      return (Array.isArray(result) ? result : []).map(item => ({
        ...item,
        Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
      })) as Fixture[];
    },
  });

  // Reset game state only when fixture ID changes
  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      resetGameState();
      previousFixtureIdRef.current = fixture.Id;
    }
  }, [fixture?.Id, resetGameState]);

  useEffect(() => {
    if (isMatchComplete && match && hasGameStarted) {
      console.log('Match complete, saving scores');
      saveMatchScores(match.id, setScores.home, setScores.away);
    }
  }, [isMatchComplete, match, setScores, saveMatchScores, hasGameStarted]);

  const findNextMatch = (matches: Fixture[]) => {
    if (!fixture || matches.length === 0) return null;
    
    const currentFixtureDate = parseFixtureDate(fixture.DateTime);
    
    const sortedMatches = [...matches].sort((a, b) => 
      parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime()
    );
    
    const nextMatch = sortedMatches.find((m: Fixture) => 
      m.Id !== fixture.Id && 
      m.PlayingAreaName === `Court ${courtId}` && 
      parseFixtureDate(m.DateTime) > currentFixtureDate
    );
    
    return nextMatch;
  };

  const handleStartNextMatch = (nextMatch: Fixture | null) => {
    if (nextMatch) {
      window.location.href = `/scoreboard/${courtId}?fixture=${encodeURIComponent(JSON.stringify(nextMatch))}`;
    } else {
      navigate('/');
    }
  };

  const handleBack = () => {
    if (hasGameStarted) {
      setShowExitConfirmation(true);
    } else {
      navigate('/');
    }
  };

  const confirmExit = () => {
    navigate('/');
  };

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />
        
        {isMatchComplete && (
          <div className="absolute top-6 right-6 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartNextMatch(findNextMatch(nextMatches))}
              className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
            >
              <FastForward className="w-4 h-4 mr-1" />
              Next Match
            </Button>
          </div>
        )}

        <div className="flex flex-col justify-between h-full">
          {isMatchComplete ? (
            <ResultsScreen
              match={match}
              setScores={setScores}
              isTeamsSwitched={isTeamsSwitched}
            />
          ) : (
            <>
              <Timer
                initialMinutes={1}
                onComplete={handleTimerComplete}
                onSwitchTeams={handleSwitchTeams}
                isBreak={isBreak}
                isMatchComplete={isMatchComplete}
                fixture={fixture}
                onNextMatch={() => handleStartNextMatch(findNextMatch(nextMatches))}
              />

              <GameScores
                currentScore={currentScore}
                setScores={setScores}
                match={match}
                isTeamsSwitched={isTeamsSwitched}
                onScoreUpdate={handleScore}
              />
            </>
          )}
        </div>

        <ExitConfirmationDialog
          open={showExitConfirmation}
          onOpenChange={setShowExitConfirmation}
          onConfirm={confirmExit}
        />
      </div>
    </div>
  );
};

export default Scoreboard;