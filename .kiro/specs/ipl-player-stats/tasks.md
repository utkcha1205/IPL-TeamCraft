# Implementation Plan: IPL Player Stats

## Overview

Build an IPL Player Statistics application using Next.js App Router, TypeScript, and Tailwind CSS. The implementation proceeds from data layer → utility functions → UI components → pages → integration, ensuring each step builds on the previous one with no orphaned code.

## Tasks

- [x] 1. Set up data layer and TypeScript interfaces
  - [x] 1.1 Create TypeScript interfaces and player data file
    - Create `data/types.ts` with `Player`, `SeasonStats`, `BattingStats`, `BowlingStats`, `FilterState`, `SortConfig`, and `AggregateStats` interfaces
    - Create `data/players.json` with at least 30 players across 3+ IPL seasons, covering all four roles (Batter, Bowler, All-Rounder, Wicket-Keeper)
    - Create `data/players.ts` with `getAllPlayers` and `getPlayerById` loader functions that read from `players.json`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Write property test for Player JSON round-trip
    - **Property 12: Player JSON round-trip**
    - **Validates: Requirements 8.5**
    - Install `vitest` and `fast-check` as dev dependencies
    - Create `__tests__/utils/playerData.test.ts`
    - Generate arbitrary valid `Player` objects with fast-check and verify `JSON.parse(JSON.stringify(player))` deep-equals the original

- [x] 2. Implement filtering and search utility functions
  - [x] 2.1 Implement `filterPlayers` utility function
    - Create `lib/filterPlayers.ts` with the `filterPlayers(players, filters, searchQuery)` function
    - Implement case-insensitive name substring search
    - Implement role, team, and season filtering
    - Implement filter intersection (all active filters must match)
    - _Requirements: 2.1, 2.2, 2.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 2.2 Write property test for search filtering
    - **Property 2: Search filters by name substring (case-insensitive)**
    - **Validates: Requirements 2.1**
    - Create `__tests__/utils/filterPlayers.test.ts`

  - [x] 2.3 Write property test for empty search identity
    - **Property 3: Empty search is identity**
    - **Validates: Requirements 2.2**
    - Add to `__tests__/utils/filterPlayers.test.ts`

  - [x] 2.4 Write property test for single-dimension filter correctness
    - **Property 4: Single-dimension filter correctness**
    - **Validates: Requirements 3.4, 3.5**
    - Add to `__tests__/utils/filterPlayers.test.ts`

  - [x] 2.5 Write property test for season filter
    - **Property 5: Season filter returns season-specific stats**
    - **Validates: Requirements 3.6**
    - Add to `__tests__/utils/filterPlayers.test.ts`

  - [x] 2.6 Write property test for filter composition
    - **Property 6: Filter composition is intersection**
    - **Validates: Requirements 3.7**
    - Add to `__tests__/utils/filterPlayers.test.ts`

- [x] 3. Implement sorting utility functions
  - [x] 3.1 Implement `sortPlayers` and `getStatValue` utility functions
    - Create `lib/sortPlayers.ts` with `sortPlayers(players, config)` and `getStatValue(player, statKey, season?)` functions
    - Support sorting by runs, wickets, average, strike rate, economy
    - Support ascending and descending sort directions
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.2 Write property test for sort ordering
    - **Property 10: Sort ordering**
    - **Validates: Requirements 6.2**
    - Create `__tests__/utils/sortPlayers.test.ts`

  - [x] 3.3 Write property test for sort toggle involution
    - **Property 11: Sort toggle is involution**
    - **Validates: Requirements 6.3**
    - Add to `__tests__/utils/sortPlayers.test.ts`

- [x] 4. Implement aggregate stats utility
  - [x] 4.1 Implement `getAggregateStats` and `getSeasonStats` utility functions
    - Create `lib/statsUtils.ts` with `getAggregateStats(player)` and `getSeasonStats(player, season)` functions
    - Compute career totals by summing season data for batting runs, bowling wickets, matches
    - Compute weighted averages for batting average, strike rate, bowling economy, bowling average
    - _Requirements: 4.4_

  - [x] 4.2 Write property test for aggregate stats correctness
    - **Property 7: Aggregate stats are correct sums**
    - **Validates: Requirements 4.4**
    - Create `__tests__/utils/aggregateStats.test.ts`

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Build dashboard UI components
  - [x] 6.1 Implement `PlayerCard` component
    - Create `components/PlayerCard.tsx`
    - Display player name, team, role, and key stats
    - Show batting stats for Batters and Wicket-Keepers, bowling stats for Bowlers, both for All-Rounders
    - Include selection checkbox for comparison feature
    - Include link to player detail page
    - _Requirements: 1.1, 1.4, 1.5, 4.1_

  - [x] 6.2 Write property test for role-appropriate stat display
    - **Property 1: Role-appropriate stat display**
    - **Validates: Requirements 1.4, 1.5**
    - Create `__tests__/components/PlayerCard.test.tsx`

  - [x] 6.3 Implement `SearchBar` component
    - Create `components/SearchBar.tsx`
    - Text input that calls `onChange` with the current query value
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.4 Implement `FilterPanel` component
    - Create `components/FilterPanel.tsx`
    - Dropdowns for role, team, and season filters
    - Reset filters button
    - Collapsible on mobile (screens ≤768px)
    - _Requirements: 3.1, 3.2, 3.3, 3.8, 7.3_

  - [x] 6.5 Implement `SortControls` component
    - Create `components/SortControls.tsx`
    - Sort criterion selector (runs, wickets, average, strike rate, economy)
    - Ascending/descending toggle
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Build dashboard page
  - [x] 7.1 Implement the Stats Dashboard page (`app/page.tsx`)
    - Wire up `SearchBar`, `FilterPanel`, `SortControls`, and `PlayerCard` grid
    - Manage client-side state for `searchQuery`, `activeFilters`, `sortConfig`, `selectedForComparison`
    - Apply `filterPlayers` and `sortPlayers` to the player list
    - Display "No results found" when filtered list is empty
    - Responsive grid layout: multi-column on >768px, single-column on ≤768px
    - Include "Compare Selected" button that navigates to `/compare?ids=...`
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 7.1, 7.2_

