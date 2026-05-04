import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getQualifyingInnings, computeLeaderboard, extractStatValue, BATTING_CATEGORIES, BOWLING_CATEGORIES, FIELDING_CATEGORIES, EXTRAS_CATEGORIES, NON_STRIKER_CATEGORIES, MILESTONE_CATEGORIES } from "@/lib/leaderboardEngine";
import type { LeaderboardCategory } from "@/lib/leaderboardEngine";
import type { Player } from "@/data/types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    name: "Test Player",
    team: "Team A",
    primaryRole: "Batter",
    nationality: "Indian",
    seasons: [],
    ...overrides,
  };
}

describe("getQualifyingInnings", () => {
  it('returns 0 when qualifierType is "none"', () => {
    const player = makePlayer({
      seasons: [
        { year: "2023", team: "Team A", batting: { matches: 10, innings: 8, runs: 300, average: 37.5, strikeRate: 130, fifties: 2, hundreds: 0, highestScore: 80, sixes: 10, fours: 20, ballsAsNonStriker: 100 } },
      ],
    });
    expect(getQualifyingInnings(player, "none")).toBe(0);
  });

  it("sums batting innings across all seasons", () => {
    const player = makePlayer({
      seasons: [
        { year: "2022", team: "Team A", batting: { matches: 10, innings: 8, runs: 200, average: 25, strikeRate: 120, fifties: 1, hundreds: 0, highestScore: 60, sixes: 5, fours: 15, ballsAsNonStriker: 50 } },
        { year: "2023", team: "Team A", batting: { matches: 12, innings: 10, runs: 350, average: 35, strikeRate: 135, fifties: 3, hundreds: 1, highestScore: 105, sixes: 12, fours: 25, ballsAsNonStriker: 80 } },
      ],
    });
    expect(getQualifyingInnings(player, "batting")).toBe(18);
  });

  it("sums bowling innings across all seasons", () => {
    const player = makePlayer({
      seasons: [
        { year: "2022", team: "Team A", bowling: { matches: 10, innings: 9, wickets: 12, economy: 7.5, average: 25, bestFigures: "3/20", fourWickets: 0, fiveWickets: 0, widesConceded: 5, noballsConceded: 2, dotBalls: 50, legByes: 3, byes: 1 } },
        { year: "2023", team: "Team A", bowling: { matches: 12, innings: 11, wickets: 18, economy: 7.0, average: 22, bestFigures: "4/15", fourWickets: 1, fiveWickets: 0, widesConceded: 3, noballsConceded: 1, dotBalls: 70, legByes: 2, byes: 0 } },
      ],
    });
    expect(getQualifyingInnings(player, "bowling")).toBe(20);
  });

  it("returns 0 when player has no batting data for batting qualifier", () => {
    const player = makePlayer({
      seasons: [
        { year: "2023", team: "Team A", bowling: { matches: 10, innings: 9, wickets: 12, economy: 7.5, average: 25, bestFigures: "3/20", fourWickets: 0, fiveWickets: 0, widesConceded: 5, noballsConceded: 2, dotBalls: 50, legByes: 3, byes: 1 } },
      ],
    });
    expect(getQualifyingInnings(player, "batting")).toBe(0);
  });

  it("returns 0 when player has no bowling data for bowling qualifier", () => {
    const player = makePlayer({
      seasons: [
        { year: "2023", team: "Team A", batting: { matches: 10, innings: 8, runs: 300, average: 37.5, strikeRate: 130, fifties: 2, hundreds: 0, highestScore: 80, sixes: 10, fours: 20, ballsAsNonStriker: 100 } },
      ],
    });
    expect(getQualifyingInnings(player, "bowling")).toBe(0);
  });

  it("returns 0 when player has no seasons", () => {
    const player = makePlayer({ seasons: [] });
    expect(getQualifyingInnings(player, "batting")).toBe(0);
    expect(getQualifyingInnings(player, "bowling")).toBe(0);
  });

  it("filters to a specific season when season is provided", () => {
    const player = makePlayer({
      seasons: [
        { year: "2022", team: "Team A", batting: { matches: 10, innings: 8, runs: 200, average: 25, strikeRate: 120, fifties: 1, hundreds: 0, highestScore: 60, sixes: 5, fours: 15, ballsAsNonStriker: 50 } },
        { year: "2023", team: "Team A", batting: { matches: 12, innings: 10, runs: 350, average: 35, strikeRate: 135, fifties: 3, hundreds: 1, highestScore: 105, sixes: 12, fours: 25, ballsAsNonStriker: 80 } },
      ],
    });
    expect(getQualifyingInnings(player, "batting", "2023")).toBe(10);
  });

  it("returns 0 when season filter matches no seasons", () => {
    const player = makePlayer({
      seasons: [
        { year: "2022", team: "Team A", batting: { matches: 10, innings: 8, runs: 200, average: 25, strikeRate: 120, fifties: 1, hundreds: 0, highestScore: 60, sixes: 5, fours: 15, ballsAsNonStriker: 50 } },
      ],
    });
    expect(getQualifyingInnings(player, "batting", "2024")).toBe(0);
  });

  it("only counts innings from the matching qualifier type", () => {
    const player = makePlayer({
      seasons: [
        {
          year: "2023",
          team: "Team A",
          batting: { matches: 10, innings: 8, runs: 300, average: 37.5, strikeRate: 130, fifties: 2, hundreds: 0, highestScore: 80, sixes: 10, fours: 20, ballsAsNonStriker: 100 },
          bowling: { matches: 10, innings: 6, wickets: 10, economy: 8.0, average: 30, bestFigures: "2/25", fourWickets: 0, fiveWickets: 0, widesConceded: 4, noballsConceded: 1, dotBalls: 40, legByes: 2, byes: 1 },
        },
      ],
    });
    expect(getQualifyingInnings(player, "batting")).toBe(8);
    expect(getQualifyingInnings(player, "bowling")).toBe(6);
  });
});

