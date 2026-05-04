import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroPodium from "@/components/HeroPodium";
import type { RankedPlayer } from "@/lib/leaderboardEngine";
import type { Player } from "@/data/types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Virat Kohli",
    team: "Royal Challengers",
    primaryRole: "Batter",
    nationality: "Indian",
    seasons: [
      {
        year: "2023",
        team: "Royal Challengers",
        batting: {
          matches: 14, innings: 14, runs: 639, average: 53.25,
          strikeRate: 139.82, fifties: 6, hundreds: 1, highestScore: 112,
          sixes: 20, fours: 55, ballsAsNonStriker: 300,
        },
      },
    ],
    ...overrides,
  };
}

function makeRankedPlayer(
  name: string,
  id: string,
  team: string,
  rank: number,
  statValue: number
): RankedPlayer {
  return {
    player: makePlayer({ id, name, team }),
    rank,
    statValue,
  };
}

describe("HeroPodium", () => {
  it("renders all three performers when given 3 entries", () => {
    const topPerformers = [
      makeRankedPlayer("Player One", "p1", "Team A", 1, 1000),
      makeRankedPlayer("Player Two", "p2", "Team B", 2, 800),
      makeRankedPlayer("Player Three", "p3", "Team C", 3, 600),
    ];

    render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("Player Two")).toBeInTheDocument();
    expect(screen.getByText("Player Three")).toBeInTheDocument();
  });

  it("renders with fewer than 3 performers", () => {
    const topPerformers = [
      makeRankedPlayer("Solo Player", "p1", "Team A", 1, 500),
    ];

    const { container } = render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("Solo Player")).toBeInTheDocument();
    expect(container.querySelector(".flex")).not.toBeNull();
  });

  it("returns null when given an empty array", () => {
    const { container } = render(<HeroPodium topPerformers={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("shows gold, silver, and bronze medal emojis", () => {
    const topPerformers = [
      makeRankedPlayer("First", "p1", "A", 1, 1000),
      makeRankedPlayer("Second", "p2", "B", 2, 800),
      makeRankedPlayer("Third", "p3", "C", 3, 600),
    ];

    render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();
  });

  it("displays player names and stat values", () => {
    const topPerformers = [
      makeRankedPlayer("MS Dhoni", "p1", "CSK", 1, 750),
      makeRankedPlayer("Jasprit Bumrah", "p2", "MI", 2, 620),
      makeRankedPlayer("Rashid Khan", "p3", "GT", 3, 480),
    ];

    render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("MS Dhoni")).toBeInTheDocument();
    expect(screen.getByText("Jasprit Bumrah")).toBeInTheDocument();
    expect(screen.getByText("Rashid Khan")).toBeInTheDocument();
    expect(screen.getByText("750")).toBeInTheDocument();
    expect(screen.getByText("620")).toBeInTheDocument();
    expect(screen.getByText("480")).toBeInTheDocument();
  });

  it("displays team names for each performer", () => {
    const topPerformers = [
      makeRankedPlayer("Player A", "p1", "Chennai Super Kings", 1, 900),
      makeRankedPlayer("Player B", "p2", "Mumbai Indians", 2, 700),
    ];

    render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("Chennai Super Kings")).toBeInTheDocument();
    expect(screen.getByText("Mumbai Indians")).toBeInTheDocument();
  });

  it("formats decimal stat values to 2 decimal places", () => {
    const topPerformers = [
      makeRankedPlayer("Rate Player", "p1", "Team X", 1, 45.678),
    ];

    render(<HeroPodium topPerformers={topPerformers} />);

    expect(screen.getByText("45.68")).toBeInTheDocument();
  });
});
