import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LeaderboardCard from "@/components/LeaderboardCard";
import type { LeaderboardCategory, RankedPlayer } from "@/lib/leaderboardEngine";
import type { Player } from "@/data/types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

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

function makeRankedPlayer(overrides: Partial<RankedPlayer> & { playerOverrides?: Partial<Player> } = {}): RankedPlayer {
  const { playerOverrides, ...rest } = overrides;
  return {
    player: makePlayer(playerOverrides),
    rank: 1,
    statValue: 639,
    ...rest,
  };
}

const category: LeaderboardCategory = {
  id: "most-runs",
  label: "Most Runs",
  statPath: "batting.runs",
  direction: "higher",
  qualifierType: "none",
  minInnings: 0,
};

describe("LeaderboardCard", () => {
  it("renders with valid data (best, average, worst all present)", () => {
    const best = makeRankedPlayer({
      playerOverrides: { id: "p1", name: "Virat Kohli", team: "RCB" },
      rank: 1, statValue: 639,
    });
    const average = makeRankedPlayer({
      playerOverrides: { id: "p2", name: "Rohit Sharma", team: "MI" },
      rank: 5, statValue: 400,
    });
    const worst = makeRankedPlayer({
      playerOverrides: { id: "p3", name: "KL Rahul", team: "LSG" },
      rank: 10, statValue: 150,
    });

    render(
      <LeaderboardCard category={category} best={best} average={average} worst={worst} isEmpty={false} />
    );

    expect(screen.getByText("Most Runs")).toBeInTheDocument();
    expect(screen.getByText("Virat Kohli")).toBeInTheDocument();
    expect(screen.getByText("Rohit Sharma")).toBeInTheDocument();
    expect(screen.getByText("KL Rahul")).toBeInTheDocument();
    expect(screen.getByText("639")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("shows empty state message when isEmpty is true", () => {
    render(
      <LeaderboardCard category={category} best={null} average={null} worst={null} isEmpty={true} />
    );

    expect(screen.getByText("Not enough data for this category")).toBeInTheDocument();
    expect(screen.queryByText("Best")).not.toBeInTheDocument();
  });

  it("player name links navigate to /player/[id]", () => {
    const best = makeRankedPlayer({
      playerOverrides: { id: "abc-123", name: "Player A" },
      rank: 1, statValue: 500,
    });
    const average = makeRankedPlayer({
      playerOverrides: { id: "def-456", name: "Player B" },
      rank: 3, statValue: 300,
    });
    const worst = makeRankedPlayer({
      playerOverrides: { id: "ghi-789", name: "Player C" },
      rank: 5, statValue: 100,
    });

    render(
      <LeaderboardCard category={category} best={best} average={average} worst={worst} isEmpty={false} />
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute("href")).toBe("/player/abc-123");
    expect(links[1].getAttribute("href")).toBe("/player/def-456");
    expect(links[2].getAttribute("href")).toBe("/player/ghi-789");
  });

  it("gold/silver/bronze accent colors are applied via style attributes", () => {
    const best = makeRankedPlayer({ rank: 1, statValue: 100 });
    const average = makeRankedPlayer({ rank: 5, statValue: 50 });
    const worst = makeRankedPlayer({ rank: 10, statValue: 10 });

    const { container } = render(
      <LeaderboardCard category={category} best={best} average={average} worst={worst} isEmpty={false} />
    );

    const tierRows = container.querySelectorAll('[style*="border-left"]');
    expect(tierRows).toHaveLength(3);

    // Gold for Best
    expect((tierRows[0] as HTMLElement).style.borderLeft).toContain("rgb(255, 215, 0)");
    // Silver for Average
    expect((tierRows[1] as HTMLElement).style.borderLeft).toContain("rgb(192, 192, 192)");
    // Bronze for Worst
    expect((tierRows[2] as HTMLElement).style.borderLeft).toContain("rgb(205, 127, 50)");
  });

  it("formats integer stat values without decimals", () => {
    const best = makeRankedPlayer({ rank: 1, statValue: 42 });

    render(
      <LeaderboardCard category={category} best={best} average={null} worst={null} isEmpty={false} />
    );

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats decimal stat values to 2 decimal places", () => {
    const rateCategory: LeaderboardCategory = {
      id: "highest-average",
      label: "Highest Average",
      statPath: "batting.average",
      direction: "higher",
      qualifierType: "batting",
      minInnings: 5,
    };
    const best = makeRankedPlayer({ rank: 1, statValue: 53.257 });

    render(
      <LeaderboardCard category={rateCategory} best={best} average={null} worst={null} isEmpty={false} />
    );

    expect(screen.getByText("53.26")).toBeInTheDocument();
  });

  it("shows trophy icon for best performer", () => {
    const best = makeRankedPlayer({ rank: 1, statValue: 100 });

    render(
      <LeaderboardCard category={category} best={best} average={null} worst={null} isEmpty={false} />
    );

    expect(screen.getByText("🏆")).toBeInTheDocument();
  });
});
