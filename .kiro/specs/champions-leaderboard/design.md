# Design Document: Champions Leaderboard

## Overview

The Champions Leaderboard adds a `/champions` page that ranks IPL players across batting, bowling, fielding, extras, non-striker, and milestone categories. Each category card shows the Best (rank 1), Average (median), and Worst (last rank) performers with gold/silver/bronze accents. A season filter lets users view all-time aggregates or a single season.

This feature requires three layers of work:

1. **Data pipeline expansion** — The import script (`scripts/import-ipl-data.ts`) must capture sixes, fours, fielding stats (catches, run-outs, stumpings), extras breakdown (wides, no-balls, leg-byes, byes), dot balls, and non-striker appearances from the ball-by-ball CSV.
2. **Leaderboard engine** — A new `lib/leaderboardEngine.ts` utility computes ranked player lists for any statistical category, applying minimum qualifiers for rate-based stats and identifying best/average/worst tiers.
3. **Champions page UI** — A new `app/champions/page.tsx` "use client" component renders leaderboard sections in a responsive grid, with a hero podium, season filter, and navigation links.

The design reuses existing patterns: CSS variable inline styles for theming, Recharts for any charts, `data/types.ts` for type safety, and `lib/` for pure utility functions.

## Architecture

```mermaid
graph TD
    CSV[Ball-by-Ball CSV] -->|import-ipl-data.ts| JSON[data/players.json]
    JSON -->|data/players.ts| Players[Player[]]
    Players --> Engine[lib/leaderboardEngine.ts]
    Engine -->|ranked lists| Page[app/champions/page.tsx]
    Page --> Cards[LeaderboardCard component]
    Page --> Podium[HeroPodium component]
    Page --> Filter[SeasonFilter dropdown]
    
    subgraph "Data Layer"
        CSV
        JSON
        Players
    end
    
    subgraph "Logic Layer"
        Engine
    end
    
    subgraph "UI Layer"
        Page
        Cards
        Podium
        Filter
    end
```

**Data flow:**
1. `scripts/import-ipl-data.ts` processes CSV → writes extended `data/players.json` with new fields
2. `data/players.ts` loads JSON, typed via `data/types.ts` (extended interfaces)
3. `lib/leaderboardEngine.ts` takes `Player[]`, a category config, and optional season → returns a ranked list with best/average/worst identified
4. `app/champions/page.tsx` calls the engine for each category, renders cards in a grid

## Components and Interfaces

### New Files

| File | Purpose |
|------|---------|
| `lib/leaderboardEngine.ts` | Pure utility: ranking computation, qualifier filtering, tier identification |
| `app/champions/page.tsx` | Champions page with season filter, hero podium, leaderboard sections |
| `components/LeaderboardCard.tsx` | Single category card showing best/average/worst performers |
| `components/HeroPodium.tsx` | Top-3 podium display for the hero section |

### Modified Files

| File | Changes |
|------|---------|
| `data/types.ts` | Add `FieldingStats` interface; extend `BattingStats`, `BowlingStats`, `SeasonStats` |
| `scripts/import-ipl-data.ts` | Track sixes, fours, fielding, extras, dot balls, non-striker stats |
| `app/page.tsx` | Add "Champions" nav link in header |

### Leaderboard Engine Interface

```typescript
/** Direction of "better" for a category */
type SortDirection = "higher" | "lower";

/** Qualifier type — which innings count to check */
type QualifierType = "batting" | "bowling" | "none";

/** Category configuration */
interface LeaderboardCategory {
  id: string;
  label: string;
  /** Dot-path to stat: e.g. "batting.runs", "bowling.economy", "fielding.catches" */
  statPath: string;
  direction: SortDirection;
  qualifierType: QualifierType;
  /** Minimum innings required (default 5 for rate-based, 0 for counting stats) */
  minInnings: number;
  /** Minimum seasons required (for multi-season stats like consistency) */
  minSeasons?: number;
}

/** A ranked player entry */
interface RankedPlayer {
  player: Player;
  rank: number;
  statValue: number;
}

/** Result of ranking for a single category */
interface LeaderboardResult {
  category: LeaderboardCategory;
  rankings: RankedPlayer[];
  best: RankedPlayer | null;
  average: RankedPlayer | null;
  worst: RankedPlayer | null;
}

/** Main engine function */
function computeLeaderboard(
  players: Player[],
  category: LeaderboardCategory,
  season?: string
): LeaderboardResult;

/** Extract stat value for a player given a category and optional season */
function extractStatValue(
  player: Player,
  category: LeaderboardCategory,
  season?: string
): number | null;

/** Get total innings (batting or bowling) for qualifier check */
function getQualifyingInnings(
  player: Player,
  qualifierType: QualifierType,
  season?: string
): number;

/** Compute standard deviation of a player's per-season runs (for consistency) */
function computeRunsStdDev(player: Player): number | null;
```

