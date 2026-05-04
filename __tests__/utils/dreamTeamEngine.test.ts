import { describe, it, expect } from "vitest";
import {
  computeBattingScore,
  computeBowlingScore,
  hasHeadToHead,
  computePlayerScore,
  getTeamsFromPlayers,
  getSeasonsFromPlayers,
} from "@/lib/dreamTeamEngine";
import { getAggregateStats } from "@/lib/statsUtils";
import type { Player } from "@/data/types";

// --- Helper factories ---

function makeBatter(overrides: Partial<Player> = {}): Player {
  return {
    id: "batter-1",
    name: "Test Batter",
    team: "Team A",
    primaryRole: "Batter",
    nationality: "Indian",
    seasons: [
      {
        year: "2023",
        team: "Team A",
        batting: {
          matches: 14,
          innings: 14,
          runs: 500,
          average: 35,
          strikeRate: 140,
          fifties: 3,
          hundreds: 1,
          highestScore: 100,
        },
      },
    ],
    ...overrides,
  };
}

function makeBowler(overrides: Partial<Player> = {}): Player {
  return {
    id: "bowler-1",
    name: "Test Bowler",
    team: "Team A",
    primaryRole: "Bowler",
    nationality: "Indian",
    seasons: [
      {
        year: "2023",
        team: "Team A",
        bowling: {
          matches: 14,
          innings: 14,
          wickets: 20,
          economy: 7.5,
          average: 25,
          bestFigures: "4/20",
          fourWickets: 1,
          fiveWickets: 0,
        },
      },
    ],
    ...overrides,
  };
}

function makeAllRounder(overrides: Partial<Player> = {}): Player {
  return {
    id: "allrounder-1",
    name: "Test All-Rounder",
    team: "Team A",
    primaryRole: "Batter",
    secondaryRole: "All-Rounder",
    nationality: "Indian",
    seasons: [
      {
        year: "2023",
        team: "Team A",
        batting: {
          matches: 14,
          innings: 14,
          runs: 400,
          average: 30,
          strikeRate: 130,
          fifties: 2,
          hundreds: 0,
          highestScore: 80,
        },
        bowling: {
          matches: 14,
          innings: 14,
          wickets: 15,
          economy: 8,
          average: 28,
          bestFigures: "3/25",
          fourWickets: 0,
          fiveWickets: 0,
        },
      },
    ],
    ...overrides,
  };
}

// --- computeBattingScore ---

describe("computeBattingScore", () => {
  it("returns 0 for undefined stats", () => {
    expect(computeBattingScore(undefined)).toBe(0);
  });

  it("computes correct score for known stats", () => {
    // average=50, strikeRate=200, runs=5000 → all components maxed
    const score = computeBattingScore({
      matches: 100,
      runs: 5000,
      average: 50,
      strikeRate: 200,
    });
    expect(score).toBeCloseTo(100, 5);
  });

  it("computes correct score for partial stats", () => {
    // average=25 → 0.4 * (25/50) * 100 = 20
    // strikeRate=100 → 0.35 * (100/200) * 100 = 17.5
    // runs=2500 → 0.25 * (2500/5000) * 100 = 12.5
    const score = computeBattingScore({
      matches: 50,
      runs: 2500,
      average: 25,
      strikeRate: 100,
    });
    expect(score).toBeCloseTo(50, 5);
  });

  it("clamps values above maximum", () => {
    const score = computeBattingScore({
      matches: 200,
      runs: 10000,
      average: 100,
      strikeRate: 400,
    });
    // All clamped to 1, so score = 100
    expect(score).toBeCloseTo(100, 5);
  });

  it("returns 0 for all-zero stats", () => {
    const score = computeBattingScore({
      matches: 0,
      runs: 0,
      average: 0,
      strikeRate: 0,
    });
    expect(score).toBe(0);
  });
});

// --- computeBowlingScore ---

describe("computeBowlingScore", () => {
  it("returns 0 for undefined stats", () => {
    expect(computeBowlingScore(undefined)).toBe(0);
  });

  it("computes max score for perfect bowling stats", () => {
    // wickets=150 → 0.4 * 1 * 100 = 40
    // economy=0 → 0.35 * (1 - 0) * 100 = 35
    // average=0 → 0.25 * (1 - 0) * 100 = 25
    const score = computeBowlingScore({
      matches: 100,
      wickets: 150,
      economy: 0,
      average: 0,
    });
    expect(score).toBeCloseTo(100, 5);
  });

  it("computes correct score for known stats", () => {
    // wickets=75 → 0.4 * (75/150) * 100 = 20
    // economy=6 → 0.35 * (1 - 6/12) * 100 = 17.5
    // average=20 → 0.25 * (1 - 20/40) * 100 = 12.5
    const score = computeBowlingScore({
      matches: 50,
      wickets: 75,
      economy: 6,
      average: 20,
    });
    expect(score).toBeCloseTo(50, 5);
  });

  it("returns minimum score for worst bowling stats", () => {
    // wickets=0 → 0
    // economy=12+ → 0.35 * (1 - 1) * 100 = 0
    // average=40+ → 0.25 * (1 - 1) * 100 = 0
    const score = computeBowlingScore({
      matches: 10,
      wickets: 0,
      economy: 12,
      average: 40,
    });
    expect(score).toBeCloseTo(0, 5);
  });
});

