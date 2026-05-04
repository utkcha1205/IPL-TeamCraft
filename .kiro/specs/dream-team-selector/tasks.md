# Implementation Plan: Dream Team Selector

## Overview

Build a Dream Team Selector feature that lets users pick two IPL teams and generates an optimal playing XI of 11 players. Implementation starts with the pure scoring/selection engine, then builds the UI components, wires them into a new `/dream-team` page, and adds navigation from the dashboard.

## Tasks

- [x] 1. Implement the Dream Team Selection Engine
  - [x] 1.1 Create `lib/dreamTeamEngine.ts` with types and scoring functions
    - Define `ScoredPlayer`, `DreamXIResult`, and `CompositionRules` interfaces
    - Implement `computeBattingScore(stats)` — normalized 0–100 batting score using weights: 0.4 × average/50, 0.35 × strikeRate/200, 0.25 × runs/5000
    - Implement `computeBowlingScore(stats)` — normalized 0–100 bowling score using weights: 0.4 × wickets/150, 0.35 × (1 - economy/12), 0.25 × (1 - bowlingAverage/40)
    - Implement `hasHeadToHead(player, opponentTeam)` — returns true if player has season data where both selected teams appear in the dataset
    - Implement `computePlayerScore(player, opponentTeam, season?)` — composite score using role-based components (batting only for Batters/WK, bowling only for Bowlers, 50/50 for All-Rounders) with 1.1× head-to-head bonus
    - Implement `getTeamsFromPlayers(players)` and `getSeasonsFromPlayers(players)` helper functions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Write property tests for scoring functions (Properties 2, 3, 4)
    - **Property 2: Score uses correct role-based components** — For any player, verify pure Batters/WK use batting score only, pure Bowlers use bowling score only, All-Rounders use 0.5×batting + 0.5×bowling
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - **Property 3: Head-to-head bonus increases score** — For any player with head-to-head history, score with bonus > score without
    - **Validates: Requirements 2.5**
    - **Property 4: Score normalization range** — For any player, base score (before H2H bonus) is in [0, 100]
    - **Validates: Requirements 2.6**

  - [x] 1.3 Implement `selectDreamXI(players, teamA, teamB, season?)` function
    - Filter players to the two selected teams
    - When season is provided, exclude players without data for that season and use season-specific stats
    - When no season is provided, use aggregate career stats via `getAggregateStats()`
    - Score all eligible players via `computePlayerScore()`
    - Apply greedy constrained selection: fill mandatory slots first (min 3 Batters, min 3 Bowlers, min 1 WK), then fill remaining with highest-scoring players respecting max 4 All-Rounders and min 1 per team
    - Return `DreamXIResult` with players, composition relaxed flag, and team counts
    - Handle edge cases: not enough players, composition constraints relaxed
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.2, 5.3, 5.4_

  - [x] 1.4 Write property tests for selection logic (Properties 5, 6)
    - **Property 5: Dream XI composition constraints** — For any two distinct teams with sufficient players, result has exactly 11 players, ≥1 WK, ≥3 Batters, ≥3 Bowlers, ≤4 All-Rounders, ≥1 from each team
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.7**
    - **Property 6: Season filter restricts players and stats** — For any season filter, every player in result has data for that season; no player without data for that season appears
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 1.5 Write unit tests for engine edge cases
    - Test with teams that have very few players
    - Test composition relaxation when not enough players of a role
    - Test season filter yielding no eligible players
    - _Requirements: 3.6, 5.4_

- [x] 2. Checkpoint — Verify engine logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Build UI Components
  - [x] 3.1 Create `components/TeamPicker.tsx`
    - Two `<select>` dropdowns for Team A and Team B
    - Show all available teams as options
    - Display validation message when same team selected for both
    - Use CSS variable inline styles for theming (`var(--bg-input)`, `var(--text-primary)`, `var(--border-color)`)
    - Stack dropdowns vertically on screens ≤768px
    - _Requirements: 1.1, 1.2, 1.3, 8.3_

  - [x] 3.2 Write property test for TeamPicker validation (Property 1)
    - **Property 1: Generate button enabled iff two distinct teams selected** — For any pair of team selections, button enabled iff both non-null and different; validation message shown when same team selected
    - **Validates: Requirements 1.3, 1.4, 1.5**

  - [x] 3.3 Create `components/DreamTeamCard.tsx`
    - Display player name (as link to `/player/[id]`), team, primary role, secondary role (if present), and computed score
    - Visually distinguish Team A vs Team B via team label/color coding
    - Use CSS variable inline styles for theming
    - Indicate player name is clickable via hover styling
    - _Requirements: 4.2, 4.4, 7.1, 7.2_

  - [x] 3.4 Write property test for DreamTeamCard display (Property 7)
    - **Property 7: Dream Team Card displays required information** — For any ScoredPlayer, rendered card contains player name, team, primary role, secondary role (if present), and score
    - **Validates: Requirements 4.2**

  - [x] 3.5 Write unit tests for TeamPicker and DreamTeamCard
    - Test TeamPicker renders all teams, handles selection changes
    - Test DreamTeamCard renders player info, links to player detail page
    - _Requirements: 1.1, 4.2, 7.1_

