# Implementation Plan: Test Dashboard

## Overview

Build a Test Dashboard that displays test results from multiple runners (vitest, playwright, jest) in a unified view. Implementation starts with the pure report parser and aggregate utility, then builds the API route, UI components, wires them into a `/test-dashboard` page, and adds navigation from the home page.

## Tasks

- [x] 1. Implement the Report Parser
  - [x] 1.1 Create `lib/reportParser.ts` with types and parser functions
    - Define `RunnerType`, `TestStatus`, `FailedTest`, `TestCase`, `NormalizedResult`, `FileCoverage` types
    - Implement `detectRunnerType(json)` — returns `"vitest"` (has `testResults` with `assertionResults` + `snapshot` field), `"playwright"` (has `suites` + `stats.expected`), `"jest"` (has `numPassedTests`/`numFailedTests` without `snapshot`), or `null`
    - Implement `parseVitestReport(json)` — extract pass/fail from `testResults[].assertionResults`, duration from timing fields, failed test details, and individual TestCase entries in allTests
    - Implement `parsePlaywrightReport(json)` — recursively traverse `suites` to count expected/unexpected specs, duration from `stats.duration`, failed test details, and individual TestCase entries in allTests
    - Implement `parseJestReport(json)` — map `numPassedTests`/`numFailedTests` directly, extract duration, failed test details, and individual TestCase entries in allTests
    - Implement `parseReport(json)` — auto-detect runner and delegate to the correct parser; throw descriptive error for unsupported formats
    - Implement `serialize(result)` and `deserialize(json)` for round-trip verification
    - Implement `parseCoverage(json)` — extract `total.lines.pct` as number 0–100, return `null` for malformed/missing input without throwing
    - Implement `parseFileCoverage(json)` — extract per-file coverage data (lines, statements, functions, branches), skip "total" key and malformed entries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

  - [x] 1.2 Write property tests for report parser (Properties 1–8)
    - **Property 1: Count invariant** — For any NormalizedResult produced by any parser, `passCount + failCount === totalTests`
    - **Validates: Requirements 1.3, 2.2, 3.2, 4.2**
    - **Property 2: Vitest parsing correctness** — For any valid vitest report with P passed and F failed, parsing produces `runnerType === "vitest"`, `passCount === P`, `failCount === F`, `totalTests === P + F`
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 3: Playwright parsing correctness** — For any valid playwright report with P expected and F unexpected, parsing produces `runnerType === "playwright"`, `passCount === P`, `failCount === F`, `totalTests === P + F`
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 4: Jest parsing correctness** — For any valid jest report with P passed and F failed, parsing produces `runnerType === "jest"`, `passCount === P`, `failCount === F`, `totalTests === P + F`
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - **Property 5: Malformed input error handling** — For any JSON missing required structural markers, `parseReport` throws a descriptive error
    - **Validates: Requirements 2.4, 3.4, 4.4**
    - **Property 6: Serialization round-trip** — For any valid NormalizedResult, `deserialize(serialize(result))` deeply equals the original
    - **Validates: Requirements 5.3**
    - **Property 7: Coverage extraction and range** — For any valid coverage summary, `parseCoverage` returns a number between 0 and 100
    - **Validates: Requirements 6.1, 6.2**
    - **Property 8: Coverage graceful failure** — For any malformed coverage input, `parseCoverage` returns `null` without throwing
    - **Validates: Requirements 6.3**

  - [x] 1.3 Write unit tests for report parser edge cases
    - Test parsing with empty test arrays, zero duration, missing optional fields
    - Test error messages for malformed JSON and unknown runner formats
    - Test coverage parsing with valid summary, missing file structure, and malformed JSON
    - _Requirements: 2.4, 3.4, 4.4, 6.3_

- [x] 2. Implement the Aggregate Utility
  - [x] 2.1 Create `lib/testDashboardUtils.ts` with `computeAggregate` function
    - Implement `computeAggregate(results: NormalizedResult[]): AggregateResult`
    - Sum `totalTests`, `totalPass`, `totalFail` across all results
    - Compute `passRate` as `(totalPass / totalTests) * 100` rounded to one decimal place
    - Return zeros and `passRate: 0` for empty arrays
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 2.2 Write property tests for aggregate utility (Properties 9–11)
    - **Property 9: Aggregate count invariant** — For any array of NormalizedResult objects, `totalPass + totalFail === totalTests` in the aggregate
    - **Validates: Requirements 13.2**
    - **Property 10: Aggregate additive property** — For any array, aggregate `totalTests` equals sum of individual `totalTests`, likewise for `totalPass` and `totalFail`
    - **Validates: Requirements 13.3, 10.1**
    - **Property 11: Aggregate pass rate computation** — For any non-empty array where `totalTests > 0`, `passRate === round((totalPass / totalTests) * 100, 1)`
    - **Validates: Requirements 10.2**

  - [x] 2.3 Write unit tests for aggregate utility
    - Test with empty array returns all zeros
    - Test with single result matches that result's values
    - Test with multiple results sums correctly
    - _Requirements: 13.4_

