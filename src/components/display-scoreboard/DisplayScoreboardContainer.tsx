import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Score, SetScores } from "@/types/volleyball";
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
    if (!match) {
      console.log('No match data available');
      return;
    }

    console.log('Setting up real-time subscription for match:', match.id);

    // First fetch current scores
    const fetchCurrentScores = async () => {
      console.log('Fetching current scores for match:', match.id);
      const { data: scores, error } = await supabase
        .from('match_scores_v2')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scores:', error);
        return;
      }

      console.log('Received scores:', scores);

      if (scores && scores.length > 0) {
        // Get the latest score
        const latestScore = scores[0];
        console.log('Setting current score from latest:', latestScore);
        setCurrentScore({
          home: latestScore.home_score || 0,
          away: latestScore.away_score || 0
        });

        // Group scores by set number
        const scoresBySet = scores.reduce((acc: { [key: number]: MatchScore }, score) => {
          acc[score.set_number] = score;
          return acc;
        }, {});

        // Set up all set scores
        const newSetScores = { home: [], away: [] };
        for (let i = 1; i <= 3; i++) {
          const setScore = scoresBySet[i];
          if (setScore) {
            newSetScores.home[i - 1] = setScore.home_score || 0;
            newSetScores.away[i - 1] = setScore.away_score || 0;
          }
        }
        console.log('Setting set scores:', newSetScores);
        setSetScores(newSetScores);
      }
    };

    fetchCurrentScores();

    // Set up real-time subscription
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
            setSetScores(prevSetScores => {
              const newSetScores = {
                home: [...prevSetScores.home],
                away: [...prevSetScores.away]
              };
              
              if (newScore.set_number <= 3) {
                newSetScores.home[newScore.set_number - 1] = newScore.home_score || 0;
                newSetScores.away[newScore.set_number - 1] = newScore.away_score || 0;
              }
              return newSetScores;
            });
          }
        }
      )
      .subscribe();

    // Subscribe to team switch events
    const switchChannel = supabase
      .channel('team-switch')
      .on(
        'broadcast',
        { event: 'team_switch' },
        ({ payload }) => {
          console.log('Received team switch event:', payload);
          setIsTeamsSwitched(payload.isTeamsSwitched);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(channel);
      supabase.removeChannel(switchChannel);
    };
  }, [match]);

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