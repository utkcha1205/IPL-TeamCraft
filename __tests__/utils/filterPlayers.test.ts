import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterPlayers } from "@/lib/filterPlayers";
import { Player, FilterState, BattingStats, BowlingStats, SeasonStats } from "@/data/types";

const noFilters: FilterState = { primaryRole: null, secondaryRole: null, team: null, season: null };

const makePlayers = (): Player[] => [
  {
    id: "1",
    name: "Virat Kohli",
    team: "Royal Challengers Bangalore",
    primaryRole: "Batter",
    nationality: "Indian",
    seasons: [
      { year: "2021", team: "RCB", batting: { matches: 15, innings: 15, runs: 405, average: 28.93, strikeRate: 119.47, fifties: 3, hundreds: 0, highestScore: 72 } },
      { year: "2022", team: "RCB", batting: { matches: 16, innings: 16, runs: 341, average: 22.73, strikeRate: 115.98, fifties: 2, hundreds: 0, highestScore: 73 } },
    ],
  },
  {
    id: "2",
    name: "Jasprit Bumrah",
    team: "Mumbai Indians",
    primaryRole: "Bowler",
    nationality: "Indian",
    seasons: [
      { year: "2021", team: "MI", bowling: { matches: 14, innings: 14, wickets: 21, economy: 7.45, average: 20.33, bestFigures: "4/14", fourWickets: 1, fiveWickets: 0 } },
    ],
  },
  {
    id: "3",
    name: "Ravindra Jadeja",
    team: "Chennai Super Kings",
    primaryRole: "Bowler",
    secondaryRole: "All-Rounder",
    nationality: "Indian",
    seasons: [
      { year: "2021", team: "CSK", batting: { matches: 16, innings: 12, runs: 227, average: 32.43, strikeRate: 145.51, fifties: 1, hundreds: 0, highestScore: 62 }, bowling: { matches: 16, innings: 14, wickets: 13, economy: 7.52, average: 28.15, bestFigures: "3/20", fourWickets: 0, fiveWickets: 0 } },
      { year: "2022", team: "CSK", batting: { matches: 10, innings: 8, runs: 116, average: 19.33, strikeRate: 130.34, fifties: 0, hundreds: 0, highestScore: 40 }, bowling: { matches: 10, innings: 9, wickets: 5, economy: 7.89, average: 38.6, bestFigures: "2/18", fourWickets: 0, fiveWickets: 0 } },
    ],
  },
  {
    id: "4",
    name: "KL Rahul",
    team: "Lucknow Super Giants",
    primaryRole: "Batter",
    secondaryRole: "Wicket-Keeper",
    nationality: "Indian",
    seasons: [
      { year: "2022", team: "LSG", batting: { matches: 15, innings: 15, runs: 616, average: 51.33, strikeRate: 135.38, fifties: 4, hundreds: 2, highestScore: 103 } },
    ],
  },
];

describe("filterPlayers", () => {
  it("returns all players when no filters or search are active", () => {
    const players = makePlayers();
    const result = filterPlayers(players, noFilters, "");
    expect(result).toHaveLength(4);
  });

  it("filters by name search (case-insensitive)", () => {
    const players = makePlayers();
    const result = filterPlayers(players, noFilters, "kohli");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Virat Kohli");
  });

  it("filters by primary role", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: "Bowler", secondaryRole: null, team: null, season: null }, "");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name).sort()).toEqual(["Jasprit Bumrah", "Ravindra Jadeja"]);
  });

  it("filters by secondary role", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: null, secondaryRole: "Wicket-Keeper", team: null, season: null }, "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("KL Rahul");
  });

  it("filters by primary + secondary role", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: "Bowler", secondaryRole: "All-Rounder", team: null, season: null }, "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ravindra Jadeja");
  });

  it("filters by team", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: null, secondaryRole: null, team: "Chennai Super Kings", season: null }, "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ravindra Jadeja");
  });

  it("filters by season", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: null, secondaryRole: null, team: null, season: "2022" }, "");
    expect(result).toHaveLength(3);
  });

  it("intersects multiple filters", () => {
    const players = makePlayers();
    const result = filterPlayers(players, { primaryRole: "Batter", secondaryRole: null, team: "Mumbai Indians", season: null }, "");
    expect(result).toHaveLength(0);
  });

  it("returns empty for empty player list", () => {
    const result = filterPlayers([], noFilters, "test");
    expect(result).toHaveLength(0);
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

const primaryRoleArb = fc.constantFrom("Batter" as const, "Bowler" as const);
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
  primaryRole: primaryRoleArb,
  secondaryRole: secondaryRoleArb,
  nationality: fc.constantFrom("Indian", "Australian", "English", "South African"),
  seasons: fc.array(seasonStatsArb, { minLength: 1, maxLength: 5 }),
});

const playersArb = fc.array(playerArb, { minLength: 0, maxLength: 20 });

const noFiltersConst: FilterState = { primaryRole: null, secondaryRole: null, team: null, season: null };