// --- hasHeadToHead ---

describe("hasHeadToHead", () => {
  it("returns true when opponent team has players in the same season", () => {
    const player = makeBatter({ team: "Team A" });
    const opponentPlayer = makeBatter({
      id: "opp-1",
      team: "Team B",
      seasons: [{ year: "2023", team: "Team B" }],
    });
    expect(hasHeadToHead(player, "Team B", [player, opponentPlayer])).toBe(
      true
    );
  });

  it("returns false when opponent team has no players in the same season", () => {
    const player = makeBatter({ team: "Team A" });
    const opponentPlayer = makeBatter({
      id: "opp-1",
      team: "Team B",
      seasons: [{ year: "2024", team: "Team B" }],
    });
    expect(hasHeadToHead(player, "Team B", [player, opponentPlayer])).toBe(
      false
    );
  });

  it("returns false when no allPlayers provided", () => {
    const player = makeBatter({ team: "Team A" });
    expect(hasHeadToHead(player, "Team B")).toBe(false);
  });

  it("returns false when player has no seasons", () => {
    const player = makeBatter({ team: "Team A", seasons: [] });
    expect(hasHeadToHead(player, "Team B", [])).toBe(false);
  });

  it("skips seasons where player played for the opponent team", () => {
    const player: Player = {
      ...makeBatter({ team: "Team A" }),
      seasons: [{ year: "2023", team: "Team B" }],
    };
    const opponentPlayer = makeBatter({
      id: "opp-1",
      team: "Team B",
      seasons: [{ year: "2023", team: "Team B" }],
    });
    expect(hasHeadToHead(player, "Team B", [player, opponentPlayer])).toBe(
      false
    );
  });
});

// --- computePlayerScore ---

describe("computePlayerScore", () => {
  const teamBPlayer = makeBatter({
    id: "teamb-1",
    team: "Team B",
    seasons: [{ year: "2023", team: "Team B" }],
  });

  it("uses batting score only for Batters", () => {
    const player = makeBatter();
    const allPlayers = [player];
    const score = computePlayerScore(player, "Team B", allPlayers);
    const expectedBatting = computeBattingScore({
      matches: 14,
      runs: 500,
      average: 35,
      strikeRate: 140,
    });
    // No H2H since no opponent players in allPlayers
    expect(score).toBeCloseTo(expectedBatting, 5);
  });

  it("uses bowling score only for Bowlers", () => {
    const player = makeBowler();
    const allPlayers = [player];
    const score = computePlayerScore(player, "Team B", allPlayers);
    const expectedBowling = computeBowlingScore({
      matches: 14,
      wickets: 20,
      economy: 7.5,
      average: 25,
    });
    expect(score).toBeCloseTo(expectedBowling, 5);
  });

  it("uses 50/50 batting+bowling for All-Rounders", () => {
    const player = makeAllRounder();
    const allPlayers = [player];
    const score = computePlayerScore(player, "Team B", allPlayers);
    const batting = computeBattingScore({
      matches: 14,
      runs: 400,
      average: 30,
      strikeRate: 130,
    });
    const bowling = computeBowlingScore({
      matches: 14,
      wickets: 15,
      economy: 8,
      average: 28,
    });
    expect(score).toBeCloseTo(0.5 * batting + 0.5 * bowling, 5);
  });

  it("applies 1.1x head-to-head bonus", () => {
    const player = makeBatter();
    const allPlayers = [player, teamBPlayer];
    const scoreWithH2H = computePlayerScore(player, "Team B", allPlayers);
    const scoreWithoutH2H = computePlayerScore(player, "Team B", [player]);
    expect(scoreWithH2H).toBeCloseTo(scoreWithoutH2H * 1.1, 5);
  });

  it("uses season-specific stats when season is provided", () => {
    const player = makeBatter({
      seasons: [
        {
          year: "2023",
          team: "Team A",
          batting: {
            matches: 14,
            innings: 14,
            runs: 500,
            average: 35,
            strikeRate: 140,
            fifties: 3,
            hundreds: 1,
            highestScore: 100,
          },
        },
        {
          year: "2024",
          team: "Team A",
          batting: {
            matches: 10,
            innings: 10,
            runs: 200,
            average: 20,
            strikeRate: 110,
            fifties: 1,
            hundreds: 0,
            highestScore: 50,
          },
        },
      ],
    });
    const score2023 = computePlayerScore(player, "Team B", [], "2023");
    const score2024 = computePlayerScore(player, "Team B", [], "2024");
    // 2023 stats are better, so score should be higher
    expect(score2023).toBeGreaterThan(score2024);
  });

  it("returns 0 when player has no data for the specified season", () => {
    const player = makeBatter();
    const score = computePlayerScore(player, "Team B", [], "2099");
    expect(score).toBe(0);
  });

  it("uses batting score for Wicket-Keepers", () => {
    const player = makeBatter({ secondaryRole: "Wicket-Keeper" });
    const allPlayers = [player];
    const score = computePlayerScore(player, "Team B", allPlayers);
    const expectedBatting = computeBattingScore({
      matches: 14,
      runs: 500,
      average: 35,
      strikeRate: 140,
    });
    expect(score).toBeCloseTo(expectedBatting, 5);
  });
});

