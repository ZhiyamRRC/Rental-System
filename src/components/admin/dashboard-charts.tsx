"use client";

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartPoint = { day: string; revenue: number; count: number };
export type StatusSlice = { name: string; value: number; color: string };

const tooltipStyle = {
  backgroundColor: "#0e1114",
  border: "1px solid #232a31",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#f2ecdf",
} as const;

export function DashboardCharts({
  series,
  statusDist,
  mode,
}: {
  series: ChartPoint[];
  statusDist: StatusSlice[];
  mode: "area" | "donut";
}) {
  if (mode === "area") {
    return (
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d12" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ff4d12" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fill: "#8b94a0", fontSize: 11 }}
              axisLine={{ stroke: "#232a31" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: "#8b94a0", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#232a31" }} />
            <Area
              type="monotone"
              dataKey="count"
              name="Bookings"
              stroke="#ff4d12"
              strokeWidth={2.5}
              fill="url(#rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusDist}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              strokeWidth={0}
            >
              {statusDist.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-2">
        {statusDist.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-smoke capitalize">{s.name}</span>
            <span className="ml-auto font-display font-bold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
