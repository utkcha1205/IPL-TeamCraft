import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/BattingChart", () => ({
  default: () => <div data-testid="batting-chart">BattingChart</div>,
}));

vi.mock("@/components/BowlingChart", () => ({
  default: () => <div data-testid="bowling-chart">BowlingChart</div>,
}));

import PlayerDetailView from "@/components/PlayerDetailView";
import type { Player } from "@/data/types";

const testPlayer: Player = {
  id: "batter-1",
  name: "Virat Kohli",
  team: "Royal Challengers Bengaluru",
  primaryRole: "Batter",
  nationality: "India",
  seasons: [
    {
      year: "2023",
      team: "Royal Challengers Bengaluru",
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
      team: "Royal Challengers Bengaluru",
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

describe("PlayerDetailView", () => {
  it("Performance Trends heading appears between Career Stats and Season-by-Season Stats", () => {
    render(<PlayerDetailView player={testPlayer} />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);

    const careerStatsIndex = headingTexts.indexOf("Career Stats");
    const performanceTrendsIndex = headingTexts.indexOf("Performance Trends");
    const seasonBySeasonIndex = headingTexts.indexOf("Season-by-Season Stats");

    expect(careerStatsIndex).toBeGreaterThanOrEqual(0);
    expect(performanceTrendsIndex).toBeGreaterThanOrEqual(0);
    expect(seasonBySeasonIndex).toBeGreaterThanOrEqual(0);

    expect(careerStatsIndex).toBeLessThan(performanceTrendsIndex);
    expect(performanceTrendsIndex).toBeLessThan(seasonBySeasonIndex);
  });
});
