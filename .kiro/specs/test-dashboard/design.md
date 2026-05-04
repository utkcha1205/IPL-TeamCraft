# Design Document: Test Dashboard

## Overview

The Test Dashboard adds a `/test-dashboard` page to the IPL Player Stats app that displays test results from multiple test runners (vitest, playwright, jest) in a unified view. The system reads JSON report files from a `test-reports/` directory and coverage data from `coverage/coverage-summary.json`, normalizes them into a common data model, and presents per-runner statistics, aggregate totals, and line coverage percentage.

The feature has three layers:

1. **Report Parser** (`lib/reportParser.ts`) — Pure utility functions that parse runner-specific JSON formats into a `NormalizedResult` type, plus serialize/deserialize for round-trip verification.
2. **API Route** (`app/api/test-reports/route.ts`) — Next.js Route Handler that reads report files from disk and returns normalized data via HTTP.
3. **Dashboard UI** (`app/test-dashboard/page.tsx`) — Client component that fetches data from the API and renders `AggregateSummary`, `RunnerCard`, `CoverageDisplay`, a failed tests detail section, and tabbed views for all tests (with filters), per-file coverage, and a component flow diagram.

```mermaid
graph TD
    Reports[test-reports/*.json] -->|fs.readFile| API[app/api/test-reports/route.ts]
    Coverage[coverage/coverage-summary.json] -->|fs.readFile| API
    API -->|parse| Parser[lib/reportParser.ts]
    Parser -->|NormalizedResult[]| API
    Parser -->|FileCoverage[]| API
    API -->|JSON response| Page[app/test-dashboard/page.tsx]
    Page --> Agg[AggregateSummary]
    Page --> Cards[RunnerCard × N]
    Page --> Cov[CoverageDisplay]
    Page --> Failed[Failed Tests Detail]
    Page --> AllTests[All Tests Tab with Filters]
    Page --> FileCov[File Coverage Tab]
    Page --> Flow[ComponentFlowDiagram]
    Page --> Utils[lib/testDashboardUtils.ts]

    subgraph "Data Layer"
        Reports
        Coverage
    end

    subgraph "Logic Layer"
        Parser
        Utils
    end

    subgraph "API Layer"
        API
    end

    subgraph "UI Layer"
        Page
        Agg
        Cards
        Cov
        Failed
        AllTests
        FileCov
        Flow
    end
```

## Architecture

**Data flow:**

1. Test runners (vitest, playwright, jest) output JSON report files into `test-reports/` and coverage into `coverage/coverage-summary.json`.
2. `GET /api/test-reports` reads all `.json` files from `test-reports/`, detects the runner type from each file's structure, parses via `lib/reportParser.ts`, and reads coverage data.
3. The API returns `{ results: NormalizedResult[], coveragePercent: number | null, fileCoverage: FileCoverage[], warnings: string[] }`.
4. `app/test-dashboard/page.tsx` fetches this endpoint on mount, computes aggregates via `lib/testDashboardUtils.ts`, and renders the UI with tabbed sections for tests, file coverage, and component flow.

**Runner detection strategy:**

Each runner's JSON output has a distinct shape:
- **vitest**: Has a `testResults` array with objects containing `assertionResults` arrays
- **playwright**: Has a `suites` array at the top level with nested `specs`
- **jest**: Has top-level `numPassedTests` and `numFailedTests` fields

The parser inspects these structural markers to determine the runner type automatically.

## Components and Interfaces

### New Files

| File | Purpose |
|------|---------|
| `lib/reportParser.ts` | Parse vitest/playwright/jest JSON → `NormalizedResult`; serialize/deserialize |
| `lib/testDashboardUtils.ts` | `computeAggregate()` pure function for aggregate stats |
| `app/api/test-reports/route.ts` | Next.js Route Handler: read files, parse, return JSON |
| `app/test-dashboard/page.tsx` | Dashboard page with all UI sections |
| `components/RunnerCard.tsx` | Card displaying single runner stats |
| `components/AggregateSummary.tsx` | Combined totals across all runners |
| `components/CoverageDisplay.tsx` | Line coverage percentage display |
| `components/ComponentFlowDiagram.tsx` | Visual diagram of dashboard component architecture and data flow |

