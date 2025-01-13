import { ScoreboardContainer } from "./scoreboard/ScoreboardContainer";
import StandaloneScoreboard from "./scoreboard/StandaloneScoreboard";
import { useLocation } from "react-router-dom";

const Scoreboard = () => {
  const location = useLocation();
  const isStandalone = location.state?.standalone === true;

  return isStandalone ? <StandaloneScoreboard /> : <ScoreboardContainer />;
};

export default Scoreboard;