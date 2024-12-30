export interface Team {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  court: number;
  startTime: string;
  homeTeam: Team;
  awayTeam: Team;
}

export interface Score {
  home: number;
  away: number;
}

export interface SetScores {
  home: number[];
  away: number[];
}

export interface Fixture {
  Id: string;
  DateTime: string;
  PlayingAreaName: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamId: string;
  AwayTeamId: string;
  HomeTeamScore: string;
  AwayTeamScore: string;
  [key: string]: any;
}