export interface FieldingStats {
  catches: number;
  runOuts: number;
  stumpings: number;
}

export interface BattingStats {
  matches: number;
  innings: number;
  runs: number;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  sixes: number;
  fours: number;
  ballsAsNonStriker: number;
}

export interface BowlingStats {
  matches: number;
  innings: number;
  wickets: number;
  economy: number;
  average: number;
  bestFigures: string;
  fourWickets: number;
  fiveWickets: number;
  widesConceded: number;
  noballsConceded: number;
  dotBalls: number;
  legByes: number;
  byes: number;
}

export interface SeasonStats {
  year: string;
  team: string;
  batting?: BattingStats;
  bowling?: BowlingStats;
  fielding?: FieldingStats;
}

export interface Player {
  id: string;
  name: string;
  originalName?: string;
  team: string;
  primaryRole: "Batter" | "Bowler";
  secondaryRole?: "Wicket-Keeper" | "All-Rounder" | "Captain" | "Vice-Captain";
  nationality: string;
  seasons: SeasonStats[];
}

/** Combined display role derived from primaryRole + secondaryRole */
export type DisplayRole = Player["primaryRole"] | NonNullable<Player["secondaryRole"]>;

/** Helper to get a display-friendly role string */
export function getDisplayRole(player: Player): string {
  if (player.secondaryRole) {
    return `${player.primaryRole} / ${player.secondaryRole}`;
  }
  return player.primaryRole;
}

export interface FilterState {
  primaryRole: string | null;
  secondaryRole: string | null;
  team: string | null;
  season: string | null;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface AggregateStats {
  batting?: {
    matches: number;
    runs: number;
    average: number;
    strikeRate: number;
  };
  bowling?: {
    matches: number;
    wickets: number;
    economy: number;
    average: number;
  };
}

export interface BattingDataPoint {
  season: string;
  runs: number;
  average: number;
  strikeRate: number;
}

export interface BowlingDataPoint {
  season: string;
  wickets: number;
  economy: number;
  average: number;
}

export interface ChartVisibility {
  showBatting: boolean;
  showBowling: boolean;
  battingPrimary: boolean;
}
