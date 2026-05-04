"use client";

import Link from "next/link";
import { Player, getDisplayRole } from "@/data/types";
import { getAggregateStats, getSeasonStats } from "@/lib/statsUtils";
import { getTeamConfig, getPlayerImageUrl } from "@/lib/teamConfig";

interface PlayerCardProps {
  player: Player;
  season?: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export default function PlayerCard({ player, season, selected, onToggleSelect }: PlayerCardProps) {
  const seasonStats = season ? getSeasonStats(player, season) : undefined;
  const aggregateStats = !season ? getAggregateStats(player) : undefined;

  const battingStats = seasonStats ? seasonStats.batting : aggregateStats?.batting;
  const bowlingStats = seasonStats ? seasonStats.bowling : aggregateStats?.bowling;

  const showBatting = player.primaryRole === "Batter" || player.secondaryRole === "All-Rounder";
  const showBowling = player.primaryRole === "Bowler" || player.secondaryRole === "All-Rounder";

  const currentTeam = player.seasons.length > 0
    ? player.seasons[player.seasons.length - 1].team
    : player.team;
  const teamConfig = getTeamConfig(currentTeam);
  const playerImageUrl = getPlayerImageUrl(player.originalName ?? player.name, currentTeam);

  return (
    <article
      className={`rounded-lg border p-4 shadow-sm transition-colors ${selected ? "border-blue-500" : ""}`}
      style={{
        backgroundColor: selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
        borderColor: selected ? undefined : 'var(--border-color)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Player avatar */}
        <Link href={`/player/${player.id}`} className="flex-shrink-0">
          <img
            src={playerImageUrl}
            alt={`${player.name} avatar`}
            width={48}
            height={48}
            className="rounded-full object-cover"
            style={{
              border: `3px solid ${teamConfig.color}`,
              width: 48,
              height: 48,
            }}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <Link href={`/player/${player.id}`} className="group flex-1 min-w-0">
              <h3 className="text-lg font-semibold group-hover:text-blue-600 truncate" style={{ color: 'var(--text-primary)' }}>
                {player.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {currentTeam} &middot;{" "}
                <span
                  className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }}
                >
                  {getDisplayRole(player)}
                </span>
              </p>
            </Link>

            <label className="flex items-center gap-1 text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(player.id)}
                aria-label={`Select ${player.name} for comparison`}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="sr-only">Compare</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {showBatting && battingStats && (
          <div data-testid="batting-stats">
            <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Batting
            </h4>
            <div className="mt-1 grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{battingStats.matches}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mat</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{battingStats.runs}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Runs</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {typeof battingStats.average === "number" ? battingStats.average.toFixed(1) : battingStats.average}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {typeof battingStats.strikeRate === "number" ? battingStats.strikeRate.toFixed(1) : battingStats.strikeRate}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SR</p>
              </div>
            </div>
          </div>
        )}

        {showBowling && bowlingStats && (
          <div data-testid="bowling-stats">
            <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Bowling
            </h4>
            <div className="mt-1 grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{bowlingStats.matches}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mat</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{bowlingStats.wickets}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Wkts</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {typeof bowlingStats.economy === "number" ? bowlingStats.economy.toFixed(1) : bowlingStats.economy}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Econ</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {typeof bowlingStats.average === "number" ? bowlingStats.average.toFixed(1) : bowlingStats.average}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
