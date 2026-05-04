import fc from "fast-check";
import { describe, it, expect } from "vitest";
import {
  transformBattingData,
  transformBowlingData,
  getChartVisibility,
} from "@/lib/graphDataUtils";
import type {
  Player,
  SeasonStats,
  BattingStats,
  BowlingStats,
} from "@/data/types";

// --- Reusable Arbitrary Generators ---

const arbitraryBattingStats: fc.Arbitrary<BattingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  runs: fc.integer({ min: 0, max: 1000 }),
  average: fc.float({ min: 0, max: 100, noNaN: true }),
  strikeRate: fc.float({ min: 0, max: 300, noNaN: true }),
  fifties: fc.integer({ min: 0, max: 10 }),
  hundreds: fc.integer({ min: 0, max: 5 }),
  highestScore: fc.integer({ min: 0, max: 200 }),
});

const arbitraryBowlingStats: fc.Arbitrary<BowlingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  wickets: fc.integer({ min: 0, max: 30 }),
  economy: fc.float({ min: 0, max: 15, noNaN: true }),
  average: fc.float({ min: 0, max: 80, noNaN: true }),
  bestFigures: fc
    .tuple(fc.integer({ min: 0, max: 10 }), fc.integer({ min: 0, max: 50 }))
    .map(([w, r]) => `${w}/${r}`),
  fourWickets: fc.integer({ min: 0, max: 5 }),
  fiveWickets: fc.integer({ min: 0, max: 3 }),
});

const arbitrarySeasonStats: fc.Arbitrary<SeasonStats> = fc.record({
  year: fc.constantFrom("2022", "2023", "2024", "2025"),
  team: fc.string({ minLength: 1, maxLength: 30 }),
  batting: fc.option(arbitraryBattingStats, { nil: undefined }),
  bowling: fc.option(arbitraryBowlingStats, { nil: undefined }),
});

const arbitraryPlayer: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  team: fc.string({ minLength: 1, maxLength: 30 }),
  primaryRole: fc.constantFrom("Batter" as const, "Bowler" as const),
  secondaryRole: fc.option(
    fc.constantFrom(
      "Wicket-Keeper" as const,
      "All-Rounder" as const,
      "Captain" as const,
      "Vice-Captain" as const
    ),
    { nil: undefined }
  ),
  nationality: fc.string({ minLength: 1, maxLength: 30 }),
  seasons: fc.array(arbitrarySeasonStats, { minLength: 0, maxLength: 6 }),
});

// --- Property Tests ---