### LeaderboardCard Props

```typescript
interface LeaderboardCardProps {
  category: LeaderboardCategory;
  best: RankedPlayer | null;
  average: RankedPlayer | null;
  worst: RankedPlayer | null;
  /** If true, show "Not enough data" message */
  isEmpty: boolean;
}
```

### HeroPodium Props

```typescript
interface HeroPodiumProps {
  /** Top 3 players by total runs + wickets combined */
  topPerformers: RankedPlayer[];
}
```

## Data Models

### Extended TypeScript Interfaces

```typescript
// data/types.ts — additions

export interface FieldingStats {
  catches: number;
  runOuts: number;
  stumpings: number;
}

export interface BattingStats {
  // existing fields unchanged
  matches: number;
  innings: number;
  runs: number;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  // new fields
  sixes: number;
  fours: number;
  ballsAsNonStriker: number;
}

export interface BowlingStats {
  // existing fields unchanged
  matches: number;
  innings: number;
  wickets: number;
  economy: number;
  average: number;
  bestFigures: string;
  fourWickets: number;
  fiveWickets: number;
  // new fields
  widesConceded: number;
  noballsConceded: number;
  dotBalls: number;
  legByes: number;
  byes: number;
}

export interface SeasonStats {
  year: string;
  team: string;
  batting?: BattingStats;
  bowling?: BowlingStats;
  fielding?: FieldingStats;  // new
}
```

### Import Script Data Tracking Additions

The `PlayerSeasonData` internal struct in `import-ipl-data.ts` gains:

```typescript
// Batting additions
sixes: number;
fours: number;
ballsAsNonStriker: number;

// Bowling additions
widesConceded: number;
noballsConceded: number;
dotBalls: number;
legByes: number;
byes: number;

// Fielding (new tracking)
catches: number;
runOuts: number;
stumpings: number;
```

**Extraction logic from ball records:**

| Field | Condition |
|-------|-----------|
| `sixes` | `BatsmanRun === "6"` → increment for batter |
| `fours` | `BatsmanRun === "4"` → increment for batter |
| `ballsAsNonStriker` | For every ball record, increment for `NonStriker` player |
| `widesConceded` | `ExtraType === "wide"` → increment for bowler |
| `noballsConceded` | `ExtraType === "noball"` → increment for bowler |
| `dotBalls` | `TotalRun === "0"` AND `ExtraType` is empty → increment for bowler |
| `legByes` | `ExtraType === "legbye"` → increment `legByes` for bowler |
| `byes` | `ExtraType === "bye"` → increment `byes` for bowler |
| `catches` | `IsWicketDelivery === "1"` AND `Kind === "caught"` → increment for each player in `FieldersInvolved` |
| `runOuts` | `IsWicketDelivery === "1"` AND `Kind === "run out"` → increment for each player in `FieldersInvolved` |
| `stumpings` | `IsWicketDelivery === "1"` AND `Kind === "stumped"` → increment for each player in `FieldersInvolved` |

### Leaderboard Category Definitions

