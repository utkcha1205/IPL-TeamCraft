"use client";

import { SortConfig } from "@/data/types";

const SORT_OPTIONS = [
  { key: "runs", label: "Runs" },
  { key: "wickets", label: "Wickets" },
  { key: "average", label: "Average" },
  { key: "strikeRate", label: "Strike Rate" },
  { key: "economy", label: "Economy" },
];

interface SortControlsProps {
  sortConfig: SortConfig;
  onChange: (config: SortConfig) => void;
}

export default function SortControls({ sortConfig, onChange }: SortControlsProps) {
  const handleKeyChange = (key: string) => {
    if (key === sortConfig.key) {
      onChange({ key, direction: sortConfig.direction === "asc" ? "desc" : "asc" });
    } else {
      onChange({ key, direction: "desc" });
    }
  };

  const toggleDirection = () => {
    onChange({ ...sortConfig, direction: sortConfig.direction === "asc" ? "desc" : "asc" });
  };

  const controlStyle = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-color)',
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Sort controls">
      <label htmlFor="sort-select" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Sort by
      </label>
      <select
        id="sort-select"
        value={sortConfig.key}
        onChange={(e) => handleKeyChange(e.target.value)}
        aria-label="Sort criterion"
        className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={controlStyle}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={toggleDirection}
        aria-label={`Sort ${sortConfig.direction === "asc" ? "ascending" : "descending"}, click to toggle`}
        className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={controlStyle}
      >
        {sortConfig.direction === "asc" ? "↑ Asc" : "↓ Desc"}
      </button>
    </div>
  );
}