describe("graphDataUtils property tests", () => {
  // Feature: player-progress-graphs, Property 1: Batting data transformation completeness
  it("Property 1: transformBattingData output length equals seasons with batting data and values match", () => {
    fc.assert(
      fc.property(arbitraryPlayer, (player) => {
        const result = transformBattingData(player);
        const seasonsWithBatting = player.seasons.filter(
          (s) => s.batting !== undefined
        );

        // Output length equals number of seasons with batting data
        expect(result).toHaveLength(seasonsWithBatting.length);

        // Sort source seasons the same way the function does (by year ascending)
        const sortedSeasonsWithBatting = [...seasonsWithBatting].sort((a, b) =>
          a.year.localeCompare(b.year)
        );

        // Each output element's values match the corresponding season's batting stats
        result.forEach((dataPoint, i) => {
          const sourceBatting = sortedSeasonsWithBatting[i].batting!;
          expect(dataPoint.runs).toBe(sourceBatting.runs);
          expect(dataPoint.average).toBe(sourceBatting.average);
          expect(dataPoint.strikeRate).toBe(sourceBatting.strikeRate);
          expect(dataPoint.season).toBe(sortedSeasonsWithBatting[i].year);
        });
      }),
      { numRuns: 100 }
    );
  });

  // Feature: player-progress-graphs, Property 2: Bowling data transformation completeness
  it("Property 2: transformBowlingData output length equals seasons with bowling data and values match", () => {
    fc.assert(
      fc.property(arbitraryPlayer, (player) => {
        const result = transformBowlingData(player);
        const seasonsWithBowling = player.seasons.filter(
          (s) => s.bowling !== undefined
        );

        // Output length equals number of seasons with bowling data
        expect(result).toHaveLength(seasonsWithBowling.length);

        // Sort source seasons the same way the function does (by year ascending)
        const sortedSeasonsWithBowling = [...seasonsWithBowling].sort((a, b) =>
          a.year.localeCompare(b.year)
        );

        // Each output element's values match the corresponding season's bowling stats
        result.forEach((dataPoint, i) => {
          const sourceBowling = sortedSeasonsWithBowling[i].bowling!;
          expect(dataPoint.wickets).toBe(sourceBowling.wickets);
          expect(dataPoint.economy).toBe(sourceBowling.economy);
          expect(dataPoint.average).toBe(sourceBowling.average);
          expect(dataPoint.season).toBe(sortedSeasonsWithBowling[i].year);
        });
      }),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 1.1, 1.2, 4.2, 4.4**
  // **Validates: Requirements 2.1, 2.2, 4.3, 4.4**

  // Feature: player-progress-graphs, Property 3: Transform output is sorted by season ascending
  it("Property 3: transformBattingData and transformBowlingData return arrays sorted by season ascending", () => {
    fc.assert(
      fc.property(arbitraryPlayer, (player) => {
        const battingResult = transformBattingData(player);
        for (let i = 0; i < battingResult.length - 1; i++) {
          expect(battingResult[i].season <= battingResult[i + 1].season).toBe(
            true
          );
        }

        const bowlingResult = transformBowlingData(player);
        for (let i = 0; i < bowlingResult.length - 1; i++) {
          expect(bowlingResult[i].season <= bowlingResult[i + 1].season).toBe(
            true
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 4.1**

  // Feature: player-progress-graphs, Property 4: Chart visibility correctness
  it("Property 4: getChartVisibility returns correct showBatting, showBowling, battingPrimary", () => {
    fc.assert(
      fc.property(arbitraryPlayer, (player) => {
        const result = getChartVisibility(player);

        const hasBatting = player.seasons.some(
          (s) => s.batting !== undefined
        );
        const hasBowling = player.seasons.some(
          (s) => s.bowling !== undefined
        );

        // showBatting is true iff player has at least one season with batting data
        expect(result.showBatting).toBe(hasBatting);

        // showBowling is true iff player has at least one season with bowling data
        expect(result.showBowling).toBe(hasBowling);

        // battingPrimary matches whether primaryRole is "Batter"
        expect(result.battingPrimary).toBe(player.primaryRole === "Batter");
      }),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 1.4, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5**

  // Feature: player-progress-graphs, Property 5: Data transformation round-trip
  it("Property 5: transforming season data into chart data points yields identical numeric values to original", () => {
    fc.assert(
      fc.property(arbitraryPlayer, (player) => {
        // Build sorted source arrays the same way the transform functions do
        const sortedBattingSeasons = player.seasons
          .filter((s) => s.batting !== undefined)
          .sort((a, b) => a.year.localeCompare(b.year));

        const sortedBowlingSeasons = player.seasons
          .filter((s) => s.bowling !== undefined)
          .sort((a, b) => a.year.localeCompare(b.year));

        // Batting round-trip
        const battingPoints = transformBattingData(player);
        expect(battingPoints).toHaveLength(sortedBattingSeasons.length);
        for (let i = 0; i < battingPoints.length; i++) {
          const dp = battingPoints[i];
          const source = sortedBattingSeasons[i];
          expect(dp.season).toBe(source.year);
          expect(dp.runs).toBe(source.batting!.runs);
          expect(dp.average).toBe(source.batting!.average);
          expect(dp.strikeRate).toBe(source.batting!.strikeRate);
        }

        // Bowling round-trip
        const bowlingPoints = transformBowlingData(player);
        expect(bowlingPoints).toHaveLength(sortedBowlingSeasons.length);
        for (let i = 0; i < bowlingPoints.length; i++) {
          const dp = bowlingPoints[i];
          const source = sortedBowlingSeasons[i];
          expect(dp.season).toBe(source.year);
          expect(dp.wickets).toBe(source.bowling!.wickets);
          expect(dp.economy).toBe(source.bowling!.economy);
          expect(dp.average).toBe(source.bowling!.average);
        }
      }),
      { numRuns: 100 }
    );
  });

  // **Validates: Requirements 4.5**
});
