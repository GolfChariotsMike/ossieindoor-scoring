import { Fixture } from "@/types/volleyball";

export const generateMatchCode = (courtId: string, fixture?: Fixture): string => {
  const now = fixture ? new Date(fixture.DateTime) : new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  const teamIdentifier = fixture ? 
    `_${fixture.HomeTeam.replace(/\s+/g, '')}_${fixture.AwayTeam.replace(/\s+/g, '')}` : 
    '_TeamA_TeamB';
  
  return `${month}${day}${hour}${minute}${courtId.padStart(3, '0')}${teamIdentifier}`;
};