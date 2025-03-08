
import { XMLParser } from 'fast-xml-parser';
import { XMLFixture, XMLWeek, LeagueResponse } from '@/types/xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Forces these elements to always be treated as arrays even when there's only one
    if (name === 'Fixture' || name === 'Week') return true;
    return false;
  }
});

export const parseXMLResponse = (text: string): XMLFixture[] => {
  try {
    if (!text || typeof text !== 'string') {
      console.error('Invalid XML input:', text);
      return [];
    }
    
    console.log('Parsing XML text of length:', text.length);
    
    const result = parser.parse(text) as LeagueResponse;
    
    if (!result?.League?.Week) {
      console.log('No weeks found in XML');
      return [];
    }

    // Extract all weeks and their fixtures
    // We're ensuring Week is always an array in the parser options, but TypeScript doesn't know this
    // So we need to explicitly ensure it's treated as an array
    const weeks = Array.isArray(result.League.Week) ? result.League.Week : [result.League.Week];
    console.log(`Found ${weeks.length} weeks in XML`);
      
    // Now we can safely use array methods on weeks
    const allFixtures = weeks.flatMap(week => {
      if (!week) return [];
      
      console.log('Processing week:', week?.Date);
      
      // Ensure we always have an array of fixtures
      const fixtures = Array.isArray(week.Fixture) ? week.Fixture : (week.Fixture ? [week.Fixture] : []);
      return fixtures.filter(fixture => fixture && fixture.DateTime);
    });

    console.log(`Extracted ${allFixtures.length} fixtures from XML`);
    return allFixtures;
  } catch (error) {
    console.error('Error parsing XML:', error);
    console.error('Problem text sample:', text?.substring(0, 100));
    return [];
  }
};
