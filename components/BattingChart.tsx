"use client";

import { BattingDataPoint } from "@/data/types";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface BattingChartProps {
  data: BattingDataPoint[];
  playerName: string;
}

export default function BattingChart({ data, playerName }: BattingChartProps) {
  return (
    <div aria-label={`Batting performance trends for ${playerName}`}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="season" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="runs" fill="#3b82f6" name="Runs" maxBarSize={48} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="average"
            stroke="#ef4444"
            name="Average"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="strikeRate"
            stroke="#10b981"
            name="Strike Rate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
