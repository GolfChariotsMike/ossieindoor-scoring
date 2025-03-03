
import { useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { parse, format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export const useNextMatch = (courtId: string, fixture?: Fixture) => {
  const navigate = useNavigate();

  const parseFixtureDate = (dateStr: string) => {
    try {
      return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
    } catch (error) {
      console.error('Error parsing date:', {
        dateStr,
        error,
        type: typeof dateStr
      });
      return new Date();
    }
  };

  const findNextMatch = (matches: Fixture[]) => {
    if (!fixture || matches.length === 0) {
      console.log('No fixture or matches available for next match search', {
        hasFixture: !!fixture,
        matchesCount: matches.length
      });
      return null;
    }
    
    try {
      const currentFixtureDate = parseFixtureDate(fixture.DateTime);
      
      // Sort matches by date
      const sortedMatches = [...matches].sort((a, b) => 
        parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime()
      );
      
      // Find matches on the same court that start after the current match
      const nextMatch = sortedMatches.find((m: Fixture) => 
        m.Id !== fixture.Id && 
        m.PlayingAreaName === `Court ${courtId}` && 
        parseFixtureDate(m.DateTime) > currentFixtureDate
      );
      
      console.log('Next match search results:', {
        currentFixture: fixture.Id,
        currentTime: currentFixtureDate.toISOString(),
        nextMatchId: nextMatch?.Id,
        nextMatchTime: nextMatch ? parseFixtureDate(nextMatch.DateTime).toISOString() : null,
        searchedMatches: sortedMatches.length
      });
      
      return nextMatch;
    } catch (error) {
      console.error('Error finding next match:', {
        error,
        fixture,
        matchesCount: matches.length
      });
      return null;
    }
  };

  const navigateToCourtSelection = () => {
    try {
      const date = fixture 
        ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      
      console.log('Navigating to court selection with date:', date);
      navigate(`/court/${courtId}/${date}`);
    } catch (error) {
      console.error('Error navigating to court selection:', error);
      navigate('/');
    }
  };

  const handleStartNextMatch = (nextMatch: Fixture | null) => {
    if (!nextMatch) {
      console.warn('Attempted to start next match with null match data');
      return;
    }

    try {
      console.log('Starting next match:', {
        courtId,
        nextMatchId: nextMatch.Id,
        nextMatchTime: nextMatch.DateTime,
        nextMatchDetails: {
          homeTeam: nextMatch.HomeTeam,
          awayTeam: nextMatch.AwayTeam,
          court: nextMatch.PlayingAreaName
        }
      });
      
      // Show a loading toast
      toast({
        title: "Loading Next Match",
        description: `Loading ${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
      });
      
      // Use a small timeout to ensure toast is shown before page reload
      setTimeout(() => {
        // Force a full page reload to reset all state
        window.location.href = `/scoreboard/${courtId}?fixture=${encodeURIComponent(JSON.stringify(nextMatch))}`;
      }, 500);
    } catch (error) {
      console.error('Failed to start next match:', {
        error,
        nextMatch,
        courtId
      });
      
      toast({
        title: "Error",
        description: "Failed to start next match. Please try manually selecting the match.",
        variant: "destructive",
      });
      
      navigateToCourtSelection();
    }
  };

  return {
    findNextMatch,
    handleStartNextMatch,
    navigateToCourtSelection,
    parseFixtureDate
  };
};