describe("computeLeaderboard", () => {
  const battingCategory: LeaderboardCategory = {
    id: "most-runs",
    label: "Most Runs",
    statPath: "batting.runs",
    direction: "higher",
    qualifierType: "none",
    minInnings: 0,
  };

  const rateCategory: LeaderboardCategory = {
    id: "best-economy",
    label: "Best Economy",
    statPath: "bowling.economy",
    direction: "lower",
    qualifierType: "bowling",
    minInnings: 5,
  };

  const consistencyCategory: LeaderboardCategory = {
    id: "most-consistent",
    label: "Most Consistent Batter",
    statPath: "special:consistency",
    direction: "lower",
    qualifierType: "none",
    minInnings: 0,
    minSeasons: 3,
  };

  function makeBattingSeason(year: string, runs: number, innings = 10) {
    return {
      year,
      team: "Team A",
      batting: {
        matches: innings, innings, runs, average: runs / innings,
        strikeRate: 130, fifties: 0, hundreds: 0, highestScore: runs,
        sixes: 0, fours: 0, ballsAsNonStriker: 0,
      },
    };
  }

  function makeBowlingSeason(year: string, economy: number, innings = 10) {
    return {
      year,
      team: "Team A",
      bowling: {
        matches: innings, innings, wickets: 10, economy, average: 25,
        bestFigures: "3/20", fourWickets: 0, fiveWickets: 0,
        widesConceded: 0, noballsConceded: 0, dotBalls: 50, legByes: 0, byes: 0,
      },
    };
  }

  it("returns empty result when no players provided", () => {
    const result = computeLeaderboard([], battingCategory);
    expect(result.rankings).toEqual([]);
    expect(result.best).toBeNull();
    expect(result.average).toBeNull();
    expect(result.worst).toBeNull();
    expect(result.category).toBe(battingCategory);
  });

  it("ranks players by descending stat value for 'higher' direction", () => {
    const players = [
      makePlayer({ id: "p1", name: "Low", seasons: [makeBattingSeason("2023", 100)] }),
      makePlayer({ id: "p2", name: "High", seasons: [makeBattingSeason("2023", 500)] }),
      makePlayer({ id: "p3", name: "Mid", seasons: [makeBattingSeason("2023", 300)] }),
    ];
    const result = computeLeaderboard(players, battingCategory);
    expect(result.rankings.map((r) => r.player.id)).toEqual(["p2", "p3", "p1"]);
    expect(result.rankings.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("ranks players by ascending stat value for 'lower' direction", () => {
    const players = [
      makePlayer({ id: "p1", name: "A", seasons: [makeBowlingSeason("2023", 9.0)] }),
      makePlayer({ id: "p2", name: "B", seasons: [makeBowlingSeason("2023", 6.0)] }),
      makePlayer({ id: "p3", name: "C", seasons: [makeBowlingSeason("2023", 7.5)] }),
    ];
    const result = computeLeaderboard(players, rateCategory);
    expect(result.rankings.map((r) => r.player.id)).toEqual(["p2", "p3", "p1"]);
  });

  it("identifies best, average, and worst correctly", () => {
    const players = [
      makePlayer({ id: "p1", seasons: [makeBattingSeason("2023", 100)] }),
      makePlayer({ id: "p2", seasons: [makeBattingSeason("2023", 500)] }),
      makePlayer({ id: "p3", seasons: [makeBattingSeason("2023", 300)] }),
      makePlayer({ id: "p4", seasons: [makeBattingSeason("2023", 200)] }),
      makePlayer({ id: "p5", seasons: [makeBattingSeason("2023", 400)] }),
    ];
    const result = computeLeaderboard(players, battingCategory);
    expect(result.best!.player.id).toBe("p2");
    expect(result.worst!.player.id).toBe("p1");
    // median index = floor(5/2) = 2 → rank 3 (300 runs = p3)
    expect(result.average!.player.id).toBe("p3");
  });

  it("filters out players who don't meet minimum innings qualifier", () => {
    const players = [
      makePlayer({ id: "p1", seasons: [makeBowlingSeason("2023", 7.0, 10)] }),
      makePlayer({ id: "p2", seasons: [makeBowlingSeason("2023", 6.0, 3)] }), // only 3 innings < 5
    ];
    const result = computeLeaderboard(players, rateCategory);
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].player.id).toBe("p1");
  });

  it("filters out players without relevant stat data", () => {
    const players = [
      makePlayer({ id: "p1", seasons: [makeBattingSeason("2023", 300)] }),
      makePlayer({ id: "p2", seasons: [{ year: "2023", team: "Team A" }] }), // no batting
    ];
    const result = computeLeaderboard(players, battingCategory);
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].player.id).toBe("p1");
  });

  it("applies season filter correctly", () => {
    const players = [
      makePlayer({ id: "p1", seasons: [makeBattingSeason("2022", 200), makeBattingSeason("2023", 400)] }),
      makePlayer({ id: "p2", seasons: [makeBattingSeason("2022", 500)] }), // no 2023 data
    ];
    const result = computeLeaderboard(players, battingCategory, "2023");
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].player.id).toBe("p1");
    expect(result.rankings[0].statValue).toBe(400);
  });

  it("applies minSeasons filter for consistency category", () => {
    const players = [
      makePlayer({
        id: "p1",
        seasons: [makeBattingSeason("2021", 300), makeBattingSeason("2022", 310), makeBattingSeason("2023", 290)],
      }),
      makePlayer({
        id: "p2",
        seasons: [makeBattingSeason("2022", 200), makeBattingSeason("2023", 400)], // only 2 seasons
      }),
    ];
    const result = computeLeaderboard(players, consistencyCategory);
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].player.id).toBe("p1");
  });

  it("returns single player as best, average, and worst", () => {
    const players = [
      makePlayer({ id: "p1", seasons: [makeBattingSeason("2023", 300)] }),
    ];
    const result = computeLeaderboard(players, battingCategory);
    expect(result.rankings).toHaveLength(1);
    expect(result.best!.player.id).toBe("p1");
    expect(result.average!.player.id).toBe("p1");
    expect(result.worst!.player.id).toBe("p1");
  });
});


