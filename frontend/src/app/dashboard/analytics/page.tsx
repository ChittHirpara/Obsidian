"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/currency";
import { useDashboardData } from "@/components/DashboardContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ReferenceLine,
} from "recharts";
import { BarChart3, TrendingUp, Clock, Cpu } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  order_status:   "#6366F1",
  refund:         "#A78BFA",
  sensitive_data: "#F87171",
  general_faq:    "#34D399",
};
const CATEGORY_LABELS: Record<string, string> = {
  order_status:   "Order Status",
  refund:         "Refund",
  sensitive_data: "Sensitive Data",
  general_faq:    "General FAQ",
};
const MODEL_COLORS = ["#6366F1", "#34D399", "#FBBF24", "#A78BFA", "#F472B6"];

const tooltipStyle = {
  background: "rgba(15, 16, 24, 0.95)",
  border: "1px solid rgba(99,102,241,0.2)",
  color: "#F0F0FF",
  borderRadius: 10,
  fontSize: 11,
  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  backdropFilter: "blur(12px)",
};

function KpiCard({ label, value, sub, color, icon, delay = 0 }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card"
      style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${color}15, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${color}35, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
          <p className="stat-number" style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "var(--color-text-muted)" }}>{sub}</p>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}10`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

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
    const labels = ["<500ms", "0.5–1s", "1–2s", "2–5s", ">5s"];
    const counts = [0, 0, 0, 0, 0];
    events.forEach(e => {
      const l = e.audit_event.latency_used_ms ?? 0;
      if (l < 500) counts[0]++;
      else if (l < 1000) counts[1]++;
      else if (l < 2000) counts[2]++;
      else if (l < 5000) counts[3]++;
      else counts[4]++;
    });
    return labels.map((name, i) => ({ name, count: counts[i] }));
  }, [events]);

  const costTrend = useMemo(() => {
    let cum = 0;
    return [...events].reverse().map((e, i) => {
      if (e.category !== "__demo_marker__") {
        cum += e.audit_event.cost_total ?? 0;
      }
      return { 
        index: i, 
        cost: e.audit_event.cost_total ?? 0, 
        cumulative: cum,
        isMarker: e.category === "__demo_marker__",
        markerLabel: e.category === "__demo_marker__" ? e.audit_event.reason : undefined
      };
    });
  }, [events]);

  const totalCost   = useMemo(() => events.reduce((s, e) => s + (e.audit_event.cost_total ?? 0), 0), [events]);
  const avgLatency  = useMemo(() => events.length ? events.reduce((s, e) => s + (e.audit_event.latency_used_ms ?? 0), 0) / events.length : 0, [events]);
  const uniqueModels = useMemo(() => new Set(events.map(e => e.audit_event.model).filter(Boolean)).size, [events]);
  const blockRate   = useMemo(() => events.length ? (events.filter(e => e.audit_event.action === "stop").length / events.length * 100) : 0, [events]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="section-header"
      >
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={18} style={{ color: "#F472B6" }} />
          </div>
          Analytics
        </h1>
        <p>Cost breakdowns, model distribution, and latency patterns across all governance events.</p>
      </motion.div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <KpiCard delay={0}    label="Total Spend"   value={formatINR(totalCost, 5)} sub={`${events.length} queries`}      color="#6366F1" icon={<TrendingUp size={18} />} />
        <KpiCard delay={0.06} label="Avg Latency"   value={`${avgLatency.toFixed(0)}ms`} sub="per query"             color="#A78BFA" icon={<Clock size={18} />} />
        <KpiCard delay={0.12} label="Models Used"   value={`${uniqueModels}`}       sub="distinct models"              color="#34D399" icon={<Cpu size={18} />} />
        <KpiCard delay={0.18} label="Block Rate"    value={`${blockRate.toFixed(1)}%`} sub="stopped by policy"        color={blockRate > 20 ? "#F87171" : "#FBBF24"} icon={<BarChart3 size={18} />} />
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>

        {/* Cost by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
          style={{ padding: "24px" }}
        >
          <p style={{ margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>Cost by Category</p>
          <p style={{ margin: "0 0 20px", fontSize: 11.5, color: "var(--color-text-muted)" }}>Cumulative spend per query type</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 44, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="rgba(99,102,241,0.06)" />
                <XAxis type="number" tickFormatter={v => formatINR(Number(v), 3)} stroke="transparent" tick={{ fontSize: 10, fill: "#4E5170" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="transparent" tick={{ fontSize: 11, fill: "#9094B0" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [formatINR(value, 5), "Cost"]} contentStyle={tooltipStyle} itemStyle={{ color: "#F0F0FF" }} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={18} isAnimationActive animationDuration={1200}>
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.rawName] ?? "#5C5D63"} style={{ filter: `drop-shadow(0 0 4px ${CATEGORY_COLORS[entry.rawName] ?? "#5C5D63"}60)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Model Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="card"
          style={{ padding: "24px", display: "flex", flexDirection: "column" }}
        >
          <p style={{ margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>Model Distribution</p>
          <p style={{ margin: "0 0 16px", fontSize: 11.5, color: "var(--color-text-muted)" }}>Queries routed to each model</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelUsage}
                  cx="50%" cy="50%"
                  innerRadius={54} outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="rgba(7,8,12,0.8)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={1000}
                >
                  {modelUsage.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} style={{ filter: `drop-shadow(0 0 5px ${MODEL_COLORS[index % MODEL_COLORS.length]}50)` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#F0F0FF" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {modelUsage.map((entry, index) => {
              const total = modelUsage.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
              const color = MODEL_COLORS[index % MODEL_COLORS.length];
              return (
                <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "var(--color-surface-elevated)", borderRadius: 8, border: "1px solid var(--color-border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 6px ${color}80` }} />
                    <span className="font-mono-data" style={{ fontSize: 11.5, color: "var(--color-text-secondary)" }}>{entry.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: 2 }} />
                    </div>
                    <span className="font-mono-data" style={{ fontSize: 12, color: "var(--color-text-primary)", fontWeight: 700, minWidth: 28, textAlign: "right" }}>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Latency Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="card"
          style={{ padding: "24px" }}
        >
          <p style={{ margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>Latency Distribution</p>
          <p style={{ margin: "0 0 20px", fontSize: 11.5, color: "var(--color-text-muted)" }}>Response times across all queries</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistogram} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366F1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(99,102,241,0.06)" />
                <XAxis dataKey="name" stroke="transparent" tick={{ fontSize: 10, fill: "#4E5170" }} axisLine={false} tickLine={false} />
                <YAxis stroke="transparent" tick={{ fontSize: 10, fill: "#4E5170" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(99,102,241,0.04)" }} contentStyle={tooltipStyle} itemStyle={{ color: "#F0F0FF" }} />
                <Bar dataKey="count" fill="url(#latencyGrad)" radius={[5, 5, 0, 0]} barSize={22} name="Queries" isAnimationActive animationDuration={1200} style={{ filter: "drop-shadow(0 0 4px rgba(99,102,241,0.4))" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cumulative Spend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="card"
          style={{ padding: "24px" }}
        >
          <p style={{ margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>Cumulative Spend</p>
          <p style={{ margin: "0 0 20px", fontSize: 11.5, color: "var(--color-text-muted)" }}>Total cost growth over queries</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrend} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#818CF8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(99,102,241,0.06)" />
                <XAxis dataKey="index" stroke="transparent" tick={{ fontSize: 10, fill: "#4E5170" }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis stroke="transparent" tick={{ fontSize: 10, fill: "#4E5170" }} tickFormatter={v => formatINR(Number(v), 2)} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [formatINR(value, 5), "Cost"]} labelFormatter={(v) => `Event #${v}`} contentStyle={tooltipStyle} itemStyle={{ color: "#F0F0FF" }} />
                <Area type="monotone" dataKey="cumulative" stroke="#818CF8" strokeWidth={2.5} fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: "#6366F1", stroke: "#07080C", strokeWidth: 3 }} name="Total Spend" isAnimationActive animationDuration={1500} style={{ filter: "drop-shadow(0 0 4px rgba(129,140,248,0.6))" }} />
                {costTrend.filter(d => d.isMarker).map(d => (
                  <ReferenceLine key={`marker-${d.index}`} x={d.index} stroke="#FBBF24" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: d.markerLabel, fill: '#FBBF24', fontSize: 10, offset: 10 }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
