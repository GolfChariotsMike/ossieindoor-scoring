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