### Modified Files

| File | Changes |
|------|---------|
| `app/page.tsx` | Add "Test Dashboard" nav link in header |

### Report Parser Interface

```typescript
// lib/reportParser.ts

type RunnerType = "vitest" | "playwright" | "jest";

type TestStatus = "passed" | "failed";

interface FailedTest {
  testName: string;
  errorMessage: string;
}

interface TestCase {
  testName: string;
  status: TestStatus;
  durationMs: number;
  errorMessage?: string;
}

interface NormalizedResult {
  runnerType: RunnerType;
  totalTests: number;
  passCount: number;
  failCount: number;
  durationMs: number;
  failedTests?: FailedTest[];
  allTests: TestCase[];
}

interface FileCoverage {
  filePath: string;
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

/** Detect runner type from JSON structure */
function detectRunnerType(json: unknown): RunnerType | null;

/** Parse a vitest JSON report */
function parseVitestReport(json: unknown): NormalizedResult;

/** Parse a playwright JSON report */
function parsePlaywrightReport(json: unknown): NormalizedResult;

/** Parse a jest JSON report */
function parseJestReport(json: unknown): NormalizedResult;

/** Parse any supported report (auto-detects runner) */
function parseReport(json: unknown): NormalizedResult;

/** Serialize a NormalizedResult to JSON string */
function serialize(result: NormalizedResult): string;

/** Deserialize a JSON string to NormalizedResult */
function deserialize(json: string): NormalizedResult;

/** Parse coverage-summary.json and return line coverage percent (0-100) or null */
function parseCoverage(json: unknown): number | null;

/** Parse coverage-summary.json and return per-file coverage entries */
function parseFileCoverage(json: unknown): FileCoverage[];
```

### Aggregate Utility Interface

```typescript
// lib/testDashboardUtils.ts

interface AggregateResult {
  totalTests: number;
  totalPass: number;
  totalFail: number;
  passRate: number; // percentage, 1 decimal place
}

function computeAggregate(results: NormalizedResult[]): AggregateResult;
```

### API Route Response Shape

```typescript
// GET /api/test-reports response
interface TestReportsResponse {
  results: NormalizedResult[];
  coveragePercent: number | null;
  fileCoverage: FileCoverage[];
  warnings: string[];
}
```

### Component Props

```typescript
// components/RunnerCard.tsx
interface RunnerCardProps {
  result: NormalizedResult;
}

// components/AggregateSummary.tsx
interface AggregateSummaryProps {
  aggregate: AggregateResult;
  coveragePercent?: number | null;
}

// components/CoverageDisplay.tsx
interface CoverageDisplayProps {
  coveragePercent: number | null;
}
```

## Data Models

### NormalizedResult Type

```typescript
type RunnerType = "vitest" | "playwright" | "jest";

type TestStatus = "passed" | "failed";

interface FailedTest {
  testName: string;
  errorMessage: string;
}

interface TestCase {
  testName: string;
  status: TestStatus;
  durationMs: number;
  errorMessage?: string;
}

interface NormalizedResult {
  runnerType: RunnerType;
  totalTests: number;
  passCount: number;
  failCount: number;
  durationMs: number;
  failedTests?: FailedTest[];
  allTests: TestCase[];
}
```

**Invariant:** `passCount + failCount === totalTests` for all valid instances.

### FileCoverage Type

```typescript
interface FileCoverage {
  filePath: string;
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}
```

### Vitest JSON Report Structure (input)

```json
{
  "numTotalTests": 42,
  "numPassedTests": 40,
  "numFailedTests": 2,
  "startTime": 1700000000000,
  "testResults": [
    {
      "name": "path/to/test.ts",
      "assertionResults": [
        {
          "fullName": "test name",
          "status": "passed" | "failed",
          "failureMessages": ["error text"]
        }
      ]
    }
  ]
}
```

Detection: has `testResults` array where items have `assertionResults`.

### Playwright JSON Report Structure (input)

