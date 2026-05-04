import { Player, AggregateStats } from "@/data/types";
import { getAggregateStats, getSeasonStats } from "@/lib/statsUtils";

/** A scored player entry in the Dream XI */
export interface ScoredPlayer {
  player: Player;
  score: number;
  /** Which selected team this player belongs to */
  teamLabel: "A" | "B";
}

/** Result of the dream XI selection */
export interface DreamXIResult {
  /** The 11 selected players with scores */
  players: ScoredPlayer[];
  /** True if composition constraints had to be relaxed */
  compositionRelaxed: boolean;
  /** Count of players from team A */
  teamACount: number;
  /** Count of players from team B */
  teamBCount: number;
}

/** Composition constraints for the Dream XI */
export interface CompositionRules {
  totalPlayers: 11;
  minBatters: 3;
  minBowlers: 3;
  minWicketKeepers: 1;
  maxAllRounders: 4;
  minPerTeam: 1;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes a normalized batting score (0–100) from batting stats.
 * Formula: 0.4 × clamp(average/50, 0, 1) × 100
 *        + 0.35 × clamp(strikeRate/200, 0, 1) × 100
 *        + 0.25 × clamp(runs/5000, 0, 1) × 100
 */
export function computeBattingScore(
  stats: AggregateStats["batting"] | undefined
): number {
  if (!stats) return 0;
  const avgComponent = 0.4 * clamp(stats.average / 50, 0, 1) * 100;
  const srComponent = 0.35 * clamp(stats.strikeRate / 200, 0, 1) * 100;
  const runsComponent = 0.25 * clamp(stats.runs / 5000, 0, 1) * 100;
  return avgComponent + srComponent + runsComponent;
}

/**
 * Computes a normalized bowling score (0–100) from bowling stats.
 * Formula: 0.4 × clamp(wickets/150, 0, 1) × 100
 *        + 0.35 × (1 - clamp(economy/12, 0, 1)) × 100
 *        + 0.25 × (1 - clamp(bowlingAverage/40, 0, 1)) × 100
 */
export function computeBowlingScore(
  stats: AggregateStats["bowling"] | undefined
): number {
  if (!stats) return 0;
  const wicketsComponent = 0.4 * clamp(stats.wickets / 150, 0, 1) * 100;
  const economyComponent = 0.35 * (1 - clamp(stats.economy / 12, 0, 1)) * 100;
  const avgComponent = 0.25 * (1 - clamp(stats.average / 40, 0, 1)) * 100;
  return wicketsComponent + economyComponent + avgComponent;
}

/**
 * Returns true if the player has head-to-head history against the opponent team.
 * A player has H2H history if there exists a season where the player played for
 * one of the two selected teams, and the opponent team also has players with data
 * in that same season in the full dataset.
 */
export function hasHeadToHead(
  player: Player,
  opponentTeam: string,
  allPlayers: Player[] = []
): boolean {
  for (const season of player.seasons) {
    const playerTeamInSeason = season.team;
    // The player's team in this season must differ from the opponent team
    if (playerTeamInSeason === opponentTeam) continue;
    // Check if any player from the opponent team has data in this same season
    const opponentHasData = allPlayers.some(
      (p) =>
        p.id !== player.id &&
        p.seasons.some(
          (s) => s.team === opponentTeam && s.year === season.year
        )
    );
    if (opponentHasData) return true;
  }
  return false;
}

/**
 * Computes the composite player score using role-based components.
 * - Batters / Wicket-Keepers: battingScore only
 * - Bowlers: bowlingScore only
 * - All-Rounders: 0.5 × battingScore + 0.5 × bowlingScore
 * Applies a 1.1× head-to-head bonus when applicable.
 */
export function computePlayerScore(
  player: Player,
  opponentTeam: string,
  allPlayers: Player[] = [],
  season?: string
): number {
  let battingStats: AggregateStats["batting"];
  let bowlingStats: AggregateStats["bowling"];

  if (season) {
    const seasonData = getSeasonStats(player, season);
    if (!seasonData) return 0;
    battingStats = seasonData.batting
      ? {
          matches: seasonData.batting.matches,
          runs: seasonData.batting.runs,
          average: seasonData.batting.average,
          strikeRate: seasonData.batting.strikeRate,
        }
      : undefined;
    bowlingStats = seasonData.bowling
      ? {
          matches: seasonData.bowling.matches,
          wickets: seasonData.bowling.wickets,
          economy: seasonData.bowling.economy,
          average: seasonData.bowling.average,
        }
      : undefined;
  } else {
    const aggregate = getAggregateStats(player);
    battingStats = aggregate.batting;
    bowlingStats = aggregate.bowling;
  }

  const battingScore = computeBattingScore(battingStats);
  const bowlingScore = computeBowlingScore(bowlingStats);

  let baseScore: number;
  if (player.secondaryRole === "All-Rounder") {
    baseScore = 0.5 * battingScore + 0.5 * bowlingScore;
  } else if (player.primaryRole === "Bowler") {
    baseScore = bowlingScore;
  } else {
    // Batter, Wicket-Keeper, or any other primary role
    baseScore = battingScore;
  }

  // Apply head-to-head bonus
  if (hasHeadToHead(player, opponentTeam, allPlayers)) {
    return baseScore * 1.1;
  }

  return baseScore;
}

/**
 * Extracts sorted unique team names from the player dataset.
 */
export function getTeamsFromPlayers(players: Player[]): string[] {
  const teams = new Set<string>();
  for (const player of players) {
    teams.add(player.team);
  }
  return Array.from(teams).sort();
}

/**
 * Extracts sorted unique season years from the player dataset.
 */
export function getSeasonsFromPlayers(players: Player[]): string[] {
  const seasons = new Set<string>();
  for (const player of players) {
    for (const season of player.seasons) {
      seasons.add(season.year);
    }
  }
  return Array.from(seasons).sort();
}

/**
 * Selects the optimal Dream XI of 11 players from two teams.
 *
 * Algorithm (greedy constrained selection):
 * 1. Filter players to those belonging to teamA or teamB
 * 2. If season provided, further filter to players with data for that season
 * 3. Score all eligible players using computePlayerScore()
 * 4. Sort by score descending
 * 5. Fill mandatory slots first (min 1 WK, min 3 pure Batters, min 3 pure Bowlers)
 * 6. Fill remaining slots with highest-scoring available players respecting max 4 All-Rounders and min 1 per team
 * 7. If constraints can't be fully satisfied, relax and fill with best available
 *
 * @param players - Full player dataset
 * @param teamA - First selected team name
 * @param teamB - Second selected team name
 * @param season - Optional season year to filter by
 * @returns DreamXIResult with selected players, composition info, and team counts
 */
export function selectDreamXI(
  players: Player[],
  teamA: string,
  teamB: string,
  season?: string
): DreamXIResult {
  // 1. Filter players to the two selected teams
  let eligible = players.filter(
    (p) => p.team === teamA || p.team === teamB
  );

  // 2. If season provided, further filter to players with data for that season
  if (season) {
    eligible = eligible.filter((p) =>
      p.seasons.some((s) => s.year === season)
    );
  }

  // 3. Score all eligible players
  const scored: ScoredPlayer[] = eligible.map((p) => ({
    player: p,
    score: computePlayerScore(p, p.team === teamA ? teamB : teamA, eligible, season),
    teamLabel: (p.team === teamA ? "A" : "B") as "A" | "B",
  }));

  // 4. Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Helper: classify a player's role category
  const isWK = (sp: ScoredPlayer) =>
    sp.player.secondaryRole === "Wicket-Keeper";
  const isPureBatter = (sp: ScoredPlayer) =>
    sp.player.primaryRole === "Batter" && sp.player.secondaryRole !== "All-Rounder";
  const isPureBowler = (sp: ScoredPlayer) =>
    sp.player.primaryRole === "Bowler" && sp.player.secondaryRole !== "All-Rounder";
  const isAllRounder = (sp: ScoredPlayer) =>
    sp.player.secondaryRole === "All-Rounder";

  const selected: ScoredPlayer[] = [];
  const usedIds = new Set<string>();
  let compositionRelaxed = false;

  const pick = (sp: ScoredPlayer) => {
    selected.push(sp);
    usedIds.add(sp.player.id);
  };

  const isAvailable = (sp: ScoredPlayer) => !usedIds.has(sp.player.id);

  // 5. Fill mandatory slots first

  // Pick top WK (at least 1)
  const topWK = scored.find((sp) => isAvailable(sp) && isWK(sp));
  if (topWK) {
    pick(topWK);
  }

  // Pick top 3 pure Batters
  let battersFilled = 0;
  for (const sp of scored) {
    if (battersFilled >= 3) break;
    if (isAvailable(sp) && isPureBatter(sp) && !isWK(sp)) {
      pick(sp);
      battersFilled++;
    }
  }

  // Pick top 3 pure Bowlers
  let bowlersFilled = 0;
  for (const sp of scored) {
    if (bowlersFilled >= 3) break;
    if (isAvailable(sp) && isPureBowler(sp)) {
      pick(sp);
      bowlersFilled++;
    }
  }

  // Check if mandatory slots were under-filled
  const wkCount = selected.filter(isWK).length;
  const pureBatterCount = selected.filter((sp) => isPureBatter(sp) && !isWK(sp)).length;
  const pureBowlerCount = selected.filter(isPureBowler).length;
  if (wkCount < 1 || pureBatterCount < 3 || pureBowlerCount < 3) {
    compositionRelaxed = true;
  }

  // 6. Fill remaining slots (up to 11 total)
  const remaining = scored.filter((sp) => isAvailable(sp));

  for (const sp of remaining) {
    if (selected.length >= 11) break;

    // Respect max 4 All-Rounders
    if (isAllRounder(sp)) {
      const currentAllRounders = selected.filter(isAllRounder).length;
      if (currentAllRounders >= 4) continue;
    }

    // Check team representation: if we're at 10 selected (picking last one),
    // ensure at least 1 from each team
    if (selected.length === 10) {
      const teamACount = selected.filter((s) => s.teamLabel === "A").length;
      const teamBCount = selected.filter((s) => s.teamLabel === "B").length;
      if (teamACount === 0 && sp.teamLabel !== "A") continue;
      if (teamBCount === 0 && sp.teamLabel !== "B") continue;
    }

    pick(sp);
  }

  // 7. If we still don't have 11, relax all constraints and fill with best available
  if (selected.length < 11) {
    compositionRelaxed = true;
    const stillAvailable = scored.filter((sp) => isAvailable(sp));
    for (const sp of stillAvailable) {
      if (selected.length >= 11) break;
      pick(sp);
    }
  }

  // Ensure min 1 per team — if violated, try to swap the lowest-scoring player
  // from the over-represented team with the highest-scoring from the under-represented team
  const teamACount = selected.filter((s) => s.teamLabel === "A").length;
  const teamBCount = selected.filter((s) => s.teamLabel === "B").length;

  if (selected.length >= 2 && (teamACount === 0 || teamBCount === 0)) {
    const missingLabel: "A" | "B" = teamACount === 0 ? "A" : "B";
    const bestFromMissing = scored.find(
      (sp) => sp.teamLabel === missingLabel && !usedIds.has(sp.player.id)
    );
    if (bestFromMissing) {
      // Find the lowest-scoring player from the over-represented team to swap
      const overRepresented = missingLabel === "A" ? "B" : "A";
      let worstIdx = -1;
      let worstScore = Infinity;
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].teamLabel === overRepresented && selected[i].score < worstScore) {
          worstScore = selected[i].score;
          worstIdx = i;
        }
      }
      if (worstIdx >= 0) {
        usedIds.delete(selected[worstIdx].player.id);
        selected[worstIdx] = bestFromMissing;
        usedIds.add(bestFromMissing.player.id);
        compositionRelaxed = true;
      }
    }
  }

  const finalTeamACount = selected.filter((s) => s.teamLabel === "A").length;
  const finalTeamBCount = selected.filter((s) => s.teamLabel === "B").length;

  return {
    players: selected,
    compositionRelaxed,
    teamACount: finalTeamACount,
    teamBCount: finalTeamBCount,
  };
}
