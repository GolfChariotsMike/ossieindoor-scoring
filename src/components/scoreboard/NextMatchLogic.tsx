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
    
    const sortedMatches = [...matches].sort((a, b) => 
      parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime()
    );
    
    const currentMatchIndex = sortedMatches.findIndex(
      (m: Fixture) => m.Id === fixture.Id
    );
    
    if (currentMatchIndex === -1) return null;
    
    const nextMatch = sortedMatches
      .slice(currentMatchIndex + 1)
      .find((m: Fixture) => 
        m.PlayingAreaName === `Court ${courtId}` && 
        parseFixtureDate(m.DateTime) > parseFixtureDate(fixture.DateTime)
      );
    
    console.log('Next match found:', nextMatch);
    return nextMatch;
  };

  const navigateToCourtSelection = () => {
    const date = fixture 
      ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    
    navigate(`/court/${courtId}/${date}`, {
      replace: true
    });
  };

  const handleStartNextMatch = (nextMatch: Fixture | null) => {
    console.log('Starting next match manually');
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

  return {
    findNextMatch,
    handleStartNextMatch,
    navigateToCourtSelection,
    parseFixtureDate
  };
};