```typescript
const BATTING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-runs", label: "Most Runs", statPath: "batting.runs", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "highest-average", label: "Highest Average", statPath: "batting.average", direction: "higher", qualifierType: "batting", minInnings: 5 },
  { id: "highest-strike-rate", label: "Highest Strike Rate", statPath: "batting.strikeRate", direction: "higher", qualifierType: "batting", minInnings: 5 },
  { id: "most-sixes", label: "Most Sixes", statPath: "batting.sixes", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-fours", label: "Most Fours", statPath: "batting.fours", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-fifties", label: "Most Fifties", statPath: "batting.fifties", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-hundreds", label: "Most Hundreds", statPath: "batting.hundreds", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "highest-score", label: "Highest Score", statPath: "batting.highestScore", direction: "higher", qualifierType: "none", minInnings: 0 },
];

const BOWLING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-wickets", label: "Most Wickets", statPath: "bowling.wickets", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "best-economy", label: "Best Economy", statPath: "bowling.economy", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "best-bowling-avg", label: "Best Bowling Average", statPath: "bowling.average", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "most-dot-balls", label: "Most Dot Balls", statPath: "bowling.dotBalls", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-wides", label: "Most Wides Conceded", statPath: "bowling.widesConceded", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-noballs", label: "Most No-Balls Conceded", statPath: "bowling.noballsConceded", direction: "higher", qualifierType: "none", minInnings: 0 },
];

const FIELDING_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-catches", label: "Most Catches", statPath: "fielding.catches", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-runouts", label: "Most Run-Outs", statPath: "fielding.runOuts", direction: "higher", qualifierType: "none", minInnings: 0 },
  { id: "most-stumpings", label: "Most Stumpings", statPath: "fielding.stumpings", direction: "higher", qualifierType: "none", minInnings: 0 },
];

const EXTRAS_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-wides-bowler", label: "Most Wides by Bowler", statPath: "bowling.widesConceded", direction: "higher", qualifierType: "bowling", minInnings: 5 },
  { id: "fewest-wides-bowler", label: "Fewest Wides by Bowler", statPath: "bowling.widesConceded", direction: "lower", qualifierType: "bowling", minInnings: 5 },
  { id: "most-noballs-bowler", label: "Most No-Balls by Bowler", statPath: "bowling.noballsConceded", direction: "higher", qualifierType: "bowling", minInnings: 5 },
  { id: "fewest-noballs-bowler", label: "Fewest No-Balls by Bowler", statPath: "bowling.noballsConceded", direction: "lower", qualifierType: "bowling", minInnings: 5 },
];

const NON_STRIKER_CATEGORIES: LeaderboardCategory[] = [
  { id: "most-non-striker", label: "Most Balls as Non-Striker", statPath: "batting.ballsAsNonStriker", direction: "higher", qualifierType: "none", minInnings: 0 },
];
```

### Stat Extraction Logic

`extractStatValue` resolves the `statPath` against a player's data:

- If `season` is provided: look up that season's stats object and extract the field
- If no season: aggregate across all seasons (sum for counting stats like runs/wickets/sixes; weighted average for rate stats like average/economy/strikeRate)
- For fielding stats: sum across seasons that have a `fielding` object
- Returns `null` if the player has no data for the requested stat (used to exclude from rankings)

### Ranking Algorithm

```
computeLeaderboard(players, category, season?):
  1. For each player, compute extractStatValue(player, category, season)
  2. Filter out players where statValue is null
  3. If category.qualifierType !== "none":
     Filter out players where getQualifyingInnings(player, qualifierType, season) < category.minInnings
  4. Sort by statValue:
     - direction "higher" → descending
     - direction "lower" → ascending
  5. Assign ranks 1..N
  6. best = rankings[0]
  7. worst = rankings[N-1]
  8. average = rankings[floor(N/2)] (median position)
  9. Return { category, rankings, best, average, worst }
```

For the special "Most Consistent Batter" category:
- Requires `minSeasons: 3`
- Stat is computed via `computeRunsStdDev(player)` which calculates the standard deviation of per-season runs
- Direction is "lower" (lower std dev = more consistent)
- Only available when no season filter is active

For "Most Matches Played":
- Sum of max(battingMatches, bowlingMatches) per season

For "Best Win Contributor":
- Sum of (total runs + total wickets × 20) across seasons — wickets weighted higher to balance the scale


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sort-order invariant

*For any* list of players and any leaderboard category, the stat values in the ranked output shall form a non-increasing sequence when `direction` is `"higher"`, and a non-decreasing sequence when `direction` is `"lower"`.

**Validates: Requirements 8.1, 8.2, 8.7, 11.2, 11.3**

### Property 2: Ranking idempotence

