"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllPlayers } from "@/data/players";
import {
  computeLeaderboard,
  BATTING_CATEGORIES,
  BOWLING_CATEGORIES,
  FIELDING_CATEGORIES,
  EXTRAS_CATEGORIES,
  NON_STRIKER_CATEGORIES,
  MILESTONE_CATEGORIES,
} from "@/lib/leaderboardEngine";
import type { LeaderboardCategory, LeaderboardResult } from "@/lib/leaderboardEngine";
import LeaderboardCard from "@/components/LeaderboardCard";
import HeroPodium from "@/components/HeroPodium";
import ThemeToggle from "@/components/ThemeToggle";

const allPlayers = getAllPlayers();

interface SectionConfig {
  title: string;
  categories: LeaderboardCategory[];
}

export default function ChampionsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const seasons = useMemo(() => {
    const set = new Set(allPlayers.flatMap((p) => p.seasons.map((s) => s.year)));
    return Array.from(set).sort();
  }, []);

  const seasonParam = selectedSeason || undefined;

  const allResults = useMemo(() => {
    const results = new Map<string, LeaderboardResult>();
    const allCategories = [
      ...BATTING_CATEGORIES,
      ...BOWLING_CATEGORIES,
      ...FIELDING_CATEGORIES,
      ...EXTRAS_CATEGORIES,
      ...NON_STRIKER_CATEGORIES,
      ...MILESTONE_CATEGORIES,
    ];
    for (const cat of allCategories) {
      results.set(cat.id, computeLeaderboard(allPlayers, cat, seasonParam));
    }
    return results;
  }, [seasonParam]);

  // Hero podium: top-3 from "Best Win Contributor"
  const winContributorCategory = MILESTONE_CATEGORIES.find(
    (c) => c.id === "best-win-contributor"
  );
  const heroPodiumPlayers = useMemo(() => {
    if (!winContributorCategory) return [];
    const result = allResults.get(winContributorCategory.id);
    return result?.rankings.slice(0, 3) ?? [];
  }, [allResults, winContributorCategory]);

  // Check if season has any data at all
  const seasonHasData = useMemo(() => {
    for (const result of allResults.values()) {
      if (result.rankings.length > 0) return true;
    }
    return false;
  }, [allResults]);

  // Build sections, filtering out "Most Consistent Batter" when a season is selected
  const milestoneCategories = useMemo(() => {
    if (selectedSeason) {
      return MILESTONE_CATEGORIES.filter((c) => c.id !== "most-consistent");
    }
    return MILESTONE_CATEGORIES;
  }, [selectedSeason]);

  const sections: SectionConfig[] = [
    { title: "Batting", categories: BATTING_CATEGORIES },
    { title: "Bowling", categories: BOWLING_CATEGORIES },
    { title: "Fielding", categories: FIELDING_CATEGORIES },
    { title: "Extras", categories: EXTRAS_CATEGORIES },
    { title: "Non-Striker", categories: NON_STRIKER_CATEGORIES },
    { title: "Milestones", categories: milestoneCategories },
  ];

  // Empty state: no players at all
  if (allPlayers.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
        <header style={{ backgroundColor: "var(--bg-header)" }} className="shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Champions Leaderboard
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="mt-8 text-center" style={{ color: "var(--text-muted)" }}>
            No player data available
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      <header style={{ backgroundColor: "var(--bg-header)" }} className="shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Champions Leaderboard
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Link href="/" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span style={{ color: "var(--text-primary)" }}>Champions</span>
        </nav>

        {/* Season Filter */}
        <div className="mb-6">
          <label
            htmlFor="season-filter"
            className="mr-2 text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Season:
          </label>
          <select
            id="season-filter"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            <option value="">All Seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Empty state: season has no data */}
        {!seasonHasData ? (
          <p className="mt-8 text-center" style={{ color: "var(--text-muted)" }}>
            No data available for this season
          </p>
        ) : (
          <>
            {/* Hero Podium */}
            <section className="mb-10">
              <HeroPodium topPerformers={heroPodiumPlayers} />
            </section>

            {/* Leaderboard Sections */}
            {sections.map((section) => (
              <section key={section.title} className="mb-10">
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.categories.map((cat) => {
                    const result = allResults.get(cat.id);
                    return (
                      <LeaderboardCard
                        key={cat.id}
                        category={cat}
                        best={result?.best ?? null}
                        average={result?.average ?? null}
                        worst={result?.worst ?? null}
                        isEmpty={!result || result.rankings.length === 0}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
