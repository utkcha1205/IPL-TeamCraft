"use client";

interface TeamPickerProps {
  teams: string[];
  teamA: string | null;
  teamB: string | null;
  onChangeA: (team: string | null) => void;
  onChangeB: (team: string | null) => void;
}

const selectStyle = {
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-color)',
};

const labelStyle = {
  color: 'var(--text-secondary)',
};

export default function TeamPicker({ teams, teamA, teamB, onChangeA, onChangeB }: TeamPickerProps) {
  const isDuplicate = teamA !== null && teamB !== null && teamA === teamB;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="team-a-select" className="mb-1 block text-xs font-medium" style={labelStyle}>
            Team A
          </label>
          <select
            id="team-a-select"
            value={teamA ?? ""}
            onChange={(e) => onChangeA(e.target.value || null)}
            aria-label="Select Team A"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={selectStyle}
          >
            <option value="">Select Team A</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="team-b-select" className="mb-1 block text-xs font-medium" style={labelStyle}>
            Team B
          </label>
          <select
            id="team-b-select"
            value={teamB ?? ""}
            onChange={(e) => onChangeB(e.target.value || null)}
            aria-label="Select Team B"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={selectStyle}
          >
            <option value="">Select Team B</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {isDuplicate && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          Please select two different teams
        </p>
      )}
    </div>
  );
}
