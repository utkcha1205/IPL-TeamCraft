import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fc from "fast-check";
import DreamTeamCard from "@/components/DreamTeamCard";
import type { Player } from "@/data/types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

/**
 * Feature: dream-team-selector, Property 7: Dream Team Card displays required information
 *
 * Validates: Requirements 4.2
 */

// --- Arbitraries ---

const fullBattingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 50 }),
  innings: fc.integer({ min: 1, max: 50 }),
  runs: fc.integer({ min: 0, max: 5000 }),
  average: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.double({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.integer({ min: 0, max: 20 }),
  hundreds: fc.integer({ min: 0, max: 10 }),
  highestScore: fc.integer({ min: 0, max: 300 }),
});

const fullBowlingStatsArb = fc.record({
  matches: fc.integer({ min: 1, max: 50 }),
  innings: fc.integer({ min: 1, max: 50 }),
  wickets: fc.integer({ min: 0, max: 100 }),
  economy: fc.double({ min: 0, max: 15, noNaN: true, noDefaultInfinity: true }),
  average: fc.double({ min: 0, max: 60, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc.constant("3/25"),
  fourWickets: fc.integer({ min: 0, max: 5 }),
  fiveWickets: fc.integer({ min: 0, max: 3 }),
});

const teamNameArb = fc.constantFrom(
  "Mumbai Indians",
  "Chennai Super Kings",
  "Royal Challengers",
  "Kolkata Knight Riders",
  "Delhi Capitals"
);

const seasonArb = fc.record({
  year: fc.constantFrom("2020", "2021", "2022", "2023", "2024"),
  team: teamNameArb,
  batting: fullBattingStatsArb,
  bowling: fc.option(fullBowlingStatsArb, { nil: undefined }),
});

const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,29}$/),
  team: teamNameArb,
  primaryRole: fc.constantFrom("Batter" as const, "Bowler" as const),
  secondaryRole: fc.option(
    fc.constantFrom(
      "Wicket-Keeper" as const,
      "All-Rounder" as const,
      "Captain" as const,
      "Vice-Captain" as const
    ),
    { nil: undefined }
  ),
  nationality: fc.constant("Indian"),
  seasons: fc.array(seasonArb, { minLength: 1, maxLength: 3 }),
});

const scoreArb = fc.double({ min: 0, max: 110, noNaN: true, noDefaultInfinity: true });

const teamLabelArb = fc.constantFrom("A" as const, "B" as const);

describe("Feature: dream-team-selector, Property 7: Dream Team Card displays required information", () => {
  it("rendered card contains player name, team, primary role, secondary role (if present), and score", () => {
    fc.assert(
      fc.property(playerArb, scoreArb, teamLabelArb, (player, score, teamLabel) => {
        cleanup();

        render(
          <DreamTeamCard player={player} score={score} teamLabel={teamLabel} />
        );

        // Player name is displayed
        const nameEl = screen.getByTestId("player-name");
        expect(nameEl.textContent).toContain(player.name);

        // Team name is displayed
        const teamEl = screen.getByTestId("player-team");
        expect(teamEl).toHaveTextContent(player.team);

        // Role element contains primary role
        const roleEl = screen.getByTestId("player-role");
        expect(roleEl.textContent).toContain(player.primaryRole);

        // Secondary role displayed if present
        if (player.secondaryRole) {
          expect(roleEl.textContent).toContain(player.secondaryRole);
        }

        // Score formatted to 1 decimal place
        const scoreEl = screen.getByTestId("player-score");
        expect(scoreEl).toHaveTextContent(score.toFixed(1));

        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});


const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: "p1",
  name: "Virat Kohli",
  team: "Royal Challengers",
  primaryRole: "Batter",
  nationality: "Indian",
  seasons: [
    {
      year: "2023",
      team: "Royal Challengers",
      batting: {
        matches: 14,
        innings: 14,
        runs: 639,
        average: 53.25,
        strikeRate: 139.82,
        fifties: 6,
        hundreds: 1,
        highestScore: 112,
      },
    },
  ],
  ...overrides,
});

describe("DreamTeamCard unit tests", () => {
  it("renders player info correctly", () => {
    const player = makePlayer();

    render(<DreamTeamCard player={player} score={78.5} teamLabel="A" />);

    expect(screen.getByTestId("player-name")).toHaveTextContent("Virat Kohli");
    expect(screen.getByTestId("player-team")).toHaveTextContent("Royal Challengers");
    expect(screen.getByTestId("player-role")).toHaveTextContent("Batter");
    expect(screen.getByTestId("player-score")).toHaveTextContent("78.5");
  });

  it("links to player detail page", () => {
    const player = makePlayer({ id: "abc-123" });

    render(<DreamTeamCard player={player} score={60} teamLabel="B" />);

    const link = screen.getByTestId("player-name");
    expect(link.getAttribute("href")).toBe("/player/abc-123");
  });

  it("shows secondary role when present", () => {
    const player = makePlayer({ secondaryRole: "All-Rounder" });

    render(<DreamTeamCard player={player} score={70} teamLabel="A" />);

    const roleEl = screen.getByTestId("player-role");
    expect(roleEl.textContent).toContain("All-Rounder");
  });

  it("does not show secondary role when absent", () => {
    const player = makePlayer({ secondaryRole: undefined });

    render(<DreamTeamCard player={player} score={65} teamLabel="A" />);

    const roleEl = screen.getByTestId("player-role");
    expect(roleEl.textContent).toBe("Batter");
  });

  it("displays team label badge", () => {
    const player = makePlayer();

    render(<DreamTeamCard player={player} score={50} teamLabel="A" />);

    const badge = screen.getByTestId("team-label");
    expect(badge).toHaveTextContent("A");
  });
});
