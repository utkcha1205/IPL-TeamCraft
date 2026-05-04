"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAllPlayers } from "@/data/players";
import {
  selectDreamXI,
  getTeamsFromPlayers,
  getSeasonsFromPlayers,
  DreamXIResult,
  ScoredPlayer,
} from "@/lib/dreamTeamEngine";
import TeamPicker from "@/components/TeamPicker";
import DreamTeamCard from "@/components/DreamTeamCard";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

const allPlayers = getAllPlayers();

function groupByRole(players: ScoredPlayer[]) {
  const wicketKeepers: ScoredPlayer[] = [];
  const batters: ScoredPlayer[] = [];
  const allRounders: ScoredPlayer[] = [];
  const bowlers: ScoredPlayer[] = [];

  for (const sp of players) {
    if (sp.player.secondaryRole === "Wicket-Keeper") {
      wicketKeepers.push(sp);
    } else if (sp.player.secondaryRole === "All-Rounder") {
      allRounders.push(sp);
    } else if (sp.player.primaryRole === "Bowler") {
      bowlers.push(sp);
    } else {
      batters.push(sp);
    }
  }

  return { wicketKeepers, batters, allRounders, bowlers };
}

export default function DreamTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Dream Team…</p>
      </div>
    }>
      <DreamTeamContent />
    </Suspense>
  );
}

function DreamTeamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [teamA, setTeamA] = useState<string | null>(searchParams.get("teamA"));
  const [teamB, setTeamB] = useState<string | null>(searchParams.get("teamB"));
  const [selectedSeason, setSelectedSeason] = useState<string>(searchParams.get("season") ?? "");

  // Restore results if we came back with valid params
  const initialResult = useMemo(() => {
    const ta = searchParams.get("teamA");
    const tb = searchParams.get("teamB");
    if (ta && tb && ta !== tb) {
      const s = searchParams.get("season") ?? undefined;
      return selectDreamXI(allPlayers, ta, tb, s || undefined);
    }
    return null;
  }, [searchParams]);

  const [result, setResult] = useState<DreamXIResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);

  // Sync state to URL whenever teams/season change
  const updateUrl = (a: string | null, b: string | null, season: string) => {
    const params = new URLSearchParams();
    if (a) params.set("teamA", a);
    if (b) params.set("teamB", b);
    if (season) params.set("season", season);
    const qs = params.toString();
    router.replace(`/dream-team${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const teams = useMemo(() => getTeamsFromPlayers(allPlayers), []);
  const seasons = useMemo(() => getSeasonsFromPlayers(allPlayers), []);

  const canGenerate = teamA !== null && teamB !== null && teamA !== teamB;

  const handleTeamAChange = (team: string | null) => {
    setTeamA(team);
    updateUrl(team, teamB, selectedSeason);
  };

  const handleTeamBChange = (team: string | null) => {
    setTeamB(team);
    updateUrl(teamA, team, selectedSeason);
  };

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    updateUrl(teamA, teamB, season);
  };

  /** Build the query string that encodes current dream-team state for back navigation */
  const dreamTeamBackParams = () => {
    const params = new URLSearchParams();
    if (teamA) params.set("teamA", teamA);
    if (teamB) params.set("teamB", teamB);
    if (selectedSeason) params.set("season", selectedSeason);
    return params.toString();
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    // Use setTimeout to allow the spinner to render before heavy computation
    setTimeout(() => {
      const dreamXI = selectDreamXI(
        allPlayers,
        teamA,
        teamB,
        selectedSeason || undefined
      );
      setResult(dreamXI);
      updateUrl(teamA, teamB, selectedSeason);
      setGenerating(false);
    }, 50);
  };

  const grouped = result ? groupByRole(result.players) : null;

  if (allPlayers.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
        <header style={{ backgroundColor: "var(--bg-header)" }} className="shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Dream Team Selector
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p style={{ color: "var(--text-muted)" }}>No player data available</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      <header style={{ backgroundColor: "var(--bg-header)" }} className="shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <nav className="mb-1 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }} aria-label="Breadcrumb">
              <Link href="/" className="hover:underline" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
              <span>/</span>
              <span style={{ color: "var(--text-primary)" }}>Dream Team</span>
            </nav>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Dream Team Selector
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <section
          className="rounded-lg border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
        >
          <TeamPicker
            teams={teams}
            teamA={teamA}
            teamB={teamB}
            onChangeA={handleTeamAChange}
            onChangeB={handleTeamBChange}
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="season-filter"
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Season Filter
              </label>
              <select
                id="season-filter"
                data-testid="season-filter"
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <option value="">All Seasons</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              data-testid="generate-btn"
              disabled={!canGenerate || generating}
              onClick={handleGenerate}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
            >
              {generating && <span className="spinner" />}
              {generating ? "Generating..." : "Generate Dream XI"}
            </button>
          </div>
        </section>

        {result && (
          <section data-testid="dream-xi-results" className="space-y-6">
            <div
              data-testid="team-summary"
              className="rounded-lg border p-4 text-center"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <p className="text-sm font-medium">
                {teamA}: {result.teamACount} players | {teamB}: {result.teamBCount} players
              </p>
            </div>

            {result.compositionRelaxed && (
              <div
                data-testid="composition-notice"
                className="rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-center text-sm"
                style={{ color: "#92400e" }}
              >
                Composition is approximate — not enough players in some roles
              </div>
            )}

            {result.players.length === 0 ? (
              <p className="text-center" style={{ color: "var(--text-muted)" }}>
                Not enough players with data for the selected season
              </p>
            ) : (
              <>
                {renderRoleSection("Wicket-Keepers", grouped!.wicketKeepers, dreamTeamBackParams())}
                {renderRoleSection("Batters", grouped!.batters, dreamTeamBackParams())}
                {renderRoleSection("All-Rounders", grouped!.allRounders, dreamTeamBackParams())}
                {renderRoleSection("Bowlers", grouped!.bowlers, dreamTeamBackParams())}
              </>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function renderRoleSection(title: string, players: ScoredPlayer[], backParams: string) {
  if (players.length === 0) return null;
  return (
    <div>
      <h2
        className="mb-3 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((sp, i) => (
          <div key={sp.player.id} className={`animate-fade-in-up stagger-${(i % 6) + 1} card-hover`}>
            <DreamTeamCard
              player={sp.player}
              score={sp.score}
              teamLabel={sp.teamLabel}
              backParams={backParams}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
