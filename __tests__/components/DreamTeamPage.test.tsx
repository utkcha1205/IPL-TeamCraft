import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Player } from "@/data/types";

// Polyfill matchMedia for jsdom (ThemeToggle uses it)
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

// Mock next/link as a simple anchor tag
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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// --- Controlled test data ---

function makePlayer(overrides: Partial<Player> & { id: string; name: string; team: string; primaryRole: Player["primaryRole"] }): Player {
  return {
    nationality: "Indian",
    seasons: [],
    ...overrides,
  };
}

const seasonData = (year: string, team: string) => ({
  year,
  team,
  batting: {
    matches: 14,
    innings: 14,
    runs: 400,
    average: 35.0,
    strikeRate: 130.0,
    fifties: 3,
    hundreds: 1,
    highestScore: 95,
  },
  bowling: {
    matches: 14,
    innings: 14,
    wickets: 15,
    economy: 7.5,
    average: 25.0,
    bestFigures: "3/20",
    fourWickets: 1,
    fiveWickets: 0,
  },
});

const TEAM_ALPHA = "Team Alpha";
const TEAM_BETA = "Team Beta";

const testPlayers: Player[] = [
  // Team Alpha: 2 WKs, 4 Batters, 4 Bowlers, 2 All-Rounders
  makePlayer({ id: "a-wk1", name: "Alpha WK One", team: TEAM_ALPHA, primaryRole: "Batter", secondaryRole: "Wicket-Keeper", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-wk2", name: "Alpha WK Two", team: TEAM_ALPHA, primaryRole: "Batter", secondaryRole: "Wicket-Keeper", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bat1", name: "Alpha Bat One", team: TEAM_ALPHA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bat2", name: "Alpha Bat Two", team: TEAM_ALPHA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bat3", name: "Alpha Bat Three", team: TEAM_ALPHA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bat4", name: "Alpha Bat Four", team: TEAM_ALPHA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bowl1", name: "Alpha Bowl One", team: TEAM_ALPHA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bowl2", name: "Alpha Bowl Two", team: TEAM_ALPHA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bowl3", name: "Alpha Bowl Three", team: TEAM_ALPHA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-bowl4", name: "Alpha Bowl Four", team: TEAM_ALPHA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-ar1", name: "Alpha AR One", team: TEAM_ALPHA, primaryRole: "Batter", secondaryRole: "All-Rounder", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),
  makePlayer({ id: "a-ar2", name: "Alpha AR Two", team: TEAM_ALPHA, primaryRole: "Batter", secondaryRole: "All-Rounder", seasons: [seasonData("2023", TEAM_ALPHA), seasonData("2024", TEAM_ALPHA)] }),

  // Team Beta: 2 WKs, 4 Batters, 4 Bowlers, 2 All-Rounders
  makePlayer({ id: "b-wk1", name: "Beta WK One", team: TEAM_BETA, primaryRole: "Batter", secondaryRole: "Wicket-Keeper", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-wk2", name: "Beta WK Two", team: TEAM_BETA, primaryRole: "Batter", secondaryRole: "Wicket-Keeper", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bat1", name: "Beta Bat One", team: TEAM_BETA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bat2", name: "Beta Bat Two", team: TEAM_BETA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bat3", name: "Beta Bat Three", team: TEAM_BETA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bat4", name: "Beta Bat Four", team: TEAM_BETA, primaryRole: "Batter", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bowl1", name: "Beta Bowl One", team: TEAM_BETA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bowl2", name: "Beta Bowl Two", team: TEAM_BETA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bowl3", name: "Beta Bowl Three", team: TEAM_BETA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-bowl4", name: "Beta Bowl Four", team: TEAM_BETA, primaryRole: "Bowler", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-ar1", name: "Beta AR One", team: TEAM_BETA, primaryRole: "Batter", secondaryRole: "All-Rounder", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
  makePlayer({ id: "b-ar2", name: "Beta AR Two", team: TEAM_BETA, primaryRole: "Batter", secondaryRole: "All-Rounder", seasons: [seasonData("2023", TEAM_BETA), seasonData("2024", TEAM_BETA)] }),
];

// Mock getAllPlayers to return controlled test data
vi.mock("@/data/players", () => ({
  getAllPlayers: () => testPlayers,
}));

beforeEach(() => {
  cleanup();
});

describe("DreamTeamPage", () => {
  it("renders team pickers and generate button", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    expect(screen.getByLabelText("Select Team A")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Team B")).toBeInTheDocument();
    expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    expect(screen.getByTestId("generate-btn")).toHaveTextContent("Generate Dream XI");
  });

  it("generate button is disabled when no teams selected", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    const btn = screen.getByTestId("generate-btn");
    expect(btn).toBeDisabled();
  });

  it("generate button is disabled when same team selected", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    const teamASelect = screen.getByLabelText("Select Team A");
    const teamBSelect = screen.getByLabelText("Select Team B");

    fireEvent.change(teamASelect, { target: { value: TEAM_ALPHA } });
    fireEvent.change(teamBSelect, { target: { value: TEAM_ALPHA } });

    const btn = screen.getByTestId("generate-btn");
    expect(btn).toBeDisabled();
  });

  it("generate button is enabled when two different teams selected", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    const teamASelect = screen.getByLabelText("Select Team A");
    const teamBSelect = screen.getByLabelText("Select Team B");

    fireEvent.change(teamASelect, { target: { value: TEAM_ALPHA } });
    fireEvent.change(teamBSelect, { target: { value: TEAM_BETA } });

    const btn = screen.getByTestId("generate-btn");
    expect(btn).not.toBeDisabled();
  });

  it("generates Dream XI and displays player cards grouped by role", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    // Select two different teams
    const teamASelect = screen.getByLabelText("Select Team A");
    const teamBSelect = screen.getByLabelText("Select Team B");
    fireEvent.change(teamASelect, { target: { value: TEAM_ALPHA } });
    fireEvent.change(teamBSelect, { target: { value: TEAM_BETA } });

    // Click generate
    const btn = screen.getByTestId("generate-btn");
    fireEvent.click(btn);

    // Verify results section appears
    expect(screen.getByTestId("dream-xi-results")).toBeInTheDocument();

    // Verify team summary is shown
    expect(screen.getByTestId("team-summary")).toBeInTheDocument();

    // Verify player cards are rendered (Dream XI has 11 players)
    const playerNames = screen.getAllByTestId("player-name");
    expect(playerNames.length).toBe(11);

    // Verify role group headings are present
    expect(screen.getByText("Wicket-Keepers")).toBeInTheDocument();
    expect(screen.getByText("Batters")).toBeInTheDocument();
    expect(screen.getByText("Bowlers")).toBeInTheDocument();
  });

  it("season filter dropdown is present with All Seasons default", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    const seasonFilter = screen.getByTestId("season-filter");
    expect(seasonFilter).toBeInTheDocument();

    // Default value should be "" which shows "All Seasons"
    expect(seasonFilter).toHaveValue("");

    // Should have season options
    const options = Array.from(seasonFilter.querySelectorAll("option"));
    expect(options[0]).toHaveTextContent("All Seasons");
    expect(options.length).toBeGreaterThan(1);
  });

  it("breadcrumb navigation to dashboard exists", async () => {
    const DreamTeamPage = (await import("@/app/dream-team/page")).default;
    render(<DreamTeamPage />);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toBeInTheDocument();

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink.getAttribute("href")).toBe("/");
  });
});

describe("Dashboard navigation", () => {
  it("has a Dream Team link pointing to /dream-team", async () => {
    const Dashboard = (await import("@/app/page")).default;
    render(<Dashboard />);

    const dreamTeamLink = screen.getByTestId("dream-team-link");
    expect(dreamTeamLink).toBeInTheDocument();
    expect(dreamTeamLink.getAttribute("href")).toBe("/dream-team");
    expect(dreamTeamLink).toHaveTextContent("Dream Team");
  });
});
