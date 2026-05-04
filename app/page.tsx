"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllPlayers } from "@/data/players";
import { filterPlayers } from "@/lib/filterPlayers";
import { sortPlayers } from "@/lib/sortPlayers";
import { FilterState, SortConfig } from "@/data/types";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import SortControls from "@/components/SortControls";
import PlayerCard from "@/components/PlayerCard";
import ThemeToggle from "@/components/ThemeToggle";

const allPlayers = getAllPlayers();
const PAGE_SIZE = 24;

export default function Home() {
  const router = useRouter();

  const [searchQuery, setSearchQueryRaw] = useState("");
  const [activeFilters, setActiveFiltersRaw] = useState<FilterState>({
    primaryRole: null,
    secondaryRole: null,
    team: null,
    season: null,
  });
  const [sortConfig, setSortConfigRaw] = useState<SortConfig>({
    key: "runs",
    direction: "desc",
  });
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryRaw(q);
    setPage(1);
  }, []);
  const setActiveFilters = useCallback((f: FilterState) => {
    setActiveFiltersRaw(f);
    setPage(1);
  }, []);
  const setSortConfig = useCallback((s: SortConfig) => {
    setSortConfigRaw(s);
    setPage(1);
  }, []);

  const teams = useMemo(() => {
    const set = new Set(allPlayers.map((p) => p.team));
    return Array.from(set).sort();
  }, []);

  const seasons = useMemo(() => {
    const set = new Set(allPlayers.flatMap((p) => p.seasons.map((s) => s.year)));
    return Array.from(set).sort();
  }, []);

  const secondaryRoles = useMemo(() => {
    const set = new Set(allPlayers.map((p) => p.secondaryRole).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, []);

  const displayedPlayers = useMemo(() => {
    const filtered = filterPlayers(allPlayers, activeFilters, searchQuery);
    return sortPlayers(filtered, sortConfig);
  }, [searchQuery, activeFilters, sortConfig]);

  const visiblePlayers = useMemo(
    () => displayedPlayers.slice(0, page * PAGE_SIZE),
    [displayedPlayers, page]
  );

  const hasMore = page * PAGE_SIZE < displayedPlayers.length;

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleToggleSelect = (id: string) => {
    setSelectedForComparison((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    router.push(`/compare?ids=${selectedForComparison.join(",")}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header style={{ backgroundColor: 'var(--bg-header)' }} className="shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>IPL Player Stats</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dream-team"
              data-testid="dream-team-link"
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Dream Team
            </Link>
            <Link
              href="/champions"
              data-testid="champions-link"
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Champions
            </Link>
            <Link
              href="/test-dashboard"
              data-testid="test-dashboard-link"
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Test Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <SearchBar query={searchQuery} onChange={setSearchQuery} />
          <FilterPanel
            filters={activeFilters}
            onChange={setActiveFilters}
            teams={teams}
            seasons={seasons}
            secondaryRoles={secondaryRoles}
          />
          <div className="flex items-center justify-between">
            <SortControls sortConfig={sortConfig} onChange={setSortConfig} />
            <button
              type="button"
              onClick={handleCompare}
              disabled={selectedForComparison.length < 2}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Compare Selected ({selectedForComparison.length})
            </button>
          </div>
        </div>

        {displayedPlayers.length === 0 ? (
          <p className="mt-8 text-center" style={{ color: 'var(--text-muted)' }}>No results found</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                season={activeFilters.season ?? undefined}
                selected={selectedForComparison.includes(player.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {visiblePlayers.length} of {displayedPlayers.length} players
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
