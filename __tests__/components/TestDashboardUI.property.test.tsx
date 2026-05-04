import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import type { NormalizedResult, RunnerType, TestCase, FailedTest } from "@/lib/reportParser";
import RunnerCard from "@/components/RunnerCard";
import CoverageDisplay from "@/components/CoverageDisplay";

// --- Arbitraries ---

const runnerTypeArb: fc.Arbitrary<RunnerType> = fc.constantFrom(
  "vitest" as RunnerType,
  "playwright" as RunnerType,
  "jest" as RunnerType
);

const failedTestArb: fc.Arbitrary<FailedTest> = fc.record({
  testName: fc.string({ minLength: 1, maxLength: 50 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
});

const testCaseArb = (status: "passed" | "failed"): fc.Arbitrary<TestCase> =>
  fc.record({
    testName: fc.string({ minLength: 1, maxLength: 50 }),
    status: fc.constant(status),
    durationMs: fc.integer({ min: 0, max: 60000 }),
    errorMessage: status === "failed" ? fc.string({ minLength: 1, maxLength: 100 }) : fc.constant(undefined),
  }) as fc.Arbitrary<TestCase>;

const normalizedResultArb: fc.Arbitrary<NormalizedResult> = fc
  .record({
    runnerType: runnerTypeArb,
    passCount: fc.integer({ min: 0, max: 200 }),
    failCount: fc.integer({ min: 0, max: 200 }),
    durationMs: fc.integer({ min: 0, max: 600000 }),
  })
  .chain(({ runnerType, passCount, failCount, durationMs }) => {
    const passTests = fc.array(testCaseArb("passed"), {
      minLength: passCount,
      maxLength: passCount,
    });
    const failTests = fc.array(testCaseArb("failed"), {
      minLength: failCount,
      maxLength: failCount,
    });
    const failedTestDetails =
      failCount > 0
        ? fc.array(failedTestArb, { minLength: failCount, maxLength: failCount })
        : fc.constant(undefined);

    return fc.tuple(passTests, failTests, failedTestDetails).map(
      ([passed, failed, failedDetails]) => ({
        runnerType,
        totalTests: passCount + failCount,
        passCount,
        failCount,
        durationMs,
        allTests: [...passed, ...failed],
        ...(failedDetails ? { failedTests: failedDetails } : {}),
      })
    );
  });

// --- Property 12: Duration formatting ---
// Feature: test-dashboard, Property 12: Duration formatting
// **Validates: Requirements 9.5**

describe("Feature: test-dashboard, Property 12: Duration formatting", () => {
  it("For any non-negative durationMs, RunnerCard displays (durationMs / 1000).toFixed(1) + 's'", () => {
    fc.assert(
      fc.property(
        normalizedResultArb,
        (result) => {
          cleanup();
          const { getByTestId } = render(<RunnerCard result={result} />);
          const durationEl = getByTestId("duration");
          const expected = (result.durationMs / 1000).toFixed(1) + "s";
          expect(durationEl.textContent).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 13: Coverage color thresholds ---
// Feature: test-dashboard, Property 13: Coverage color thresholds
// **Validates: Requirements 11.2, 11.3, 11.4**

// jsdom normalizes hex colors to rgb(), so we compare against rgb values
const GREEN_RGB = "rgb(34, 197, 94)";   // #22c55e
const YELLOW_RGB = "rgb(234, 179, 8)";  // #eab308
const RED_RGB = "rgb(239, 68, 68)";     // #ef4444

describe("Feature: test-dashboard, Property 13: Coverage color thresholds", () => {
  it("For any coverage value, CoverageDisplay uses green >= 80, yellow 50-79, red < 50", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        (coverage) => {
          cleanup();
          const { getByTestId } = render(
            <CoverageDisplay coveragePercent={coverage} />
          );
          const valueEl = getByTestId("coverage-value");
          const color = valueEl.style.color;

          if (coverage >= 80) {
            expect(color).toBe(GREEN_RGB);
          } else if (coverage >= 50) {
            expect(color).toBe(YELLOW_RGB);
          } else {
            expect(color).toBe(RED_RGB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 14: Runner card status indicator ---
// Feature: test-dashboard, Property 14: Runner card status indicator
// **Validates: Requirements 9.3, 9.4**

describe("Feature: test-dashboard, Property 14: Runner card status indicator", () => {
  it("For any NormalizedResult, RunnerCard shows green when failCount === 0, red when failCount > 0", () => {
    fc.assert(
      fc.property(
        normalizedResultArb,
        (result) => {
          cleanup();
          const { getByTestId } = render(<RunnerCard result={result} />);
          const indicator = getByTestId("status-indicator");
          const color = indicator.style.color;

          if (result.failCount === 0) {
            expect(color).toBe(GREEN_RGB);
          } else {
            expect(color).toBe(RED_RGB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// --- Property 15: Failed tests section visibility ---
// Feature: test-dashboard, Property 15: Failed tests section visibility
// **Validates: Requirements 12.1, 12.3**

// We need to mock next/navigation for the dashboard page
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Feature: test-dashboard, Property 15: Failed tests section visibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("'Failed Tests' section visible iff at least one result has failCount > 0", () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(normalizedResultArb, { minLength: 0, maxLength: 5 }),
        async (results) => {
          cleanup();

          const hasFailures = results.some((r) => r.failCount > 0);

          // Mock fetch to return our generated results
          vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
              JSON.stringify({
                results,
                coveragePercent: 80,
                fileCoverage: [],
                warnings: [],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );

          // Dynamic import to avoid module-level issues with mocking
          const { default: TestDashboard } = await import(
            "@/app/test-dashboard/page"
          );

          const { queryByTestId } = render(<TestDashboard />);

          // Wait for the component to finish loading
          await waitFor(() => {
            expect(queryByTestId("runner-card") !== null || results.length === 0).toBe(true);
          });

          const failedSection = queryByTestId("failed-tests-section");

          if (results.length === 0) {
            // No results means no runner cards and no failed tests section
            expect(failedSection).toBeNull();
          } else if (hasFailures) {
            expect(failedSection).not.toBeNull();
          } else {
            expect(failedSection).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
