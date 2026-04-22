"use client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type Milestone = { id?: string; name: string; points: number };

export function PointsChart({
  data,
  milestones = [],
}: {
  data: { label: string; net: number; running: number }[];
  milestones?: Milestone[];
}) {
  if (!data.length) return <p className="text-blush/50 text-sm">No activity yet.</p>;

  const palette = ["#f3c7d1", "#d65a7a", "#b8143c", "#6b0a24", "#9d1b3a"];

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Points per bucket</p>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#14090e", border: "1px solid rgba(255,255,255,0.1)", color: "#f3c7d1" }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="net" fill="#b8143c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="label">Running total{milestones.length ? ` · ${milestones.length} milestone${milestones.length === 1 ? "" : "s"}` : ""}</p>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#14090e", border: "1px solid rgba(255,255,255,0.1)", color: "#f3c7d1" }} />
              {milestones.map((m, i) => (
                <ReferenceLine
                  key={m.id ?? i}
                  y={m.points}
                  stroke={palette[i % palette.length]}
                  strokeDasharray="4 4"
                  label={{ value: `${m.name} · ${m.points}`, fill: palette[i % palette.length], fontSize: 10, position: "insideTopRight" }}
                />
              ))}
              <Line type="monotone" dataKey="running" stroke="#d65a7a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
