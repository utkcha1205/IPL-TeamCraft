// Types

export type RunnerType = "vitest" | "playwright" | "jest";

export interface FailedTest {
  testName: string;
  errorMessage: string;
}

export type TestStatus = "passed" | "failed";

export interface TestCase {
  testName: string;
  status: TestStatus;
  durationMs: number;
  errorMessage?: string;
}

export interface NormalizedResult {
  runnerType: RunnerType;
  totalTests: number;
  passCount: number;
  failCount: number;
  durationMs: number;
  failedTests?: FailedTest[];
  allTests: TestCase[];
}

// Helper type guards

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Detect runner type from JSON structure.
 * - vitest: has `testResults` with `assertionResults` AND has `snapshot` field
 * - playwright: has `suites` array + `stats.expected`
 * - jest: has `numPassedTests`/`numFailedTests` without `snapshot`
 */
export function detectRunnerType(json: unknown): RunnerType | null {
  if (!isRecord(json)) return null;

  // Check for playwright: has `suites` array and `stats` with `expected`
  if (isArray(json.suites) && isRecord(json.stats) && "expected" in json.stats) {
    return "playwright";
  }

  // Check for vitest vs jest: both have testResults with assertionResults
  const hasTestResults =
    isArray(json.testResults) &&
    json.testResults.length > 0 &&
    isRecord(json.testResults[0]) &&
    isArray((json.testResults[0] as Record<string, unknown>).assertionResults);

  if (hasTestResults && "snapshot" in json) {
    return "vitest";
  }

  if (
    typeof json.numPassedTests === "number" &&
    typeof json.numFailedTests === "number" &&
    !("snapshot" in json)
  ) {
    return "jest";
  }

  return null;
}

/**
 * Parse a vitest JSON report into a NormalizedResult.
 * Extracts pass/fail from testResults[].assertionResults,
 * duration from timing fields, and failed test details.
 */
export function parseVitestReport(json: unknown): NormalizedResult {
  if (!isRecord(json)) {
    throw new Error("Invalid vitest report: expected an object");
  }

  if (!isArray(json.testResults)) {
    throw new Error("Invalid vitest report: missing testResults array");
  }

  let passCount = 0;
  let failCount = 0;
  const failedTests: FailedTest[] = [];
  const allTests: TestCase[] = [];

  for (const suite of json.testResults) {
    if (!isRecord(suite) || !isArray(suite.assertionResults)) continue;

    for (const assertion of suite.assertionResults) {
      if (!isRecord(assertion)) continue;
      const name = String(assertion.fullName ?? "unknown");
      const testDuration = typeof assertion.duration === "number" ? assertion.duration : 0;

      if (assertion.status === "passed") {
        passCount++;
        allTests.push({ testName: name, status: "passed", durationMs: testDuration });
      } else if (assertion.status === "failed") {
        failCount++;
        const messages = isArray(assertion.failureMessages)
          ? assertion.failureMessages
          : [];
        const errorMessage = String(messages[0] ?? "Unknown error");
        failedTests.push({ testName: name, errorMessage });
        allTests.push({ testName: name, status: "failed", durationMs: testDuration, errorMessage });
      }
    }
  }

  const totalTests = passCount + failCount;

  // Duration: try startTime + (startTime_end - startTime), or fallback to 0
  let durationMs = 0;
  if (typeof json.startTime === "number" && typeof json.startTime_end === "number") {
    durationMs = json.startTime_end - json.startTime;
  }

  return {
    runnerType: "vitest",
    totalTests,
    passCount,
    failCount,
    durationMs,
    allTests,
    ...(failedTests.length > 0 ? { failedTests } : {}),
  };
}

/**
 * Parse a playwright JSON report into a NormalizedResult.
 * Recursively traverses suites to count expected/unexpected specs.
 */
export function parsePlaywrightReport(json: unknown): NormalizedResult {
  if (!isRecord(json)) {
    throw new Error("Invalid playwright report: expected an object");
  }

  if (!isArray(json.suites)) {
    throw new Error("Invalid playwright report: missing suites array");
  }

  if (!isRecord(json.stats)) {
    throw new Error("Invalid playwright report: missing stats object");
  }

  let passCount = 0;
  let failCount = 0;
  const failedTests: FailedTest[] = [];
  const allTests: TestCase[] = [];

  function traverseSuites(suites: unknown[]): void {
    for (const suite of suites) {
      if (!isRecord(suite)) continue;

      // Process specs in this suite
      if (isArray(suite.specs)) {
        for (const spec of suite.specs) {
          if (!isRecord(spec) || !isArray(spec.tests)) continue;

          for (const test of spec.tests) {
            if (!isRecord(test)) continue;
            const name = String(spec.title ?? "unknown");
            let testDuration = 0;
            if (isArray(test.results) && test.results.length > 0) {
              const firstResult = test.results[0];
              if (isRecord(firstResult) && typeof firstResult.duration === "number") {
                testDuration = firstResult.duration;
              }
            }

            if (test.status === "expected") {
              passCount++;
              allTests.push({ testName: name, status: "passed", durationMs: testDuration });
            } else if (test.status === "unexpected") {
              failCount++;
              let errorMessage = "Unknown error";
              if (isArray(test.results) && test.results.length > 0) {
                const firstResult = test.results[0];
                if (
                  isRecord(firstResult) &&
                  isRecord(firstResult.error) &&
                  typeof firstResult.error.message === "string"
                ) {
                  errorMessage = firstResult.error.message;
                }
              }
              failedTests.push({ testName: name, errorMessage });
              allTests.push({ testName: name, status: "failed", durationMs: testDuration, errorMessage });
            }
          }
        }
      }

      // Recurse into nested suites
      if (isArray(suite.suites)) {
        traverseSuites(suite.suites);
      }
    }
  }

  traverseSuites(json.suites);

  const totalTests = passCount + failCount;
  const durationMs =
    typeof json.stats.duration === "number" ? json.stats.duration : 0;

  return {
    runnerType: "playwright",
    totalTests,
    passCount,
    failCount,
    durationMs,
    allTests,
    ...(failedTests.length > 0 ? { failedTests } : {}),
  };
}

