import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Player, BattingStats, BowlingStats, SeasonStats } from "@/data/types";

// Feature: ipl-player-stats, Property 12: Player JSON round-trip
// Validates: Requirements 8.5

const battingStatsArb: fc.Arbitrary<BattingStats> = fc.record({
  matches: fc.nat({ max: 200 }),
  innings: fc.nat({ max: 200 }),
  runs: fc.nat({ max: 10000 }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.float({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.nat({ max: 100 }),
  hundreds: fc.nat({ max: 50 }),
  highestScore: fc.nat({ max: 300 }),
});

const bowlingStatsArb: fc.Arbitrary<BowlingStats> = fc.record({
  matches: fc.nat({ max: 200 }),
  innings: fc.nat({ max: 200 }),
  wickets: fc.nat({ max: 500 }),
  economy: fc.float({ min: 0, max: 20, noNaN: true, noDefaultInfinity: true }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc.tuple(fc.nat({ max: 10 }), fc.nat({ max: 100 })).map(
    ([w, r]) => `${w}/${r}`
  ),
  fourWickets: fc.nat({ max: 50 }),
  fiveWickets: fc.nat({ max: 30 }),
});

const seasonStatsArb: fc.Arbitrary<SeasonStats> = fc.record({
  year: fc.integer({ min: 2008, max: 2025 }).map(String),
  team: fc.stringMatching(/^[A-Z]{2,5}$/),
  batting: fc.option(battingStatsArb, { nil: undefined }),
  bowling: fc.option(bowlingStatsArb, { nil: undefined }),
});

const roleArb = fc.constantFrom(
  "Batter" as const,
  "Bowler" as const
);

const secondaryRoleArb = fc.option(
  fc.constantFrom("Wicket-Keeper" as const, "All-Rounder" as const, "Captain" as const, "Vice-Captain" as const),
  { nil: undefined }
);

const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  team: fc.stringMatching(/^[A-Z]{2,5}$/),
  primaryRole: roleArb,
  secondaryRole: secondaryRoleArb,
  nationality: fc.string({ minLength: 1, maxLength: 30 }),
  seasons: fc.array(seasonStatsArb, { minLength: 1, maxLength: 5 }),
});

describe("Property 12: Player JSON round-trip", () => {
  it("JSON.parse(JSON.stringify(player)) deep-equals the original", () => {
    fc.assert(
      fc.property(playerArb, (player: Player) => {
        const roundTripped = JSON.parse(JSON.stringify(player));
        expect(roundTripped).toEqual(player);
      }),
      { numRuns: 100 }
    );
  });
});
