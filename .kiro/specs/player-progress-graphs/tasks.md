# Implementation Plan: Player Progress Graphs

## Overview

Add interactive season-over-season progress charts (batting and bowling) to the player detail page using Recharts. Implementation proceeds from data layer (types + transforms) → chart components → integration into the existing page, with property-based and unit tests alongside each step.

## Tasks

- [x] 1. Install Recharts and define chart data types
  - [x] 1.1 Install `recharts` as a production dependency
    - Run `npm install recharts`
    - _Requirements: 1.1, 2.1_
  - [x] 1.2 Add chart data point types to `data/types.ts`
    - Add `BattingDataPoint` interface with `season`, `runs`, `average`, `strikeRate`
    - Add `BowlingDataPoint` interface with `season`, `wickets`, `economy`, `average`
    - Add `ChartVisibility` interface with `showBatting`, `showBowling`, `battingPrimary`
    - _Requirements: 4.2, 4.3_

- [x] 2. Implement graph data utility functions
  - [x] 2.1 Create `lib/graphDataUtils.ts` with `transformBattingData`, `transformBowlingData`, and `getChartVisibility`
    - `transformBattingData(player: Player)` filters seasons with batting data, maps to `BattingDataPoint[]`, sorted by season ascending
    - `transformBowlingData(player: Player)` filters seasons with bowling data, maps to `BowlingDataPoint[]`, sorted by season ascending
    - `getChartVisibility(player: Player)` returns `ChartVisibility` based on `primaryRole`, `secondaryRole`, and data availability
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Write property test: Batting data transformation completeness
    - **Property 1: Batting data transformation completeness**
    - Verify output length equals number of seasons with batting data, and each element's `runs`, `average`, `strikeRate` match the source season
    - **Validates: Requirements 1.1, 1.2, 4.2, 4.4**

  - [x] 2.3 Write property test: Bowling data transformation completeness
    - **Property 2: Bowling data transformation completeness**
    - Verify output length equals number of seasons with bowling data, and each element's `wickets`, `economy`, `average` match the source season
    - **Validates: Requirements 2.1, 2.2, 4.3, 4.4**

  - [x] 2.4 Write property test: Transform output sorted by season ascending
    - **Property 3: Transform output is sorted by season ascending**
    - Verify both `transformBattingData` and `transformBowlingData` return arrays sorted by `season` in ascending lexicographic order
    - **Validates: Requirements 4.1**

  - [x] 2.5 Write property test: Chart visibility correctness
    - **Property 4: Chart visibility correctness**
    - Verify `getChartVisibility` returns correct `showBatting`, `showBowling`, `battingPrimary` for any generated Player
    - **Validates: Requirements 1.4, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 2.6 Write property test: Data transformation round-trip
    - **Property 5: Data transformation round-trip**
    - Verify transforming season data into chart data points and comparing back to original season stats yields identical numeric values
    - **Validates: Requirements 4.5**

- [x] 3. Checkpoint - Verify data layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement chart components
  - [x] 4.1 Create `components/BattingChart.tsx`
    - Client component (`"use client"`) accepting `data: BattingDataPoint[]` and `playerName: string`
    - Render Recharts `ComposedChart` with `Bar` for runs, `Line` for average and strike rate
    - Include `Tooltip`, `Legend`, `ResponsiveContainer`, and ARIA label (`aria-label="Batting performance trends for {playerName}"`)
    - Use distinct colors for each metric
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.2 Create `components/BowlingChart.tsx`
    - Client component (`"use client"`) accepting `data: BowlingDataPoint[]` and `playerName: string`
    - Render Recharts `ComposedChart` with `Bar` for wickets, `Line` for economy and average
    - Include `Tooltip`, `Legend`, `ResponsiveContainer`, and ARIA label (`aria-label="Bowling performance trends for {playerName}"`)
    - Use distinct colors for each metric
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.3 Create `components/ProgressGraphSection.tsx`
    - Client component accepting `player: Player`
    - Call `getChartVisibility(player)` to determine which charts to show and ordering
    - Call `transformBattingData` / `transformBowlingData` as needed
    - Render "Performance Trends" heading (`<h2>`)
    - Two-column grid on `sm:` breakpoint (≥640px), single-column stack below
    - Order charts: primary chart first based on `battingPrimary`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 4.4 Write unit tests for ProgressGraphSection
    - Test heading "Performance Trends" is rendered
    - Test ARIA labels are present on chart containers
    - Test correct chart visibility for Batter, Bowler, and All-Rounder players
    - Test no charts rendered when player has no batting or bowling data
    - _Requirements: 5.2, 6.2, 1.4, 2.4, 3.1, 3.2, 3.3_

- [x] 5. Integrate into PlayerDetailView
  - [x] 5.1 Add ProgressGraphSection to `components/PlayerDetailView.tsx`
    - Import `ProgressGraphSection`
    - Render `<ProgressGraphSection player={player} />` between the Career Stats `<section>` and the Season-by-Season Stats `<section>`
    - _Requirements: 6.1_

  - [x] 5.2 Write unit test for section placement
    - Verify the "Performance Trends" heading appears after "Career Stats" and before "Season-by-Season Stats" in the DOM
    - _Requirements: 6.1_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and component rendering