*For any* list of players and any leaderboard category, computing `computeLeaderboard` twice with identical inputs shall produce identical output arrays (same players, same order, same stat values).

**Validates: Requirements 17.1**

### Property 3: Size preservation

*For any* list of players and any leaderboard category, the number of players in the ranked output shall equal the number of input players that (a) have a non-null stat value for that category and (b) meet the minimum innings qualifier.

**Validates: Requirements 17.2**

### Property 4: Tier ordering

*For any* non-empty ranked output, the Best performer's stat value shall be ≥ the Average performer's stat value ≥ the Worst performer's stat value for `"higher"` direction categories, and ≤ for `"lower"` direction categories.

**Validates: Requirements 17.3, 8.3**

### Property 5: Qualifier filtering

*For any* list of players and any rate-based leaderboard category with `minInnings > 0`, every player in the ranked output shall have at least `minInnings` qualifying innings (batting or bowling as specified by `qualifierType`).

**Validates: Requirements 8.6, 13.2**

### Property 6: Season filter restricts data

*For any* list of players, any leaderboard category, and any season filter value, every player in the ranked output shall have season data for that specific season, and the stat value used shall correspond to that season's data (not aggregated).

**Validates: Requirements 8.4, 8.5**

### Property 7: Null stat exclusion

*For any* list of players and any leaderboard category, no player in the ranked output shall have a null or undefined stat value for that category. Players without the relevant stat data (e.g., no fielding object) shall be excluded.

**Validates: Requirements 12.2**

### Property 8: Consistency minimum seasons

*For any* list of players, when computing the "Most Consistent Batter" category, every player in the ranked output shall have batting data in at least 3 distinct seasons.

**Validates: Requirements 15.2**

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No players meet qualifier for a category | `computeLeaderboard` returns empty `rankings`, `best`/`average`/`worst` are `null`. UI shows "Not enough data for this category". |
| Player data is empty or missing | Champions page checks `players.length === 0` and renders "No player data available" message. |
| Selected season has no data | All leaderboard results will be empty. UI shows "No data available for this season". |
| Player has no fielding data | `extractStatValue` returns `null` for fielding categories → player excluded from fielding rankings. |
| Player has no bowling data | `extractStatValue` returns `null` for bowling categories → player excluded from bowling rankings. |
| Tie in stat values | Players with identical stat values receive adjacent ranks. The sort is stable (preserves input order for ties). |
| Season filter set for "Most Consistent Batter" | The card is hidden from the UI since consistency requires multi-season data. |

Error handling follows the existing app pattern: conditional rendering with informative messages, no thrown exceptions for expected empty states.

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required for comprehensive coverage.

**Unit tests** (`__tests__/utils/leaderboardEngine.test.ts`):
- Specific examples with known player data and expected rankings
- Edge cases: empty player list, single player, all players tied
- Error conditions: no qualifying players, missing stat fields
- Integration: verify category configs produce correct results with real-shaped data
- UI component tests for LeaderboardCard and HeroPodium rendering

**Property-based tests** (`__tests__/utils/leaderboardEngine.test.ts`, in the same file):
- All 8 correctness properties above, using `fast-check`
- Minimum 100 iterations per property test (`{ numRuns: 100 }`)
- Each test tagged with: `Feature: champions-leaderboard, Property {N}: {title}`

### Property-Based Testing Configuration

- Library: `fast-check` (already installed)
- Runner: `vitest` via `npm run test` (`vitest --run`)
- Minimum iterations: 100 per property
- Tag format in test descriptions: **Feature: champions-leaderboard, Property {number}: {property_text}**
- Each correctness property is implemented by a single `fc.assert(fc.property(...))` call

### Arbitraries (Generators)

```typescript
// Player arbitrary with configurable batting/bowling/fielding data
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
  primaryRole: fc.constantFrom("Batter", "Bowler"),
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

// Category arbitrary covering both directions and qualifier types
const categoryArb = fc.constantFrom(
  ...BATTING_CATEGORIES,
  ...BOWLING_CATEGORIES,
  ...FIELDING_CATEGORIES,
  ...EXTRAS_CATEGORIES,
  ...NON_STRIKER_CATEGORIES,
);
```
