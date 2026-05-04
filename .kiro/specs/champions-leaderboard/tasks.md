# Implementation Plan: Champions Leaderboard

## Overview

Expand the IPL Player Stats app with a Champions Leaderboard page at `/champions`. Work proceeds bottom-up: extend data types, expand the import script for new stats, build the leaderboard engine with property tests, then create UI components and wire the page together.

## Tasks

- [x] 1. Update data types and extend import script
  - [x] 1.1 Add new interfaces and fields to `data/types.ts`
    - Add `FieldingStats` interface with `catches`, `runOuts`, `stumpings`
    - Extend `BattingStats` with `sixes: number`, `fours: number`, `ballsAsNonStriker: number`
    - Extend `BowlingStats` with `widesConceded: number`, `noballsConceded: number`, `dotBalls: number`, `legByes: number`, `byes: number`
    - Add optional `fielding?: FieldingStats` to `SeasonStats`
    - Keep all existing fields unchanged for backward compatibility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 1.2 Expand `PlayerSeasonData` in `scripts/import-ipl-data.ts` to track new stats
    - Add `sixes`, `fours`, `ballsAsNonStriker` fields to the internal tracking struct
    - Add `widesConceded`, `noballsConceded`, `dotBalls`, `legByes`, `byes` fields
    - Add `catches`, `runOuts`, `stumpings` fields
    - Update `newPlayerSeasonData()` to initialize all new fields to 0
    - _Requirements: 1.3, 1.4, 2.4, 2.5, 3.3, 3.4, 4.2, 5.2, 6.3_

  - [x] 1.3 Add extraction logic in the ball-processing loop of `scripts/import-ipl-data.ts`
    - Increment `sixes` when `BatsmanRun === "6"` for the batter
    - Increment `fours` when `BatsmanRun === "4"` for the batter
    - Increment `ballsAsNonStriker` for the `NonStriker` player on every ball
    - Increment `widesConceded` when `ExtraType === "wide"` for the bowler
    - Increment `noballsConceded` when `ExtraType === "noball"` for the bowler
    - Increment `dotBalls` when `TotalRun === "0"` and `ExtraType` is empty for the bowler
    - Increment `legByes` when `ExtraType === "legbye"` for the bowler
    - Increment `byes` when `ExtraType === "bye"` for the bowler
    - Increment `catches` when `Kind === "caught"` for each player in `FieldersInvolved`
    - Increment `runOuts` when `Kind === "run out"` for each player in `FieldersInvolved`
    - Increment `stumpings` when `Kind === "stumped"` for each player in `FieldersInvolved`
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 5.1, 6.1, 6.2_

  - [x] 1.4 Update the output serialization in `scripts/import-ipl-data.ts`
    - Include `sixes`, `fours`, `ballsAsNonStriker` in the batting output object
    - Include `widesConceded`, `noballsConceded`, `dotBalls`, `legByes`, `byes` in the bowling output object
    - Include a `fielding` object with `catches`, `runOuts`, `stumpings` when any fielding stat > 0; omit when all are 0
    - Update the `OutputPlayer` interface to match the extended `SeasonStats` type
    - _Requirements: 1.3, 2.4, 2.5, 3.3, 4.2, 5.2, 6.3_

- [x] 2. Checkpoint — Verify data pipeline
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement leaderboard engine
  - [x] 3.1 Create `lib/leaderboardEngine.ts` with core types and category definitions
    - Define `SortDirection`, `QualifierType`, `LeaderboardCategory`, `RankedPlayer`, `LeaderboardResult` types
    - Define all category constant arrays: `BATTING_CATEGORIES`, `BOWLING_CATEGORIES`, `FIELDING_CATEGORIES`, `EXTRAS_CATEGORIES`, `NON_STRIKER_CATEGORIES`, and `MILESTONE_CATEGORIES`
    - Export category arrays for use by the Champions page
    - _Requirements: 8.1, 8.2, 10.1, 11.1, 12.1, 13.1, 14.1, 15.1_

  - [x] 3.2 Implement `extractStatValue` function in `lib/leaderboardEngine.ts`
    - Resolve `statPath` (e.g. `"batting.runs"`, `"fielding.catches"`) against player season data
    - When season is provided, extract from that season only; return `null` if season data missing
    - When no season, aggregate across all seasons: sum for counting stats, weighted average for rate stats
    - Handle special stats: `computeRunsStdDev` for consistency, combined runs+wickets for win contributor, total matches
    - Return `null` when player has no relevant data (no batting/bowling/fielding object)
    - _Requirements: 8.4, 8.5, 15.1, 15.2_

  - [x] 3.3 Implement `getQualifyingInnings` function in `lib/leaderboardEngine.ts`
    - Sum batting or bowling innings across all seasons (or single season if filter provided)
    - Return 0 when player has no data for the qualifier type
    - _Requirements: 8.6, 13.2_

  - [x] 3.4 Implement `computeLeaderboard` function in `lib/leaderboardEngine.ts`
    - Extract stat values for all players, filter out nulls
    - Apply minimum innings qualifier filtering
    - Apply minimum seasons filtering for consistency category
    - Sort by stat value: descending for `"higher"`, ascending for `"lower"`
    - Assign ranks 1..N
    - Identify best (rank 1), worst (last rank), average (median index `floor(N/2)`)
    - Return `LeaderboardResult` with empty rankings and null tiers when no players qualify
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 3.5 Write property test: Sort-order invariant (Property 1)
    - **Property 1: Sort-order invariant**
    - **Validates: Requirements 8.1, 8.2, 8.7, 11.2, 11.3**
    - Use `fast-check` with `{ numRuns: 100 }` in `__tests__/utils/leaderboardEngine.test.ts`
    - Generate arbitrary player lists and categories; verify ranked stat values form non-increasing (higher) or non-decreasing (lower) sequence

  - [x] 3.6 Write property test: Ranking idempotence (Property 2)
    - **Property 2: Ranking idempotence**
    - **Validates: Requirements 17.1**
    - Compute `computeLeaderboard` twice with same inputs; assert identical output

  - [x] 3.7 Write property test: Size preservation (Property 3)
    - **Property 3: Size preservation**
    - **Validates: Requirements 17.2**
    - Count players with non-null stat values meeting qualifier; assert ranked output length matches

  - [x] 3.8 Write property test: Tier ordering (Property 4)
    - **Property 4: Tier ordering**
    - **Validates: Requirements 17.3, 8.3**
    - For non-empty results, verify best.statValue >= average.statValue >= worst.statValue (higher) or <= (lower)

  - [x] 3.9 Write property test: Qualifier filtering (Property 5)
    - **Property 5: Qualifier filtering**
    - **Validates: Requirements 8.6, 13.2**
    - For rate-based categories, verify every ranked player has >= minInnings qualifying innings

  - [x] 3.10 Write property test: Season filter restricts data (Property 6)
    - **Property 6: Season filter restricts data**
    - **Validates: Requirements 8.4, 8.5**
    - With a season filter, verify every ranked player has data for that season

  - [x] 3.11 Write property test: Null stat exclusion (Property 7)
    - **Property 7: Null stat exclusion**
    - **Validates: Requirements 12.2**
    - Verify no ranked player has null/undefined stat value

  - [x] 3.12 Write property test: Consistency minimum seasons (Property 8)
    - **Property 8: Consistency minimum seasons**
    - **Validates: Requirements 15.2**
    - For the consistency category, verify every ranked player has batting data in >= 3 seasons

