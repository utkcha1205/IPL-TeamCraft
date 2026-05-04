"use client";

import { BowlingDataPoint } from "@/data/types";
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

interface BowlingChartProps {
  data: BowlingDataPoint[];
  playerName: string;
}

export default function BowlingChart({ data, playerName }: BowlingChartProps) {
  return (
    <div aria-label={`Bowling performance trends for ${playerName}`}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="season" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="wickets" fill="#8b5cf6" name="Wickets" maxBarSize={48} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="economy"
            stroke="#f59e0b"
            name="Economy"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="average"
            stroke="#06b6d4"
            name="Average"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
