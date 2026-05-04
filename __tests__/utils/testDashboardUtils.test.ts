import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeAggregate } from "@/lib/testDashboardUtils";
import type { NormalizedResult } from "@/lib/reportParser";

// ─── Arbitraries (Generators) ───────────────────────────────────────────────

const runnerTypeArb = fc.constantFrom("vitest" as const, "playwright" as const, "jest" as const);

const failedTestArb = fc.record({
  testName: fc.string({ minLength: 1, maxLength: 50 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
});

const normalizedResultArb: fc.Arbitrary<NormalizedResult> = fc
  .record({
    runnerType: runnerTypeArb,
    passCount: fc.integer({ min: 0, max: 500 }),
    failCount: fc.integer({ min: 0, max: 500 }),
    durationMs: fc.integer({ min: 0, max: 600000 }),
    failedTests: fc.option(fc.array(failedTestArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  })
  .map(({ runnerType, passCount, failCount, durationMs, failedTests }) => ({
    runnerType,
    passCount,
    failCount,
    totalTests: passCount + failCount,
    durationMs,
    failedTests,
    allTests: [],
  }));

// ─── Property Tests ─────────────────────────────────────────────────────────

describe("Aggregate Utility Property Tests", () => {
  it("Feature: test-dashboard, Property 9: Aggregate count invariant", () => {
    // For any array of valid NormalizedResult objects, computeAggregate shall return
    // an AggregateResult where totalPass + totalFail === totalTests
    // **Validates: Requirements 13.2**

    fc.assert(
      fc.property(
        fc.array(normalizedResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const aggregate = computeAggregate(results);
          expect(aggregate.totalPass + aggregate.totalFail).toBe(aggregate.totalTests);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 10: Aggregate additive property", () => {
    // For any array, aggregate totalTests equals sum of individual totalTests,
    // likewise for totalPass and totalFail
    // **Validates: Requirements 13.3, 10.1**

    fc.assert(
      fc.property(
        fc.array(normalizedResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const aggregate = computeAggregate(results);

          const expectedTotalTests = results.reduce((sum, r) => sum + r.totalTests, 0);
          const expectedTotalPass = results.reduce((sum, r) => sum + r.passCount, 0);
          const expectedTotalFail = results.reduce((sum, r) => sum + r.failCount, 0);

          expect(aggregate.totalTests).toBe(expectedTotalTests);
          expect(aggregate.totalPass).toBe(expectedTotalPass);
          expect(aggregate.totalFail).toBe(expectedTotalFail);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 11: Aggregate pass rate computation", () => {
    // For any non-empty array where totalTests > 0,
    // passRate === round((totalPass / totalTests) * 100, 1)
    // **Validates: Requirements 10.2**

    // Use a filtered arbitrary that guarantees at least one result with totalTests > 0
    const nonEmptyResultsArb = fc
      .array(normalizedResultArb, { minLength: 1, maxLength: 20 })
      .filter((results) => results.reduce((sum, r) => sum + r.totalTests, 0) > 0);

    fc.assert(
      fc.property(nonEmptyResultsArb, (results) => {
        const aggregate = computeAggregate(results);
        const expectedPassRate =
          Math.round((aggregate.totalPass / aggregate.totalTests) * 1000) / 10;
        expect(aggregate.passRate).toBe(expectedPassRate);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests ─────────────────────────────────────────────────────────────

describe("Aggregate Utility Unit Tests", () => {
  // **Validates: Requirements 13.4**

  it("returns all zeros for an empty array", () => {
    const result = computeAggregate([]);
    expect(result).toEqual({
      totalTests: 0,
      totalPass: 0,
      totalFail: 0,
      passRate: 0,
    });
  });

  it("returns values matching a single result", () => {
    const single: NormalizedResult = {
      runnerType: "vitest",
      totalTests: 10,
      passCount: 8,
      failCount: 2,
      durationMs: 1500,
      allTests: [],
    };

    const result = computeAggregate([single]);
    expect(result.totalTests).toBe(10);
    expect(result.totalPass).toBe(8);
    expect(result.totalFail).toBe(2);
    expect(result.passRate).toBe(80);
  });

  it("sums correctly across multiple results", () => {
    const results: NormalizedResult[] = [
      {
        runnerType: "vitest",
        totalTests: 20,
        passCount: 18,
        failCount: 2,
        durationMs: 3000,
        allTests: [],
      },
      {
        runnerType: "jest",
        totalTests: 30,
        passCount: 25,
        failCount: 5,
        durationMs: 2000,
        allTests: [],
      },
      {
        runnerType: "playwright",
        totalTests: 10,
        passCount: 10,
        failCount: 0,
        durationMs: 5000,
        allTests: [],
      },
    ];

    const result = computeAggregate(results);
    expect(result.totalTests).toBe(60);
    expect(result.totalPass).toBe(53);
    expect(result.totalFail).toBe(7);
    // passRate = (53/60)*100 = 88.333... rounded to 1 decimal = 88.3
    expect(result.passRate).toBe(88.3);
  });
});