- [x] 4. Checkpoint — Verify components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Build Dream Team Page and Wire Everything Together
  - [x] 5.1 Create `app/dream-team/page.tsx`
    - Client component with state for teamA, teamB, selectedSeason, dreamXI result
    - Load players via `getAllPlayers()`, derive teams and seasons
    - Render TeamPicker, season filter dropdown, and "Generate Dream XI" button
    - Button disabled when fewer than two distinct teams selected
    - On generate, call `selectDreamXI()` and display results
    - Display Dream XI grouped by role (Wicket-Keepers, Batters, All-Rounders, Bowlers)
    - Show team summary (count from each team)
    - Show composition notice when constraints were relaxed
    - Handle empty states: no data, season filter yields no players
    - Include back link to dashboard (`/`)
    - Responsive grid layout: multi-column on >768px, single-column on ≤768px
    - Use CSS variable inline styles for theming
    - _Requirements: 1.4, 1.5, 3.6, 4.1, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.3, 8.1, 8.2_

  - [x] 5.2 Add navigation link to Dream Team Selector from the dashboard
    - Add a "Dream Team" link/button in `app/page.tsx` header that navigates to `/dream-team`
    - _Requirements: 6.1, 6.2_

  - [x] 5.3 Write integration tests for Dream Team page
    - Test page renders team pickers and generate button
    - Test generate button disabled state logic
    - Test generating a Dream XI displays player cards grouped by role
    - Test season filter dropdown changes results
    - Test navigation link from dashboard exists
    - Test back link to dashboard exists
    - _Requirements: 1.4, 1.5, 4.1, 4.3, 5.1, 6.1, 6.3_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add Opponent Performance Data Model
  - [ ] 7.1 Add `OpponentBattingStats`, `OpponentBowlingStats`, and `OpponentStats` interfaces to `data/types.ts`
    - `OpponentBattingStats`: innings, runs, ballsFaced, dismissals
    - `OpponentBowlingStats`: innings, runsConceded, ballsBowled, wickets
    - `OpponentStats`: optional batting (`OpponentBattingStats`) and bowling (`OpponentBowlingStats`)
    - Add optional `opponentStats?: Record<string, OpponentStats>` field to `SeasonStats`
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 8. Update Import Script for Per-Opponent Aggregation
  - [ ] 8.1 Add per-opponent tracking to `PlayerSeasonData` in `scripts/import-ipl-data.ts`
    - Add `opponentBatting: Map<string, { innings: Set<string>; runs: number; ballsFaced: number; dismissals: number }>` to `PlayerSeasonData`
    - Add `opponentBowling: Map<string, { innings: Set<string>; runsConceded: number; ballsBowled: number; wickets: number }>` to `PlayerSeasonData`
    - Initialize both maps in `newPlayerSeasonData()`
    - _Requirements: 10.1_

  - [ ] 8.2 Aggregate per-opponent stats during ball-by-ball processing
    - In the batter processing block, identify the bowling (opponent) team and update `opponentBatting` counters for that opponent
    - In the bowler processing block, identify the batting (opponent) team and update `opponentBowling` counters for that opponent
    - Track innings per opponent using `inningsKey` to avoid double-counting
    - Track dismissals when `IsWicketDelivery === "1"` and `PlayerOut === batter`
    - _Requirements: 10.2, 10.3_

  - [ ] 8.3 Serialize `opponentStats` into the output JSON
    - In the output serialization section, convert the per-opponent maps into `OpponentStats` records
    - Omit opponents with zero deliveries
    - Write `opponentStats` into each `SeasonStats` entry
    - Update the `OutputPlayer` type to include `opponentStats` in season entries
    - _Requirements: 10.4, 10.5_

