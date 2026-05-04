import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, cleanup } from "@testing-library/react";
import type { Player, BattingStats, BowlingStats, SeasonStats } from "@/data/types";
import PlayerCard from "@/components/PlayerCard";

// Feature: ipl-player-stats, Property 1: Role-appropriate stat display
// Validates: Requirements 1.4, 1.5

const battingStatsArb: fc.Arbitrary<BattingStats> = fc.record({
  matches: fc.nat({ max: 200 }),
  innings: fc.nat({ max: 200 }),
  runs: fc.nat({ max: 10000 }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  strikeRate: fc.float({ min: 0, max: 300, noNaN: true, noDefaultInfinity: true }),
  fifties: fc.nat({ max: 100 }),
  hundreds: fc.nat({ max: 50 }),
  highestScore: fc.nat({ max: 300 }),
  sixes: fc.nat({ max: 100 }),
  fours: fc.nat({ max: 200 }),
  ballsAsNonStriker: fc.nat({ max: 500 }),
});

const bowlingStatsArb: fc.Arbitrary<BowlingStats> = fc.record({
  matches: fc.nat({ max: 200 }),
  innings: fc.nat({ max: 200 }),
  wickets: fc.nat({ max: 500 }),
  economy: fc.float({ min: 0, max: 20, noNaN: true, noDefaultInfinity: true }),
  average: fc.float({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  bestFigures: fc.tuple(fc.nat({ max: 10 }), fc.nat({ max: 100 })).map(
    ([w, r]) => `${w}/${r}`
  ),
  fourWickets: fc.nat({ max: 50 }),
  fiveWickets: fc.nat({ max: 30 }),
  widesConceded: fc.nat({ max: 50 }),
  noballsConceded: fc.nat({ max: 30 }),
  dotBalls: fc.nat({ max: 200 }),
  legByes: fc.nat({ max: 30 }),
  byes: fc.nat({ max: 20 }),
});

function seasonWithBatting(): fc.Arbitrary<SeasonStats> {
  return fc.record({
    year: fc.integer({ min: 2008, max: 2025 }).map(String),
    team: fc.stringMatching(/^[A-Z]{2,5}$/),
    batting: battingStatsArb,
    bowling: fc.constant(undefined),
  });
}

function seasonWithBowling(): fc.Arbitrary<SeasonStats> {
  return fc.record({
    year: fc.integer({ min: 2008, max: 2025 }).map(String),
    team: fc.stringMatching(/^[A-Z]{2,5}$/),
    batting: fc.constant(undefined),
    bowling: bowlingStatsArb,
  });
}

function seasonWithBoth(): fc.Arbitrary<SeasonStats> {
  return fc.record({
    year: fc.integer({ min: 2008, max: 2025 }).map(String),
    team: fc.stringMatching(/^[A-Z]{2,5}$/),
    batting: battingStatsArb,
    bowling: bowlingStatsArb,
  });
}

function playerWithRoles(
  primaryRole: Player["primaryRole"],
  secondaryRole: Player["secondaryRole"],
  seasonsArb: fc.Arbitrary<SeasonStats>
): fc.Arbitrary<Player> {
  return fc.record({
    id: fc.uuid(),
    name: fc.stringMatching(/^[A-Za-z ]{1,30}$/),
    team: fc.stringMatching(/^[A-Z]{2,5}$/),
    primaryRole: fc.constant(primaryRole),
    secondaryRole: fc.constant(secondaryRole),
    nationality: fc.stringMatching(/^[A-Za-z]{1,20}$/),
    seasons: fc.array(seasonsArb, { minLength: 1, maxLength: 3 }),
  });
}

const noop = () => {};

describe("Property 1: Role-appropriate stat display", () => {
  it("Batters show batting stats and no bowling stats", () => {
    fc.assert(
      fc.property(playerWithRoles("Batter", undefined, seasonWithBatting()), (player) => {
        cleanup();
        const { container } = render(
          <PlayerCard player={player} selected={false} onToggleSelect={noop} />
        );
        expect(container.querySelector('[data-testid="batting-stats"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="bowling-stats"]')).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("Batter/Wicket-Keepers show batting stats and no bowling stats", () => {
    fc.assert(
      fc.property(playerWithRoles("Batter", "Wicket-Keeper", seasonWithBatting()), (player) => {
        cleanup();
        const { container } = render(
          <PlayerCard player={player} selected={false} onToggleSelect={noop} />
        );
        expect(container.querySelector('[data-testid="batting-stats"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="bowling-stats"]')).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("Bowlers show bowling stats and no batting stats", () => {
    fc.assert(
      fc.property(playerWithRoles("Bowler", undefined, seasonWithBowling()), (player) => {
        cleanup();
        const { container } = render(
          <PlayerCard player={player} selected={false} onToggleSelect={noop} />
        );
        expect(container.querySelector('[data-testid="bowling-stats"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="batting-stats"]')).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("All-Rounders (Batter primary) show both batting and bowling stats", () => {
    fc.assert(
      fc.property(playerWithRoles("Batter", "All-Rounder", seasonWithBoth()), (player) => {
        cleanup();
        const { container } = render(
          <PlayerCard player={player} selected={false} onToggleSelect={noop} />
        );
        expect(container.querySelector('[data-testid="batting-stats"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="bowling-stats"]')).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("All-Rounders (Bowler primary) show both batting and bowling stats", () => {
    fc.assert(
      fc.property(playerWithRoles("Bowler", "All-Rounder", seasonWithBoth()), (player) => {
        cleanup();
        const { container } = render(
          <PlayerCard player={player} selected={false} onToggleSelect={noop} />
        );
        expect(container.querySelector('[data-testid="batting-stats"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="bowling-stats"]')).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
