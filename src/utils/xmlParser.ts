import { XMLParser } from 'fast-xml-parser';
import { XMLFixture, XMLWeek, LeagueResponse } from '@/types/xml';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  trimValues: true,
});

export const parseXMLResponse = (text: string): XMLFixture[] => {
  const result = parser.parse(text) as LeagueResponse;
  console.log('Full parsed XML result:', JSON.stringify(result, null, 2));
  
  if (!result?.League?.Week) {
    console.log('No weeks found in XML');
    return [];
  }

  // Extract all weeks and their fixtures
  const weeks = Array.isArray(result.League.Week) 
    ? result.League.Week 
    : [result.League.Week];
    
  const allFixtures = weeks.flatMap(week => {
    console.log('Processing week:', week?.Date);
    const fixtures = Array.isArray(week?.Fixture) ? week.Fixture : [week?.Fixture];
    return fixtures.filter(Boolean);
  });

  console.log(`Extracted ${allFixtures.length} fixtures`);
  return allFixtures;
};