- [ ] 9. Implement Performance-Weighted Scoring
  - [ ] 9.1 Implement `computePerformanceBonus(player, opponentTeam, season?)` in `lib/dreamTeamEngine.ts`
    - Aggregate `OpponentStats` for the given opponent across all seasons (or filtered season)
    - Compute opponent-specific derived stats: batting average, strike rate, bowling economy, bowling average
    - Compute ratios against career stats (batting ratio for Batters/WK, bowling ratio for Bowlers, combined for All-Rounders)
    - Apply small-sample dampening: for < 3 innings, scale deviation from 1.0 by `innings / 3`
    - Clamp final multiplier to [0.85, 1.25]
    - Return 1.0 when player has no opponent stats or career stats are zero
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 9.2 Update `computePlayerScore()` to use `computePerformanceBonus()` instead of the flat 1.1× `hasHeadToHead()` multiplier
    - Remove the `hasHeadToHead()` call and `* 1.1` logic
    - Call `computePerformanceBonus(player, opponentTeam, season)` and multiply the base score by the result
    - Update function signature if needed (remove `allPlayers` parameter dependency for H2H check)
    - _Requirements: 2.5, 2.6, 11.4_

  - [ ] 9.3 Update `selectDreamXI()` to pass correct parameters to the updated `computePlayerScore()`
    - Ensure the opponent team and season are passed correctly
    - Remove any `allPlayers` parameter passing that was only needed for `hasHeadToHead()`
    - _Requirements: 2.1_

  - [ ]* 9.4 Write property test for Property 3: Performance bonus clamping invariant
    - For any player and any opponent stats (including extreme values), `computePerformanceBonus()` returns a value in [0.85, 1.25]; returns exactly 1.0 when no opponent stats exist
    - **Validates: Requirements 11.4, 2.6**

  - [ ]* 9.5 Write property test for Property 8: Opponent derived stats correctness
    - For any `OpponentBattingStats` with positive ballsFaced and dismissals, derived batting average = runs/dismissals and strike rate = (runs/ballsFaced)×100; same for bowling
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 9.6 Write property test for Property 9: Performance bonus uses role-appropriate comparison
    - For any player with opponent stats, verify pure Batters/WK use only batting ratios, pure Bowlers use only bowling ratios, All-Rounders use both
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [ ]* 9.7 Write property test for Property 10: Small-sample dampening reduces bonus magnitude
    - For any player with < 3 innings against opponent, bonus is closer to 1.0 than undampened value; deviation scaled by innings/3
    - **Validates: Requirements 11.5**

  - [ ]* 9.8 Write property test for Property 11: Better opponent performance yields bonus above 1.0
    - For any player with opponent batting avg and SR both > career stats (≥ 3 innings), bonus > 1.0; conversely, both worse → bonus < 1.0
    - **Validates: Requirements 11.6, 2.5**

- [ ] 10. Update Existing Tests for New Scoring
  - [ ] 10.1 Update Property 3 test in `__tests__/utils/dreamTeamEngine.test.ts`
    - Replace the old "head-to-head bonus increases score" test with the new "performance bonus clamping invariant" property
    - Update any tests that relied on the flat 1.1× multiplier or `hasHeadToHead()` function
    - _Requirements: 11.4_

  - [ ] 10.2 Update unit tests that reference `hasHeadToHead()` or the flat 1.1× bonus
    - Fix any tests in `__tests__/utils/dreamTeamEngine.test.ts` that call `hasHeadToHead()` directly
    - Update `computePlayerScore()` test calls to match the new signature
    - Ensure all existing property tests (2, 4, 5, 6) still pass with the updated scoring
    - _Requirements: 2.5, 2.6_

- [ ] 11. Final Checkpoint — Verify all tests pass
  - Run `npm run test -- --run` and ensure all tests pass
  - Verify no regressions in existing functionality

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All new components use CSS variable inline styles (no Tailwind `dark:` classes)
- Property tests use fast-check with minimum 100 iterations and tag comment format: `Feature: dream-team-selector, Property {number}: {property_text}`
    - _Requirements: 9.1, 9.6_

- [ ] 8. Update Import Script for Per-Opponent Aggregation
  - [ ] 8.1 Add per-opponent tracking to `PlayerSeasonData` in `scripts/import-ipl-data.ts`
    - Add an `opponentData: Map<string, { battingRuns: number, battingBallsFaced: number, battingInnings: Set<string>, battingDismissals: number, bowlingRunsConceded: number, bowlingBallsBowled: number, bowlingInnings: Set<string>, bowlingWickets: number }>` field to `PlayerSeasonData`
    - Initialize in `newPlayerSeasonData()`
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 8.2 Update ball processing loop to track per-opponent stats
    - For each batter delivery, update the batter's opponent counters keyed by `bowlingTeam`
    - For each bowler delivery, update the bowler's opponent counters keyed by `battingTeam`
    - Track innings per opponent using `inningsKey`
    - Track dismissals per opponent when `IsWicketDelivery === "1"` and `PlayerOut === batter`
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 8.3 Serialize `opponentStats` into the output JSON
    - Convert the per-opponent map into `Record<string, OpponentStats>` for each season entry
    - Omit opponents with zero deliveries (no batting balls faced and no bowling balls bowled)
    - _Requirements: 10.4, 10.5_