// --- Property-based test arbitraries ---

const battingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  runs: fc.integer({ min: 0, max: 1000 }),
  average: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.double({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.integer({ min: 0, max: 10 }),
  hundreds: fc.integer({ min: 0, max: 5 }),
  highestScore: fc.integer({ min: 0, max: 200 }),
  sixes: fc.integer({ min: 0, max: 100 }),
  fours: fc.integer({ min: 0, max: 200 }),
  ballsAsNonStriker: fc.integer({ min: 0, max: 500 }),
});

const bowlingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 20 }),
  innings: fc.integer({ min: 1, max: 20 }),
  wickets: fc.integer({ min: 0, max: 50 }),
  economy: fc.double({ min: 0, max: 20, noNaN: true, noDefaultInfinity: true }),
  average: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc.constant("3/25"),
  fourWickets: fc.integer({ min: 0, max: 5 }),
  fiveWickets: fc.integer({ min: 0, max: 3 }),
  widesConceded: fc.integer({ min: 0, max: 50 }),
  noballsConceded: fc.integer({ min: 0, max: 30 }),
  dotBalls: fc.integer({ min: 0, max: 200 }),
  legByes: fc.integer({ min: 0, max: 30 }),
  byes: fc.integer({ min: 0, max: 20 }),
});

const fieldingStatsArb = fc.record({
  catches: fc.integer({ min: 0, max: 30 }),
  runOuts: fc.integer({ min: 0, max: 15 }),
  stumpings: fc.integer({ min: 0, max: 20 }),
});

const playerArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.constantFrom("Team A", "Team B", "Team C"),
  primaryRole: fc.constantFrom("Batter" as const, "Bowler" as const),
  nationality: fc.constant("Indian"),
  seasons: fc.array(
    fc.record({
      year: fc.constantFrom("2022", "2023", "2024"),
      team: fc.constantFrom("Team A", "Team B", "Team C"),
      batting: fc.option(battingStatsArb, { nil: undefined }),
      bowling: fc.option(bowlingStatsArb, { nil: undefined }),
      fielding: fc.option(fieldingStatsArb, { nil: undefined }),
    }),
    { minLength: 1, maxLength: 4 }
  ),
});

