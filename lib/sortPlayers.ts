import { Player, SortConfig } from "@/data/types";

/**
 * Extracts a numeric stat value from a player for sorting/comparison.
 * If season is provided, gets the stat from that specific season.
 * If no season, computes aggregate (sum for runs/wickets, weighted average for average/strikeRate/economy).
 * Returns 0 if the stat is not available.
 */
export function getStatValue(
  player: Player,
  statKey: string,
  season?: string
): number {
  if (season) {
    const seasonData = player.seasons.find((s) => s.year === season);
    if (!seasonData) return 0;
    return extractStat(seasonData, statKey);
  }

  // Aggregate across all seasons
  switch (statKey) {
    case "runs": {
      return player.seasons.reduce((sum, s) => sum + (s.batting?.runs ?? 0), 0);
    }
    case "wickets": {
      return player.seasons.reduce(
        (sum, s) => sum + (s.bowling?.wickets ?? 0),
        0
      );
    }
    case "average": {
      // Weighted batting average: total runs / total innings (where innings > 0)
      const totalRuns = player.seasons.reduce(
        (sum, s) => sum + (s.batting?.runs ?? 0),
        0
      );
      const totalInnings = player.seasons.reduce(
        (sum, s) => sum + (s.batting?.innings ?? 0),
        0
      );
      return totalInnings > 0 ? totalRuns / totalInnings : 0;
    }
    case "strikeRate": {
      // Weighted strike rate: use innings as weight
      const totalInnings = player.seasons.reduce(
        (sum, s) => sum + (s.batting?.innings ?? 0),
        0
      );
      if (totalInnings === 0) return 0;
      const weightedSum = player.seasons.reduce(
        (sum, s) =>
          sum + (s.batting?.strikeRate ?? 0) * (s.batting?.innings ?? 0),
        0
      );
      return weightedSum / totalInnings;
    }
    case "economy": {
      // Weighted economy: use bowling innings as weight
      const totalBowlingInnings = player.seasons.reduce(
        (sum, s) => sum + (s.bowling?.innings ?? 0),
        0
      );
      if (totalBowlingInnings === 0) return 0;
      const weightedSum = player.seasons.reduce(
        (sum, s) =>
          sum + (s.bowling?.economy ?? 0) * (s.bowling?.innings ?? 0),
        0
      );
      return weightedSum / totalBowlingInnings;
    }
    default:
      return 0;
  }
}

/**
 * Extracts a stat value from a single season's data.
 */
function extractStat(
  seasonData: { batting?: { runs: number; average: number; strikeRate: number }; bowling?: { wickets: number; economy: number } },
  statKey: string
): number {
  switch (statKey) {
    case "runs":
      return seasonData.batting?.runs ?? 0;
    case "wickets":
      return seasonData.bowling?.wickets ?? 0;
    case "average":
      return seasonData.batting?.average ?? 0;
    case "strikeRate":
      return seasonData.batting?.strikeRate ?? 0;
    case "economy":
      return seasonData.bowling?.economy ?? 0;
    default:
      return 0;
  }
}

/**
 * Sorts a copy of the players array by the stat key in the config.
 * Supports ascending and descending directions. Defaults to descending.
 */
export function sortPlayers(players: Player[], config: SortConfig): Player[] {
  const sorted = [...players];
  const direction = config.direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    const aVal = getStatValue(a, config.key);
    const bVal = getStatValue(b, config.key);
    return (aVal - bVal) * direction;
  });

  return sorted;
}
