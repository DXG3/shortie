"use client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export function PointsChart({
  data,
  target,
}: {
  data: { day: string; net: number; running: number }[];
  target?: number;
}) {
  if (!data.length) return <p className="text-blush/50 text-sm">No activity yet.</p>;
  return (
    <div className="space-y-6">
      <div>
        <p className="label">Daily net (last 30 days)</p>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#14090e", border: "1px solid rgba(255,255,255,0.1)", color: "#f3c7d1" }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="net" fill="#b8143c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="label">Running total{target ? ` · target ${target}` : ""}</p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#d65a7a", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#14090e", border: "1px solid rgba(255,255,255,0.1)", color: "#f3c7d1" }} />
              {target && target > 0 && (
                <ReferenceLine
                  y={target}
                  stroke="#f3c7d1"
                  strokeDasharray="4 4"
                  label={{ value: `target ${target}`, fill: "#f3c7d1", fontSize: 10, position: "insideTopRight" }}
                />
              )}
              <Line type="monotone" dataKey="running" stroke="#d65a7a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