- [x] 4. Checkpoint — Verify leaderboard engine and property tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Build UI components
  - [x] 5.1 Create `components/LeaderboardCard.tsx`
    - Accept `LeaderboardCardProps` (category, best, average, worst, isEmpty)
    - Render a card with gold accent for Best (🏆 icon), silver for Average, bronze for Worst
    - Show player name, team, and stat value for each tier
    - Make player names clickable, linking to `/player/[id]`
    - Show "Not enough data for this category" when `isEmpty` is true
    - Apply hover elevation effect with CSS transitions
    - Use CSS variable inline styles for theming (no `dark:` classes)
    - _Requirements: 10.2, 10.4, 16.1, 16.2, 16.5, 18.1_

  - [x] 5.2 Create `components/HeroPodium.tsx`
    - Accept `HeroPodiumProps` with top 3 `RankedPlayer` entries
    - Render a podium-style layout: 2nd place left, 1st place center (elevated), 3rd place right
    - Show player name, team, and combined stat value
    - Use gold/silver/bronze color accents
    - Use CSS variable inline styles for theming
    - _Requirements: 16.3_

  - [x] 5.3 Write unit tests for `LeaderboardCard` and `HeroPodium`
    - Test rendering with valid data, empty state, and click navigation
    - Test gold/silver/bronze accent application
    - Place tests in `__tests__/components/LeaderboardCard.test.tsx` and `__tests__/components/HeroPodium.test.tsx`
    - _Requirements: 16.1, 16.2, 16.3, 18.1_

- [x] 6. Build Champions page and wire everything together
  - [x] 6.1 Create `app/champions/page.tsx`
    - "use client" component that loads all players via `getAllPlayers()`
    - Implement Season_Filter dropdown listing all available seasons plus "All Seasons"
    - Compute leaderboard results for all categories using `computeLeaderboard` with the selected season
    - Render HeroPodium at the top with top-3 "Best Win Contributor" players
    - Render sections: Batting, Bowling, Fielding, Extras, Non-Striker, Milestones
    - Each section contains a responsive grid of LeaderboardCard components (1 col mobile, 2 col tablet, 3-4 col desktop)
    - Hide "Most Consistent Batter" card when a specific season is selected
    - Add breadcrumb navigation: "Dashboard / Champions"
    - Handle empty states: "No player data available" when no players, "No data available for this season" when season has no data
    - Use CSS variable inline styles for theming
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 11.1, 11.4, 12.1, 12.2, 12.3, 13.1, 13.3, 14.1, 15.1, 15.3, 16.4, 18.1, 18.2, 18.3_

  - [x] 6.2 Add "Champions" navigation link to the Dashboard header in `app/page.tsx`
    - Add a Link component labeled "Champions" pointing to `/champions` alongside the existing "Dream Team" link
    - Style consistently with the existing Dream Team link
    - _Requirements: 9.2_

  - [x] 6.3 Write integration tests for the Champions page
    - Test that the page renders all leaderboard sections
    - Test season filter changes recompute leaderboard results
    - Test "Most Consistent Batter" card is hidden when a specific season is selected
    - Test empty state messages render correctly
    - Test player name links navigate to `/player/[id]`
    - Place tests in `__tests__/components/ChampionsPage.test.tsx`
    - _Requirements: 9.1, 9.5, 10.3, 15.3, 18.1, 18.2, 18.3_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The import script changes (tasks 1.2–1.4) require re-running `npx tsx scripts/import-ipl-data.ts` to regenerate `data/players.json`
