
import { Fixture } from "@/types/volleyball";
import { parse, format } from "date-fns";
import { getAllCourtMatches } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";

export const parseFixtureDate = (dateStr: string) => {
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

export const findNextMatchByIndex = (
  matches: Fixture[],
  currentFixtureId: string,
  courtId: string
): { foundMatch: Fixture | null; foundIndex: number } => {
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
  
  // Find the index of the current match by ID
  let currentMatchIndex = sortedMatches.findIndex(m => m.Id === currentFixtureId);
  console.log('Current match index using ID:', currentMatchIndex);
  
  if (currentMatchIndex !== -1 && currentMatchIndex < sortedMatches.length - 1) {
    return { 
      foundMatch: sortedMatches[currentMatchIndex + 1],
      foundIndex: currentMatchIndex
    };
  }
  
  return { foundMatch: null, foundIndex: currentMatchIndex };
};

export const findNextMatchByTeams = (
  matches: Fixture[],
  fixture: Fixture,
  courtId: string
): Fixture | null => {
  // Filter and sort matches as before
  const sameCourtMatches = matches.filter(m => 
    m.PlayingAreaName === `Court ${courtId}`
  );
  
  const sortedMatches = [...sameCourtMatches].sort((a, b) => {
    try {
      return parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime();
    } catch (error) {
      console.error('Error sorting matches by date:', error);
      return 0;
    }
  });
  
  // Try to find by teams if ID match fails
  console.log('Trying to find current match by teams instead of ID');
  const currentMatchIndex = sortedMatches.findIndex(m => 
    m.HomeTeam === fixture.HomeTeam && 
    m.AwayTeam === fixture.AwayTeam &&
    m.DateTime === fixture.DateTime
  );
  
  console.log('Current match index using teams and time:', currentMatchIndex);
  
  if (currentMatchIndex !== -1 && currentMatchIndex < sortedMatches.length - 1) {
    return sortedMatches[currentMatchIndex + 1];
  }
  
  return null;
};

export const findNextMatchByFlexibleMatching = (
  matches: Fixture[],
  fixture: Fixture,
  courtId: string
): Fixture | null => {
  // Filter and sort matches as before
  const sameCourtMatches = matches.filter(m => 
    m.PlayingAreaName === `Court ${courtId}`
  );
  
  const sortedMatches = [...sameCourtMatches].sort((a, b) => {
    try {
      return parseFixtureDate(a.DateTime).getTime() - parseFixtureDate(b.DateTime).getTime();
    } catch (error) {
      console.error('Error sorting matches by date:', error);
      return 0;
    }
  });
  
  console.log('Trying more flexible match criteria');
  
  // Try matching by any part of the ID (useful for offline IDs)
  const matchesById = sortedMatches.findIndex(m => 
    m.Id.includes(fixture.Id) || fixture.Id.includes(m.Id)
  );
  
  if (matchesById !== -1 && matchesById < sortedMatches.length - 1) {
    console.log('Found match using partial ID match:', matchesById);
    return sortedMatches[matchesById + 1];
  }
  
  // Try fuzzy matching by team names (ignoring case, partial match)
  const homeTeamLower = fixture.HomeTeam.toLowerCase();
  const awayTeamLower = fixture.AwayTeam.toLowerCase();
  
  const matchesByTeam = sortedMatches.findIndex(m => 
    (m.HomeTeam.toLowerCase().includes(homeTeamLower) || 
     homeTeamLower.includes(m.HomeTeam.toLowerCase())) &&
    (m.AwayTeam.toLowerCase().includes(awayTeamLower) || 
     awayTeamLower.includes(m.AwayTeam.toLowerCase()))
  );
  
  if (matchesByTeam !== -1 && matchesByTeam < sortedMatches.length - 1) {
    console.log('Found match using fuzzy team name match:', matchesByTeam);
    return sortedMatches[matchesByTeam + 1];
  }
  
  return null;
};

export const findNextMatchByTime = (
  matches: Fixture[],
  currentFixtureDate: Date,
  courtId: string
): Fixture | null => {
  // Filter matches to only those on the same court
  const sameCourtMatches = matches.filter(m => 
    m.PlayingAreaName === `Court ${courtId}`
  );
  
  console.log('Fallback to time-based next match search');
  const matchesAfterCurrent = sameCourtMatches.filter(m => {
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
    
    return nextMatches[0];
  }
  
  return null;
};

export const getAdditionalMatchesFromCache = async (
  courtId: string,
  existingMatches: Fixture[]
): Promise<Fixture[]> => {
  try {
    console.log('In offline mode with limited matches, trying to get more from cache');
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
        DivisionName: m.division || m.DivisionName,
        // Add the missing properties required by the Fixture type
        HomeTeamScore: m.HomeTeamScore || '0',
        AwayTeamScore: m.AwayTeamScore || '0'
      })) as Fixture[];
      
      // Combine with any existing matches, avoiding duplicates by ID
      const existingIds = new Set(existingMatches.map(m => m.Id));
      const uniqueAdditionalMatches = additionalMatches.filter(m => !existingIds.has(m.Id));
      
      if (uniqueAdditionalMatches.length > 0) {
        console.log(`Adding ${uniqueAdditionalMatches.length} unique matches from cache`);
        return [...existingMatches, ...uniqueAdditionalMatches];
      }
    }
    
    return existingMatches;
  } catch (error) {
    console.error('Error fetching additional matches from cache:', error);
    return existingMatches;
  }
};