// --- getTeamsFromPlayers ---

describe("getTeamsFromPlayers", () => {
  it("returns sorted unique team names", () => {
    const players = [
      makeBatter({ team: "Zebras" }),
      makeBatter({ id: "b2", team: "Alphas" }),
      makeBatter({ id: "b3", team: "Zebras" }),
    ];
    expect(getTeamsFromPlayers(players)).toEqual(["Alphas", "Zebras"]);
  });

  it("returns empty array for no players", () => {
    expect(getTeamsFromPlayers([])).toEqual([]);
  });
});

// --- getSeasonsFromPlayers ---

describe("getSeasonsFromPlayers", () => {
  it("returns sorted unique seasons", () => {
    const players = [
      makeBatter({
        seasons: [
          { year: "2024", team: "A" },
          { year: "2022", team: "A" },
        ],
      }),
      makeBatter({
        id: "b2",
        seasons: [{ year: "2023", team: "B" }],
      }),
    ];
    expect(getSeasonsFromPlayers(players)).toEqual(["2022", "2023", "2024"]);
  });

  it("returns empty array for no players", () => {
    expect(getSeasonsFromPlayers([])).toEqual([]);
  });
});


// --- Property-Based Tests ---

import fc from "fast-check";

// --- Arbitraries ---

/** Arbitrary for non-negative finite numbers */
const nonNegFinite = fc.double({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true });

/** Arbitrary for aggregate batting stats */
const battingStatsArb = fc.record({
  matches: fc.integer({ min: 0, max: 500 }),
  runs: fc.integer({ min: 0, max: 15000 }),
  average: nonNegFinite,
  strikeRate: nonNegFinite,
});

/** Arbitrary for aggregate bowling stats */
const bowlingStatsArb = fc.record({
  matches: fc.integer({ min: 0, max: 500 }),
  wickets: fc.integer({ min: 0, max: 500 }),
  economy: nonNegFinite,
  average: nonNegFinite,
});

/** Arbitrary for full BattingStats (season-level) */
const fullBattingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 50 }),
  innings: fc.integer({ min: 1, max: 50 }),
  runs: fc.integer({ min: 0, max: 5000 }),
  average: nonNegFinite,
  strikeRate: nonNegFinite,
  fifties: fc.integer({ min: 0, max: 20 }),
  hundreds: fc.integer({ min: 0, max: 10 }),
  highestScore: fc.integer({ min: 0, max: 300 }),
});

/** Arbitrary for full BowlingStats (season-level) */
const fullBowlingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 50 }),
  innings: fc.integer({ min: 1, max: 50 }),
  wickets: fc.integer({ min: 0, max: 100 }),
  economy: nonNegFinite,
  average: nonNegFinite,
  bestFigures: fc.constant("3/25"),
  fourWickets: fc.integer({ min: 0, max: 5 }),
  fiveWickets: fc.integer({ min: 0, max: 3 }),
});

