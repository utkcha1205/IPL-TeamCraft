import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "@/components/SearchBar";

describe("SearchBar", () => {
  it("renders with the provided query value", () => {
    render(<SearchBar query="Kohli" onChange={() => {}} />);
    const input = screen.getByRole("textbox", { name: /search players/i });
    expect((input as HTMLInputElement).value).toBe("Kohli");
  });

  it("calls onChange when user types", () => {
    const handleChange = vi.fn();
    render(<SearchBar query="" onChange={handleChange} />);
    const input = screen.getByRole("textbox", { name: /search players/i });
    fireEvent.change(input, { target: { value: "Rohit" } });
    expect(handleChange).toHaveBeenCalledWith("Rohit");
  });

  it("renders a search icon (decorative svg)", () => {
    const { container } = render(<SearchBar query="" onChange={() => {}} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("has accessible label", () => {
    render(<SearchBar query="" onChange={() => {}} />);
    expect(screen.getByLabelText(/search players/i)).toBeDefined();
  });
});
