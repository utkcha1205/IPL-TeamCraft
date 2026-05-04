"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Player, getDisplayRole } from "@/data/types";
import Footer from "@/components/Footer";
import { getAggregateStats } from "@/lib/statsUtils";
import { getTeamConfig, getPlayerImageUrl, getTeamLogoUrl } from "@/lib/teamConfig";
import ProgressGraphSection from "@/components/ProgressGraphSection";

interface PlayerDetailViewProps {
  player: Player;
}

export default function PlayerDetailView({ player }: PlayerDetailViewProps) {
  const searchParams = useSearchParams();
  const aggregateStats = getAggregateStats(player);

  const displayName = player.originalName ?? player.name;

  const teamConfig = getTeamConfig(player.team);
  const playerImageUrl = getPlayerImageUrl(displayName, player.team);
  const teamLogoUrl = getTeamLogoUrl(player.team);

  // Build breadcrumb based on where the user came from
  const from = searchParams.get("from");
  const dreamTeamBackUrl = (() => {
    if (from !== "dream-team") return null;
    const params = new URLSearchParams();
    const ta = searchParams.get("teamA");
    const tb = searchParams.get("teamB");
    const season = searchParams.get("season");
    if (ta) params.set("teamA", ta);
    if (tb) params.set("teamB", tb);
    if (season) params.set("season", season);
    const qs = params.toString();
    return `/dream-team${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }} aria-label="Breadcrumb">
        <Link href="/" className="hover:underline" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
        {dreamTeamBackUrl ? (
          <>
            <span>/</span>
            <Link href={dreamTeamBackUrl} className="hover:underline" style={{ color: "var(--text-secondary)" }}>Dream Team</Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>{displayName}</span>
          </>
        ) : (
          <>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>{displayName}</span>
          </>
        )}
      </nav>

      {/* Player Header */}
      <div className="mb-8 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <img
            src={playerImageUrl}
            alt={`${displayName} avatar`}
            width={80}
            height={80}
            className="rounded-full object-cover"
            style={{
              border: `4px solid ${teamConfig.color}`,
              width: 80,
              height: 80,
            }}
          />
          {/* Team logo badge */}
          <img
            src={teamLogoUrl}
            alt={`${player.team} logo`}
            width={28}
            height={28}
            className="absolute -bottom-1 -right-1 rounded-md shadow-sm"
            style={{
              width: 28,
              height: 28,
              border: '2px solid var(--bg-card)',
            }}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="inline-block rounded px-2 py-0.5 text-xs font-bold"
              style={{ backgroundColor: teamConfig.color, color: teamConfig.textColor }}
            >
              {teamConfig.shortName}
            </span>
            {player.team} &middot;{" "}
            <span
              className="inline-block rounded px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-badge)' }}
            >
              {getDisplayRole(player)}
            </span>
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{player.nationality}</p>
        </div>
      </div>

      {/* Aggregate Career Stats */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Career Stats</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {aggregateStats.batting && (
            <div
              className="rounded-lg border p-4 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Batting
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.batting.matches}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Matches</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.batting.runs}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Runs</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.batting.average.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Average</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.batting.strikeRate.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SR</p>
                </div>
              </div>
            </div>
          )}
          {aggregateStats.bowling && (
            <div
              className="rounded-lg border p-4 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Bowling
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.bowling.matches}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Matches</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.bowling.wickets}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Wickets</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.bowling.economy.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Economy</p>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{aggregateStats.bowling.average.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Average</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ProgressGraphSection player={player} />

      {/* Season-by-Season Stats */}
      <section>
        <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Season-by-Season Stats</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-badge)', color: 'var(--text-muted)' }}
              >
                <th className="px-3 py-2">Season</th>
                <th className="px-3 py-2">Team</th>
                {player.seasons.some((s) => s.batting) && (
                  <>
                    <th className="px-3 py-2 text-right">Mat</th>
                    <th className="px-3 py-2 text-right">Runs</th>
                    <th className="px-3 py-2 text-right">Avg</th>
                    <th className="px-3 py-2 text-right">SR</th>
                    <th className="px-3 py-2 text-right">50s</th>
                    <th className="px-3 py-2 text-right">100s</th>
                    <th className="px-3 py-2 text-right">HS</th>
                  </>
                )}
                {player.seasons.some((s) => s.bowling) && (
                  <>
                    <th className="px-3 py-2 text-right">Wkts</th>
                    <th className="px-3 py-2 text-right">Econ</th>
                    <th className="px-3 py-2 text-right">B.Avg</th>
                    <th className="px-3 py-2 text-right">Best</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {player.seasons.map((season) => (
                <tr key={season.year} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{season.year}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{season.team}</td>
                  {player.seasons.some((s) => s.batting) && (
                    <>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.batting?.matches ?? "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.batting?.runs ?? "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                        {season.batting ? season.batting.average.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                        {season.batting ? season.batting.strikeRate.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.batting?.fifties ?? "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.batting?.hundreds ?? "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.batting?.highestScore ?? "—"}</td>
                    </>
                  )}
                  {player.seasons.some((s) => s.bowling) && (
                    <>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.bowling?.wickets ?? "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                        {season.bowling ? season.bowling.economy.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                        {season.bowling ? season.bowling.average.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{season.bowling?.bestFigures ?? "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </div>
  );
}
