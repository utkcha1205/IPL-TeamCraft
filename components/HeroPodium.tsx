"use client";

import type { RankedPlayer } from "@/lib/leaderboardEngine";

interface HeroPodiumProps {
  topPerformers: RankedPlayer[];
}

function formatStatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

interface PodiumPositionProps {
  entry: RankedPlayer;
  medal: string;
  accentColor: string;
  height: string;
}

function PodiumPosition({ entry, medal, accentColor, height }: PodiumPositionProps) {
  return (
    <div className="flex flex-col items-center" style={{ alignSelf: "flex-end" }}>
      <span className="text-3xl mb-2">{medal}</span>
      <div
        className="flex flex-col items-center justify-start rounded-t-lg px-4 py-4 w-full"
        style={{
          height,
          backgroundColor: "var(--bg-card)",
          borderTop: `4px solid ${accentColor}`,
          borderLeft: `1px solid var(--border-color)`,
          borderRight: `1px solid var(--border-color)`,
        }}
      >
        <p
          className="text-sm font-semibold text-center truncate w-full"
          style={{ color: "var(--text-primary)" }}
        >
          {entry.player.name}
        </p>
        <p
          className="text-xs text-center truncate w-full mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {entry.player.team}
        </p>
        <p
          className="text-lg font-bold mt-2"
          style={{ color: accentColor }}
        >
          {formatStatValue(entry.statValue)}
        </p>
      </div>
    </div>
  );
}

export default function HeroPodium({ topPerformers }: HeroPodiumProps) {
  if (topPerformers.length === 0) return null;

  const first = topPerformers[0] ?? null;
  const second = topPerformers[1] ?? null;
  const third = topPerformers[2] ?? null;

  return (
    <div
      className="flex items-end justify-center gap-4"
      style={{ minHeight: "220px" }}
    >
      {second && (
        <div className="flex-1 max-w-[160px]">
          <PodiumPosition
            entry={second}
            medal="🥈"
            accentColor="#C0C0C0"
            height="140px"
          />
        </div>
      )}
      {first && (
        <div className="flex-1 max-w-[180px]">
          <PodiumPosition
            entry={first}
            medal="🥇"
            accentColor="#FFD700"
            height="180px"
          />
        </div>
      )}
      {third && (
        <div className="flex-1 max-w-[160px]">
          <PodiumPosition
            entry={third}
            medal="🥉"
            accentColor="#CD7F32"
            height="120px"
          />
        </div>
      )}
    </div>
  );
}
