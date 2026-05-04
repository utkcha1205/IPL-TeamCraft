"use client";

import type { Player } from "@/data/types";
import {
  getChartVisibility,
  transformBattingData,
  transformBowlingData,
} from "@/lib/graphDataUtils";
import BattingChart from "@/components/BattingChart";
import BowlingChart from "@/components/BowlingChart";

interface ProgressGraphSectionProps {
  player: Player;
}

export default function ProgressGraphSection({
  player,
}: ProgressGraphSectionProps) {
  const { showBatting, showBowling, battingPrimary } =
    getChartVisibility(player);

  const battingData = showBatting ? transformBattingData(player) : undefined;
  const bowlingData = showBowling ? transformBowlingData(player) : undefined;

  const displayName = player.originalName ?? player.name;

  const battingChart = showBatting && battingData ? (
    <BattingChart data={battingData} playerName={displayName} />
  ) : null;

  const bowlingChart = showBowling && bowlingData ? (
    <BowlingChart data={bowlingData} playerName={displayName} />
  ) : null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Performance Trends
      </h2>
      <div className="grid gap-4 grid-cols-1">
        {battingPrimary ? (
          <>
            {battingChart}
            {bowlingChart}
          </>
        ) : (
          <>
            {bowlingChart}
            {battingChart}
          </>
        )}
      </div>
    </section>
  );
}
