import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, cleanup } from "@testing-library/react";
import type {
  Player,
  BattingStats,
  BowlingStats,
  SeasonStats,
} from "@/data/types";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import { getStatValue } from "@/lib/sortPlayers";

// Shared arbitraries

const battingStatsArb: fc.Arbitrary<BattingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 200 }),
  innings: fc.integer({ min: 1, max: 200 }),
  runs: fc.integer({ min: 0, max: 10000 }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.float({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.nat({ max: 100 }),
  hundreds: fc.nat({ max: 50 }),
  highestScore: fc.nat({ max: 300 }),
});

const bowlingStatsArb: fc.Arbitrary<BowlingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 200 }),
  innings: fc.integer({ min: 1, max: 200 }),
  wickets: fc.integer({ min: 0, max: 500 }),
  economy: fc.float({ min: 0, max: 20, noNaN: true, noDefaultInfinity: true }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc
    .tuple(fc.nat({ max: 10 }), fc.nat({ max: 100 }))
    .map(([w, r]) => `${w}/${r}`),
  fourWickets: fc.nat({ max: 50 }),
  fiveWickets: fc.nat({ max: 30 }),
});

const seasonArb: fc.Arbitrary<SeasonStats> = fc.record({
  year: fc.integer({ min: 2008, max: 2025 }).map(String),
  team: fc.stringMatching(/^[A-Z]{2,5}$/),
  batting: battingStatsArb,
  bowling: bowlingStatsArb,
});

const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Za-z ]{1,30}$/),
  team: fc.stringMatching(/^[A-Z]{2,5}$/),
  primaryRole: fc.constantFrom(
    "Batter" as const,
    "Bowler" as const
  ),
  secondaryRole: fc.option(
    fc.constantFrom("Wicket-Keeper" as const, "All-Rounder" as const, "Captain" as const, "Vice-Captain" as const),
    { nil: undefined }
  ),
  nationality: fc.stringMatching(/^[A-Za-z]{1,20}$/),
  seasons: fc.array(seasonArb, { minLength: 1, maxLength: 3 }),
});

const playersArb = fc.array(playerArb, { minLength: 2, maxLength: 4 });

const STAT_KEYS = ["runs", "wickets", "average", "strikeRate", "economy"];

// Feature: ipl-player-stats, Property 8: Comparison view shows matching stat rows
// Validates: Requirements 5.2, 5.3
describe("Property 8: Comparison view shows matching stat rows", () => {
  it("for any set of 2 to 4 players, the comparison output contains the same stat rows for each player and each row has a value for every player", () => {
    fc.assert(
      fc.property(playersArb, (players) => {
        cleanup();
        const { container } = render(
          <PlayerComparisonView players={players} />
        );

        for (const key of STAT_KEYS) {
          const row = container.querySelector(
            `[data-testid="stat-row-${key}"]`
          );
          expect(row).not.toBeNull();

          // Each stat row should have a value span for every player
          // The new UI uses div-based stat bars with font-mono value spans
          const valueSpans = row!.querySelectorAll("span.font-mono");
          expect(valueSpans.length).toBe(players.length);

          // Each value span should have non-empty text
          for (const span of valueSpans) {
            expect(span.textContent!.trim()).not.toBe("");
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: ipl-player-stats, Property 9: Superior stat highlighting
// Validates: Requirements 5.5
describe("Property 9: Superior stat highlighting", () => {
  const higherIsBetter: Record<string, boolean> = {
    runs: true,
    wickets: true,
    average: true,
    strikeRate: true,
    economy: false,
  };

  it("for any set of 2 to 4 players and any stat row, the highlighted value is the best among compared players", () => {
    fc.assert(
      fc.property(playersArb, (players) => {
        cleanup();
        const { container } = render(
          <PlayerComparisonView players={players} />
        );

        for (const key of STAT_KEYS) {
          const row = container.querySelector(
            `[data-testid="stat-row-${key}"]`
          );
          expect(row).not.toBeNull();

          // Compute expected best value
          const values = players.map((p) => getStatValue(p, key));
          const best = higherIsBetter[key]
            ? Math.max(...values)
            : Math.min(...values);

          // Find the highlighted cell(s) in this row
          const bestCells = row!.querySelectorAll('[data-testid="best-value"]');
          expect(bestCells.length).toBeGreaterThanOrEqual(1);

          // The highlighted cell's numeric value should equal the best value
          for (const cell of bestCells) {
            const cellValue = parseFloat(cell.textContent!.trim());
            expect(cellValue).toBeCloseTo(best, 1);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
