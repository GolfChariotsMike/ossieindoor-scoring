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
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  
  // Fetch the latest active match for this court
  const { data: match, isLoading } = useMatchData(courtId!);

  useEffect(() => {
    if (!match) return;

    console.log('Setting up real-time subscription for match:', match.id);

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

    // Also fetch the current scores when first loading
    const fetchCurrentScores = async () => {
      const { data: scores } = await supabase
        .from('match_scores_v2')
        .select('*')
        .eq('match_id', match.id)
        .order('set_number', { ascending: true });

      if (scores && scores.length > 0) {
        // Get the latest score
        const latestScore = scores[scores.length - 1];
        setCurrentScore({
          home: latestScore.home_score || 0,
          away: latestScore.away_score || 0
        });

        // Set up all set scores
        const newSetScores = { home: [], away: [] };
        scores.forEach(score => {
          if (score.set_number <= 3) {
            newSetScores.home[score.set_number - 1] = score.home_score || 0;
            newSetScores.away[score.set_number - 1] = score.away_score || 0;
          }
        });
        setSetScores(newSetScores);
      }
    };

    fetchCurrentScores();

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