"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NormalizedResult, FileCoverage } from "@/lib/reportParser";
import type { AggregateResult } from "@/lib/testDashboardUtils";
import { computeAggregate } from "@/lib/testDashboardUtils";
import RunnerCard from "@/components/RunnerCard";
import AggregateSummary from "@/components/AggregateSummary";
import CoverageDisplay from "@/components/CoverageDisplay";
import ComponentFlowDiagram from "@/components/ComponentFlowDiagram";

type TestType = "unit" | "integration" | "e2e" | "property";

function inferTestType(runnerType: string, testName: string): TestType {
  if (runnerType === "playwright") return "e2e";
  const lower = testName.toLowerCase();
  if (/\bproperty\b|\barbitrary\b|\bfc\.|\bfast-check\b|\bpbt\b/.test(lower)) return "property";
  if (/\bintegration\b|\bpage\b|\bfull render\b/.test(lower)) return "integration";
  return "unit";
}

const typeColors: Record<TestType, string> = {
  unit: "#3b82f6",
  integration: "#a855f7",
  e2e: "#f59e0b",
  property: "#06b6d4",
};

interface TestReportsResponse {
  results: NormalizedResult[];
  coveragePercent: number | null;
  fileCoverage: FileCoverage[];
  warnings: string[];
}

export default function TestDashboard() {
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [coveragePercent, setCoveragePercent] = useState<number | null>(null);
  const [fileCoverage, setFileCoverage] = useState<FileCoverage[]>([]);
  const [aggregate, setAggregate] = useState<AggregateResult>({
    totalTests: 0,
    totalPass: 0,
    totalFail: 0,
    passRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterRunner, setFilterRunner] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"tests" | "coverage" | "flow">("tests");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/test-reports");
        if (!res.ok) throw new Error("API error");
        const data: TestReportsResponse = await res.json();
        setResults(data.results);
        setCoveragePercent(data.coveragePercent);
        setFileCoverage(data.fileCoverage ?? []);
        setAggregate(computeAggregate(data.results));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Collect all tests across runners with runner label and inferred type
  const allTestsList = results.flatMap((r) =>
    r.allTests.map((t) => ({
      ...t,
      runnerType: r.runnerType,
      testType: inferTestType(r.runnerType, t.testName),
    }))
  );

  // Apply filters
  const filteredTests = allTestsList.filter((t) => {
    if (filterRunner !== "all" && t.runnerType !== filterRunner) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterType !== "all" && t.testType !== filterType) return false;
    return true;
  });

  // Get unique runner types and test types for filters
  const runnerTypes = [...new Set(results.map((r) => r.runnerType))];
  const testTypes = [...new Set(allTestsList.map((t) => t.testType))];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      <header style={{ backgroundColor: "var(--bg-header)" }} className="shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Test Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <p style={{ color: "var(--text-muted)" }} className="text-center py-12">
            Loading...
          </p>
        )}

        {error && (
          <p style={{ color: "var(--text-muted)" }} className="text-center py-12">
            Failed to load test results
          </p>
        )}

        {!loading && !error && results.length === 0 && (
          <p style={{ color: "var(--text-muted)" }} className="text-center py-12">
            No test reports found. Run your test suites to generate reports.
          </p>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-6">
            <AggregateSummary aggregate={aggregate} coveragePercent={coveragePercent} />

            <CoverageDisplay coveragePercent={coveragePercent} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <RunnerCard key={result.runnerType} result={result} />
              ))}
            </div>

            {/* Failed Tests section — visible only when failures exist */}
            {results.some((r) => r.failCount > 0) && (
              <section data-testid="failed-tests-section">
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Failed Tests
                </h2>
                <div className="space-y-1">
                  {results
                    .filter((r) => r.failedTests && r.failedTests.length > 0)
                    .flatMap((r) =>
                      (r.failedTests ?? []).map((ft, i) => (
                        <div
                          key={`${r.runnerType}-${i}`}
                          className="rounded-lg border px-3 py-2 flex items-center gap-2"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            borderColor: "var(--border-color)",
                          }}
                        >
                          <span
                            style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, minWidth: "2.5rem" }}
                          >
                            FAIL
                          </span>
                          <span
                            className="text-xs font-medium uppercase px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--border-color)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {r.runnerType}
                          </span>
                          <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
                            {ft.testName}
                          </span>
                          <span
                            className="text-xs truncate max-w-xs"
                            style={{ color: "#ef4444" }}
                            title={ft.errorMessage}
                          >
                            {ft.errorMessage}
                          </span>
                        </div>
                      ))
                    )}
                </div>
              </section>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-color)" }}>
              {([
                { key: "tests", label: "All Tests" },
                { key: "coverage", label: "File Coverage" },
                { key: "flow", label: "Component Flow" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 text-sm font-medium rounded-t-lg"
                  style={{
                    backgroundColor: activeTab === tab.key ? "var(--bg-card)" : "transparent",
                    color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                    borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tests tab */}
            {activeTab === "tests" && allTestsList.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    All Tests ({filteredTests.length})
                  </h2>
                  <div className="flex gap-2">
                    <select
                      value={filterRunner}
                      onChange={(e) => setFilterRunner(e.target.value)}
                      className="rounded px-2 py-1 text-sm"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                      }}
                      aria-label="Filter by runner"
                    >
                      <option value="all">All Runners</option>
                      {runnerTypes.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt.charAt(0).toUpperCase() + rt.slice(1)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded px-2 py-1 text-sm"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                      }}
                      aria-label="Filter by status"
                    >
                      <option value="all">All Status</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded px-2 py-1 text-sm"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                      }}
                      aria-label="Filter by test type"
                    >
                      <option value="all">All Types</option>
                      {testTypes.map((tt) => (
                        <option key={tt} value={tt}>
                          {tt.charAt(0).toUpperCase() + tt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  {filteredTests.map((t, i) => (
                    <div
                      key={i}
                      className="rounded-lg border px-3 py-2 flex items-center gap-2"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          color: t.status === "passed" ? "#22c55e" : "#ef4444",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          minWidth: "2.5rem",
                        }}
                      >
                        {t.status === "passed" ? "PASS" : "FAIL"}
                      </span>
                      <span
                        className="text-xs font-medium uppercase px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--border-color)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {t.runnerType}
                      </span>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${typeColors[t.testType]}20`,
                          color: typeColors[t.testType],
                        }}
                      >
                        {t.testType}
                      </span>
                      <span
                        className="text-sm flex-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.testName}
                      </span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ color: "var(--text-muted)", minWidth: "3.5rem", textAlign: "right" }}
                      >
                        {t.durationMs < 1000
                          ? `${Math.round(t.durationMs)}ms`
                          : `${(t.durationMs / 1000).toFixed(1)}s`}
                      </span>
                      {t.errorMessage && (
                        <span
                          className="text-xs truncate max-w-xs"
                          style={{ color: "#ef4444" }}
                          title={t.errorMessage}
                        >
                          {t.errorMessage}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Coverage tab */}
            {activeTab === "coverage" && (
              <section>
                {fileCoverage.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }} className="text-center py-8">
                    No file coverage data available. Generate a coverage report to see per-file metrics.
                  </p>
                ) : (
                  <div
                    className="rounded-lg border overflow-x-auto"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          {["File", "Lines", "Statements", "Functions", "Branches"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileCoverage.map((fc) => {
                          const pctColor = (pct: number) =>
                            pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
                          return (
                            <tr
                              key={fc.filePath}
                              style={{ borderBottom: "1px solid var(--border-color)" }}
                            >
                              <td className="px-4 py-2 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                                {fc.filePath}
                              </td>
                              {([fc.lines, fc.statements, fc.functions, fc.branches] as const).map((m, i) => (
                                <td key={i} className="px-4 py-2 tabular-nums text-xs">
                                  <span style={{ color: pctColor(m.pct), fontWeight: 600 }}>
                                    {m.pct.toFixed(1)}%
                                  </span>
                                  <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                                    {m.covered}/{m.total}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Component Flow tab */}
            {activeTab === "flow" && (
              <section>
                <ComponentFlowDiagram />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