```json
{
  "stats": {
    "startTime": "2024-01-01T00:00:00.000Z",
    "duration": 5000,
    "expected": 10,
    "unexpected": 1,
    "skipped": 0
  },
  "suites": [
    {
      "title": "Suite",
      "suites": [],
      "specs": [
        {
          "title": "test name",
          "tests": [
            {
              "status": "expected" | "unexpected",
              "results": [{ "error": { "message": "err" } }]
            }
          ]
        }
      ]
    }
  ]
}
```

Detection: has `suites` array at top level and a `stats` object with `expected`/`unexpected`.

### Jest JSON Report Structure (input)

```json
{
  "numTotalTests": 30,
  "numPassedTests": 28,
  "numFailedTests": 2,
  "startTime": 1700000000000,
  "testResults": [
    {
      "name": "path/to/test.ts",
      "assertionResults": [
        {
          "fullName": "test name",
          "status": "passed" | "failed",
          "failureMessages": ["error text"]
        }
      ]
    }
  ]
}
```

Detection: has `numPassedTests` and `numFailedTests` at top level but no `assertionResults` with vitest-specific markers. Since vitest and jest share a similar format, the parser differentiates by checking for vitest-specific fields (e.g., vitest reports may include a `config` object or `snapshot` field). If neither is present, the file name or an explicit `runnerType` field in the report can be used as a fallback. For simplicity, the parser will check for a `snapshot` field (vitest-specific) to distinguish.

### Coverage Summary Structure (input)

```json
{
  "total": {
    "lines": {
      "total": 500,
      "covered": 400,
      "skipped": 0,
      "pct": 80
    }
  }
}
```

### AggregateResult Type

```typescript
interface AggregateResult {
  totalTests: number;
  totalPass: number;
  totalFail: number;
  passRate: number;
}
```

**Invariant:** `totalPass + totalFail === totalTests`.
**Additive property:** `totalTests === sum(results.map(r => r.totalTests))`.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Count invariant

*For any* valid `NormalizedResult` object produced by any parser function, `passCount + failCount` shall equal `totalTests`.

**Validates: Requirements 1.3, 2.2, 3.2, 4.2**

### Property 2: Vitest parsing correctness

*For any* valid vitest JSON report containing N tests with P passed and F failed, parsing shall produce a `NormalizedResult` with `runnerType === "vitest"`, `passCount === P`, `failCount === F`, `totalTests === N`, and `durationMs` matching the report's timing data.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Playwright parsing correctness

*For any* valid playwright JSON report with arbitrarily nested suites containing P expected and F unexpected specs, parsing shall produce a `NormalizedResult` with `runnerType === "playwright"`, `passCount === P`, `failCount === F`, `totalTests === P + F`, and `durationMs` derived from the stats duration.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Jest parsing correctness

*For any* valid jest JSON report with `numPassedTests === P` and `numFailedTests === F`, parsing shall produce a `NormalizedResult` with `runnerType === "jest"`, `passCount === P`, `failCount === F`, and `totalTests === P + F`.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Malformed input error handling

*For any* JSON object that does not conform to any supported runner format (missing required structural markers), the parser shall throw a descriptive error rather than returning a corrupt `NormalizedResult`.

**Validates: Requirements 2.4, 3.4, 4.4**

### Property 6: NormalizedResult serialization round-trip

*For any* valid `NormalizedResult` object, `deserialize(serialize(result))` shall produce an object deeply equal to the original.

**Validates: Requirements 5.3**

### Property 7: Coverage extraction and range

*For any* valid coverage summary JSON with a `total.lines.pct` value, `parseCoverage` shall return that value, and the returned number shall be between 0 and 100 inclusive.

**Validates: Requirements 6.1, 6.2**

### Property 8: Coverage graceful failure

*For any* malformed or missing coverage input, `parseCoverage` shall return `null` without throwing an error.

**Validates: Requirements 6.3**

### Property 9: Aggregate count invariant

*For any* array of valid `NormalizedResult` objects, `computeAggregate` shall return an `AggregateResult` where `totalPass + totalFail === totalTests`.

**Validates: Requirements 13.2**

### Property 10: Aggregate additive property

*For any* array of valid `NormalizedResult` objects, the aggregate `totalTests` shall equal the sum of each individual result's `totalTests`, and likewise for `totalPass` and `totalFail`.

**Validates: Requirements 13.3, 10.1**

