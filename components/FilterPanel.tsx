"use client";

import { useState } from "react";
import { FilterState } from "@/data/types";

const PRIMARY_ROLES = ["Batter", "Bowler"];

const selectStyle = {
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-color)',
};

const labelStyle = {
  color: 'var(--text-secondary)',
};

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  teams: string[];
  seasons: string[];
  secondaryRoles: string[];
}

export default function FilterPanel({
  filters,
  onChange,
  teams,
  seasons,
  secondaryRoles,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = filters.primaryRole || filters.secondaryRole || filters.team || filters.season;

  const handleReset = () => {
    onChange({ primaryRole: null, secondaryRole: null, team: null, season: null });
  };

  const filterContent = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="flex-1">
        <label htmlFor="primary-role-filter" className="mb-1 block text-xs font-medium" style={labelStyle}>
          Primary Role
        </label>
        <select
          id="primary-role-filter"
          value={filters.primaryRole ?? ""}
          onChange={(e) => onChange({ ...filters, primaryRole: e.target.value || null })}
          aria-label="Filter by primary role"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={selectStyle}
        >
          <option value="">All Roles</option>
          {PRIMARY_ROLES.map((role) => (<option key={role} value={role}>{role}</option>))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="secondary-role-filter" className="mb-1 block text-xs font-medium" style={labelStyle}>
          Secondary Role
        </label>
        <select
          id="secondary-role-filter"
          value={filters.secondaryRole ?? ""}
          onChange={(e) => onChange({ ...filters, secondaryRole: e.target.value || null })}
          aria-label="Filter by secondary role"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={selectStyle}
        >
          <option value="">Any</option>
          {secondaryRoles.map((role) => (<option key={role} value={role}>{role}</option>))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="team-filter" className="mb-1 block text-xs font-medium" style={labelStyle}>
          Team
        </label>
        <select
          id="team-filter"
          value={filters.team ?? ""}
          onChange={(e) => onChange({ ...filters, team: e.target.value || null })}
          aria-label="Filter by team"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={selectStyle}
        >
          <option value="">All Teams</option>
          {teams.map((team) => (<option key={team} value={team}>{team}</option>))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="season-filter" className="mb-1 block text-xs font-medium" style={labelStyle}>
          Season
        </label>
        <select
          id="season-filter"
          value={filters.season ?? ""}
          onChange={(e) => onChange({ ...filters, season: e.target.value || null })}
          aria-label="Filter by season"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={selectStyle}
        >
          <option value="">All Seasons</option>
          {seasons.map((season) => (<option key={season} value={season}>{season}</option>))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset all filters"
          className="rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
        >
          Reset
        </button>
      )}
    </div>
  );

  return (
    <div role="group" aria-label="Player filters">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="filter-panel-content"
        className="flex w-full items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium md:hidden"
        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
      >
        <span>Filters{hasActiveFilters ? " (active)" : ""}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        id="filter-panel-content"
        className={`mt-2 md:mt-0 ${isOpen ? "block" : "hidden"} md:block`}
      >
        {filterContent}
      </div>
    </div>
  );
}