- [ ] 9. Implement Performance-Weighted Scoring
  - [ ] 9.1 Implement `computePerformanceBonus(player, opponentTeam, season?)` in `lib/dreamTeamEngine.ts`
    - Aggregate `OpponentStats` for the given opponent across all seasons (or filtered season)
    - Compute opponent-specific derived stats: batting average, strike rate, bowling economy, bowling average
    - Compute ratios against career stats (batting ratio for batters/WK, bowling ratio for bowlers, combined for all-rounders)
    - Apply small-sample dampening when innings < 3: `dampened = 1.0 + (ratio - 1.0) × (innings / 3)`
    - Clamp final multiplier to [0.85, 1.25]
    - Return 1.0 when player has no opponent stats or career stats are zero
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  - [ ] 9.2 Replace `hasHeadToHead()` usage with `computePerformanceBonus()` in `computePlayerScore()`
    - Remove the flat `1.1×` multiplier logic
    - Apply `finalScore = baseScore × computePerformanceBonus(player, opponentTeam, season)`
    - Remove the `allPlayers` parameter from `computePlayerScore()` since opponent stats are now on the player object
    - _Requirements: 2.5, 2.6, 11.4_
  - [ ] 9.3 Update `selectDreamXI()` to pass correct arguments to the updated `computePlayerScore()`
    - Remove `allPlayers` / `eligible` from `computePlayerScore()` calls
    - _Requirements: 2.5_

  - [ ]* 9.4 Write property test for Property 8: Opponent derived stats correctness
    - **Property 8: Opponent derived stats correctness**
    - Generate `OpponentBattingStats` with positive `ballsFaced` and `dismissals`, verify derived batting average = `runs / dismissals` and strike rate = `(runs / ballsFaced) × 100`
    - Generate `OpponentBowlingStats` with positive `ballsBowled` and `wickets`, verify derived bowling economy = `(runsConceded / ballsBowled) × 6` and bowling average = `runsConceded / wickets`
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 9.5 Write property test for Property 9: Performance bonus uses role-appropriate comparison
    - **Property 9: Performance bonus uses role-appropriate comparison**
    - For pure Batters/WK with opponent stats, verify `computePerformanceBonus()` uses only batting ratios
    - For pure Bowlers with opponent stats, verify `computePerformanceBonus()` uses only bowling ratios
    - For All-Rounders with opponent stats, verify `computePerformanceBonus()` uses both batting and bowling ratios
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [ ]* 9.6 Write property test for Property 3 (updated): Performance bonus clamping invariant
    - **Property 3: Performance bonus clamping invariant**
    - For any player and any set of opponent statistics (including extreme values), verify `computePerformanceBonus()` returns a value in [0.85, 1.25]
    - When player has no opponent stats, verify bonus is exactly 1.0
    - **Validates: Requirements 11.4, 2.6**

  - [ ]* 9.7 Write property test for Property 10: Small-sample dampening reduces bonus magnitude
    - **Property 10: Small-sample dampening reduces bonus magnitude**
    - For players with < 3 batting or bowling innings against an opponent, verify the bonus is closer to 1.0 than the undampened value
    - Verify deviation from 1.0 is scaled by `n / 3` for `n` innings
    - **Validates: Requirements 11.5**

  - [ ]* 9.8 Write property test for Property 11: Better opponent performance yields bonus above 1.0
    - **Property 11: Better opponent performance yields bonus above 1.0**
    - For players with opponent batting avg and SR both > career stats (≥ 3 innings), verify bonus > 1.0
    - For players with opponent stats both worse than career stats, verify bonus < 1.0
    - **Validates: Requirements 11.6, 2.5**

- [ ] 10. Update Existing Tests for New Scoring Logic
  - [ ] 10.1 Update existing unit tests in `__tests__/utils/dreamTeamEngine.test.ts`
    - Update `computePlayerScore` tests to remove `allPlayers` parameter
    - Update the "applies 1.1x head-to-head bonus" test to test `computePerformanceBonus()` instead
    - Update Property 3 test from "H2H bonus increases score" to "Performance bonus clamping invariant"
    - Ensure Property 2 tests still pass with updated `computePlayerScore()` signature
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 11.4_
  - [ ] 10.2 Update `selectDreamXI` call sites in tests to match updated `computePlayerScore()` signature
    - Ensure Property 5 and Property 6 tests still pass
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 5.2, 5.3, 5.4_

- [ ] 11. Checkpoint — Verify all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All new components use CSS variable inline styles (no Tailwind `dark:` classes)
- Property tests use fast-check with minimum 100 iterations and tag comment format: `Feature: dream-team-selector, Property {number}: {property_text}`
- Tasks 1–6 are completed from the initial implementation
- Tasks 7–11 add opponent performance-based scoring enhancements per Requirements 9, 10, 11
