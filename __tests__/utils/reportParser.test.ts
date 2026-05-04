import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  parseVitestReport,
  parsePlaywrightReport,
  parseJestReport,
  parseReport,
  serialize,
  deserialize,
  parseCoverage,
  type NormalizedResult,
} from "@/lib/reportParser";

// ─── Arbitraries (Generators) ───────────────────────────────────────────────

const runnerTypeArb = fc.constantFrom("vitest" as const, "playwright" as const, "jest" as const);

const failedTestArb = fc.record({
  testName: fc.string({ minLength: 1, maxLength: 50 }),
  errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
});

const normalizedResultArb = fc
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
  }));

const vitestReportArb = fc
  .record({
    passCount: fc.integer({ min: 0, max: 100 }),
    failCount: fc.integer({ min: 0, max: 100 }),
    durationMs: fc.integer({ min: 0, max: 60000 }),
  })
  .map(({ passCount, failCount, durationMs }) => ({
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

const playwrightReportArb = fc
  .record({
    passCount: fc.integer({ min: 0, max: 100 }),
    failCount: fc.integer({ min: 0, max: 100 }),
    durationMs: fc.integer({ min: 0, max: 60000 }),
  })
  .map(({ passCount, failCount, durationMs }) => ({
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

const jestReportArb = fc
  .record({
    passCount: fc.integer({ min: 0, max: 100 }),
    failCount: fc.integer({ min: 0, max: 100 }),
    durationMs: fc.integer({ min: 0, max: 60000 }),
  })
  .map(({ passCount, failCount, durationMs }) => ({
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

const coverageSummaryArb = fc
  .double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true })
  .map((pct) => ({
    total: {
      lines: {
        total: 500,
        covered: Math.round(pct * 5),
        skipped: 0,
        pct: Math.round(pct * 10) / 10,
      },
    },
  }));

// ─── Property Tests ─────────────────────────────────────────────────────────

describe("Report Parser Property Tests", () => {
  it("Feature: test-dashboard, Property 1: Count invariant", () => {
    // For any NormalizedResult produced by any parser function,
    // passCount + failCount === totalTests
    // **Validates: Requirements 1.3, 2.2, 3.2, 4.2**

    // Test via vitest parser
    fc.assert(
      fc.property(vitestReportArb, (report) => {
        const result = parseVitestReport(report);
        expect(result.passCount + result.failCount).toBe(result.totalTests);
      }),
      { numRuns: 100 }
    );

    // Test via playwright parser
    fc.assert(
      fc.property(playwrightReportArb, (report) => {
        const result = parsePlaywrightReport(report);
        expect(result.passCount + result.failCount).toBe(result.totalTests);
      }),
      { numRuns: 100 }
    );

    // Test via jest parser
    fc.assert(
      fc.property(jestReportArb, (report) => {
        const result = parseJestReport(report);
        expect(result.passCount + result.failCount).toBe(result.totalTests);
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 2: Vitest parsing correctness", () => {
    // For any valid vitest report with P passed and F failed, parsing produces
    // runnerType === "vitest", passCount === P, failCount === F, totalTests === P + F
    // **Validates: Requirements 2.1, 2.2, 2.3**

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (P, F) => {
          const report = {
            numTotalTests: P + F,
            numPassedTests: P,
            numFailedTests: F,
            startTime: 1700000000000,
            snapshot: {},
            testResults: [
              {
                name: "test.ts",
                assertionResults: [
                  ...Array.from({ length: P }, (_, i) => ({
                    fullName: `pass-${i}`,
                    status: "passed",
                    failureMessages: [],
                  })),
                  ...Array.from({ length: F }, (_, i) => ({
                    fullName: `fail-${i}`,
                    status: "failed",
                    failureMessages: ["error"],
                  })),
                ],
              },
            ],
            config: {},
            startTime_end: 1700000005000,
          };

          const result = parseVitestReport(report);
          expect(result.runnerType).toBe("vitest");
          expect(result.passCount).toBe(P);
          expect(result.failCount).toBe(F);
          expect(result.totalTests).toBe(P + F);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 3: Playwright parsing correctness", () => {
    // For any valid playwright report with P expected and F unexpected,
    // parsing produces runnerType === "playwright", passCount === P, failCount === F, totalTests === P + F
    // **Validates: Requirements 3.1, 3.2, 3.3**

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (P, F) => {
          const report = {
            stats: {
              startTime: "2024-01-01T00:00:00.000Z",
              duration: 5000,
              expected: P,
              unexpected: F,
              skipped: 0,
            },
            suites: [
              {
                title: "Suite",
                suites: [],
                specs: [
                  ...Array.from({ length: P }, (_, i) => ({
                    title: `pass-${i}`,
                    tests: [{ status: "expected", results: [{}] }],
                  })),
                  ...Array.from({ length: F }, (_, i) => ({
                    title: `fail-${i}`,
                    tests: [{ status: "unexpected", results: [{ error: { message: "err" } }] }],
                  })),
                ],
              },
            ],
          };

          const result = parsePlaywrightReport(report);
          expect(result.runnerType).toBe("playwright");
          expect(result.passCount).toBe(P);
          expect(result.failCount).toBe(F);
          expect(result.totalTests).toBe(P + F);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 4: Jest parsing correctness", () => {
    // For any valid jest report with P passed and F failed, parsing produces
    // runnerType === "jest", passCount === P, failCount === F, totalTests === P + F
    // **Validates: Requirements 4.1, 4.2, 4.3**

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (P, F) => {
          const report = {
            numTotalTests: P + F,
            numPassedTests: P,
            numFailedTests: F,
            startTime: 1700000000000,
            testResults: [
              {
                name: "test.ts",
                assertionResults: [
                  ...Array.from({ length: P }, (_, i) => ({
                    fullName: `pass-${i}`,
                    status: "passed",
                    failureMessages: [],
                  })),
                  ...Array.from({ length: F }, (_, i) => ({
                    fullName: `fail-${i}`,
                    status: "failed",
                    failureMessages: ["error"],
                  })),
                ],
              },
            ],
          };

          const result = parseJestReport(report);
          expect(result.runnerType).toBe("jest");
          expect(result.passCount).toBe(P);
          expect(result.failCount).toBe(F);
          expect(result.totalTests).toBe(P + F);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 5: Malformed input error handling", () => {
    // For any JSON missing required structural markers, parseReport throws a descriptive error
    // **Validates: Requirements 2.4, 3.4, 4.4**

    const malformedInputArb = fc.oneof(
      // Random objects without runner-specific markers
      fc.record({
        randomKey: fc.string(),
        anotherKey: fc.integer(),
      }),
      // Primitives
      fc.constant(42),
      fc.constant("not a report"),
      fc.constant(true),
      // Null
      fc.constant(null),
      // Arrays
      fc.array(fc.integer()),
      // Objects with some but not all required fields
      fc.record({
        testResults: fc.constant("not an array"),
      }),
      fc.record({
        suites: fc.constant("not an array"),
      })
    );

    fc.assert(
      fc.property(malformedInputArb, (input) => {
        expect(() => parseReport(input)).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 6: Serialization round-trip", () => {
    // For any valid NormalizedResult, deserialize(serialize(result)) deeply equals the original
    // **Validates: Requirements 5.3**

    // We need to generate NormalizedResult objects that include allTests (as the actual type requires it)
    const roundTripResultArb = fc
      .record({
        runnerType: runnerTypeArb,
        passCount: fc.integer({ min: 0, max: 500 }),
        failCount: fc.integer({ min: 0, max: 500 }),
        durationMs: fc.integer({ min: 0, max: 600000 }),
        failedTests: fc.option(fc.array(failedTestArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
      })
      .map(({ runnerType, passCount, failCount, durationMs, failedTests }) => {
        const result: NormalizedResult = {
          runnerType,
          passCount,
          failCount,
          totalTests: passCount + failCount,
          durationMs,
          allTests: [],
        };
        if (failedTests !== undefined) {
          result.failedTests = failedTests;
        }
        return result;
      });

    fc.assert(
      fc.property(roundTripResultArb, (result) => {
        const roundTripped = deserialize(serialize(result));
        expect(roundTripped).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 7: Coverage extraction and range", () => {
    // For any valid coverage summary, parseCoverage returns a number between 0 and 100
    // **Validates: Requirements 6.1, 6.2**

    fc.assert(
      fc.property(coverageSummaryArb, (summary) => {
        const result = parseCoverage(summary);
        expect(result).not.toBeNull();
        expect(typeof result).toBe("number");
        expect(result!).toBeGreaterThanOrEqual(0);
        expect(result!).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it("Feature: test-dashboard, Property 8: Coverage graceful failure", () => {
    // For any malformed coverage input, parseCoverage returns null without throwing
    // **Validates: Requirements 6.3**

    const malformedCoverageArb = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(42),
      fc.constant("not json"),
      fc.constant(true),
      fc.array(fc.integer()),
      // Object missing total
      fc.record({ something: fc.string() }),
      // Object with total but missing lines
      fc.constant({ total: { notLines: {} } }),
      // Object with total.lines but missing pct
      fc.constant({ total: { lines: { total: 100, covered: 50 } } }),
      // Object with total.lines.pct as non-number
      fc.constant({ total: { lines: { pct: "not a number" } } }),
      // Object with total.lines.pct as NaN
      fc.constant({ total: { lines: { pct: NaN } } }),
      // Object with total.lines.pct out of range
      fc.constant({ total: { lines: { pct: -5 } } }),
      fc.constant({ total: { lines: { pct: 150 } } })
    );

    fc.assert(
      fc.property(malformedCoverageArb, (input) => {
        // Should not throw
        const result = parseCoverage(input);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Unit / Edge-Case Tests ─────────────────────────────────────────────────

describe("Report Parser Unit / Edge-Case Tests", () => {
  // ── Vitest edge cases ───────────────────────────────────────────────────

  describe("parseVitestReport edge cases", () => {
    it("handles empty assertionResults array", () => {
      const report = {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        startTime: 1700000000000,
        snapshot: {},
        testResults: [{ name: "empty.ts", assertionResults: [] }],
        config: {},
        startTime_end: 1700000000000,
      };
      const result = parseVitestReport(report);
      expect(result.runnerType).toBe("vitest");
      expect(result.totalTests).toBe(0);
      expect(result.passCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.durationMs).toBe(0);
      expect(result.failedTests).toBeUndefined();
    });

    it("handles empty testResults array", () => {
      const report = {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        startTime: 1700000000000,
        snapshot: {},
        testResults: [],
        config: {},
        startTime_end: 1700000005000,
      };
      const result = parseVitestReport(report);
      expect(result.totalTests).toBe(0);
      expect(result.passCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.durationMs).toBe(5000);
    });

    it("handles zero duration (startTime equals startTime_end)", () => {
      const report = {
        numTotalTests: 1,
        numPassedTests: 1,
        numFailedTests: 0,
        startTime: 1700000000000,
        snapshot: {},
        testResults: [
          {
            name: "test.ts",
            assertionResults: [
              { fullName: "fast test", status: "passed", failureMessages: [] },
            ],
          },
        ],
        config: {},
        startTime_end: 1700000000000,
      };
      const result = parseVitestReport(report);
      expect(result.durationMs).toBe(0);
      expect(result.passCount).toBe(1);
    });

    it("handles missing timing fields gracefully (durationMs defaults to 0)", () => {
      const report = {
        testResults: [
          {
            name: "test.ts",
            assertionResults: [
              { fullName: "t1", status: "passed", failureMessages: [] },
            ],
          },
        ],
      };
      const result = parseVitestReport(report);
      expect(result.durationMs).toBe(0);
      expect(result.passCount).toBe(1);
    });

    it("omits failedTests when all tests pass", () => {
      const report = {
        testResults: [
          {
            name: "test.ts",
            assertionResults: [
              { fullName: "t1", status: "passed", failureMessages: [] },
              { fullName: "t2", status: "passed", failureMessages: [] },
            ],
          },
        ],
        startTime: 1700000000000,
        startTime_end: 1700000001000,
      };
      const result = parseVitestReport(report);
      expect(result.failedTests).toBeUndefined();
    });
  });

  // ── Playwright edge cases ───────────────────────────────────────────────

  describe("parsePlaywrightReport edge cases", () => {
    it("handles empty specs array", () => {
      const report = {
        stats: { startTime: "2024-01-01T00:00:00.000Z", duration: 0, expected: 0, unexpected: 0, skipped: 0 },
        suites: [{ title: "Empty Suite", suites: [], specs: [] }],
      };
      const result = parsePlaywrightReport(report);
      expect(result.runnerType).toBe("playwright");
      expect(result.totalTests).toBe(0);
      expect(result.passCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.durationMs).toBe(0);
      expect(result.failedTests).toBeUndefined();
    });

    it("handles empty suites array", () => {
      const report = {
        stats: { startTime: "2024-01-01T00:00:00.000Z", duration: 500, expected: 0, unexpected: 0, skipped: 0 },
        suites: [],
      };
      const result = parsePlaywrightReport(report);
      expect(result.totalTests).toBe(0);
      expect(result.durationMs).toBe(500);
    });

    it("handles zero duration", () => {
      const report = {
        stats: { startTime: "2024-01-01T00:00:00.000Z", duration: 0, expected: 1, unexpected: 0, skipped: 0 },
        suites: [
          {
            title: "Suite",
            suites: [],
            specs: [{ title: "fast", tests: [{ status: "expected", results: [{}] }] }],
          },
        ],
      };
      const result = parsePlaywrightReport(report);
      expect(result.durationMs).toBe(0);
      expect(result.passCount).toBe(1);
    });

    it("handles missing duration in stats (defaults to 0)", () => {
      const report = {
        stats: { startTime: "2024-01-01T00:00:00.000Z", expected: 0, unexpected: 0, skipped: 0 },
        suites: [],
      };
      const result = parsePlaywrightReport(report);
      expect(result.durationMs).toBe(0);
    });
  });

  // ── Jest edge cases ─────────────────────────────────────────────────────

  describe("parseJestReport edge cases", () => {
    it("handles empty testResults array (no assertion details)", () => {
      const report = {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        startTime: 1700000000000,
        testResults: [],
      };
      const result = parseJestReport(report);
      expect(result.runnerType).toBe("jest");
      expect(result.totalTests).toBe(0);
      expect(result.passCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.failedTests).toBeUndefined();
    });

    it("handles zero duration", () => {
      const report = {
        numTotalTests: 1,
        numPassedTests: 1,
        numFailedTests: 0,
        startTime: 1700000000000,
        endTime: 1700000000000,
        testResults: [],
      };
      const result = parseJestReport(report);
      expect(result.durationMs).toBe(0);
    });

    it("handles missing timing fields (durationMs defaults to 0)", () => {
      const report = {
        numTotalTests: 2,
        numPassedTests: 2,
        numFailedTests: 0,
        testResults: [],
      };
      const result = parseJestReport(report);
      expect(result.durationMs).toBe(0);
    });

    it("handles missing testResults field (no assertion details)", () => {
      const report = {
        numTotalTests: 3,
        numPassedTests: 2,
        numFailedTests: 1,
      };
      const result = parseJestReport(report);
      expect(result.passCount).toBe(2);
      expect(result.failCount).toBe(1);
      expect(result.totalTests).toBe(3);
      // No assertion-level details available, so failedTests won't be populated
      expect(result.failedTests).toBeUndefined();
    });
  });

  // ── Error handling: malformed JSON and unknown formats ──────────────────

  describe("parseReport error handling", () => {
    it("throws for null input", () => {
      expect(() => parseReport(null)).toThrow();
    });

    it("throws for undefined input", () => {
      expect(() => parseReport(undefined)).toThrow();
    });

    it("throws for a plain string", () => {
      expect(() => parseReport("not a report")).toThrow();
    });

    it("throws for a number", () => {
      expect(() => parseReport(42)).toThrow();
    });

    it("throws for an empty object (unknown format)", () => {
      expect(() => parseReport({})).toThrow(/unrecognized report format/i);
    });

    it("throws for an object with unrelated keys", () => {
      expect(() => parseReport({ foo: "bar", baz: 123 })).toThrow(/unrecognized report format/i);
    });

    it("throws for an array", () => {
      expect(() => parseReport([1, 2, 3])).toThrow();
    });
  });

  describe("parseVitestReport error handling", () => {
    it("throws for non-object input", () => {
      expect(() => parseVitestReport("bad")).toThrow(/invalid vitest report/i);
    });

    it("throws when testResults is missing", () => {
      expect(() => parseVitestReport({ snapshot: {} })).toThrow(/missing testResults/i);
    });
  });

  describe("parsePlaywrightReport error handling", () => {
    it("throws for non-object input", () => {
      expect(() => parsePlaywrightReport(null)).toThrow(/invalid playwright report/i);
    });

    it("throws when suites is missing", () => {
      expect(() => parsePlaywrightReport({ stats: {} })).toThrow(/missing suites/i);
    });

    it("throws when stats is missing", () => {
      expect(() => parsePlaywrightReport({ suites: [] })).toThrow(/missing stats/i);
    });
  });

  describe("parseJestReport error handling", () => {
    it("throws for non-object input", () => {
      expect(() => parseJestReport(123)).toThrow(/invalid jest report/i);
    });

    it("throws when numPassedTests is missing", () => {
      expect(() => parseJestReport({ numFailedTests: 0 })).toThrow(/missing numPassedTests/i);
    });

    it("throws when numFailedTests is missing", () => {
      expect(() => parseJestReport({ numPassedTests: 0 })).toThrow(/missing numPassedTests or numFailedTests/i);
    });
  });

  // ── Coverage parsing edge cases ─────────────────────────────────────────

  describe("parseCoverage edge cases", () => {
    it("returns correct value for a valid coverage summary", () => {
      const summary = { total: { lines: { total: 200, covered: 160, skipped: 0, pct: 80 } } };
      expect(parseCoverage(summary)).toBe(80);
    });

    it("returns 0 for 0% coverage", () => {
      const summary = { total: { lines: { total: 100, covered: 0, skipped: 0, pct: 0 } } };
      expect(parseCoverage(summary)).toBe(0);
    });

    it("returns 100 for 100% coverage", () => {
      const summary = { total: { lines: { total: 100, covered: 100, skipped: 0, pct: 100 } } };
      expect(parseCoverage(summary)).toBe(100);
    });

    it("returns null for null input", () => {
      expect(parseCoverage(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(parseCoverage(undefined)).toBeNull();
    });

    it("returns null for a string input", () => {
      expect(parseCoverage("bad")).toBeNull();
    });

    it("returns null when total is missing", () => {
      expect(parseCoverage({})).toBeNull();
    });

    it("returns null when total.lines is missing", () => {
      expect(parseCoverage({ total: {} })).toBeNull();
    });

    it("returns null when total.lines.pct is missing", () => {
      expect(parseCoverage({ total: { lines: { total: 100, covered: 50 } } })).toBeNull();
    });

    it("returns null when pct is NaN", () => {
      expect(parseCoverage({ total: { lines: { pct: NaN } } })).toBeNull();
    });

    it("returns null when pct is a string", () => {
      expect(parseCoverage({ total: { lines: { pct: "eighty" } } })).toBeNull();
    });

    it("returns null when pct is negative", () => {
      expect(parseCoverage({ total: { lines: { pct: -1 } } })).toBeNull();
    });

    it("returns null when pct exceeds 100", () => {
      expect(parseCoverage({ total: { lines: { pct: 101 } } })).toBeNull();
    });
  });
});
