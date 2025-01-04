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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { parse, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";

const Scoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fixture = location.state?.fixture as Fixture | undefined;
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);

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
  } = useGameState();

  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  // Parse the fixture date from "DD/MM/YYYY HH:mm" format
  const parseFixtureDate = (dateStr: string) => {
    try {
      return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return new Date();
    }
  };

  // Query to get next match using the fixture date
  const { data: nextMatches = [] } = useQuery({
    queryKey: ["matches", fixture?.DateTime ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const queryDate = fixture?.DateTime ? parseFixtureDate(fixture.DateTime) : new Date();
      const result = await fetchMatchData(undefined, queryDate);
      return Array.isArray(result) ? result : [];
    },
  });

  const findNextMatch = () => {
    if (!fixture || nextMatches.length === 0) return null;
    
    // Sort matches by DateTime to ensure correct sequence
    const sortedMatches = [...nextMatches].sort((a, b) => 
      parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime()
    );
    
    const currentMatchIndex = sortedMatches.findIndex(
      (m: Fixture) => m.Id === fixture.Id
    );
    
    if (currentMatchIndex === -1) return null;
    
    // Find the next match on the same court after the current match time
    const nextMatch = sortedMatches
      .slice(currentMatchIndex + 1)
      .find((m: Fixture) => 
        m.PlayingAreaName === `Court ${courtId}` && 
        parseFixtureDate(m.DateTime) > parseFixtureDate(fixture.DateTime)
      );
    
    console.log('Next match found:', nextMatch);
    return nextMatch;
  };

  const handleStartNextMatch = () => {
    console.log('Starting next match manually');
    const nextMatch = findNextMatch();
    if (nextMatch) {
      console.log('Navigating to next match:', nextMatch);
      navigate(`/scoreboard/${courtId}`, {
        state: { fixture: nextMatch },
        replace: true
      });
    } else {
      console.log('No next match found, returning to court selection');
      navigateToCourtSelection();
    }
  };

  useEffect(() => {
    if (isMatchComplete && match && hasGameStarted) {
      console.log('Match complete, saving scores');
      saveMatchScores(match.id, setScores.home, setScores.away);
      setResultsDisplayStartTime(Date.now());
    }
  }, [isMatchComplete, match, setScores, saveMatchScores, hasGameStarted]);

  useEffect(() => {
    const checkResultsDisplayTime = () => {
      if (resultsDisplayStartTime && Date.now() - resultsDisplayStartTime >= 30000) {
        console.log('Results display time complete, checking for next match');
        handleStartNextMatch();
      }
    };

    const timer = setInterval(checkResultsDisplayTime, 1000);
    return () => clearInterval(timer);
  }, [resultsDisplayStartTime]);

  const handleBack = () => {
    if (hasGameStarted) {
      setShowExitConfirmation(true);
    } else {
      navigateToCourtSelection();
    }
  };

  const navigateToCourtSelection = () => {
    const date = fixture 
      ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    
    navigate(`/court/${courtId}/${date}`, {
      replace: true
    });
  };

  const confirmExit = () => {
    navigateToCourtSelection();
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
              onClick={handleStartNextMatch}
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