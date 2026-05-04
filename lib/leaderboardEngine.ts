import type { Player } from "@/data/types";

/** Direction of "better" for a category */
export type SortDirection = "higher" | "lower";

/** Qualifier type — which innings count to check */
export type QualifierType = "batting" | "bowling" | "none";

/** Category configuration */
export interface LeaderboardCategory {
  id: string;
  label: string;
  /** Dot-path to stat: e.g. "batting.runs", "bowling.economy", "fielding.catches" */
  statPath: string;
  direction: SortDirection;
  qualifierType: QualifierType;
  /** Minimum innings required (default 5 for rate-based, 0 for counting stats) */
  minInnings: number;
  /** Minimum seasons required (for multi-season stats like consistency) */
  minSeasons?: number;
}

/** A ranked player entry */
export interface RankedPlayer {
  player: Player;
  rank: number;
  statValue: number;
}

/** Result of ranking for a single category */
export interface LeaderboardResult {
  category: LeaderboardCategory;
  rankings: RankedPlayer[];
  best: RankedPlayer | null;
  average: RankedPlayer | null;
  worst: RankedPlayer | null;
}

export const BATTING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-runs", label: "Most Runs", statPath: "batting.runs", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "highest-average", label: "Highest Average", statPath: "batting.average", direction: "higher", qualifierType: "batting", minInnings: 5 },
  { id: "highest-strike-rate", label: "Highest Strike Rate", statPath: "batting.strikeRate", direction: "higher", qualifierType: "batting", minInnings: 5 },
  { id: "most-sixes", label: "Most Sixes", statPath: "batting.sixes", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-fours", label: "Most Fours", statPath: "batting.fours", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-fifties", label: "Most Fifties", statPath: "batting.fifties", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-hundreds", label: "Most Hundreds", statPath: "batting.hundreds", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "highest-score", label: "Highest Score", statPath: "batting.highestScore", direction: "higher", qualifierType: "none", minInnings: 0 },
];

export const BOWLING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-wickets", label: "Most Wickets", statPath: "bowling.wickets", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "best-economy", label: "Best Economy", statPath: "bowling.economy", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "best-bowling-avg", label: "Best Bowling Average", statPath: "bowling.average", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "most-dot-balls", label: "Most Dot Balls", statPath: "bowling.dotBalls", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-wides", label: "Most Wides Conceded", statPath: "bowling.widesConceded", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-noballs", label: "Most No-Balls Conceded", statPath: "bowling.noballsConceded", direction: "higher", qualifierType: "none", minInnings: 0 },
];

export const FIELDING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-catches", label: "Most Catches", statPath: "fielding.catches", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-runouts", label: "Most Run-Outs", statPath: "fielding.runOuts", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-stumpings", label: "Most Stumpings", statPath: "fielding.stumpings", direction: "higher", qualifierType: "none", minInnings: 0 },
];

export const EXTRAS_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-wides-bowler", label: "Most Wides by Bowler", statPath: "bowling.widesConceded", direction: "higher", qualifierType: "bowling", minInnings: 5 },
  { id: "fewest-wides-bowler", label: "Fewest Wides by Bowler", statPath: "bowling.widesConceded", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "most-noballs-bowler", label: "Most No-Balls by Bowler", statPath: "bowling.noballsConceded", direction: "higher", qualifierType: "bowling", minInnings: 5 },
  { id: "fewest-noballs-bowler", label: "Fewest No-Balls by Bowler", statPath: "bowling.noballsConceded", direction: "lower", qualifierType: "bowling", minInnings: 5 },
];

export const NON_STRIKER_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-non-striker", label: "Most Balls as Non-Striker", statPath: "batting.ballsAsNonStriker", direction: "higher", qualifierType: "none", minInnings: 0 },
];

export const MILESTONE_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-matches", label: "Most Matches Played", statPath: "special:matches", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "best-win-contributor", label: "Best Win Contributor", statPath: "special:winContributor", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-consistent", label: "Most Consistent Batter", statPath: "special:consistency", direction: "lower", qualifierType: "none", minInnings: 0, minSeasons: 3 },
];

/** Rate stat field names that require weighted averaging instead of summing */
const RATE_STAT_FIELDS = new Set(["average", "strikeRate", "economy"]);

/**
 * Compute standard deviation of per-season runs for a player.
 * Returns null if the player has batting data in fewer than 3 seasons.
 */
export function computeRunsStdDev(player: Player): number | null {
  const runsPerSeason = player.seasons
    .filter((s) => s.batting != null)
    .map((s) => s.batting!.runs);

  if (runsPerSeason.length < 3) return null;

  const mean = runsPerSeason.reduce((a, b) => a + b, 0) / runsPerSeason.length;
  const variance =
    runsPerSeason.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
    runsPerSeason.length;

  return Math.sqrt(variance);
}

/**
 * Extract stat value for a player given a category and optional season filter.
 * Returns null when the player has no relevant data.
 */
