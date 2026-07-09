"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/currency";
import { useDashboardData } from "@/components/DashboardContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  order_status: "#6366F1",
  refund: "#A78BFA",
  sensitive_data: "#F87171",
  general_faq: "#34D399",
};
const CATEGORY_LABELS: Record<string, string> = {
  order_status: "Order Status",
  refund: "Refund",
  sensitive_data: "Sensitive Data",
  general_faq: "General FAQ",
};
const MODEL_COLORS = ["#6366F1", "#34D399", "#FBBF24", "#A78BFA"];

const tooltipStyle = {
  background: "#1A1B1E",
  border: "1px solid rgba(38,39,43,0.8)",
  color: "#F5F5F7",
  borderRadius: "8px",
  fontSize: "11px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
};

export default function AnalyticsPage() {
  const { events } = useDashboardData();

  const costByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => { map[e.category] = (map[e.category] ?? 0) + (e.audit_event.cost_total ?? 0); });
    return Object.entries(map)
      .map(([name, value]) => ({ name: CATEGORY_LABELS[name] ?? name, value, rawName: name }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const modelUsage = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => { const m = e.audit_event.model || "unknown"; map[m] = (map[m] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const latencyHistogram = useMemo(() => {
    const bins = [0, 500, 1000, 2000, 5000];
    const labels = ["<500ms", "0.5-1s", "1-2s", "2-5s", ">5s"];
    const counts = [0, 0, 0, 0, 0];
    events.forEach(e => {
      const l = e.audit_event.latency_used_ms ?? 0;
      if (l < bins[1]) counts[0]++;
      else if (l < bins[2]) counts[1]++;
      else if (l < bins[3]) counts[2]++;
      else if (l < bins[4]) counts[3]++;
      else counts[4]++;
    });
    return labels.map((name, i) => ({ name, count: counts[i] }));
  }, [events]);

  const costTrend = useMemo(() => {
    let cum = 0;
    return [...events].reverse().map((e, i) => {
      cum += e.audit_event.cost_total ?? 0;
      return { index: i, cost: e.audit_event.cost_total ?? 0, cumulative: cum };
    });
  }, [events]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Cost by Category */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>Total Cost by Category</h3>
          <p style={{ margin: "0 0 20px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Cumulative spend per query type</p>
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tickFormatter={v => formatINR(Number(v), 3)} stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#5C5D63" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#9B9CA3" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [formatINR(value, 5), "Cost"]} contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive animationDuration={1200}>
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.rawName] ?? "#5C5D63"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>Model Distribution</h3>
          <p style={{ margin: "0 0 16px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Queries routed to each model</p>
          <div style={{ height: "180px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modelUsage} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="rgba(20,20,22,0.8)" strokeWidth={2} isAnimationActive animationDuration={1000}>
                  {modelUsage.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
            {modelUsage.map((entry, index) => {
              const total = modelUsage.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
              return (
                <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--color-surface-elevated)", borderRadius: "6px", border: "1px solid var(--color-border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: MODEL_COLORS[index % MODEL_COLORS.length], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{entry.name}</span>
                  </div>
                  <span className="font-mono-data" style={{ fontSize: "12px", color: "var(--color-text-primary)", fontWeight: 700 }}>{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latency Distribution */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>Latency Distribution</h3>
          <p style={{ margin: "0 0 20px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Response times across all queries</p>
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistogram} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#5C5D63" }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#5C5D63" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} />
                <Bar dataKey="count" fill="url(#latencyGrad)" radius={[4, 4, 0, 0]} barSize={20} name="Queries" isAnimationActive animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Spend */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>Cumulative Spend</h3>
          <p style={{ margin: "0 0 20px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Total cost growth over time</p>
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="index" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#5C5D63" }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: "#5C5D63" }} tickFormatter={v => formatINR(Number(v), 2)} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [formatINR(value, 5), "Cost"]} labelFormatter={(v) => `Query #${v}`} contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} />
                <Line type="monotone" dataKey="cumulative" stroke="#818CF8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#6366F1", stroke: "#141416", strokeWidth: 2 }} name="Total Spend" isAnimationActive animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
