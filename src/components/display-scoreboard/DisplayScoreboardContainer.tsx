import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Match, Score, SetScores, Fixture } from "@/types/volleyball";
import { DisplayScoreboardContent } from "./DisplayScoreboardContent";
import { useMatchData } from "@/hooks/useMatchData";
import { Database } from "@/integrations/supabase/types";

type MatchScore = Database['public']['Tables']['match_scores_v2']['Row'];

export const DisplayScoreboardContainer = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  useEffect(() => {
    if (!match) return;

    const channel = supabase
      .channel('match-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_scores_v2',
          filter: `match_id=eq.${match.id}`
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          const newScore = payload.new as MatchScore;
          
          if (newScore) {
            // Update current score
            setCurrentScore({
              home: newScore.home_score || 0,
              away: newScore.away_score || 0
            });

            // Update set scores
            const newSetScores = {
              home: [...setScores.home],
              away: [...setScores.away]
            };
            
            if (newScore.set_number <= 3) {
              newSetScores.home[newScore.set_number - 1] = newScore.home_score || 0;
              newSetScores.away[newScore.set_number - 1] = newScore.away_score || 0;
              setSetScores(newSetScores);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match, setScores]);

  return (
    <DisplayScoreboardContent
      match={match}
      isLoading={isLoading}
      currentScore={currentScore}
      setScores={setScores}
      isTeamsSwitched={isTeamsSwitched}
    />
  );
};