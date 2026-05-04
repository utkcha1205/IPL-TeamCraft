import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterPanel from "@/components/FilterPanel";
import type { FilterState } from "@/data/types";

const defaultFilters: FilterState = { primaryRole: null, secondaryRole: null, team: null, season: null };
const teams = ["Mumbai Indians", "Chennai Super Kings", "Royal Challengers Bangalore"];
const seasons = ["2022", "2023", "2024"];
const secondaryRoles = ["All-Rounder", "Wicket-Keeper"];

describe("FilterPanel", () => {
  it("renders primary role, secondary role, team, and season dropdowns", () => {
    render(
      <FilterPanel filters={defaultFilters} onChange={() => {}} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    expect(screen.getByLabelText(/filter by primary role/i)).toBeDefined();
    expect(screen.getByLabelText(/filter by secondary role/i)).toBeDefined();
    expect(screen.getByLabelText(/filter by team/i)).toBeDefined();
    expect(screen.getByLabelText(/filter by season/i)).toBeDefined();
  });

  it("calls onChange with updated primaryRole when primary role is selected", () => {
    const handleChange = vi.fn();
    render(
      <FilterPanel filters={defaultFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    fireEvent.change(screen.getByLabelText(/filter by primary role/i), {
      target: { value: "Batter" },
    });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultFilters, primaryRole: "Batter" });
  });

  it("calls onChange with updated secondaryRole when secondary role is selected", () => {
    const handleChange = vi.fn();
    render(
      <FilterPanel filters={defaultFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    fireEvent.change(screen.getByLabelText(/filter by secondary role/i), {
      target: { value: "Wicket-Keeper" },
    });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultFilters, secondaryRole: "Wicket-Keeper" });
  });

  it("calls onChange with updated team when team is selected", () => {
    const handleChange = vi.fn();
    render(
      <FilterPanel filters={defaultFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    fireEvent.change(screen.getByLabelText(/filter by team/i), {
      target: { value: "Mumbai Indians" },
    });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultFilters, team: "Mumbai Indians" });
  });

  it("calls onChange with updated season when season is selected", () => {
    const handleChange = vi.fn();
    render(
      <FilterPanel filters={defaultFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    fireEvent.change(screen.getByLabelText(/filter by season/i), {
      target: { value: "2023" },
    });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultFilters, season: "2023" });
  });

  it("shows reset button when filters are active and resets on click", () => {
    const handleChange = vi.fn();
    const activeFilters: FilterState = { primaryRole: "Batter", secondaryRole: null, team: null, season: null };
    render(
      <FilterPanel filters={activeFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    const resetBtn = screen.getByRole("button", { name: /reset all filters/i });
    fireEvent.click(resetBtn);
    expect(handleChange).toHaveBeenCalledWith({ primaryRole: null, secondaryRole: null, team: null, season: null });
  });

  it("does not show reset button when no filters are active", () => {
    render(
      <FilterPanel filters={defaultFilters} onChange={() => {}} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    expect(screen.queryByRole("button", { name: /reset all filters/i })).toBeNull();
  });

  it("has a mobile toggle button with aria-expanded", () => {
    render(
      <FilterPanel filters={defaultFilters} onChange={() => {}} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    const toggle = screen.getByRole("button", { name: /filters/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("sets primaryRole to null when 'All Roles' is selected", () => {
    const handleChange = vi.fn();
    const activeFilters: FilterState = { primaryRole: "Batter", secondaryRole: null, team: null, season: null };
    render(
      <FilterPanel filters={activeFilters} onChange={handleChange} teams={teams} seasons={seasons} secondaryRoles={secondaryRoles} />
    );
    fireEvent.change(screen.getByLabelText(/filter by primary role/i), {
      target: { value: "" },
    });
    expect(handleChange).toHaveBeenCalledWith({ ...activeFilters, primaryRole: null });
  });
});