- [x] 8. Build player detail page
  - [x] 8.1 Implement `PlayerDetailView` component
    - Create `components/PlayerDetailView.tsx`
    - Display player name, team, role, nationality, and photo placeholder
    - Render season-by-season stats in a table
    - Display aggregate career stats using `getAggregateStats`
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 8.2 Implement the Player Detail page (`app/player/[id]/page.tsx`)
    - Server component that loads player by ID from params
    - Render `PlayerDetailView` with player data
    - Show error message and link back to dashboard if player not found
    - _Requirements: 4.1, 4.5_

- [x] 9. Build player comparison page
  - [x] 9.1 Implement `PlayerComparisonView` component
    - Create `components/PlayerComparisonView.tsx`
    - Side-by-side stat table with matching stat category rows for each player
    - Highlight the best value in each stat row (highest for runs, wickets, strike rate; lowest for economy, bowling average)
    - Support horizontal scrolling on narrow screens
    - _Requirements: 5.2, 5.3, 5.5, 7.4_

  - [x] 9.2 Write property test for comparison stat rows
    - **Property 8: Comparison view shows matching stat rows**
    - **Validates: Requirements 5.2, 5.3**
    - Create `__tests__/components/PlayerComparison.test.tsx`

  - [x] 9.3 Write property test for superior stat highlighting
    - **Property 9: Superior stat highlighting**
    - **Validates: Requirements 5.5**
    - Add to `__tests__/components/PlayerComparison.test.tsx`

  - [x] 9.4 Implement the Comparison page (`app/compare/page.tsx`)
    - Client component that reads `ids` from search params
    - Load selected players and render `PlayerComparisonView`
    - Validate 2–4 players; show prompt if fewer than 2 valid players
    - Handle malformed query params gracefully
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Update layout and finalize wiring
  - [x] 11.1 Update `app/layout.tsx` with application title and metadata
    - Set page title to "IPL Player Stats"
    - Ensure global styles and fonts are applied
    - _Requirements: 1.1_

  - [x] 11.2 Verify all routes and navigation links work end-to-end
    - Dashboard links to player detail pages
    - Compare button navigates to comparison page with correct query params
    - Player detail "back to dashboard" link works
    - Comparison page handles edge cases (invalid IDs, fewer than 2 players)
    - _Requirements: 4.1, 4.5, 5.1, 5.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All filtering, sorting, and aggregation logic lives in pure utility functions for testability

## Post-Implementation Changes

The following enhancements were made after the initial task execution:

- [x] P1. Integrated open-source IPL data via import script
  - Created `scripts/import-ipl-data.ts` to download and aggregate ball-by-ball CSV data from the IPL-DATASET repository (https://github.com/ritesh-ojha/IPL-DATASET)
  - Added `npm run import-data` script, installed `csv-parse` and `tsx` as dev dependencies
  - Player data expanded from ~33 to 248 players across 2022–2025 seasons
  - _Requirements: 8.1, 8.2, 8.3, 8.7_

- [x] P2. Added `originalName` field to Player interface
  - Added optional `originalName` field to `Player` in `data/types.ts`
  - Import script maps abbreviated IPL names to full names via CSV + supplementary mapping
  - ~135+ of 248 players have `originalName` populated
  - _Requirements: 8.6_

- [x] P3. Enhanced search to match both `name` and `originalName`
  - Updated `filterPlayers` in `lib/filterPlayers.ts` to search against both `name` and `originalName`
  - Searching "Vaibhav" now finds "V Suryavanshi" (originalName: "Vaibhav Suryavanshi")
  - _Requirements: 2.1, 2.4_

- [x] P4. Updated name display across views
  - `PlayerCard` shows `player.name` (official IPL abbreviated name)
  - `PlayerDetailView` shows `player.originalName ?? player.name` (full name)
  - `PlayerComparisonView` shows `player.originalName ?? player.name` (full name)
  - _Requirements: 1.1, 4.2_

- [x] P5. Changed dev server port to 4000
  - Updated `package.json` dev script to `next dev --port 4000`