/** Arbitrary for a pure Batter player (no secondary role or WK) */
const pureBatterArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.constant("Team A"),
  primaryRole: fc.constant("Batter" as const),
  nationality: fc.constant("Indian"),
  seasons: fc.array(
    fc.record({
      year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
      team: fc.constant("Team A"),
      batting: fullBattingStatsArb,
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

/** Arbitrary for a Wicket-Keeper player */
const wicketKeeperArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.constant("Team A"),
  primaryRole: fc.constant("Batter" as const),
  secondaryRole: fc.constant("Wicket-Keeper" as const),
  nationality: fc.constant("Indian"),
  seasons: fc.array(
    fc.record({
      year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
      team: fc.constant("Team A"),
      batting: fullBattingStatsArb,
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

/** Arbitrary for a pure Bowler player */
const pureBowlerArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.constant("Team A"),
  primaryRole: fc.constant("Bowler" as const),
  nationality: fc.constant("Indian"),
  seasons: fc.array(
    fc.record({
      year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
      team: fc.constant("Team A"),
      bowling: fullBowlingStatsArb,
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

/** Arbitrary for an All-Rounder player (has both batting and bowling) */
const allRounderArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.constant("Team A"),
  primaryRole: fc.constant("Batter" as const),
  secondaryRole: fc.constant("All-Rounder" as const),
  nationality: fc.constant("Indian"),
  seasons: fc.array(
    fc.record({
      year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
      team: fc.constant("Team A"),
      batting: fullBattingStatsArb,
      bowling: fullBowlingStatsArb,
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

/** Arbitrary for any player with at least one season of stats */
const anyPlayerArb = fc.oneof(
  pureBatterArb,
  wicketKeeperArb,
  pureBowlerArb,
  allRounderArb
) as fc.Arbitrary<Player>;

// --- Property 2: Score uses correct role-based components ---
// Feature: dream-team-selector, Property 2: Score uses correct role-based components

describe("Property 2: Score uses correct role-based components", () => {
  it("pure Batters use batting score only", () => {
    fc.assert(
      fc.property(pureBatterArb, (player) => {
        // No allPlayers → no H2H bonus, so score = base score
        const score = computePlayerScore(player as Player, "Team B", []);
        const aggregate = getAggregateStats(player as Player);
        const expectedBatting = computeBattingScore(aggregate.batting);
        expect(score).toBeCloseTo(expectedBatting, 5);
      }),
      { numRuns: 100 }
    );
  });

  it("Wicket-Keepers use batting score only", () => {
    fc.assert(
      fc.property(wicketKeeperArb, (player) => {
        const score = computePlayerScore(player as Player, "Team B", []);
        const aggregate = getAggregateStats(player as Player);
        const expectedBatting = computeBattingScore(aggregate.batting);
        expect(score).toBeCloseTo(expectedBatting, 5);
      }),
      { numRuns: 100 }
    );
  });

  it("pure Bowlers use bowling score only", () => {
    fc.assert(
      fc.property(pureBowlerArb, (player) => {
        const score = computePlayerScore(player as Player, "Team B", []);
        const aggregate = getAggregateStats(player as Player);
        const expectedBowling = computeBowlingScore(aggregate.bowling);
        expect(score).toBeCloseTo(expectedBowling, 5);
      }),
      { numRuns: 100 }
    );
  });

  it("All-Rounders use 0.5 × batting + 0.5 × bowling", () => {
    fc.assert(
      fc.property(allRounderArb, (player) => {
        const score = computePlayerScore(player as Player, "Team B", []);
        const aggregate = getAggregateStats(player as Player);
        const expectedBatting = computeBattingScore(aggregate.batting);
        const expectedBowling = computeBowlingScore(aggregate.bowling);
        const expected = 0.5 * expectedBatting + 0.5 * expectedBowling;
        expect(score).toBeCloseTo(expected, 5);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 3: Head-to-head bonus increases score ---
// Feature: dream-team-selector, Property 3: Head-to-head bonus increases score

describe("Property 3: Head-to-head bonus increases score", () => {
  it("score with H2H > score without for any player with positive base score", () => {
    // Generate a player on Team A with at least one season in a shared year,
    // and an opponent player on Team B in the same year, ensuring H2H exists.
    const sharedYear = fc.constantFrom("2020", "2021", "2022", "2023", "2024");

    const playerWithH2HArb = fc.tuple(sharedYear, anyPlayerArb).map(([year, player]) => {
      // Ensure the player has at least one season in the shared year on Team A
      const hasYear = player.seasons.some((s) => s.year === year && s.team === "Team A");
      if (!hasYear) {
        player.seasons.push({
          year,
          team: "Team A",
          batting: {
            matches: 10, innings: 10, runs: 300, average: 30,
            strikeRate: 130, fifties: 2, hundreds: 0, highestScore: 80,
          },
          bowling: {
            matches: 10, innings: 10, wickets: 10, economy: 8,
            average: 30, bestFigures: "2/20", fourWickets: 0, fiveWickets: 0,
          },
        });
      }
      // Create an opponent player on Team B in the same year
      const opponent: Player = {
        id: "opponent-h2h",
        name: "Opponent",
        team: "Team B",
        primaryRole: "Batter",
        nationality: "Indian",
        seasons: [{ year, team: "Team B" }],
      };
      return { player: player as Player, opponent, year };
    });

    fc.assert(
      fc.property(playerWithH2HArb, ({ player, opponent }) => {
        const allPlayersWithH2H = [player, opponent];
        const scoreWithH2H = computePlayerScore(player, "Team B", allPlayersWithH2H);
        const scoreWithoutH2H = computePlayerScore(player, "Team B", []);

        // H2H applies a 1.1x multiplier, so if base score > 0, score with H2H > without
        if (scoreWithoutH2H > 0) {
          expect(scoreWithH2H).toBeGreaterThan(scoreWithoutH2H);
        } else {
          // If base score is 0, H2H bonus doesn't change it (0 * 1.1 = 0)
          expect(scoreWithH2H).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 4: Score normalization range ---
// Feature: dream-team-selector, Property 4: Score normalization range

describe("Property 4: Score normalization range", () => {
  it("base score (before H2H bonus) is in [0, 100] for any player", () => {
    fc.assert(
      fc.property(anyPlayerArb, (player) => {
        // Pass empty allPlayers to ensure no H2H bonus is applied
        const baseScore = computePlayerScore(player, "Team B", []);
        expect(baseScore).toBeGreaterThanOrEqual(0);
        expect(baseScore).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it("computeBattingScore is in [0, 100] for any stats", () => {
    fc.assert(
      fc.property(battingStatsArb, (stats) => {
        const score = computeBattingScore(stats);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it("computeBowlingScore is in [0, 100] for any stats", () => {
    fc.assert(
      fc.property(bowlingStatsArb, (stats) => {
        const score = computeBowlingScore(stats);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});


import { selectDreamXI } from "@/lib/dreamTeamEngine";

// --- Helper: Generate a valid team pool for two teams ---

/**
 * Creates a team-specific arbitrary for a given role, assigning the team name
 * and ensuring all seasons use the provided shared years.
 */
function makeTeamBatterArb(team: string, sharedYears: string[]) {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    team: fc.constant(team),
    primaryRole: fc.constant("Batter" as const),
    nationality: fc.constant("Indian"),
    seasons: fc.tuple(
      ...sharedYears.map((year) =>
        fc.record({
          year: fc.constant(year),
          team: fc.constant(team),
          batting: fullBattingStatsArb,
        })
      )
    ),
  }) as fc.Arbitrary<Player>;
}

function makeTeamBowlerArb(team: string, sharedYears: string[]) {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    team: fc.constant(team),
    primaryRole: fc.constant("Bowler" as const),
    nationality: fc.constant("Indian"),
    seasons: fc.tuple(
      ...sharedYears.map((year) =>
        fc.record({
          year: fc.constant(year),
          team: fc.constant(team),
          bowling: fullBowlingStatsArb,
        })
      )
    ),
  }) as fc.Arbitrary<Player>;
}

function makeTeamWKArb(team: string, sharedYears: string[]) {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    team: fc.constant(team),
    primaryRole: fc.constant("Batter" as const),
    secondaryRole: fc.constant("Wicket-Keeper" as const),
    nationality: fc.constant("Indian"),
    seasons: fc.tuple(
      ...sharedYears.map((year) =>
        fc.record({
          year: fc.constant(year),
          team: fc.constant(team),
          batting: fullBattingStatsArb,
        })
      )
    ),
  }) as fc.Arbitrary<Player>;
}

function makeTeamAllRounderArb(team: string, sharedYears: string[]) {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    team: fc.constant(team),
    primaryRole: fc.constant("Batter" as const),
    secondaryRole: fc.constant("All-Rounder" as const),
    nationality: fc.constant("Indian"),
    seasons: fc.tuple(
      ...sharedYears.map((year) =>
        fc.record({
          year: fc.constant(year),
          team: fc.constant(team),
          batting: fullBattingStatsArb,
          bowling: fullBowlingStatsArb,
        })
      )
    ),
  }) as fc.Arbitrary<Player>;
}

/**
 * Generates a valid pool of players from two teams with sufficient role diversity.
 * Each team gets: 4 batters, 4 bowlers, 2 WKs, 2 all-rounders (24 total).
 * All players share the same season years so H2H and season filtering work.
 */
function validTwoTeamPoolArb() {
  const sharedYears = ["2023", "2024"];
  const teamA = "Team Alpha";
  const teamB = "Team Beta";

  return fc.tuple(
    // Team A: 4 batters, 4 bowlers, 2 WKs, 2 all-rounders
    fc.tuple(
      makeTeamBatterArb(teamA, sharedYears),
      makeTeamBatterArb(teamA, sharedYears),
      makeTeamBatterArb(teamA, sharedYears),
      makeTeamBatterArb(teamA, sharedYears)
    ),
    fc.tuple(
      makeTeamBowlerArb(teamA, sharedYears),
      makeTeamBowlerArb(teamA, sharedYears),
      makeTeamBowlerArb(teamA, sharedYears),
      makeTeamBowlerArb(teamA, sharedYears)
    ),
    fc.tuple(
      makeTeamWKArb(teamA, sharedYears),
      makeTeamWKArb(teamA, sharedYears)
    ),
    fc.tuple(
      makeTeamAllRounderArb(teamA, sharedYears),
      makeTeamAllRounderArb(teamA, sharedYears)
    ),
    // Team B: 4 batters, 4 bowlers, 2 WKs, 2 all-rounders
    fc.tuple(
      makeTeamBatterArb(teamB, sharedYears),
      makeTeamBatterArb(teamB, sharedYears),
      makeTeamBatterArb(teamB, sharedYears),
      makeTeamBatterArb(teamB, sharedYears)
    ),
    fc.tuple(
      makeTeamBowlerArb(teamB, sharedYears),
      makeTeamBowlerArb(teamB, sharedYears),
      makeTeamBowlerArb(teamB, sharedYears),
      makeTeamBowlerArb(teamB, sharedYears)
    ),
    fc.tuple(
      makeTeamWKArb(teamB, sharedYears),
      makeTeamWKArb(teamB, sharedYears)
    ),
    fc.tuple(
      makeTeamAllRounderArb(teamB, sharedYears),
      makeTeamAllRounderArb(teamB, sharedYears)
    )
  ).map(([aBat, aBowl, aWK, aAR, bBat, bBowl, bWK, bAR]) => {
    const allPlayers = [
      ...aBat, ...aBowl, ...aWK, ...aAR,
      ...bBat, ...bBowl, ...bWK, ...bAR,
    ];
    return { players: allPlayers, teamA, teamB, sharedYears };
  });
}

// --- Property 5: Dream XI composition constraints ---
// Feature: dream-team-selector, Property 5: Dream XI composition constraints

describe("Property 5: Dream XI composition constraints", () => {
  /**
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
   *
   * For any two distinct teams with sufficient players of each role,
   * the Dream XI result should satisfy all composition constraints simultaneously.
   */
  it("selects exactly 11 players with correct role composition from two teams", () => {
    fc.assert(
      fc.property(validTwoTeamPoolArb(), ({ players, teamA, teamB }) => {
        const result = selectDreamXI(players, teamA, teamB);

        // Exactly 11 players
        expect(result.players).toHaveLength(11);

        // At least 1 Wicket-Keeper
        const wkCount = result.players.filter(
          (sp) => sp.player.secondaryRole === "Wicket-Keeper"
        ).length;
        expect(wkCount).toBeGreaterThanOrEqual(1);

        // At least 3 pure Batters (primaryRole === "Batter" and not All-Rounder)
        const pureBatterCount = result.players.filter(
          (sp) =>
            sp.player.primaryRole === "Batter" &&
            sp.player.secondaryRole !== "All-Rounder" &&
            sp.player.secondaryRole !== "Wicket-Keeper"
        ).length;
        expect(pureBatterCount).toBeGreaterThanOrEqual(3);

        // At least 3 pure Bowlers (primaryRole === "Bowler" and not All-Rounder)
        const pureBowlerCount = result.players.filter(
          (sp) =>
            sp.player.primaryRole === "Bowler" &&
            sp.player.secondaryRole !== "All-Rounder"
        ).length;
        expect(pureBowlerCount).toBeGreaterThanOrEqual(3);

        // At most 4 All-Rounders
        const allRounderCount = result.players.filter(
          (sp) => sp.player.secondaryRole === "All-Rounder"
        ).length;
        expect(allRounderCount).toBeLessThanOrEqual(4);

        // At least 1 from each team
        expect(result.teamACount).toBeGreaterThanOrEqual(1);
        expect(result.teamBCount).toBeGreaterThanOrEqual(1);

        // Composition should not be relaxed since we provide sufficient players
        expect(result.compositionRelaxed).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 6: Season filter restricts players and stats ---
// Feature: dream-team-selector, Property 6: Season filter restricts players and stats

describe("Property 6: Season filter restricts players and stats", () => {
  /**
   * Validates: Requirements 5.2, 5.3, 5.4
   *
   * For any season filter, every player in the result has season data for
   * that season, and no player without data for that season appears.
   */
  it("every selected player has data for the filtered season", () => {
    fc.assert(
      fc.property(
        validTwoTeamPoolArb(),
        fc.constantFrom("2023", "2024"),
        ({ players, teamA, teamB }, season) => {
          const result = selectDreamXI(players, teamA, teamB, season);

          // Every player in the result must have season data for the filtered season
          for (const sp of result.players) {
            const hasSeasonData = sp.player.seasons.some(
              (s) => s.year === season
            );
            expect(hasSeasonData).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no player without data for the filtered season appears in the result", () => {
    // Create a pool where some players only have data for "2023" and not "2024"

    // Generate a pool with all players having both years, plus extra players
    // that only have "2023" data — these must NOT appear when filtering by "2024"
    const poolWithPartialPlayersArb = fc.tuple(
      validTwoTeamPoolArb(),
      // Extra players that only have "2023" data
      fc.tuple(
        makeTeamBatterArb("Team Alpha", ["2023"]),
        makeTeamBowlerArb("Team Beta", ["2023"])
      )
    ).map(([pool, [extraBatter, extraBowler]]) => {
      // Give extra players unique IDs to avoid collisions
      const allPlayers = [
        ...pool.players,
        { ...extraBatter, id: "extra-batter-only-2023" },
        { ...extraBowler, id: "extra-bowler-only-2023" },
      ];
      return { players: allPlayers, teamA: pool.teamA, teamB: pool.teamB };
    });

    fc.assert(
      fc.property(poolWithPartialPlayersArb, ({ players, teamA, teamB }) => {
        const result = selectDreamXI(players, teamA, teamB, "2024");

        // Players that only have "2023" data must not appear
        const selectedIds = result.players.map((sp) => sp.player.id);
        expect(selectedIds).not.toContain("extra-batter-only-2023");
        expect(selectedIds).not.toContain("extra-bowler-only-2023");

        // Double-check: every selected player has "2024" data
        for (const sp of result.players) {
          const has2024 = sp.player.seasons.some((s) => s.year === "2024");
          expect(has2024).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- selectDreamXI edge cases ---

describe("selectDreamXI edge cases", () => {
  it("returns empty result when no players match the teams", () => {
    // All players belong to unrelated teams
    const players = [
      makeBatter({ id: "u1", team: "Unrelated A" }),
      makeBowler({ id: "u2", team: "Unrelated B" }),
      makeAllRounder({ id: "u3", team: "Unrelated C" }),
    ];
    const result = selectDreamXI(players, "Team X", "Team Y");
    expect(result.players.length).toBeLessThan(11);
    expect(result.players).toHaveLength(0);
  });

  it("relaxes composition when not enough players of a role", () => {
    // Two teams with only batters — no bowlers, no WK
    const battersA = Array.from({ length: 6 }, (_, i) =>
      makeBatter({
        id: `batter-a-${i}`,
        team: "Team A",
        seasons: [
          {
            year: "2023",
            team: "Team A",
            batting: {
              matches: 10,
              innings: 10,
              runs: 300 + i * 50,
              average: 30 + i,
              strikeRate: 120 + i * 5,
              fifties: 2,
              hundreds: 0,
              highestScore: 80,
            },
          },
        ],
      })
    );
    const battersB = Array.from({ length: 6 }, (_, i) =>
      makeBatter({
        id: `batter-b-${i}`,
        team: "Team B",
        seasons: [
          {
            year: "2023",
            team: "Team B",
            batting: {
              matches: 10,
              innings: 10,
              runs: 250 + i * 50,
              average: 25 + i,
              strikeRate: 115 + i * 5,
              fifties: 1,
              hundreds: 0,
              highestScore: 70,
            },
          },
        ],
      })
    );
    const players = [...battersA, ...battersB];
    const result = selectDreamXI(players, "Team A", "Team B");
    expect(result.compositionRelaxed).toBe(true);
    // Should still select available players (up to 11)
    expect(result.players.length).toBeGreaterThan(0);
    expect(result.players.length).toBeLessThanOrEqual(11);
  });

  it("handles teams with very few players", () => {
    // Two teams with only 5 players each (total 10 < 11)
    const teamAPlayers = [
      makeBatter({ id: "a1", team: "Team A" }),
      makeBatter({ id: "a2", team: "Team A" }),
      makeBowler({ id: "a3", team: "Team A" }),
      makeBowler({ id: "a4", team: "Team A" }),
      makeAllRounder({ id: "a5", team: "Team A" }),
    ];
    const teamBPlayers = [
      makeBatter({ id: "b1", team: "Team B" }),
      makeBatter({ id: "b2", team: "Team B" }),
      makeBowler({ id: "b3", team: "Team B" }),
      makeBowler({ id: "b4", team: "Team B" }),
      makeAllRounder({ id: "b5", team: "Team B" }),
    ];
    const players = [...teamAPlayers, ...teamBPlayers];
    const result = selectDreamXI(players, "Team A", "Team B");
    // Only 10 players available, can't fill 11
    expect(result.players.length).toBeLessThanOrEqual(10);
    expect(result.compositionRelaxed).toBe(true);
  });

  it("season filter yielding no eligible players", () => {
    // All players have data for "2023" only, filter by "2099"
    const players = [
      makeBatter({ id: "p1", team: "Team A" }),
      makeBowler({ id: "p2", team: "Team A" }),
      makeBatter({ id: "p3", team: "Team B" }),
      makeBowler({ id: "p4", team: "Team B" }),
    ];
    const result = selectDreamXI(players, "Team A", "Team B", "2099");
    expect(result.players).toHaveLength(0);
  });

  it("selects from both teams even with uneven distribution", () => {
    // Team A has 10 players, Team B has 2
    const teamAPlayers = Array.from({ length: 10 }, (_, i) => {
      if (i < 4) {
        return makeBatter({
          id: `a-bat-${i}`,
          team: "Team A",
          seasons: [
            {
              year: "2023",
              team: "Team A",
              batting: {
                matches: 14,
                innings: 14,
                runs: 400 + i * 100,
                average: 30 + i * 5,
                strikeRate: 130 + i * 10,
                fifties: 2,
                hundreds: 1,
                highestScore: 100,
              },
            },
          ],
        });
      } else if (i < 7) {
        return makeBowler({
          id: `a-bowl-${i}`,
          team: "Team A",
          seasons: [
            {
              year: "2023",
              team: "Team A",
              bowling: {
                matches: 14,
                innings: 14,
                wickets: 15 + (i - 4) * 5,
                economy: 7 + (i - 4) * 0.5,
                average: 22 + (i - 4) * 3,
                bestFigures: "3/20",
                fourWickets: 1,
                fiveWickets: 0,
              },
            },
          ],
        });
      } else if (i === 7) {
        return makeBatter({
          id: `a-wk-${i}`,
          team: "Team A",
          secondaryRole: "Wicket-Keeper",
          seasons: [
            {
              year: "2023",
              team: "Team A",
              batting: {
                matches: 14,
                innings: 14,
                runs: 350,
                average: 28,
                strikeRate: 125,
                fifties: 2,
                hundreds: 0,
                highestScore: 75,
              },
            },
          ],
        });
      } else {
        return makeAllRounder({
          id: `a-ar-${i}`,
          team: "Team A",
          seasons: [
            {
              year: "2023",
              team: "Team A",
              batting: {
                matches: 14,
                innings: 14,
                runs: 300,
                average: 25,
                strikeRate: 120,
                fifties: 1,
                hundreds: 0,
                highestScore: 60,
              },
              bowling: {
                matches: 14,
                innings: 14,
                wickets: 12,
                economy: 8.5,
                average: 30,
                bestFigures: "2/25",
                fourWickets: 0,
                fiveWickets: 0,
              },
            },
          ],
        });
      }
    });

    const teamBPlayers = [
      makeBatter({
        id: "b-bat-0",
        team: "Team B",
        seasons: [
          {
            year: "2023",
            team: "Team B",
            batting: {
              matches: 14,
              innings: 14,
              runs: 450,
              average: 35,
              strikeRate: 140,
              fifties: 3,
              hundreds: 1,
              highestScore: 100,
            },
          },
        ],
      }),
      makeBowler({
        id: "b-bowl-0",
        team: "Team B",
        seasons: [
          {
            year: "2023",
            team: "Team B",
            bowling: {
              matches: 14,
              innings: 14,
              wickets: 20,
              economy: 7,
              average: 22,
              bestFigures: "4/20",
              fourWickets: 1,
              fiveWickets: 0,
            },
          },
        ],
      }),
    ];

    const players = [...teamAPlayers, ...teamBPlayers];
    const result = selectDreamXI(players, "Team A", "Team B");

    // At least 1 from each team
    const fromA = result.players.filter((sp) => sp.teamLabel === "A").length;
    const fromB = result.players.filter((sp) => sp.teamLabel === "B").length;
    expect(fromA).toBeGreaterThanOrEqual(1);
    expect(fromB).toBeGreaterThanOrEqual(1);
  });
});
