import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortPlayers, getStatValue } from "@/lib/sortPlayers";
import { Player, BattingStats, BowlingStats, SeasonStats, SortConfig } from "@/data/types";

const batter: Player = {
  id: "batter-1",
  name: "Test Batter",
  team: "Team A",
  primaryRole: "Batter",
  nationality: "Indian",
  seasons: [
    {
      year: "2022",
      team: "Team A",
      batting: {
        matches: 14,
        innings: 14,
        runs: 400,
        average: 33.33,
        strikeRate: 130.0,
        fifties: 3,
        hundreds: 0,
        highestScore: 80,
      },
    },
    {
      year: "2023",
      team: "Team A",
      batting: {
        matches: 16,
        innings: 16,
        runs: 600,
        average: 42.86,
        strikeRate: 145.0,
        fifties: 5,
        hundreds: 1,
        highestScore: 110,
      },
    },
  ],
};

const bowler: Player = {
  id: "bowler-1",
  name: "Test Bowler",
  team: "Team B",
  primaryRole: "Bowler",
  nationality: "Indian",
  seasons: [
    {
      year: "2022",
      team: "Team B",
      bowling: {
        matches: 14,
        innings: 14,
        wickets: 20,
        economy: 7.5,
        average: 22.0,
        bestFigures: "4/25",
        fourWickets: 1,
        fiveWickets: 0,
      },
    },
    {
      year: "2023",
      team: "Team B",
      bowling: {
        matches: 16,
        innings: 16,
        wickets: 25,
        economy: 8.0,
        average: 24.0,
        bestFigures: "5/30",
        fourWickets: 2,
        fiveWickets: 1,
      },
    },
  ],
};

const allRounder: Player = {
  id: "allrounder-1",
  name: "Test AllRounder",
  team: "Team C",
  primaryRole: "Batter",
  secondaryRole: "All-Rounder",
  nationality: "Indian",
  seasons: [
    {
      year: "2022",
      team: "Team C",
      batting: {
        matches: 14,
        innings: 12,
        runs: 300,
        average: 27.27,
        strikeRate: 140.0,
        fifties: 2,
        hundreds: 0,
        highestScore: 75,
      },
      bowling: {
        matches: 14,
        innings: 10,
        wickets: 15,
        economy: 8.5,
        average: 28.0,
        bestFigures: "3/20",
        fourWickets: 0,
        fiveWickets: 0,
      },
    },
  ],
};

describe("getStatValue", () => {
  describe("season-specific stats", () => {
    it("returns runs for a specific season", () => {
      expect(getStatValue(batter, "runs", "2022")).toBe(400);
      expect(getStatValue(batter, "runs", "2023")).toBe(600);
    });

    it("returns wickets for a specific season", () => {
      expect(getStatValue(bowler, "wickets", "2022")).toBe(20);
    });

    it("returns average for a specific season", () => {
      expect(getStatValue(batter, "average", "2023")).toBe(42.86);
    });

    it("returns strikeRate for a specific season", () => {
      expect(getStatValue(batter, "strikeRate", "2022")).toBe(130.0);
    });

    it("returns economy for a specific season", () => {
      expect(getStatValue(bowler, "economy", "2022")).toBe(7.5);
    });

    it("returns 0 for a season that does not exist", () => {
      expect(getStatValue(batter, "runs", "2020")).toBe(0);
    });

    it("returns 0 for a stat not available on the player", () => {
      expect(getStatValue(batter, "wickets", "2022")).toBe(0);
      expect(getStatValue(bowler, "runs", "2022")).toBe(0);
    });
  });

  describe("aggregate stats", () => {
    it("sums runs across all seasons", () => {
      expect(getStatValue(batter, "runs")).toBe(1000);
    });

    it("sums wickets across all seasons", () => {
      expect(getStatValue(bowler, "wickets")).toBe(45);
    });

    it("computes weighted batting average (total runs / total innings)", () => {
      // 1000 runs / 30 innings = 33.333...
      const avg = getStatValue(batter, "average");
      expect(avg).toBeCloseTo(33.33, 1);
    });

    it("computes weighted strike rate by innings", () => {
      // (130 * 14 + 145 * 16) / 30 = (1820 + 2320) / 30 = 138.0
      const sr = getStatValue(batter, "strikeRate");
      expect(sr).toBeCloseTo(138.0, 1);
    });

    it("computes weighted economy by bowling innings", () => {
      // (7.5 * 14 + 8.0 * 16) / 30 = (105 + 128) / 30 = 7.766...
      const eco = getStatValue(bowler, "economy");
      expect(eco).toBeCloseTo(7.77, 1);
    });

    it("returns 0 for runs when player has no batting stats", () => {
      expect(getStatValue(bowler, "runs")).toBe(0);
    });

    it("returns 0 for wickets when player has no bowling stats", () => {
      expect(getStatValue(batter, "wickets")).toBe(0);
    });

    it("returns 0 for unknown stat key", () => {
      expect(getStatValue(batter, "unknownStat")).toBe(0);
    });
  });
});

