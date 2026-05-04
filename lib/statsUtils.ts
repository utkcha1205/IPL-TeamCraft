import { Player, AggregateStats, SeasonStats } from "@/data/types";

/**
 * Computes aggregate career statistics for a player by summing season data
 * and computing weighted averages using innings as weights.
 */
export function getAggregateStats(player: Player): AggregateStats {
  const result: AggregateStats = {};

  // Aggregate batting stats
  const battingSeasons = player.seasons.filter((s) => s.batting);
  if (battingSeasons.length > 0) {
    let totalMatches = 0;
    let totalRuns = 0;
    let totalInnings = 0;
    let weightedAverage = 0;
    let weightedStrikeRate = 0;

    for (const season of battingSeasons) {
      const b = season.batting!;
      totalMatches += b.matches;
      totalRuns += b.runs;
      totalInnings += b.innings;
      weightedAverage += b.average * b.innings;
      weightedStrikeRate += b.strikeRate * b.innings;
    }

    result.batting = {
      matches: totalMatches,
      runs: totalRuns,
      average: totalInnings > 0 ? weightedAverage / totalInnings : 0,
      strikeRate: totalInnings > 0 ? weightedStrikeRate / totalInnings : 0,
    };
  }

  // Aggregate bowling stats
  const bowlingSeasons = player.seasons.filter((s) => s.bowling);
  if (bowlingSeasons.length > 0) {
    let totalMatches = 0;
    let totalWickets = 0;
    let totalInnings = 0;
    let weightedEconomy = 0;
    let weightedAverage = 0;

    for (const season of bowlingSeasons) {
      const bw = season.bowling!;
      totalMatches += bw.matches;
      totalWickets += bw.wickets;
      totalInnings += bw.innings;
      weightedEconomy += bw.economy * bw.innings;
      weightedAverage += bw.average * bw.innings;
    }

    result.bowling = {
      matches: totalMatches,
      wickets: totalWickets,
      economy: totalInnings > 0 ? weightedEconomy / totalInnings : 0,
      average: totalInnings > 0 ? weightedAverage / totalInnings : 0,
    };
  }

  return result;
}

/**
 * Returns the SeasonStats for a given season year, or undefined if not found.
 */
export function getSeasonStats(
  player: Player,
  season: string
): SeasonStats | undefined {
  return player.seasons.find((s) => s.year === season);
}
