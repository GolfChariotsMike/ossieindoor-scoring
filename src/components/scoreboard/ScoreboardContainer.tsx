import { useParams, useLocation } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { useGameState } from "@/hooks/useGameState";
import { useMatchInitialization } from "@/hooks/useMatchInitialization";
import { LoadingSpinner } from "./LoadingSpinner";
import { ScoreboardContent } from "./ScoreboardContent";

export const ScoreboardContainer = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  console.log('ScoreboardContainer - Initializing with fixture:', fixture);

  const gameState = useGameState();
  const { match, isLoading } = useMatchInitialization(
    courtId!,
    fixture,
    gameState.resetGameState
  );

  if (isLoading || !match) {
    console.log('ScoreboardContainer - Loading state');
    return <LoadingSpinner />;
  }

  console.log('ScoreboardContainer - Rendering with match:', match);
  return (
    <ScoreboardContent
      courtId={courtId!}
      fixture={fixture}
      match={match}
      gameState={gameState}
    />
  );
};

export default ScoreboardContainer;