describe("sortPlayers", () => {
  const players = [batter, bowler, allRounder];

  it("does not mutate the original array", () => {
    const original = [...players];
    sortPlayers(players, { key: "runs", direction: "desc" });
    expect(players).toEqual(original);
  });

  it("sorts by runs descending", () => {
    const sorted = sortPlayers(players, { key: "runs", direction: "desc" });
    expect(sorted[0].id).toBe("batter-1"); // 1000 runs
    expect(sorted[1].id).toBe("allrounder-1"); // 300 runs
    expect(sorted[2].id).toBe("bowler-1"); // 0 runs
  });

  it("sorts by runs ascending", () => {
    const sorted = sortPlayers(players, { key: "runs", direction: "asc" });
    expect(sorted[0].id).toBe("bowler-1"); // 0 runs
    expect(sorted[1].id).toBe("allrounder-1"); // 300 runs
    expect(sorted[2].id).toBe("batter-1"); // 1000 runs
  });

  it("sorts by wickets descending", () => {
    const sorted = sortPlayers(players, { key: "wickets", direction: "desc" });
    expect(sorted[0].id).toBe("bowler-1"); // 45 wickets
    expect(sorted[1].id).toBe("allrounder-1"); // 15 wickets
    expect(sorted[2].id).toBe("batter-1"); // 0 wickets
  });

  it("sorts by economy descending", () => {
    const sorted = sortPlayers(players, { key: "economy", direction: "desc" });
    // allRounder: 8.5, bowler: ~7.77, batter: 0
    expect(sorted[0].id).toBe("allrounder-1");
    expect(sorted[1].id).toBe("bowler-1");
    expect(sorted[2].id).toBe("batter-1");
  });

  it("handles empty player array", () => {
    const sorted = sortPlayers([], { key: "runs", direction: "desc" });
    expect(sorted).toEqual([]);
  });

  it("handles single player array", () => {
    const sorted = sortPlayers([batter], { key: "runs", direction: "desc" });
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("batter-1");
  });
});


// --- fast-check arbitraries for property tests ---

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

const playersArb = fc.array(playerArb, { minLength: 0, maxLength: 20 });

const sortKeyArb = fc.constantFrom("runs", "wickets", "average", "strikeRate", "economy");

// Feature: ipl-player-stats, Property 10: Sort ordering
// Validates: Requirements 6.2
describe("Property 10: Sort ordering", () => {
  it("sorted result is in descending order by the selected statistic", () => {
    fc.assert(
      fc.property(playersArb, sortKeyArb, (players, key) => {
        const sorted = sortPlayers(players, { key, direction: "desc" });

        // Each player's stat value should be >= the next player's stat value
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = getStatValue(sorted[i], key);
          const next = getStatValue(sorted[i + 1], key);
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ipl-player-stats, Property 11: Sort toggle is involution
// Validates: Requirements 6.3
describe("Property 11: Sort toggle is involution", () => {
  it("sorting ascending then descending by the same key produces the reverse of each other", () => {
    fc.assert(
      fc.property(playersArb, sortKeyArb, (players, key) => {
        const ascending = sortPlayers(players, { key, direction: "asc" });
        const descending = sortPlayers(players, { key, direction: "desc" });

        // The stat values in ascending reversed should equal the stat values in descending
        // We compare values rather than IDs because players with equal stat values
        // may appear in any relative order (sort is not stable for ties)
        const ascValues = ascending.map((p) => getStatValue(p, key)).reverse();
        const descValues = descending.map((p) => getStatValue(p, key));
        expect(ascValues).toEqual(descValues);
      }),
      { numRuns: 100 }
    );
  });
});