### Property 11: Aggregate pass rate computation

*For any* non-empty array of valid `NormalizedResult` objects where the aggregate `totalTests > 0`, `passRate` shall equal `(totalPass / totalTests) * 100` rounded to one decimal place.

**Validates: Requirements 10.2**

### Property 12: Duration formatting

*For any* `durationMs` value (non-negative integer), the `RunnerCard` shall display it formatted as `(durationMs / 1000).toFixed(1) + "s"`.

**Validates: Requirements 9.5**

### Property 13: Coverage color thresholds

*For any* coverage percentage value, the `CoverageDisplay` shall use green when coverage ≥ 80, yellow when 50 ≤ coverage < 80, and red when coverage < 50.

**Validates: Requirements 11.2, 11.3, 11.4**

### Property 14: Runner card status indicator

*For any* `NormalizedResult`, the `RunnerCard` shall display a green success indicator when `failCount === 0` and a red failure indicator when `failCount > 0`.

**Validates: Requirements 9.3, 9.4**

### Property 15: Failed tests section visibility

*For any* array of `NormalizedResult` objects, the "Failed Tests" section shall be visible if and only if at least one result has `failCount > 0`.

**Validates: Requirements 12.1, 12.3**

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Malformed vitest/playwright/jest JSON | `parseReport` throws an error with a descriptive message identifying the issue |
| Unknown runner format | `detectRunnerType` returns `null`; `parseReport` throws "Unsupported or unrecognized report format" |
| Missing `test-reports/` directory | API route returns `{ results: [], coveragePercent: null, warnings: [] }` |
| Individual report file fails to parse | API route skips the file, adds a warning string to `warnings` array |
| Missing `coverage/coverage-summary.json` | `parseCoverage` returns `null`; API returns `coveragePercent: null` |
| Malformed coverage JSON | `parseCoverage` returns `null` (no throw) |
| API returns HTTP error | Dashboard page shows "Failed to load test results" message |
| API returns empty results array | Dashboard page shows "No test reports found. Run your test suites to generate reports." |
| `totalTests` is 0 in aggregate | `AggregateSummary` shows "No test data available" instead of computed stats |
| Coverage is `null` | `CoverageDisplay` shows "No coverage data" with muted styling |
| Network timeout fetching API | Dashboard page catches the error and shows the generic error message |

Error handling follows the existing app pattern: conditional rendering with informative messages, no thrown exceptions for expected empty states. Parser functions throw for truly malformed input; the API layer catches and converts to warnings.

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required for comprehensive coverage.

**Unit tests** (`__tests__/utils/reportParser.test.ts` and `__tests__/utils/testDashboardUtils.test.ts`):
- Specific examples with known report JSON fixtures for each runner type
- Edge cases: empty test arrays, zero duration, missing optional fields
- Error conditions: malformed JSON, missing required fields, unknown runner format
- Coverage parsing: valid summary, missing file, malformed JSON
- Aggregate utility: empty array returns zeros, single result, multiple results
- UI component unit tests (`__tests__/components/TestDashboardUI.test.tsx`):
  - RunnerCard: renders all fields, success/failure indicators, duration formatting
  - AggregateSummary: renders stats, "No test data available" state
  - CoverageDisplay: renders percentage, color accents, "No coverage data" state
- Integration tests (`__tests__/components/TestDashboardPage.test.tsx`):
  - Dashboard page: loading state, data rendering, error state, empty state
  - Runner cards, aggregate summary, coverage display, failed tests section
  - Home page navigation link to /test-dashboard

**Property-based tests** (in `__tests__/utils/reportParser.test.ts`, `__tests__/utils/testDashboardUtils.test.ts`, and `__tests__/components/TestDashboardUI.property.test.tsx`):
- All 15 correctness properties above
- Minimum 100 iterations per property test (`{ numRuns: 100 }`)
- Each test tagged with: `Feature: test-dashboard, Property {N}: {title}`

### Property-Based Testing Configuration

- Library: `fast-check` (already installed)
- Runner: `vitest` via `npm run test -- --run`
- Minimum iterations: 100 per property (`{ numRuns: 100 }`)
- Tag format in test descriptions: **Feature: test-dashboard, Property {number}: {property_text}**
- Each correctness property is implemented by a single `fc.assert(fc.property(...))` call

