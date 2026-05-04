"use client";

import Link from "next/link";
import { Player } from "@/data/types";

interface DreamTeamCardProps {
  player: Player;
  score: number;
  teamLabel: "A" | "B";
  backParams?: string;
}

export default function DreamTeamCard({ player, score, teamLabel, backParams }: DreamTeamCardProps) {
  const teamBadgeBg = teamLabel === "A" ? "#3b82f6" : "#10b981";
  const teamBadgeColor = "#ffffff";

  const playerHref = backParams
    ? `/player/${player.id}?from=dream-team&${backParams}`
    : `/player/${player.id}`;

  return (
    <article
      className="rounded-lg border p-4 shadow-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href={playerHref}
            data-testid="player-name"
            className="text-lg font-semibold hover:text-blue-600 hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </Link>
          <p
            className="mt-1 text-sm"
            data-testid="player-team"
            style={{ color: "var(--text-secondary)" }}
          >
            {player.team}
          </p>
        </div>
        <span
          data-testid="team-label"
          className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{
            backgroundColor: teamBadgeBg,
            color: teamBadgeColor,
          }}
        >
          {teamLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p
          className="text-sm"
          data-testid="player-role"
          style={{ color: "var(--text-muted)" }}
        >
          {player.primaryRole}
          {player.secondaryRole ? ` / ${player.secondaryRole}` : ""}
        </p>
        <p
          className="text-sm font-semibold"
          data-testid="player-score"
          style={{ color: "var(--text-primary)" }}
        >
          {score.toFixed(1)}
        </p>
      </div>
    </article>
  );
}
