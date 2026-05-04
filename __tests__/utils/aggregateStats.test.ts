import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getAggregateStats, getSeasonStats } from "@/lib/statsUtils";
import {
  Player,
  BattingStats,
  BowlingStats,
  SeasonStats,
} from "@/data/types";


// --- fast-check arbitraries ---

const battingStatsArb: fc.Arbitrary<BattingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  runs: fc.integer({ min: 0, max: 1000 }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.float({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.nat({ max: 10 }),
  hundreds: fc.nat({ max: 5 }),
  highestScore: fc.nat({ max: 300 }),
});

const bowlingStatsArb: fc.Arbitrary<BowlingStats> = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  wickets: fc.integer({ min: 0, max: 50 }),
  economy: fc.float({ min: 0, max: 20, noNaN: true, noDefaultInfinity: true }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc
    .tuple(fc.nat({ max: 10 }), fc.nat({ max: 100 }))
    .map(([w, r]) => `${w}/${r}`),
  fourWickets: fc.nat({ max: 10 }),
  fiveWickets: fc.nat({ max: 5 }),
});

const seasonStatsArb: fc.Arbitrary<SeasonStats> = fc.record({
  year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
  team: fc.constantFrom("MI", "CSK", "RCB", "KKR", "DC", "SRH", "PBKS", "RR"),
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

const teamArb = fc.constantFrom(
  "Mumbai Indians",
  "Chennai Super Kings",
  "Royal Challengers Bangalore",
  "Kolkata Knight Riders",
  "Delhi Capitals",
  "Sunrisers Hyderabad",
  "Punjab Kings",
  "Rajasthan Royals"
);

const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Za-z ]{1,30}$/),
  team: teamArb,
  primaryRole: roleArb,
  secondaryRole: secondaryRoleArb,
  nationality: fc.constantFrom("Indian", "Australian", "English", "South African"),
  seasons: fc.array(seasonStatsArb, { minLength: 1, maxLength: 5 }),
});

// Feature: ipl-player-stats, Property 7: Aggregate stats are correct sums
// Validates: Requirements 4.4
describe("Property 7: Aggregate stats are correct sums", () => {
  it("aggregate batting runs equal the sum of all season batting runs", () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const aggregate = getAggregateStats(player);
        const battingSeasons = player.seasons.filter((s) => s.batting);

        if (battingSeasons.length === 0) {
          expect(aggregate.batting).toBeUndefined();
        } else {
          expect(aggregate.batting).toBeDefined();

          const expectedRuns = battingSeasons.reduce(
            (sum, s) => sum + s.batting!.runs,
            0
          );
          expect(aggregate.batting!.runs).toBe(expectedRuns);

          const expectedMatches = battingSeasons.reduce(
            (sum, s) => sum + s.batting!.matches,
            0
          );
          expect(aggregate.batting!.matches).toBe(expectedMatches);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("aggregate bowling wickets equal the sum of all season bowling wickets", () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const aggregate = getAggregateStats(player);
        const bowlingSeasons = player.seasons.filter((s) => s.bowling);

        if (bowlingSeasons.length === 0) {
          expect(aggregate.bowling).toBeUndefined();
        } else {
          expect(aggregate.bowling).toBeDefined();

          const expectedWickets = bowlingSeasons.reduce(
            (sum, s) => sum + s.bowling!.wickets,
            0
          );
          expect(aggregate.bowling!.wickets).toBe(expectedWickets);

          const expectedMatches = bowlingSeasons.reduce(
            (sum, s) => sum + s.bowling!.matches,
            0
          );
          expect(aggregate.bowling!.matches).toBe(expectedMatches);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Unit tests for getSeasonStats
describe("getSeasonStats", () => {
  const testPlayer: Player = {
    id: "test-1",
    name: "Test Player",
    team: "Mumbai Indians",
    primaryRole: "Batter",
    nationality: "Indian",
    seasons: [
      {
        year: "2021",
        team: "MI",
        batting: {
          matches: 14,
          innings: 14,
          runs: 405,
          average: 28.93,
          strikeRate: 119.47,
          fifties: 3,
          hundreds: 0,
          highestScore: 72,
        },
      },
      {
        year: "2022",
        team: "MI",
        batting: {
          matches: 16,
          innings: 16,
          runs: 341,
          average: 22.73,
          strikeRate: 115.98,
          fifties: 2,
          hundreds: 0,
          highestScore: 73,
        },
      },
    ],
  };

  it("returns the correct season stats for a valid season", () => {
    const stats = getSeasonStats(testPlayer, "2021");
    expect(stats).toBeDefined();
    expect(stats!.year).toBe("2021");
    expect(stats!.batting!.runs).toBe(405);
  });

  it("returns undefined for a season that does not exist", () => {
    const stats = getSeasonStats(testPlayer, "2019");
    expect(stats).toBeUndefined();
  });
});
