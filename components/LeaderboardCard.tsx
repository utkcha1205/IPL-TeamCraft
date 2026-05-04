"use client";

import Link from "next/link";
import type { LeaderboardCategory, RankedPlayer } from "@/lib/leaderboardEngine";

interface LeaderboardCardProps {
  category: LeaderboardCategory;
  best: RankedPlayer | null;
  average: RankedPlayer | null;
  worst: RankedPlayer | null;
  isEmpty: boolean;
}

function formatStatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

interface TierRowProps {
  label: string;
  icon?: string;
  accentColor: string;
  entry: RankedPlayer;
}

function TierRow({ label, icon, accentColor, entry }: TierRowProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-md px-3 py-2"
      style={{
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wide flex-shrink-0"
              style={{ color: accentColor }}
            >
              {label}
            </span>
          </div>
          <Link
            href={`/player/${entry.player.id}`}
            className="block truncate text-sm font-medium hover:text-blue-600 hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {entry.player.name}
          </Link>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {entry.player.team}
          </p>
        </div>
      </div>
      <span
        className="text-sm font-bold flex-shrink-0"
        style={{ color: "var(--text-primary)" }}
      >
        {formatStatValue(entry.statValue)}
      </span>
    </div>
  );
}

export default function LeaderboardCard({
  category,
  best,
  average,
  worst,
  isEmpty,
}: LeaderboardCardProps) {
  return (
    <article
      className="rounded-lg border p-4 shadow-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <h3
        className="text-base font-semibold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {category.label}
      </h3>

      {isEmpty ? (
        <p className="text-sm py-4 text-center" style={{ color: "var(--text-secondary)" }}>
          Not enough data for this category
        </p>
      ) : (
        <div className="space-y-2">
          {best && (
            <TierRow label="Best" icon="🏆" accentColor="#FFD700" entry={best} />
          )}
          {average && (
            <TierRow label="Average" accentColor="#C0C0C0" entry={average} />
          )}
          {worst && (
            <TierRow label="Worst" accentColor="#CD7F32" entry={worst} />
          )}
        </div>
      )}
    </article>
  );
}
