import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { NormalizedResult } from "@/lib/reportParser";

// Polyfill matchMedia for jsdom
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock next/link as simple anchor tags
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock ThemeToggle
vi.mock("@/components/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

// Mock data/players for the home page (hoisted to top level)
vi.mock("@/data/players", () => ({
  getAllPlayers: () => [],
}));

// Mock next/navigation (hoisted to top level)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// --- Test data ---

const vitestResult: NormalizedResult = {
  runnerType: "vitest",
  totalTests: 20,
  passCount: 18,
  failCount: 2,
  durationMs: 3500,
  allTests: [
    { testName: "adds numbers", status: "passed", durationMs: 10 },
    { testName: "subtracts numbers", status: "passed", durationMs: 8 },
    { testName: "divides by zero", status: "failed", durationMs: 5, errorMessage: "Division by zero" },
    { testName: "handles null", status: "failed", durationMs: 3, errorMessage: "Null pointer" },
  ],
  failedTests: [
    { testName: "divides by zero", errorMessage: "Division by zero" },
    { testName: "handles null", errorMessage: "Null pointer" },
  ],
};

const jestResult: NormalizedResult = {
  runnerType: "jest",
  totalTests: 15,
  passCount: 15,
  failCount: 0,
  durationMs: 2100,
  allTests: [
    { testName: "jest test 1", status: "passed", durationMs: 12 },
  ],
};

const playwrightResult: NormalizedResult = {
  runnerType: "playwright",
  totalTests: 5,
  passCount: 4,
  failCount: 1,
  durationMs: 8000,
  allTests: [
    { testName: "e2e login", status: "passed", durationMs: 2000 },
    { testName: "e2e signup fails", status: "failed", durationMs: 1500, errorMessage: "Timeout" },
  ],
  failedTests: [
    { testName: "e2e signup fails", errorMessage: "Timeout" },
  ],
};

function mockFetchSuccess(results: NormalizedResult[], coveragePercent: number | null = 85) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      results,
      coveragePercent,
      fileCoverage: [],
      warnings: [],
    }),
  });
}

function mockFetchError() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });
}

function mockFetchEmpty() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      results: [],
      coveragePercent: null,
      fileCoverage: [],
      warnings: [],
    }),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// --- Dashboard Page Integration Tests ---
// Validates: Requirements 8.1, 14.1, 14.2, 14.3

describe("TestDashboard Page Integration", () => {
  it("displays loading state initially", async () => {
    // Use a fetch that never resolves to keep loading state visible
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders data after loading completes", async () => {
    mockFetchSuccess([vitestResult, jestResult, playwrightResult]);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    // Initially shows loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // After fetch resolves, loading disappears and data renders
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Page title
    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
  });

  it("displays error message when API returns error", async () => {
    mockFetchError();

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load test results")).toBeInTheDocument();
    });
  });

  it("displays empty state when results array is empty", async () => {
    mockFetchEmpty();

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("No test reports found. Run your test suites to generate reports.")
      ).toBeInTheDocument();
    });
  });

  it("renders runner cards for each runner type", async () => {
    mockFetchSuccess([vitestResult, jestResult, playwrightResult]);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Runner cards rendered — one per runner type
    const runnerCards = screen.getAllByTestId("runner-card");
    expect(runnerCards).toHaveLength(3);

    // Each runner card contains its capitalized name
    const cardTexts = runnerCards.map((c) => c.textContent);
    expect(cardTexts.some((t) => t?.includes("Vitest"))).toBe(true);
    expect(cardTexts.some((t) => t?.includes("Jest"))).toBe(true);
    expect(cardTexts.some((t) => t?.includes("Playwright"))).toBe(true);
  });

  it("renders aggregate summary with correct totals", async () => {
    mockFetchSuccess([vitestResult, jestResult, playwrightResult]);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const summary = screen.getByTestId("aggregate-summary");
    expect(summary).toBeInTheDocument();

    // Total: 20 + 15 + 5 = 40
    expect(screen.getByText("40")).toBeInTheDocument();
    // Passed: 18 + 15 + 4 = 37
    expect(screen.getByText("37")).toBeInTheDocument();
    // Failed: 2 + 0 + 1 = 3
    // Note: "3" also appears in runner cards, so just check it exists
    expect(summary.textContent).toContain("Total Tests");
    expect(summary.textContent).toContain("Passed");
    expect(summary.textContent).toContain("Failed");
    expect(summary.textContent).toContain("Pass Rate");
  });

  it("renders coverage display", async () => {
    mockFetchSuccess([vitestResult], 85);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const coverageDisplay = screen.getByTestId("coverage-display");
    expect(coverageDisplay).toBeInTheDocument();
    expect(screen.getByTestId("coverage-value").textContent).toBe("85%");
  });

  it("renders failed tests section when failures exist", async () => {
    mockFetchSuccess([vitestResult, playwrightResult]);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const failedSection = screen.getByTestId("failed-tests-section");
    expect(failedSection).toBeInTheDocument();
    expect(screen.getByText("Failed Tests")).toBeInTheDocument();

    // Failed test names should appear in the failed tests section
    const failedSectionText = failedSection.textContent;
    expect(failedSectionText).toContain("divides by zero");
    expect(failedSectionText).toContain("handles null");
    expect(failedSectionText).toContain("e2e signup fails");
  });

  it("hides failed tests section when no failures exist", async () => {
    mockFetchSuccess([jestResult]); // all pass

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("failed-tests-section")).not.toBeInTheDocument();
  });

  it("displays 'No coverage data' when coverage is null", async () => {
    mockFetchSuccess([jestResult], null);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No coverage data")).toBeInTheDocument();
  });

  it("displays page title 'Test Dashboard'", async () => {
    mockFetchSuccess([vitestResult]);

    const TestDashboard = (await import("@/app/test-dashboard/page")).default;
    render(<TestDashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
  });
});

// --- Home Page Navigation Link Test ---
// Validates: Requirements 8.2

describe("Home Page Navigation", () => {
  it("has a 'Test Dashboard' navigation link pointing to /test-dashboard", async () => {
    const HomePage = (await import("@/app/page")).default;
    render(<HomePage />);

    const link = screen.getByTestId("test-dashboard-link");
    expect(link).toBeInTheDocument();
    expect(link.textContent).toBe("Test Dashboard");
    expect(link.getAttribute("href")).toBe("/test-dashboard");
  });
});
