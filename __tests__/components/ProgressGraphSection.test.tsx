import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/components/BattingChart", () => ({
  default: ({ data, playerName }: { data: unknown[]; playerName: string }) => (
    <div data-testid="batting-chart" aria-label={`Batting performance trends for ${playerName}`}>
      BattingChart ({data.length} points)
    </div>
  ),
}));

vi.mock("@/components/BowlingChart", () => ({
  default: ({ data, playerName }: { data: unknown[]; playerName: string }) => (
    <div data-testid="bowling-chart" aria-label={`Bowling performance trends for ${playerName}`}>
      BowlingChart ({data.length} points)
    </div>
  ),
}));

import ProgressGraphSection from "@/components/ProgressGraphSection";
import type { Player } from "@/data/types";

const batterPlayer: Player = {
  id: "batter-1",
  name: "Test Batter",
  team: "Team A",
  primaryRole: "Batter",
  nationality: "India",
  seasons: [
    {
      year: "2023",
      team: "Team A",
      batting: {
        matches: 14,
        innings: 14,
        runs: 450,
        average: 35.0,
        strikeRate: 140.0,
        fifties: 3,
        hundreds: 1,
        highestScore: 102,
      },
    },
    {
      year: "2024",
      team: "Team A",
      batting: {
        matches: 12,
        innings: 12,
        runs: 380,
        average: 31.67,
        strikeRate: 135.5,
        fifties: 2,
        hundreds: 0,
        highestScore: 78,
      },
    },
  ],
};

const bowlerPlayer: Player = {
  id: "bowler-1",
  name: "Test Bowler",
  team: "Team B",
  primaryRole: "Bowler",
  nationality: "Australia",
  seasons: [
    {
      year: "2023",
      team: "Team B",
      bowling: {
        matches: 14,
        innings: 14,
        wickets: 18,
        economy: 7.5,
        average: 24.0,
        bestFigures: "4/25",
        fourWickets: 1,
        fiveWickets: 0,
      },
    },
    {
      year: "2024",
      team: "Team B",
      bowling: {
        matches: 13,
        innings: 13,
        wickets: 15,
        economy: 8.0,
        average: 28.0,
        bestFigures: "3/30",
        fourWickets: 0,
        fiveWickets: 0,
      },
    },
  ],
};

const allRounderPlayer: Player = {
  id: "allrounder-1",
  name: "Test AllRounder",
  team: "Team C",
  primaryRole: "Batter",
  secondaryRole: "All-Rounder",
  nationality: "England",
  seasons: [
    {
      year: "2023",
      team: "Team C",
      batting: {
        matches: 14,
        innings: 14,
        runs: 320,
        average: 28.0,
        strikeRate: 130.0,
        fifties: 2,
        hundreds: 0,
        highestScore: 85,
      },
      bowling: {
        matches: 14,
        innings: 14,
        wickets: 12,
        economy: 8.2,
        average: 30.0,
        bestFigures: "3/28",
        fourWickets: 0,
        fiveWickets: 0,
      },
    },
    {
      year: "2024",
      team: "Team C",
      batting: {
        matches: 12,
        innings: 12,
        runs: 280,
        average: 25.5,
        strikeRate: 125.0,
        fifties: 1,
        hundreds: 0,
        highestScore: 72,
      },
      bowling: {
        matches: 12,
        innings: 12,
        wickets: 10,
        economy: 8.5,
        average: 32.0,
        bestFigures: "2/22",
        fourWickets: 0,
        fiveWickets: 0,
      },
    },
  ],
};

const noDataPlayer: Player = {
  id: "nodata-1",
  name: "Test NoData",
  team: "Team D",
  primaryRole: "Batter",
  nationality: "India",
  seasons: [
    { year: "2023", team: "Team D" },
    { year: "2024", team: "Team D" },
  ],
};

describe("ProgressGraphSection", () => {
  it("renders Performance Trends heading", () => {
    render(<ProgressGraphSection player={batterPlayer} />);
    expect(screen.getByText("Performance Trends")).toBeInTheDocument();
  });

  it("renders batting chart ARIA label for batter", () => {
    render(<ProgressGraphSection player={batterPlayer} />);
    expect(
      screen.getByLabelText(/Batting performance trends/)
    ).toBeInTheDocument();
  });

  it("renders bowling chart ARIA label for bowler", () => {
    render(<ProgressGraphSection player={bowlerPlayer} />);
    expect(
      screen.getByLabelText(/Bowling performance trends/)
    ).toBeInTheDocument();
  });

  it("renders both charts for all-rounder", () => {
    render(<ProgressGraphSection player={allRounderPlayer} />);
    expect(screen.getByTestId("batting-chart")).toBeInTheDocument();
    expect(screen.getByTestId("bowling-chart")).toBeInTheDocument();
  });

  it("renders no charts when player has no data", () => {
    render(<ProgressGraphSection player={noDataPlayer} />);
    expect(screen.queryByTestId("batting-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bowling-chart")).not.toBeInTheDocument();
  });
});
