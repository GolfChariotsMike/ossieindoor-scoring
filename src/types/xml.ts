export interface XMLWeek {
  Date: string;
  Fixture: XMLFixture | XMLFixture[];
}

export interface XMLFixture {
  DateTime: string;
  PlayingAreaName: string;
  DivisionName: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamId: string;
  AwayTeamId: string;
  HomeTeamScore: string;
  AwayTeamScore: string;
  [key: string]: any;
}

export interface LeagueResponse {
  League?: {
    Week: XMLWeek | XMLWeek[];
  };
}