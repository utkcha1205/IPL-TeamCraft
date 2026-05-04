"use client";

interface CoverageDisplayProps {
  coveragePercent: number | null;
}

function getCoverageColor(percent: number): string {
  if (percent >= 80) return "#22c55e";
  if (percent >= 50) return "#eab308";
  return "#ef4444";
}

export default function CoverageDisplay({ coveragePercent }: CoverageDisplayProps) {
  if (coveragePercent === null) {
    return (
      <div
        data-testid="coverage-display"
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-muted)",
        }}
      >
        No coverage data
      </div>
    );
  }

  return (
    <div
      data-testid="coverage-display"
      className="rounded-lg border p-6 flex flex-col items-center gap-1"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        Line Coverage
      </span>
      <span
        data-testid="coverage-value"
        className="text-4xl font-bold"
        style={{ color: getCoverageColor(coveragePercent) }}
      >
        {coveragePercent}%
      </span>
    </div>
  );
}
