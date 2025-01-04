import { useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { parse, format } from "date-fns";

export const useNextMatch = (courtId: string, fixture?: Fixture) => {
  const navigate = useNavigate();

  const parseFixtureDate = (dateStr: string) => {
    try {
      return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return new Date();
    }
  };

  const findNextMatch = (matches: Fixture[]) => {
    if (!fixture || matches.length === 0) return null;
    
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
    
    console.log('Next match search:', {
      currentFixture: fixture.Id,
      currentTime: currentFixtureDate,
      nextMatch: nextMatch?.Id,
      nextMatchTime: nextMatch ? parseFixtureDate(nextMatch.DateTime) : null
    });
    
    return nextMatch;
  };

  const navigateToCourtSelection = () => {
    const date = fixture 
      ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    
    console.log('Navigating to court selection with date:', date);
    navigate(`/court/${courtId}/${date}`);
  };

  const handleStartNextMatch = (nextMatch: Fixture | null) => {
    console.log('Starting next match:', nextMatch);
    
    if (nextMatch) {
      console.log('Navigating to next match:', {
        courtId,
        nextMatchId: nextMatch.Id,
        nextMatchTime: nextMatch.DateTime
      });
      
      navigate(`/scoreboard/${courtId}`, {
        state: { fixture: nextMatch },
        replace: true
      });
    } else {
      console.log('No next match found, returning to court selection');
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