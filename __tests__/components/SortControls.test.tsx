import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SortControls from "@/components/SortControls";
import type { SortConfig } from "@/data/types";

describe("SortControls", () => {
  const defaultConfig: SortConfig = { key: "runs", direction: "desc" };

  it("renders sort select with current key selected", () => {
    render(<SortControls sortConfig={defaultConfig} onChange={() => {}} />);
    const select = screen.getByLabelText(/sort criterion/i) as HTMLSelectElement;
    expect(select.value).toBe("runs");
  });

  it("renders all sort options", () => {
    render(<SortControls sortConfig={defaultConfig} onChange={() => {}} />);
    const select = screen.getByLabelText(/sort criterion/i);
    const options = select.querySelectorAll("option");
    const values = Array.from(options).map((o) => o.value);
    expect(values).toEqual(["runs", "wickets", "average", "strikeRate", "economy"]);
  });

  it("calls onChange with new key and desc direction when a different key is selected", () => {
    const handleChange = vi.fn();
    render(<SortControls sortConfig={defaultConfig} onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/sort criterion/i), {
      target: { value: "wickets" },
    });
    expect(handleChange).toHaveBeenCalledWith({ key: "wickets", direction: "desc" });
  });

  it("toggles direction when the same key is selected again", () => {
    const handleChange = vi.fn();
    render(<SortControls sortConfig={defaultConfig} onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/sort criterion/i), {
      target: { value: "runs" },
    });
    expect(handleChange).toHaveBeenCalledWith({ key: "runs", direction: "asc" });
  });

  it("toggles direction when toggle button is clicked", () => {
    const handleChange = vi.fn();
    render(<SortControls sortConfig={defaultConfig} onChange={handleChange} />);
    const toggleBtn = screen.getByRole("button", { name: /sort.*click to toggle/i });
    fireEvent.click(toggleBtn);
    expect(handleChange).toHaveBeenCalledWith({ key: "runs", direction: "asc" });
  });

  it("shows ascending label when direction is asc", () => {
    const ascConfig: SortConfig = { key: "runs", direction: "asc" };
    render(<SortControls sortConfig={ascConfig} onChange={() => {}} />);
    expect(screen.getByText("↑ Asc")).toBeDefined();
  });

  it("shows descending label when direction is desc", () => {
    render(<SortControls sortConfig={defaultConfig} onChange={() => {}} />);
    expect(screen.getByText("↓ Desc")).toBeDefined();
  });

  it("has accessible group label", () => {
    render(<SortControls sortConfig={defaultConfig} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: /sort controls/i })).toBeDefined();
  });
});
