import type { NormalizedResult } from "@/lib/reportParser";

export interface AggregateResult {
  totalTests: number;
  totalPass: number;
  totalFail: number;
  passRate: number;
}

/**
 * Compute aggregate statistics from an array of NormalizedResult objects.
 * Pure function — no side effects.
 *
 * Invariants:
 * - totalPass + totalFail === totalTests
 * - totalTests === sum(results.map(r => r.totalTests))
 */
export function computeAggregate(results: NormalizedResult[]): AggregateResult {
  if (results.length === 0) {
    return { totalTests: 0, totalPass: 0, totalFail: 0, passRate: 0 };
  }

  const totalPass = results.reduce((sum, r) => sum + r.passCount, 0);
  const totalFail = results.reduce((sum, r) => sum + r.failCount, 0);
  const totalTests = totalPass + totalFail;

  const passRate =
    totalTests > 0
      ? Math.round((totalPass / totalTests) * 1000) / 10
      : 0;

  return { totalTests, totalPass, totalFail, passRate };
}
