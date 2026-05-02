
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
  
  if (!result?.League?.Week) {
    return [];
  }

  // Extract all weeks and their fixtures
  const weeks = Array.isArray(result.League.Week) 
    ? result.League.Week 
    : [result.League.Week];
    
  const allFixtures = weeks.flatMap(week => {
    const fixtures = Array.isArray(week?.Fixture) ? week.Fixture : (week?.Fixture ? [week.Fixture] : []);
    return fixtures.filter(Boolean);
  });

  return allFixtures;
};
