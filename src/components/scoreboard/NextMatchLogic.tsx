
import { useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { parse, format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { isOffline } from "@/utils/offlineMode";
import { getAllCourtMatches } from "@/services/db/operations/matchOperations";

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
        console.log('In offline mode with limited matches, trying to get more from cache');
        try {
          const cachedMatches = await getAllCourtMatches(courtId);
          if (cachedMatches.length > 0) {
            console.log(`Found ${cachedMatches.length} cached matches for Court ${courtId}`);
            
            // Convert the cached matches to Fixture format
            const additionalMatches = cachedMatches.map(m => ({
              Id: m.id,
              PlayingAreaName: m.PlayingAreaName,
              DateTime: m.DateTime,
              HomeTeam: m.home_team_name || m.HomeTeam,
              AwayTeam: m.away_team_name || m.AwayTeam,
              HomeTeamId: m.home_team_id || m.HomeTeamId,
              AwayTeamId: m.away_team_id || m.AwayTeamId,
              DivisionName: m.division || m.DivisionName
            }));
            
            // Combine with any existing matches, avoiding duplicates by ID
            const existingIds = new Set(matches.map(m => m.Id));
            const uniqueAdditionalMatches = additionalMatches.filter(m => !existingIds.has(m.Id));
            
            if (uniqueAdditionalMatches.length > 0) {
              console.log(`Adding ${uniqueAdditionalMatches.length} unique matches from cache`);
              matches = [...matches, ...uniqueAdditionalMatches];
            }
          }
        } catch (error) {
          console.error('Error fetching additional matches from cache:', error);
        }
      }
      
      // Filter matches to only those on the same court
      const sameCourtMatches = matches.filter(m => 
        m.PlayingAreaName === `Court ${courtId}`
      );

      console.log(`Found ${sameCourtMatches.length} matches on Court ${courtId}`);
      
      // Sort matches by date
      const sortedMatches = [...sameCourtMatches].sort((a, b) => {
        try {
          return parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime();
        } catch (error) {
          console.error('Error sorting matches by date:', error);
          return 0; // Keep original order if can't parse dates
        }
      });
      
      // Log the sorted matches for debugging
      sortedMatches.forEach((match, i) => {
        console.log(`Match ${i+1}: ${match.Id} - ${match.HomeTeam} vs ${match.AwayTeam} at ${match.DateTime}`);
      });
      
      // Try multiple approaches to find the next match:
      
      // 1. Find the index of the current match by ID
      let currentMatchIndex = sortedMatches.findIndex(m => m.Id === currentFixtureId);
      console.log('Current match index using ID:', currentMatchIndex);
      
      // 2. Fallback to find by teams if ID match fails
      if (currentMatchIndex === -1) {
        console.log('Trying to find current match by teams instead of ID');
        currentMatchIndex = sortedMatches.findIndex(m => 
          m.HomeTeam === fixture.HomeTeam && 
          m.AwayTeam === fixture.AwayTeam &&
          m.DateTime === fixture.DateTime
        );
        console.log('Current match index using teams and time:', currentMatchIndex);
      }
      
      // 3. Try more flexible matching using partial IDs or team names
      if (currentMatchIndex === -1) {
        console.log('Trying more flexible match criteria');
        
        // Try matching by any part of the ID (useful for offline IDs)
        const matchesById = sortedMatches.findIndex(m => 
          m.Id.includes(currentFixtureId) || currentFixtureId.includes(m.Id)
        );
        
        if (matchesById !== -1) {
          currentMatchIndex = matchesById;
          console.log('Found match using partial ID match:', currentMatchIndex);
        } else {
          // Try fuzzy matching by team names (ignoring case, partial match)
          const homeTeamLower = fixture.HomeTeam.toLowerCase();
          const awayTeamLower = fixture.AwayTeam.toLowerCase();
          
          const matchesByTeam = sortedMatches.findIndex(m => 
            (m.HomeTeam.toLowerCase().includes(homeTeamLower) || 
             homeTeamLower.includes(m.HomeTeam.toLowerCase())) &&
            (m.AwayTeam.toLowerCase().includes(awayTeamLower) || 
             awayTeamLower.includes(m.AwayTeam.toLowerCase()))
          );
          
          if (matchesByTeam !== -1) {
            currentMatchIndex = matchesByTeam;
            console.log('Found match using fuzzy team name match:', currentMatchIndex);
          }
        }
      }
      
      // If we found the current match and there's a next one, return it
      if (currentMatchIndex !== -1 && currentMatchIndex < sortedMatches.length - 1) {
        const nextMatch = sortedMatches[currentMatchIndex + 1];
        console.log('Next match found by index:', {
          id: nextMatch.Id,
          teams: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
          time: nextMatch.DateTime
        });
        return nextMatch;
      }
      
      // If we couldn't find by index, try the time-based approach as fallback
      console.log('Fallback to time-based next match search');
      const matchesAfterCurrent = sortedMatches.filter(m => {
        try {
          return parseFixtureDate(m.DateTime) > currentFixtureDate;
        } catch (error) {
          console.error('Error comparing fixture dates:', error);
          return false;
        }
      });
      
      if (matchesAfterCurrent.length > 0) {
        // Sort again to find the next chronological match
        const nextMatches = [...matchesAfterCurrent].sort((a, b) => {
          try {
            return parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime();
          } catch (error) {
            console.error('Error sorting future matches by date:', error);
            return 0;
          }
        });
        
        const nextMatch = nextMatches[0];
        console.log('Next match found by time:', {
          id: nextMatch.Id,
          teams: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
          time: nextMatch.DateTime
        });
        return nextMatch;
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
