"use client";

import { Player } from "@/data/types";
import { getStatValue } from "@/lib/sortPlayers";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const PLAYER_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

interface StatDef {
  key: string;
  label: string;
  higherIsBetter: boolean;
}

const battingStats: StatDef[] = [
  { key: "runs", label: "Runs", higherIsBetter: true },
  { key: "average", label: "Avg", higherIsBetter: true },
  { key: "strikeRate", label: "SR", higherIsBetter: true },
];

const bowlingStats: StatDef[] = [
  { key: "wickets", label: "Wickets", higherIsBetter: true },
  { key: "economy", label: "Economy", higherIsBetter: false },
];

const radarStats: StatDef[] = [
  { key: "runs", label: "Runs", higherIsBetter: true },
  { key: "average", label: "Batting Avg", higherIsBetter: true },
  { key: "strikeRate", label: "Strike Rate", higherIsBetter: true },
  { key: "wickets", label: "Wickets", higherIsBetter: true },
  { key: "economy", label: "Economy", higherIsBetter: false },
];

function getBestIndex(values: number[], higherIsBetter: boolean): number {
  if (values.length === 0) return -1;
  let bestIdx = 0;
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[bestIdx] : values[i] < values[bestIdx]) {
      bestIdx = i;
    }
  }
  return bestIdx;
}

function formatVal(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(2);
}

function PlayerHeader({ player, color }: { player: Player; color: string }) {
  const displayName = player.originalName ?? player.name;
  const role = player.secondaryRole
    ? `${player.primaryRole} / ${player.secondaryRole}`
    : player.primaryRole;

  return (
    <div
      className="rounded-xl p-4 text-center flex-1 min-w-[140px]"
      style={{
        backgroundColor: "var(--bg-card)",
        border: `2px solid ${color}`,
      }}
    >
      <div
        className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {displayName.charAt(0)}
      </div>
      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
        {displayName}
      </h3>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{player.team}</p>
      <span
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {role}
      </span>
    </div>
  );
}

function StatBar({
  stat,
  players,
}: {
  stat: StatDef;
  players: Player[];
}) {
  const values = players.map((p) => getStatValue(p, stat.key));
  const maxVal = Math.max(...values, 1);
  const bestIdx = getBestIndex(values, stat.higherIsBetter);

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--bg-card)" }}
      data-testid={`stat-row-${stat.key}`}
    >
      <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        {stat.label}
      </div>
      <div className="space-y-2">
        {players.map((player, i) => {
          const pct = maxVal > 0 ? (values[i] / maxVal) * 100 : 0;
          const isBest = i === bestIdx;
          const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
          return (
            <div key={player.id} className="flex items-center gap-2">
              <span
                className="w-20 text-xs truncate text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                {(player.originalName ?? player.name).split(" ").pop()}
              </span>
              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: color,
                    opacity: isBest ? 1 : 0.6,
                  }}
                />
              </div>
              <span
                className="w-16 text-xs font-mono text-right"
                style={{ color: isBest ? color : "var(--text-secondary)", fontWeight: isBest ? 700 : 400 }}
                {...(isBest ? { "data-testid": "best-value" } : {})}
              >
                {formatVal(values[i])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadarComparison({ players }: { players: Player[] }) {
  // Normalize each stat to 0-100 for radar
  const rawValues = radarStats.map((stat) => {
    const vals = players.map((p) => getStatValue(p, stat.key));
    const max = Math.max(...vals, 1);
    return { stat, vals, max };
  });

  const data = rawValues.map(({ stat, vals, max }) => {
    const entry: Record<string, string | number> = { stat: stat.label };
    players.forEach((p, i) => {
      // For economy (lower is better), invert the normalization
      const normalized = stat.higherIsBetter
        ? (vals[i] / max) * 100
        : max > 0 ? ((max - vals[i] + max * 0.2) / (max * 1.2)) * 100 : 0;
      entry[p.id] = Math.round(Math.max(normalized, 5));
    });
    return entry;
  });

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)" }}>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        Overall Comparison
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--border-color)" />
          <PolarAngleAxis dataKey="stat" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <Tooltip />
          {players.map((p, i) => (
            <Radar
              key={p.id}
              name={p.originalName ?? p.name}
              dataKey={p.id}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SeasonComparison({ players, statKey, label }: { players: Player[]; statKey: string; label: string }) {
  const allSeasons = Array.from(
    new Set(players.flatMap((p) => p.seasons.map((s) => s.year)))
  ).sort();

  const data = allSeasons.map((year) => {
    const entry: Record<string, string | number> = { season: year };
    players.forEach((p) => {
      entry[p.id] = getStatValue(p, statKey, year);
    });
    return entry;
  });

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)" }}>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {label} by Season
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="season" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {players.map((p, i) => (
            <Bar
              key={p.id}
              dataKey={p.id}
              name={(p.originalName ?? p.name).split(" ").pop()!}
              fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              maxBarSize={32}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PlayerComparisonViewProps {
  players: Player[];
}

export default function PlayerComparisonView({ players }: PlayerComparisonViewProps) {
  return (
    <div className="space-y-6" data-testid="comparison-view">
      {/* Player headers */}
      <div className="flex gap-3 flex-wrap">
        {players.map((p, i) => (
          <PlayerHeader key={p.id} player={p} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} />
        ))}
      </div>

      {/* Radar chart */}
      <RadarComparison players={players} />

      {/* Stat bars */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Batting
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {battingStats.map((stat) => (
            <StatBar key={stat.key} stat={stat} players={players} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Bowling
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {bowlingStats.map((stat) => (
            <StatBar key={stat.key} stat={stat} players={players} />
          ))}
        </div>
      </div>

      {/* Season-by-season charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <SeasonComparison players={players} statKey="runs" label="Runs" />
        <SeasonComparison players={players} statKey="wickets" label="Wickets" />
      </div>
    </div>
  );
}
