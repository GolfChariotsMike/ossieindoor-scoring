
import { useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { isOffline } from "@/utils/offlineMode";
import { 
  parseFixtureDate,
  findNextMatchByIndex,
  findNextMatchByTeams,
  findNextMatchByFlexibleMatching,
  findNextMatchByTime,
  getAdditionalMatchesFromCache
} from "@/utils/nextMatchUtility";

export const useNextMatch = (courtId: string, fixture?: Fixture) => {
  const navigate = useNavigate();

  const findNextMatch = async (matches: Fixture[]) => {
    if (!fixture) {
      console.log('No current fixture available for next match search');
      return null;
    }
    
    try {
      const currentFixtureDate = parseFixtureDate(fixture.DateTime);
      const currentFixtureId = fixture.Id;
      
      console.log('Finding next match after:', {
        currentFixtureId,
        currentFixtureDate: format(currentFixtureDate, 'yyyy-MM-dd HH:mm'),
        currentFixtureTeams: `${fixture.HomeTeam} vs ${fixture.AwayTeam}`,
        courtId,
        availableMatchesCount: matches.length,
        offlineMode: isOffline()
      });
      
      // In offline mode, we might need to fetch more matches directly from the cache
      if (isOffline() && matches.length <= 1) {
        matches = await getAdditionalMatchesFromCache(courtId, matches);
      }
      
      // Try multiple approaches to find the next match:
      
      // 1. Find the index of the current match by ID
      const { foundMatch, foundIndex } = findNextMatchByIndex(matches, currentFixtureId, courtId);
      if (foundMatch) {
        console.log('Next match found by index:', {
          id: foundMatch.Id,
          teams: `${foundMatch.HomeTeam} vs ${foundMatch.AwayTeam}`,
          time: foundMatch.DateTime
        });
        return foundMatch;
      }
      
      // 2. Fallback to find by teams if ID match fails
      if (foundIndex === -1) {
        const nextMatchByTeams = findNextMatchByTeams(matches, fixture, courtId);
        if (nextMatchByTeams) {
          console.log('Next match found by team names:', {
            id: nextMatchByTeams.Id,
            teams: `${nextMatchByTeams.HomeTeam} vs ${nextMatchByTeams.AwayTeam}`,
            time: nextMatchByTeams.DateTime
          });
          return nextMatchByTeams;
        }
        
        // 3. Try more flexible matching using partial IDs or team names
        const nextMatchByFlexibleMatching = findNextMatchByFlexibleMatching(matches, fixture, courtId);
        if (nextMatchByFlexibleMatching) {
          console.log('Next match found by flexible matching:', {
            id: nextMatchByFlexibleMatching.Id,
            teams: `${nextMatchByFlexibleMatching.HomeTeam} vs ${nextMatchByFlexibleMatching.AwayTeam}`,
            time: nextMatchByFlexibleMatching.DateTime
          });
          return nextMatchByFlexibleMatching;
        }
      }
      
      // 4. If we couldn't find by index or names, try the time-based approach as fallback
      const nextMatchByTime = findNextMatchByTime(matches, currentFixtureDate, courtId);
      if (nextMatchByTime) {
        console.log('Next match found by time:', {
          id: nextMatchByTime.Id,
          teams: `${nextMatchByTime.HomeTeam} vs ${nextMatchByTime.AwayTeam}`,
          time: nextMatchByTime.DateTime
        });
        return nextMatchByTime;
      }
      
      console.log('No next match found on this court');
      return null;
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
