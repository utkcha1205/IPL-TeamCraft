"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPlayerById } from "@/data/players";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import Footer from "@/components/Footer";

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <span className="spinner-dark mb-3" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading comparison…</p>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();

  const players = useMemo(() => {
    const idsParam = searchParams.get("ids") ?? "";
    if (!idsParam.trim()) return [];
    const ids = idsParam.split(",").filter((id) => id.trim() !== "");
    return ids.map((id) => getPlayerById(id.trim())).filter((p) => p !== undefined);
  }, [searchParams]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header className="shadow-sm" style={{ backgroundColor: 'var(--bg-header)' }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Player Comparison
          </h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {players.length < 2 ? (
          <div className="text-center py-16">
            <p style={{ color: 'var(--text-secondary)' }}>
              Please select at least 2 players to compare.
            </p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              ← Go to Dashboard
            </Link>
          </div>
        ) : (
          <PlayerComparisonView players={players} />
        )}
      </main>
      <Footer />
    </div>
  );
}
