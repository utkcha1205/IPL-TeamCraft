import type { Player, BattingDataPoint, BowlingDataPoint, ChartVisibility } from "@/data/types";

export function transformBattingData(player: Player): BattingDataPoint[] {
  return player.seasons
    .filter((s) => s.batting !== undefined)
    .map((s) => ({
      season: s.year,
      runs: s.batting!.runs,
      average: s.batting!.average,
      strikeRate: s.batting!.strikeRate,
    }))
    .sort((a, b) => a.season.localeCompare(b.season));
}

export function transformBowlingData(player: Player): BowlingDataPoint[] {
  return player.seasons
    .filter((s) => s.bowling !== undefined)
    .map((s) => ({
      season: s.year,
      wickets: s.bowling!.wickets,
      economy: s.bowling!.economy,
      average: s.bowling!.average,
    }))
    .sort((a, b) => a.season.localeCompare(b.season));
}

export function getChartVisibility(player: Player): ChartVisibility {
  const showBatting = player.seasons.some((s) => s.batting !== undefined);
  const showBowling = player.seasons.some((s) => s.bowling !== undefined);
  const battingPrimary = player.primaryRole === "Batter";

  return { showBatting, showBowling, battingPrimary };
}