export function extractStatValue(
  player: Player,
  category: LeaderboardCategory,
  season?: string
): number | null {
  const { statPath } = category;

  // --- Special stat paths ---
  if (statPath === "special:consistency") {
    // Consistency is multi-season only
    if (season) return null;
    return computeRunsStdDev(player);
  }

  if (statPath === "special:matches") {
    const seasons = season
      ? player.seasons.filter((s) => s.year === season)
      : player.seasons;
    if (seasons.length === 0) return null;

    let total = 0;
    for (const s of seasons) {
      const batMatches = s.batting?.matches ?? 0;
      const bowlMatches = s.bowling?.matches ?? 0;
      total += Math.max(batMatches, bowlMatches);
    }
    return total > 0 ? total : null;
  }

  if (statPath === "special:winContributor") {
    const seasons = season
      ? player.seasons.filter((s) => s.year === season)
      : player.seasons;
    if (seasons.length === 0) return null;

    let totalRuns = 0;
    let totalWickets = 0;
    let hasData = false;
    for (const s of seasons) {
      if (s.batting) {
        totalRuns += s.batting.runs;
        hasData = true;
      }
      if (s.bowling) {
        totalWickets += s.bowling.wickets;
        hasData = true;
      }
    }
    return hasData ? totalRuns + totalWickets * 20 : null;
  }

  // --- Regular dot-path stats (e.g. "batting.runs", "bowling.economy", "fielding.catches") ---
  const [group, field] = statPath.split(".");

  // Single season extraction
  if (season) {
    const seasonData = player.seasons.find((s) => s.year === season);
    if (!seasonData) return null;

    const groupObj = seasonData[group as keyof typeof seasonData];
    if (!groupObj || typeof groupObj === "string") return null;

    const value = (groupObj as unknown as Record<string, number>)[field];
    return value != null ? value : null;
  }

  // Aggregate across all seasons
  if (group === "fielding") {
    const seasonsWithFielding = player.seasons.filter((s) => s.fielding != null);
    if (seasonsWithFielding.length === 0) return null;

    let total = 0;
    for (const s of seasonsWithFielding) {
      total += (s.fielding as unknown as Record<string, number>)[field] ?? 0;
    }
    return total;
  }

  // batting or bowling group
  const groupKey = group as "batting" | "bowling";
  const relevantSeasons = player.seasons.filter((s) => s[groupKey] != null);
  if (relevantSeasons.length === 0) return null;

  // highestScore: take MAX across seasons
  if (field === "highestScore") {
    let max = -Infinity;
    for (const s of relevantSeasons) {
      const val = (s[groupKey] as unknown as Record<string, number>)[field];
      if (val != null && val > max) max = val;
    }
    return max === -Infinity ? null : max;
  }

  // Rate stats: weighted average by innings
  if (RATE_STAT_FIELDS.has(field)) {
    let weightedSum = 0;
    let totalInnings = 0;
    for (const s of relevantSeasons) {
      const obj = s[groupKey] as unknown as Record<string, number>;
      const innings = obj.innings ?? 0;
      const value = obj[field];
      if (innings > 0 && value != null) {
        weightedSum += value * innings;
        totalInnings += innings;
      }
    }
    return totalInnings > 0 ? weightedSum / totalInnings : null;
  }

  // Counting stats: SUM across seasons
  let total = 0;
  for (const s of relevantSeasons) {
    total += (s[groupKey] as unknown as Record<string, number>)[field] ?? 0;
  }
  return total;
}

/**
 * Get total qualifying innings (batting or bowling) for a player.
 * Used to check minimum innings requirements for rate-based categories.
 */
export function getQualifyingInnings(
  player: Player,
  qualifierType: QualifierType,
  season?: string
): number {
  if (qualifierType === "none") return 0;

  const seasons = season
    ? player.seasons.filter((s) => s.year === season)
    : player.seasons;

  let total = 0;
  for (const s of seasons) {
    const group = s[qualifierType];
    if (group) {
      total += group.innings;
    }
  }
  return total;
}

/**
 * Compute a ranked leaderboard for a given category.
 * Filters out players without relevant data or who don't meet qualifiers,
 * sorts by stat value, and identifies best/average/worst tiers.
 */
export function computeLeaderboard(
  players: Player[],
  category: LeaderboardCategory,
  season?: string
): LeaderboardResult {
  // 1. Extract stat values for all players
  const entries: { player: Player; statValue: number }[] = [];
  for (const player of players) {
    const statValue = extractStatValue(player, category, season);
    // 2. Filter out nulls
    if (statValue == null) continue;
    // 3. Apply minimum innings qualifier
    if (category.qualifierType !== "none") {
      const innings = getQualifyingInnings(player, category.qualifierType, season);
      if (innings < category.minInnings) continue;
    }
    // 4. Apply minimum seasons filter (e.g. consistency category)
    if (category.minSeasons != null) {
      const seasonsWithData =
        category.statPath === "special:consistency"
          ? player.seasons.filter((s) => s.batting != null).length
          : player.seasons.length;
      if (seasonsWithData < category.minSeasons) continue;
    }
    entries.push({ player, statValue });
  }

  // Empty result when no players qualify
  if (entries.length === 0) {
    return { category, rankings: [], best: null, average: null, worst: null };
  }

  // 5. Sort by statValue
  entries.sort((a, b) =>
    category.direction === "higher"
      ? b.statValue - a.statValue
      : a.statValue - b.statValue
  );

  // 6. Assign ranks 1..N
  const rankings: RankedPlayer[] = entries.map((e, i) => ({
    player: e.player,
    rank: i + 1,
    statValue: e.statValue,
  }));

  // 7-9. Identify best, worst, average
  const best = rankings[0];
  const worst = rankings[rankings.length - 1];
  const average = rankings[Math.floor(rankings.length / 2)];

  // 10. Return result
  return { category, rankings, best, average, worst };
}
