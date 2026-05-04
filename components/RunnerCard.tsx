"use client";

import type { NormalizedResult } from "@/lib/reportParser";

interface RunnerCardProps {
  result: NormalizedResult;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function RunnerCard({ result }: RunnerCardProps) {
  const { runnerType, passCount, failCount, totalTests, durationMs } = result;
  const allPassed = failCount === 0;

  return (
    <article
      data-testid="runner-card"
      className="rounded-lg border p-4 shadow-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {capitalize(runnerType)}
        </h3>
        <span
          data-testid="status-indicator"
          style={{ color: allPassed ? "#22c55e" : "#ef4444" }}
        >
          {allPassed ? "●" : `● ${failCount} failed`}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Total</span>
          <span style={{ color: "var(--text-primary)" }}>{totalTests}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Passed</span>
          <span style={{ color: "#22c55e" }}>{passCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Failed</span>
          <span style={{ color: failCount > 0 ? "#ef4444" : "var(--text-primary)" }}>
            {failCount}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-muted)" }}>Duration</span>
          <span
            data-testid="duration"
            style={{ color: "var(--text-primary)" }}
          >
            {(durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </article>
  );
}
