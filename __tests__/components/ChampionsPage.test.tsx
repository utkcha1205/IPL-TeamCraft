import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Player, SeasonStats } from "@/data/types";

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

// Mock ThemeToggle as a simple div
vi.mock("@/components/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

function makeSeason(year: string, team: string, overrides?: Partial<SeasonStats>): SeasonStats {
  return {
    year,
    team,
    batting: {
      matches: 14, innings: 10, runs: 450, average: 45.0, strikeRate: 135.0,
      fifties: 3, hundreds: 1, highestScore: 98, sixes: 20, fours: 40,
      ballsAsNonStriker: 150,
    },
    bowling: {
      matches: 14, innings: 10, wickets: 12, economy: 7.5, average: 25.0,
      bestFigures: "3/20", fourWickets: 1, fiveWickets: 0,
      widesConceded: 8, noballsConceded: 3, dotBalls: 80, legByes: 4, byes: 2,
    },
    fielding: { catches: 8, runOuts: 3, stumpings: 1 },
    ...overrides,
  };
}

function makePlayer(id: string, name: string, team: string, seasons: SeasonStats[]): Player {
  return { id, name, team, primaryRole: "Batter", nationality: "Indian", seasons };
}

// Player 1: 3 seasons of batting data (qualifies for consistency)
const player1 = makePlayer("p1", "Virat Star", "Team Alpha", [
  makeSeason("2022", "Team Alpha", {
    batting: {
      matches: 14, innings: 12, runs: 600, average: 50.0, strikeRate: 140.0,
      fifties: 5, hundreds: 2, highestScore: 112, sixes: 30, fours: 55,
      ballsAsNonStriker: 200,
    },
  }),
  makeSeason("2023", "Team Alpha", {
    batting: {
      matches: 14, innings: 12, runs: 580, average: 48.3, strikeRate: 138.0,
      fifties: 4, hundreds: 2, highestScore: 105, sixes: 28, fours: 50,
      ballsAsNonStriker: 190,
    },
  }),
  makeSeason("2024", "Team Alpha", {
    batting: {
      matches: 14, innings: 12, runs: 620, average: 51.7, strikeRate: 142.0,
      fifties: 5, hundreds: 2, highestScore: 118, sixes: 32, fours: 58,
      ballsAsNonStriker: 210,
    },
  }),
]);

// Player 2: 2 seasons
const player2 = makePlayer("p2", "Rohit Power", "Team Beta", [
  makeSeason("2023", "Team Beta"),
  makeSeason("2024", "Team Beta", {
    batting: {
      matches: 14, innings: 10, runs: 500, average: 50.0, strikeRate: 145.0,
      fifties: 4, hundreds: 1, highestScore: 102, sixes: 25, fours: 45,
      ballsAsNonStriker: 170,
    },
  }),
]);

// Player 3: 2 seasons with fielding data
const player3 = makePlayer("p3", "Jadeja Field", "Team Alpha", [
  makeSeason("2022", "Team Alpha", {
    fielding: { catches: 15, runOuts: 5, stumpings: 0 },
  }),
  makeSeason("2023", "Team Alpha", {
    fielding: { catches: 12, runOuts: 4, stumpings: 0 },
  }),
]);

// Player 4: 1 season only (2024)
const player4 = makePlayer("p4", "Bumrah Pace", "Team Beta", [
  makeSeason("2024", "Team Beta", {
    bowling: {
      matches: 14, innings: 14, wickets: 25, economy: 6.2, average: 18.0,
      bestFigures: "5/15", fourWickets: 2, fiveWickets: 1,
      widesConceded: 5, noballsConceded: 2, dotBalls: 120, legByes: 3, byes: 1,
    },
  }),
]);

const testPlayers: Player[] = [player1, player2, player3, player4];

// Use a module-level variable that the mock factory reads
let currentPlayers: Player[] = testPlayers;

vi.mock("@/data/players", () => ({
  getAllPlayers: () => currentPlayers,
}));

beforeEach(() => {
  cleanup();
  currentPlayers = testPlayers;
  // Reset module cache so the page re-evaluates getAllPlayers() at module level
  vi.resetModules();
});

async function renderChampionsPage() {
  const mod = await import("@/app/champions/page");
  const ChampionsPage = mod.default;
  return render(<ChampionsPage />);
}

describe("ChampionsPage Integration", () => {
  it("renders all leaderboard sections", async () => {
    await renderChampionsPage();

    expect(screen.getByText("Batting")).toBeInTheDocument();
    expect(screen.getByText("Bowling")).toBeInTheDocument();
    expect(screen.getByText("Fielding")).toBeInTheDocument();
    expect(screen.getByText("Extras")).toBeInTheDocument();
    expect(screen.getByText("Non-Striker")).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
  });

  it("season filter changes recompute leaderboard results", async () => {
    await renderChampionsPage();

    const seasonSelect = screen.getByLabelText("Season:");
    expect(seasonSelect).toBeInTheDocument();
    expect((seasonSelect as HTMLSelectElement).value).toBe("");

    // Change to a specific season
    fireEvent.change(seasonSelect, { target: { value: "2024" } });
    expect((seasonSelect as HTMLSelectElement).value).toBe("2024");

    // Page should still render sections
    expect(screen.getByText("Batting")).toBeInTheDocument();
    expect(screen.getByText("Bowling")).toBeInTheDocument();
  });

  it("Most Consistent Batter card is hidden when a specific season is selected", async () => {
    await renderChampionsPage();

    // With "All Seasons", the Most Consistent Batter card should be present
    expect(screen.getByText("Most Consistent Batter")).toBeInTheDocument();

    // Select a specific season
    const seasonSelect = screen.getByLabelText("Season:");
    fireEvent.change(seasonSelect, { target: { value: "2024" } });

    // Most Consistent Batter should be hidden
    expect(screen.queryByText("Most Consistent Batter")).not.toBeInTheDocument();
  });

  it("empty state messages render correctly", async () => {
    currentPlayers = [];
    await renderChampionsPage();

    expect(screen.getByText("No player data available")).toBeInTheDocument();
  });

  it("player name links navigate to /player/[id]", async () => {
    await renderChampionsPage();

    const playerLinks = screen.getAllByRole("link").filter(
      (link) => link.getAttribute("href")?.startsWith("/player/")
    );

    expect(playerLinks.length).toBeGreaterThan(0);

    const hrefs = playerLinks.map((link) => link.getAttribute("href"));
    const knownPlayerPaths = ["/player/p1", "/player/p2", "/player/p3", "/player/p4"];
    const hasKnownPlayer = hrefs.some((href) => knownPlayerPaths.includes(href!));
    expect(hasKnownPlayer).toBe(true);
  });

  it("renders breadcrumb navigation", async () => {
    await renderChampionsPage();

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.getAttribute("href")).toBe("/");

    expect(screen.getByText("Champions")).toBeInTheDocument();
  });

  it("renders HeroPodium with top performers", async () => {
    await renderChampionsPage();

    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();
  });
});