### Arbitraries (Generators)

```typescript
import fc from "fast-check";

// Runner type arbitrary
const runnerTypeArb = fc.constantFrom("vitest", "playwright", "jest");

// FailedTest arbitrary
const failedTestArb = fc.record({
  testName: fc.string({ minLength: 1, maxLength: 50 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
});

// NormalizedResult arbitrary (maintains count invariant)
const normalizedResultArb = fc.record({
  runnerType: runnerTypeArb,
  passCount: fc.integer({ min: 0, max: 500 }),
  failCount: fc.integer({ min: 0, max: 500 }),
  durationMs: fc.integer({ min: 0, max: 600000 }),
  failedTests: fc.option(fc.array(failedTestArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
}).map(({ runnerType, passCount, failCount, durationMs, failedTests }) => ({
  runnerType,
  passCount,
  failCount,
  totalTests: passCount + failCount,
  durationMs,
  failedTests,
}));

// Vitest report JSON arbitrary
const vitestReportArb = fc.record({
  passCount: fc.integer({ min: 0, max: 100 }),
  failCount: fc.integer({ min: 0, max: 100 }),
  durationMs: fc.integer({ min: 0, max: 60000 }),
}).map(({ passCount, failCount, durationMs }) => ({
  numTotalTests: passCount + failCount,
  numPassedTests: passCount,
  numFailedTests: failCount,
  startTime: 1700000000000,
  snapshot: {},
  testResults: [
    {
      name: "test.ts",
      assertionResults: [
        ...Array.from({ length: passCount }, (_, i) => ({
          fullName: `pass-${i}`,
          status: "passed",
          failureMessages: [],
        })),
        ...Array.from({ length: failCount }, (_, i) => ({
          fullName: `fail-${i}`,
          status: "failed",
          failureMessages: ["error"],
        })),
      ],
    },
  ],
  config: {},
  startTime_end: 1700000000000 + durationMs,
}));

// Playwright report JSON arbitrary
const playwrightReportArb = fc.record({
  passCount: fc.integer({ min: 0, max: 100 }),
  failCount: fc.integer({ min: 0, max: 100 }),
  durationMs: fc.integer({ min: 0, max: 60000 }),
}).map(({ passCount, failCount, durationMs }) => ({
  stats: {
    startTime: "2024-01-01T00:00:00.000Z",
    duration: durationMs,
    expected: passCount,
    unexpected: failCount,
    skipped: 0,
  },
  suites: [
    {
      title: "Suite",
      suites: [],
      specs: [
        ...Array.from({ length: passCount }, (_, i) => ({
          title: `pass-${i}`,
          tests: [{ status: "expected", results: [{}] }],
        })),
        ...Array.from({ length: failCount }, (_, i) => ({
          title: `fail-${i}`,
          tests: [{ status: "unexpected", results: [{ error: { message: "err" } }] }],
        })),
      ],
    },
  ],
}));

// Jest report JSON arbitrary
const jestReportArb = fc.record({
  passCount: fc.integer({ min: 0, max: 100 }),
  failCount: fc.integer({ min: 0, max: 100 }),
  durationMs: fc.integer({ min: 0, max: 60000 }),
}).map(({ passCount, failCount, durationMs }) => ({
  numTotalTests: passCount + failCount,
  numPassedTests: passCount,
  numFailedTests: failCount,
  startTime: 1700000000000,
  testResults: [
    {
      name: "test.ts",
      assertionResults: [
        ...Array.from({ length: passCount }, (_, i) => ({
          fullName: `pass-${i}`,
          status: "passed",
          failureMessages: [],
        })),
        ...Array.from({ length: failCount }, (_, i) => ({
          fullName: `fail-${i}`,
          status: "failed",
          failureMessages: ["error"],
        })),
      ],
    },
  ],
}));

// Coverage summary arbitrary
const coverageSummaryArb = fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }).map(
  (pct) => ({
    total: {
      lines: {
        total: 500,
        covered: Math.round(pct * 5),
        skipped: 0,
        pct: Math.round(pct * 10) / 10,
      },
    },
  })
);
```
