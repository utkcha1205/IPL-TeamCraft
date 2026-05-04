"use client";

import type { AggregateResult } from "@/lib/testDashboardUtils";

interface AggregateSummaryProps {
  aggregate: AggregateResult;
  coveragePercent?: number | null;
}

export default function AggregateSummary({ aggregate, coveragePercent }: AggregateSummaryProps) {
  const { totalTests, totalPass, totalFail, passRate } = aggregate;

  if (totalTests === 0) {
    return (
      <div
        data-testid="aggregate-summary"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-muted)",
        }}
        className="rounded-lg border p-6 text-center"
      >
        No test data available
      </div>
    );
  }

  const passRateColor = passRate >= 80 ? "#22c55e" : passRate >= 50 ? "#eab308" : "#ef4444";
  const coverageColor =
    coveragePercent != null
      ? coveragePercent >= 80
        ? "#22c55e"
        : coveragePercent >= 50
          ? "#eab308"
          : "#ef4444"
      : "var(--text-muted)";

  const stats: { label: string; value: string | number; color?: string }[] = [
    { label: "Total Tests", value: totalTests },
    { label: "Passed", value: totalPass, color: "#22c55e" },
    { label: "Failed", value: totalFail, color: totalFail > 0 ? "#ef4444" : undefined },
    { label: "Pass Rate", value: `${passRate.toFixed(1)}%`, color: passRateColor },
    {
      label: "Line Coverage",
      value: coveragePercent != null ? `${coveragePercent.toFixed(1)}%` : "N/A",
      color: coverageColor,
    },
  ];

  return (
    <div
      data-testid="aggregate-summary"
      className="rounded-lg border p-6"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex flex-wrap justify-around gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </span>
            <span
              className="text-2xl font-bold"
              style={{
                color: stat.color ?? "var(--text-primary)",
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
