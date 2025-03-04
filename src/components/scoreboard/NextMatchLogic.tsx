
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
      const currentFixtureId = fixture.Id;
      
      console.log('Finding next match after:', {
        currentFixtureId,
        currentFixtureDate: format(currentFixtureDate, 'yyyy-MM-dd HH:mm'),
        currentFixtureTeams: `${fixture.HomeTeam} vs ${fixture.AwayTeam}`,
        courtId
      });
      
      // Filter matches to only those on the same court
      const sameCourtMatches = matches.filter(m => 
        m.PlayingAreaName === `Court ${courtId}`
      );

      console.log(`Found ${sameCourtMatches.length} matches on Court ${courtId}`);
      
      // Sort matches by date
      const sortedMatches = [...sameCourtMatches].sort((a, b) => 
        parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime()
      );
      
      // Log the sorted matches for debugging
      sortedMatches.forEach((match, i) => {
        console.log(`Match ${i+1}: ${match.Id} - ${match.HomeTeam} vs ${match.AwayTeam} at ${match.DateTime}`);
      });
      
      // Find the index of the current match
      const currentMatchIndex = sortedMatches.findIndex(m => m.Id === currentFixtureId);
      console.log('Current match index:', currentMatchIndex);
      
      // If we found the current match and there's a next one, return it
      if (currentMatchIndex !== -1 && currentMatchIndex < sortedMatches.length - 1) {
        const nextMatch = sortedMatches[currentMatchIndex + 1];
        console.log('Next match found:', {
          id: nextMatch.Id,
          teams: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
          time: nextMatch.DateTime
        });
        return nextMatch;
      }
      
      // If we couldn't find by index, try the time-based approach as fallback
      console.log('Fallback to time-based next match search');
      const nextMatch = sortedMatches.find((m: Fixture) => 
        m.Id !== currentFixtureId && 
        parseFixtureDate(m.DateTime) > currentFixtureDate
      );
      
      if (nextMatch) {
        console.log('Next match found by time:', {
          id: nextMatch.Id,
          teams: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
          time: nextMatch.DateTime
        });
      } else {
        console.log('No next match found on this court');
      }
      
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