/**
 * Parse a jest JSON report into a NormalizedResult.
 * Maps numPassedTests/numFailedTests directly, extracts duration and failed test details.
 */
export function parseJestReport(json: unknown): NormalizedResult {
  if (!isRecord(json)) {
    throw new Error("Invalid jest report: expected an object");
  }

  if (
    typeof json.numPassedTests !== "number" ||
    typeof json.numFailedTests !== "number"
  ) {
    throw new Error(
      "Invalid jest report: missing numPassedTests or numFailedTests"
    );
  }

  const passCount = json.numPassedTests;
  const failCount = json.numFailedTests;
  const totalTests = passCount + failCount;

  // Duration: try startTime to endTime, or fallback to 0
  let durationMs = 0;
  if (typeof json.startTime === "number") {
    if (typeof json.endTime === "number") {
      durationMs = json.endTime - json.startTime;
    } else if (typeof json.duration === "number") {
      durationMs = json.duration;
    }
  }

  const failedTests: FailedTest[] = [];
  const allTests: TestCase[] = [];
  if (isArray(json.testResults)) {
    for (const suite of json.testResults) {
      if (!isRecord(suite) || !isArray(suite.assertionResults)) continue;

      for (const assertion of suite.assertionResults) {
        if (!isRecord(assertion)) continue;
        const name = String(assertion.fullName ?? "unknown");
        const testDuration = typeof assertion.duration === "number" ? assertion.duration : 0;

        if (assertion.status === "failed") {
          const messages = isArray(assertion.failureMessages)
            ? assertion.failureMessages
            : [];
          const errorMessage = String(messages[0] ?? "Unknown error");
          failedTests.push({ testName: name, errorMessage });
          allTests.push({ testName: name, status: "failed", durationMs: testDuration, errorMessage });
        } else if (assertion.status === "passed") {
          allTests.push({ testName: name, status: "passed", durationMs: testDuration });
        }
      }
    }
  }

  return {
    runnerType: "jest",
    totalTests,
    passCount,
    failCount,
    durationMs,
    allTests,
    ...(failedTests.length > 0 ? { failedTests } : {}),
  };
}

/**
 * Parse any supported report by auto-detecting the runner type.
 * Throws a descriptive error for unsupported formats.
 */
export function parseReport(json: unknown): NormalizedResult {
  const runnerType = detectRunnerType(json);

  switch (runnerType) {
    case "vitest":
      return parseVitestReport(json);
    case "playwright":
      return parsePlaywrightReport(json);
    case "jest":
      return parseJestReport(json);
    default:
      throw new Error(
        "Unsupported or unrecognized report format: could not detect runner type from JSON structure"
      );
  }
}

/**
 * Serialize a NormalizedResult to a JSON string.
 */
export function serialize(result: NormalizedResult): string {
  return JSON.stringify(result);
}

/**
 * Deserialize a JSON string back to a NormalizedResult.
 */
export function deserialize(json: string): NormalizedResult {
  return JSON.parse(json) as NormalizedResult;
}

export interface FileCoverage {
  filePath: string;
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

/**
 * Parse coverage-summary.json and return line coverage percent (0–100).
 * Returns null for malformed or missing input without throwing.
 */
export function parseCoverage(json: unknown): number | null {
  try {
    if (!isRecord(json)) return null;
    if (!isRecord(json.total)) return null;
    if (!isRecord(json.total.lines)) return null;

    const pct = json.total.lines.pct;
    if (typeof pct !== "number" || isNaN(pct)) return null;
    if (pct < 0 || pct > 100) return null;

    return pct;
  } catch {
    return null;
  }
}

/**
 * Parse coverage-summary.json and return per-file coverage entries.
 * Skips the "total" key and any malformed entries.
 */
export function parseFileCoverage(json: unknown): FileCoverage[] {
  if (!isRecord(json)) return [];

  const files: FileCoverage[] = [];
  for (const [key, value] of Object.entries(json)) {
    if (key === "total") continue;
    if (!isRecord(value)) continue;

    const lines = isRecord(value.lines) ? value.lines : null;
    const statements = isRecord(value.statements) ? value.statements : null;
    const functions = isRecord(value.functions) ? value.functions : null;
    const branches = isRecord(value.branches) ? value.branches : null;

    if (!lines || !statements || !functions || !branches) continue;

    files.push({
      filePath: key,
      lines: { total: Number(lines.total) || 0, covered: Number(lines.covered) || 0, pct: Number(lines.pct) || 0 },
      statements: { total: Number(statements.total) || 0, covered: Number(statements.covered) || 0, pct: Number(statements.pct) || 0 },
      functions: { total: Number(functions.total) || 0, covered: Number(functions.covered) || 0, pct: Number(functions.pct) || 0 },
      branches: { total: Number(branches.total) || 0, covered: Number(branches.covered) || 0, pct: Number(branches.pct) || 0 },
    });
  }

  return files;
}