// Feature: ipl-player-stats, Property 2: Search filters by name substring (case-insensitive)
// Validates: Requirements 2.1
describe("Property 2: Search filters by name substring (case-insensitive)", () => {
  it("filtered result contains exactly the players whose name includes the query (case-insensitive)", () => {
    fc.assert(
      fc.property(
        playersArb,
        fc.stringMatching(/^[A-Za-z]{1,10}$/),
        (players, query) => {
          const result = filterPlayers(players, noFiltersConst, query);
          const queryLower = query.toLowerCase();

          // Every result player must match the query
          for (const p of result) {
            expect(p.name.toLowerCase()).toContain(queryLower);
          }

          // Every player matching the query must be in the result
          const expected = players.filter((p) =>
            p.name.toLowerCase().includes(queryLower)
          );
          expect(result).toHaveLength(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ipl-player-stats, Property 3: Empty search is identity
// Validates: Requirements 2.2
describe("Property 3: Empty search is identity", () => {
  it("filtering with empty search produces the same result as no search query", () => {
    const filterStateArb = fc.record({
      primaryRole: fc.option(primaryRoleArb, { nil: null }),
      secondaryRole: fc.option(
        fc.constantFrom("Wicket-Keeper" as const, "All-Rounder" as const, "Captain" as const, "Vice-Captain" as const),
        { nil: null }
      ),
      team: fc.option(teamArb, { nil: null }),
      season: fc.option(
        fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
        { nil: null }
      ),
    });

    fc.assert(
      fc.property(playersArb, filterStateArb, (players, filters) => {
        const withEmptySearch = filterPlayers(players, filters, "");
        const withNoSearch = filterPlayers(players, filters, "");
        expect(withEmptySearch).toEqual(withNoSearch);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ipl-player-stats, Property 4: Single-dimension filter correctness
// Validates: Requirements 3.4, 3.5
describe("Property 4: Single-dimension filter correctness", () => {
  it("primary role filter returns exactly the players matching that primary role", () => {
    fc.assert(
      fc.property(playersArb, primaryRoleArb, (players, primaryRole) => {
        const filters: FilterState = { primaryRole, secondaryRole: null, team: null, season: null };
        const result = filterPlayers(players, filters, "");

        for (const p of result) {
          expect(p.primaryRole).toBe(primaryRole);
        }

        const expected = players.filter((p) => p.primaryRole === primaryRole);
        expect(result).toHaveLength(expected.length);
      }),
      { numRuns: 100 }
    );
  });

  it("team filter returns exactly the players matching that team", () => {
    fc.assert(
      fc.property(playersArb, teamArb, (players, team) => {
        const filters: FilterState = { primaryRole: null, secondaryRole: null, team, season: null };
        const result = filterPlayers(players, filters, "");

        for (const p of result) {
          expect(p.team).toBe(team);
        }

        const expected = players.filter((p) => p.team === team);
        expect(result).toHaveLength(expected.length);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ipl-player-stats, Property 5: Season filter returns season-specific stats
// Validates: Requirements 3.6
describe("Property 5: Season filter returns season-specific stats", () => {
  it("filtered result contains only players who have stats for the selected season", () => {
    const seasonArb = fc.constantFrom("2020", "2021", "2022", "2023", "2024");

    fc.assert(
      fc.property(playersArb, seasonArb, (players, season) => {
        const filters: FilterState = { primaryRole: null, secondaryRole: null, team: null, season };
        const result = filterPlayers(players, filters, "");

        for (const p of result) {
          const hasSeason = p.seasons.some((s) => s.year === season);
          expect(hasSeason).toBe(true);
        }

        const expected = players.filter((p) =>
          p.seasons.some((s) => s.year === season)
        );
        expect(result).toHaveLength(expected.length);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ipl-player-stats, Property 6: Filter composition is intersection
// Validates: Requirements 3.7
describe("Property 6: Filter composition is intersection", () => {
  it("combined filters equal the intersection of each filter applied individually", () => {
    const filterStateArb = fc.record({
      primaryRole: fc.option(primaryRoleArb, { nil: null }),
      secondaryRole: fc.option(
        fc.constantFrom("Wicket-Keeper" as const, "All-Rounder" as const, "Captain" as const, "Vice-Captain" as const),
        { nil: null }
      ),
      team: fc.option(teamArb, { nil: null }),
      season: fc.option(
        fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
        { nil: null }
      ),
    });
    const searchArb = fc.oneof(
      fc.constant(""),
      fc.stringMatching(/^[A-Za-z]{1,8}$/)
    );

    fc.assert(
      fc.property(
        playersArb,
        filterStateArb,
        searchArb,
        (players, filters, search) => {
          const combined = filterPlayers(players, filters, search);

          const bySearch = filterPlayers(players, noFiltersConst, search);
          const byPrimaryRole = filterPlayers(
            players,
            { primaryRole: filters.primaryRole, secondaryRole: null, team: null, season: null },
            ""
          );
          const bySecondaryRole = filterPlayers(
            players,
            { primaryRole: null, secondaryRole: filters.secondaryRole, team: null, season: null },
            ""
          );
          const byTeam = filterPlayers(
            players,
            { primaryRole: null, secondaryRole: null, team: filters.team, season: null },
            ""
          );
          const bySeason = filterPlayers(
            players,
            { primaryRole: null, secondaryRole: null, team: null, season: filters.season },
            ""
          );

          const bySearchIds = new Set(bySearch.map((p) => p.id));
          const byPrimaryRoleIds = new Set(byPrimaryRole.map((p) => p.id));
          const bySecondaryRoleIds = new Set(bySecondaryRole.map((p) => p.id));
          const byTeamIds = new Set(byTeam.map((p) => p.id));
          const bySeasonIds = new Set(bySeason.map((p) => p.id));

          const intersection = players.filter(
            (p) =>
              bySearchIds.has(p.id) &&
              byPrimaryRoleIds.has(p.id) &&
              bySecondaryRoleIds.has(p.id) &&
              byTeamIds.has(p.id) &&
              bySeasonIds.has(p.id)
          );

          const combinedIds = combined.map((p) => p.id).sort();
          const intersectionIds = intersection.map((p) => p.id).sort();

          expect(combinedIds).toEqual(intersectionIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});