- [x] 3. Checkpoint — Verify parser and utility logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the API Route
  - [x] 4.1 Create `app/api/test-reports/route.ts`
    - Implement GET handler that reads all `.json` files from `test-reports/` directory
    - For each file, parse via `parseReport()` and collect results; catch parse errors and add to warnings array
    - Read `coverage/coverage-summary.json` via `parseCoverage()` and `parseFileCoverage()`; return `null`/empty if missing
    - Return `{ results: NormalizedResult[], coveragePercent: number | null, fileCoverage: FileCoverage[], warnings: string[] }`
    - Return empty results, null coverage, and empty fileCoverage when `test-reports/` directory doesn't exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Build UI Components
  - [x] 5.1 Create `components/RunnerCard.tsx`
    - Display runner name, passCount, failCount, totalTests
    - Display duration formatted as `(durationMs / 1000).toFixed(1) + "s"`
    - Show green success indicator when `failCount === 0`, red failure indicator when `failCount > 0`
    - Use CSS variable inline styles for theming
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.2 Create `components/AggregateSummary.tsx`
    - Display totalTests, totalPass, totalFail, and passRate
    - Show "No test data available" when `totalTests === 0`
    - Use CSS variable inline styles for theming
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 5.3 Create `components/CoverageDisplay.tsx`
    - Display coverage percentage as a large number with "%" suffix
    - Apply green color when coverage ≥ 80, yellow when 50 ≤ coverage < 80, red when coverage < 50
    - Show "No coverage data" with muted style when coverage is `null`
    - Use CSS variable inline styles for theming
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.4 Write property tests for UI components (Properties 12–15)
    - Test file: `__tests__/components/TestDashboardUI.property.test.tsx`
    - **Property 12: Duration formatting** — For any non-negative durationMs, RunnerCard displays `(durationMs / 1000).toFixed(1) + "s"`
    - **Validates: Requirements 9.5**
    - **Property 13: Coverage color thresholds** — For any coverage value, CoverageDisplay uses green ≥ 80, yellow 50–79, red < 50
    - **Validates: Requirements 11.2, 11.3, 11.4**
    - **Property 14: Runner card status indicator** — For any NormalizedResult, RunnerCard shows green when failCount === 0, red when failCount > 0
    - **Validates: Requirements 9.3, 9.4**
    - **Property 15: Failed tests section visibility** — For any array of NormalizedResult, "Failed Tests" section visible iff at least one result has failCount > 0
    - **Validates: Requirements 12.1, 12.3**

  - [x] 5.5 Write unit tests for UI components
    - Test file: `__tests__/components/TestDashboardUI.test.tsx`
    - Test RunnerCard renders all fields, success/failure indicators
    - Test AggregateSummary renders stats and "No test data available" state
    - Test CoverageDisplay renders percentage, color accents, and "No coverage data" state
    - _Requirements: 9.2, 9.3, 10.3, 11.1, 11.5_

- [x] 6. Checkpoint — Verify components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build Dashboard Page and Wire Everything Together
  - [x] 7.1 Create `app/test-dashboard/page.tsx`
    - Client component that fetches `GET /api/test-reports` on mount
    - Compute aggregate via `computeAggregate(results)`
    - Render AggregateSummary (with coveragePercent) above RunnerCards
    - Render RunnerCards in responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
    - Render CoverageDisplay
    - Render "Failed Tests" section listing each failed test with testName, errorMessage, and runnerType — visible only when failures exist
    - Render tabbed interface with "All Tests", "File Coverage", and "Component Flow" tabs
    - "All Tests" tab lists individual test cases with filters for runner, status, and test type
    - "File Coverage" tab displays per-file coverage table with color-coded metrics
    - "Component Flow" tab renders ComponentFlowDiagram
    - Show loading indicator while fetching
    - Show "Failed to load test results" on API error
    - Show "No test reports found. Run your test suites to generate reports." when results array is empty
    - Include page title "Test Dashboard"
    - Use CSS variable inline styles for theming
    - _Requirements: 8.1, 8.3, 8.4, 9.1, 9.6, 10.4, 12.1, 12.2, 12.3, 14.1, 14.2, 14.3, 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 17.1_

  - [x] 7.2 Add "Test Dashboard" navigation link to `app/page.tsx`
    - Add a "Test Dashboard" link in the header nav alongside existing links
    - Style consistently with existing "Dream Team" and "Champions" links
    - _Requirements: 8.2_

  - [x] 7.3 Write integration tests for Dashboard page
    - Test file: `__tests__/components/TestDashboardPage.test.tsx`
    - Test page renders loading state, then data
    - Test error state displays error message
    - Test empty state displays "No test reports found" message
    - Test runner cards, aggregate summary, coverage display, and failed tests section render correctly
    - Test navigation link exists on home page
    - _Requirements: 8.1, 8.2, 14.1, 14.2, 14.3_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All new components use CSS variable inline styles (no Tailwind `dark:` classes)
- Property tests use fast-check with `{ numRuns: 100 }` and tag format: `Feature: test-dashboard, Property {number}: {property_text}`