// Category arbitrary covering standard categories (not special/milestone)
const categoryArb = fc.constantFrom(
  ...BATTING_CATEGORIES,
  ...BOWLING_CATEGORIES,
  ...FIELDING_CATEGORIES,
  ...EXTRAS_CATEGORIES,
  ...NON_STRIKER_CATEGORIES,
);

describe("Property-based tests", () => {
  it("Feature: champions-leaderboard, Property 1: Sort-order invariant", () => {
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), categoryArb, (players, category) => {
        const result = computeLeaderboard(players, category);
        const values = result.rankings.map(r => r.statValue);
        for (let i = 1; i < values.length; i++) {
          if (category.direction === "higher") {
            expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]);
          } else {
            expect(values[i - 1]).toBeLessThanOrEqual(values[i]);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 2: Ranking idempotence", () => {
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), categoryArb, (players, category) => {
        const result1 = computeLeaderboard(players, category);
        const result2 = computeLeaderboard(players, category);
        expect(result1.rankings.length).toBe(result2.rankings.length);
        for (let i = 0; i < result1.rankings.length; i++) {
          expect(result1.rankings[i].player.id).toBe(result2.rankings[i].player.id);
          expect(result1.rankings[i].statValue).toBe(result2.rankings[i].statValue);
          expect(result1.rankings[i].rank).toBe(result2.rankings[i].rank);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 3: Size preservation", () => {
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), categoryArb, (players, category) => {
        const result = computeLeaderboard(players, category);
        // Count players that should qualify
        let expectedCount = 0;
        for (const player of players) {
          const statValue = extractStatValue(player, category);
          if (statValue == null) continue;
          if (category.qualifierType !== "none") {
            const innings = getQualifyingInnings(player, category.qualifierType);
            if (innings < category.minInnings) continue;
          }
          expectedCount++;
        }
        expect(result.rankings.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 4: Tier ordering", () => {
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 1, maxLength: 10 }), categoryArb, (players, category) => {
        const result = computeLeaderboard(players, category);
        if (result.best && result.average && result.worst) {
          if (category.direction === "higher") {
            expect(result.best.statValue).toBeGreaterThanOrEqual(result.average.statValue);
            expect(result.average.statValue).toBeGreaterThanOrEqual(result.worst.statValue);
          } else {
            expect(result.best.statValue).toBeLessThanOrEqual(result.average.statValue);
            expect(result.average.statValue).toBeLessThanOrEqual(result.worst.statValue);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 5: Qualifier filtering", () => {
    // Use only categories with qualifiers (minInnings > 0)
    const qualifiedCategoryArb = fc.constantFrom(
      ...BATTING_CATEGORIES.filter(c => c.minInnings > 0),
      ...BOWLING_CATEGORIES.filter(c => c.minInnings > 0),
      ...EXTRAS_CATEGORIES.filter(c => c.minInnings > 0),
    );
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), qualifiedCategoryArb, (players, category) => {
        const result = computeLeaderboard(players, category);
        for (const ranked of result.rankings) {
          const innings = getQualifyingInnings(ranked.player, category.qualifierType);
          expect(innings).toBeGreaterThanOrEqual(category.minInnings);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 6: Season filter restricts data", () => {
    const seasonArb = fc.constantFrom("2022", "2023", "2024");
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), categoryArb, seasonArb, (players, category, season) => {
        const result = computeLeaderboard(players, category, season);
        for (const ranked of result.rankings) {
          const hasSeason = ranked.player.seasons.some(s => s.year === season);
          expect(hasSeason).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 7: Null stat exclusion", () => {
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), categoryArb, (players, category) => {
        const result = computeLeaderboard(players, category);
        for (const ranked of result.rankings) {
          expect(ranked.statValue).not.toBeNull();
          expect(ranked.statValue).not.toBeUndefined();
          expect(typeof ranked.statValue).toBe("number");
          expect(Number.isNaN(ranked.statValue)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: champions-leaderboard, Property 8: Consistency minimum seasons", () => {
    const consistencyCategory = MILESTONE_CATEGORIES.find(c => c.id === "most-consistent")!;
    fc.assert(
      fc.property(fc.array(playerArb, { minLength: 0, maxLength: 10 }), (players) => {
        const result = computeLeaderboard(players, consistencyCategory);
        for (const ranked of result.rankings) {
          const battingSeasons = ranked.player.seasons.filter(s => s.batting != null).length;
          expect(battingSeasons).toBeGreaterThanOrEqual(3);
        }
      }),
      { numRuns: 100 }
    );
  });
});
