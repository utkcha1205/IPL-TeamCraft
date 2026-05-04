import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RunnerCard from "@/components/RunnerCard";
import AggregateSummary from "@/components/AggregateSummary";
import CoverageDisplay from "@/components/CoverageDisplay";
import type { NormalizedResult } from "@/lib/reportParser";
import type { AggregateResult } from "@/lib/testDashboardUtils";

// --- RunnerCard Tests ---
// Validates: Requirements 9.2, 9.3

describe("RunnerCard", () => {
  const allPassResult: NormalizedResult = {
    runnerType: "vitest",
    totalTests: 10,
    passCount: 10,
    failCount: 0,
    durationMs: 2300,
    allTests: [],
  };

  const someFailResult: NormalizedResult = {
    runnerType: "jest",
    totalTests: 8,
    passCount: 5,
    failCount: 3,
    durationMs: 4560,
    allTests: [],
    failedTests: [
      { testName: "test1", errorMessage: "err1" },
      { testName: "test2", errorMessage: "err2" },
      { testName: "test3", errorMessage: "err3" },
    ],
  };

  it("renders runner name capitalized", () => {
    const { getByText } = render(<RunnerCard result={allPassResult} />);
    expect(getByText("Vitest")).toBeTruthy();
  });

  it("renders totalTests, passCount, and failCount", () => {
    const { getByText } = render(<RunnerCard result={someFailResult} />);
    expect(getByText("8")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  it("renders duration formatted as seconds with one decimal", () => {
    const { getByTestId } = render(<RunnerCard result={allPassResult} />);
    expect(getByTestId("duration").textContent).toBe("2.3s");
  });

  it("shows green indicator when all tests pass", () => {
    const { getByTestId } = render(<RunnerCard result={allPassResult} />);
    const indicator = getByTestId("status-indicator");
    expect(indicator.style.color).toBe("rgb(34, 197, 94)");
    expect(indicator.textContent).toBe("●");
  });

  it("shows red indicator with fail count when tests fail", () => {
    const { getByTestId } = render(<RunnerCard result={someFailResult} />);
    const indicator = getByTestId("status-indicator");
    expect(indicator.style.color).toBe("rgb(239, 68, 68)");
    expect(indicator.textContent).toContain("3 failed");
  });

  it("renders playwright runner name correctly", () => {
    const result: NormalizedResult = {
      runnerType: "playwright",
      totalTests: 5,
      passCount: 5,
      failCount: 0,
      durationMs: 1000,
      allTests: [],
    };
    const { getByText } = render(<RunnerCard result={result} />);
    expect(getByText("Playwright")).toBeTruthy();
  });
});

// --- AggregateSummary Tests ---
// Validates: Requirements 10.3

describe("AggregateSummary", () => {
  it("renders 'No test data available' when totalTests is 0", () => {
    const aggregate: AggregateResult = {
      totalTests: 0,
      totalPass: 0,
      totalFail: 0,
      passRate: 0,
    };
    const { getByTestId } = render(<AggregateSummary aggregate={aggregate} />);
    expect(getByTestId("aggregate-summary").textContent).toContain("No test data available");
  });

  it("renders totalTests, totalPass, totalFail, and passRate", () => {
    const aggregate: AggregateResult = {
      totalTests: 50,
      totalPass: 45,
      totalFail: 5,
      passRate: 90.0,
    };
    const { getByText } = render(<AggregateSummary aggregate={aggregate} />);
    expect(getByText("50")).toBeTruthy();
    expect(getByText("45")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
    expect(getByText("90.0%")).toBeTruthy();
  });

  it("renders stat labels", () => {
    const aggregate: AggregateResult = {
      totalTests: 10,
      totalPass: 8,
      totalFail: 2,
      passRate: 80.0,
    };
    const { getByText } = render(<AggregateSummary aggregate={aggregate} />);
    expect(getByText("Total Tests")).toBeTruthy();
    expect(getByText("Passed")).toBeTruthy();
    expect(getByText("Failed")).toBeTruthy();
    expect(getByText("Pass Rate")).toBeTruthy();
  });
});

// --- CoverageDisplay Tests ---
// Validates: Requirements 11.1, 11.5

describe("CoverageDisplay", () => {
  it("renders 'No coverage data' when coveragePercent is null", () => {
    const { getByTestId } = render(<CoverageDisplay coveragePercent={null} />);
    expect(getByTestId("coverage-display").textContent).toContain("No coverage data");
  });

  it("renders coverage percentage with % suffix", () => {
    const { getByTestId } = render(<CoverageDisplay coveragePercent={85} />);
    expect(getByTestId("coverage-value").textContent).toBe("85%");
  });

  it("uses green color for coverage >= 80", () => {
    const { getByTestId } = render(<CoverageDisplay coveragePercent={80} />);
    expect(getByTestId("coverage-value").style.color).toBe("rgb(34, 197, 94)");
  });

  it("uses yellow color for coverage between 50 and 79", () => {
    const { getByTestId } = render(<CoverageDisplay coveragePercent={65} />);
    expect(getByTestId("coverage-value").style.color).toBe("rgb(234, 179, 8)");
  });

  it("uses red color for coverage below 50", () => {
    const { getByTestId } = render(<CoverageDisplay coveragePercent={30} />);
    expect(getByTestId("coverage-value").style.color).toBe("rgb(239, 68, 68)");
  });

  it("renders 'Line Coverage' label when data is present", () => {
    const { getByText } = render(<CoverageDisplay coveragePercent={75} />);
    expect(getByText("Line Coverage")).toBeTruthy();
  });
});
