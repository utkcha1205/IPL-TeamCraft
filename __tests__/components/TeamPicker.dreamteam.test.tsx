import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fc from "fast-check";
import { useState } from "react";
import TeamPicker from "@/components/TeamPicker";

/**
 * Feature: dream-team-selector, Property 1: Generate button enabled iff two distinct teams selected
 *
 * Validates: Requirements 1.3, 1.4, 1.5
 */

const TEAMS = ["Team A", "Team B", "Team C", "Team D"];

/**
 * Wrapper component that renders TeamPicker + a "Generate Dream XI" button,
 * mimicking the page behavior where the button is disabled unless two distinct
 * teams are selected.
 */
function TeamPickerWrapper({
  initialTeamA,
  initialTeamB,
}: {
  initialTeamA: string | null;
  initialTeamB: string | null;
}) {
  const [teamA, setTeamA] = useState<string | null>(initialTeamA);
  const [teamB, setTeamB] = useState<string | null>(initialTeamB);

  const canGenerate = teamA !== null && teamB !== null && teamA !== teamB;

  return (
    <div>
      <TeamPicker
        teams={TEAMS}
        teamA={teamA}
        teamB={teamB}
        onChangeA={setTeamA}
        onChangeB={setTeamB}
      />
      <button disabled={!canGenerate} data-testid="generate-btn">
        Generate Dream XI
      </button>
    </div>
  );
}

const teamSelectionArb = fc.tuple(
  fc.option(fc.constantFrom("Team A", "Team B", "Team C", "Team D"), {
    nil: null,
  }),
  fc.option(fc.constantFrom("Team A", "Team B", "Team C", "Team D"), {
    nil: null,
  })
);

describe("Feature: dream-team-selector, Property 1: Generate button enabled iff two distinct teams selected", () => {
  it("button is enabled iff both teams are non-null and different; validation message shown when same team selected", () => {
    fc.assert(
      fc.property(teamSelectionArb, ([teamA, teamB]) => {
        cleanup();

        render(
          <TeamPickerWrapper initialTeamA={teamA} initialTeamB={teamB} />
        );

        const button = screen.getByTestId("generate-btn");

        if (teamA !== null && teamB !== null && teamA !== teamB) {
          // Both non-null and different → button enabled
          expect(button).not.toBeDisabled();
        } else if (teamA !== null && teamB !== null && teamA === teamB) {
          // Same team for both → button disabled AND validation message present
          expect(button).toBeDisabled();
          expect(
            screen.getByText("Please select two different teams")
          ).toBeDefined();
        } else {
          // Either is null → button disabled
          expect(button).toBeDisabled();
        }

        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});


describe("TeamPicker unit tests", () => {
  it("renders all teams as options", () => {
    const teams = ["Mumbai Indians", "Chennai Super Kings", "Royal Challengers", "Delhi Capitals"];

    render(
      <TeamPicker
        teams={teams}
        teamA={null}
        teamB={null}
        onChangeA={() => {}}
        onChangeB={() => {}}
      />
    );

    const teamASelect = screen.getByLabelText("Select Team A");
    const teamBSelect = screen.getByLabelText("Select Team B");

    for (const team of teams) {
      const optionsA = Array.from(teamASelect.querySelectorAll("option"));
      expect(optionsA.some((opt) => opt.textContent === team)).toBe(true);

      const optionsB = Array.from(teamBSelect.querySelectorAll("option"));
      expect(optionsB.some((opt) => opt.textContent === team)).toBe(true);
    }
  });

  it("handles selection changes", () => {
    const teams = ["Mumbai Indians", "Chennai Super Kings", "Royal Challengers"];
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();

    render(
      <TeamPicker
        teams={teams}
        teamA={null}
        teamB={null}
        onChangeA={onChangeA}
        onChangeB={onChangeB}
      />
    );

    const teamASelect = screen.getByLabelText("Select Team A");
    fireEvent.change(teamASelect, { target: { value: "Chennai Super Kings" } });

    expect(onChangeA).toHaveBeenCalledWith("Chennai Super Kings");
  });

  it("shows validation message when same team selected", () => {
    const teams = ["Mumbai Indians", "Chennai Super Kings"];

    render(
      <TeamPicker
        teams={teams}
        teamA="Mumbai Indians"
        teamB="Mumbai Indians"
        onChangeA={() => {}}
        onChangeB={() => {}}
      />
    );

    expect(screen.getByText("Please select two different teams")).toBeDefined();
  });

  it("does not show validation message when different teams selected", () => {
    const teams = ["Mumbai Indians", "Chennai Super Kings"];

    render(
      <TeamPicker
        teams={teams}
        teamA="Mumbai Indians"
        teamB="Chennai Super Kings"
        onChangeA={() => {}}
        onChangeB={() => {}}
      />
    );

    expect(screen.queryByText("Please select two different teams")).toBeNull();
  });
});
