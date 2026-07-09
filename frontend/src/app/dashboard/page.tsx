"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { deleteSession, type EventRecord } from "@/lib/api";
import { formatINR } from "@/lib/currency";
import { useDashboardData } from "@/components/DashboardContext";
import { showToast } from "@/components/Toast";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  order_status: "#0D9488",
  refund: "#6366F1",
  sensitive_data: "#DC2626",
  general_faq: "#16A34A",
};
const CATEGORY_LABELS: Record<string, string> = {
  order_status: "Order Status",
  refund: "Refund",
  sensitive_data: "Sensitive Data",
  general_faq: "General FAQ",
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
const formatLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;

function ActionBadge({ action }: { action: string }) {
  if (action === "allow")
    return <span className="badge badge-allow"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />Allow</span>;
  if (action === "stop")
    return <span className="badge badge-stop"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />Stop</span>;
  return <span className="badge badge-switch">{action}</span>;
}

function StatCard({ label, value, sub, color, icon, trend }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode; trend?: string;
}) {
  return (
    <div className="card card-hover" style={{ padding: "18px 20px", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <p className="font-mono-data" style={{ margin: "5px 0 0", fontSize: "26px", fontWeight: 700, color: "#F3F4F6", lineHeight: 1, wordBreak: "break-all" }}>{value}</p>
          {sub && <p style={{ margin: "5px 0 0", fontSize: "11.5px", color: "#9CA3AF" }}>{sub}</p>}
          {trend && <p style={{ margin: "4px 0 0", fontSize: "11.5px", color }}>{trend}</p>}
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { events, insights, refreshData: fetchData } = useDashboardData();
  const [resetting, setResetting] = useState(false);
  const [uptime, setUptime] = useState("00:00");
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const e = Date.now() - sessionStart.current;
      const m = Math.floor(e / 60000), s = Math.floor((e % 60000) / 1000);
      setUptime(`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await deleteSession();
      sessionStart.current = Date.now();
      setUptime("00:00");
      showToast(res?.message ?? "Session reset successfully!", "success");
      await fetchData();
    } catch (e: any) {
      showToast(e?.message ?? "Failed to reset session", "error");
    } finally {
      setResetting(false);
    }
  };

  const latest = events[0]?.audit_event;
  const isWarning = latest && (latest.action === "stop" || (latest.budget_state?.remaining ?? 1) <= 0);

  const budget = useMemo(() => {
    if (!latest?.budget_state) return { remaining: 0.02, max: 0.02, pct: 100 };
    const { remaining, max } = latest.budget_state;
    return { remaining, max, pct: Math.max(0, (remaining / max) * 100) };
  }, [latest]);

  const totalCost = useMemo(() => events.reduce((s, e) => s + (e.audit_event.cost_total ?? 0), 0), [events]);
  const avgLatency = useMemo(() => {
    if (!events.length) return 0;
    return events.reduce((s, e) => s + (e.audit_event.latency_used_ms ?? 0), 0) / events.length;
  }, [events]);
  const blockRate = useMemo(() => {
    if (!events.length) return 0;
    return (events.filter(e => e.audit_event.action === "stop").length / events.length) * 100;
  }, [events]);

  const chartData = useMemo(() => {
    let cum = 0;
    return [...events].reverse().map((r, i) => {
      cum += r.audit_event.cost_total ?? 0;
      return { i, cost: r.audit_event.cost_total ?? 0, cumulative: cum, time: formatTime(r.timestamp_ms) };
    });
  }, [events]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(r => { counts[r.category] = (counts[r.category] ?? 0) + 1; });
    return Object.entries(counts).map(([cat, value]) => ({
      name: CATEGORY_LABELS[cat] ?? cat, value,
      color: CATEGORY_COLORS[cat] ?? "#6B7280",
    }));
  }, [events]);

  const budgetBarColor = isWarning ? "#DC2626" : budget.pct < 40 ? "#D97706" : "#0D9488";

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top action row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="status-dot online" />
          <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#9CA3AF" }}>
            Live · {uptime} · {events.length} events
          </span>
        </div>
        <button
          id="reset-session-btn"
          onClick={handleReset}
          disabled={resetting}
          className="btn btn-danger"
          style={{ fontSize: "13px", padding: "6px 14px" }}
        >
          {resetting ? <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14 }}>↻</span> : (
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Reset Session
        </button>
      </div>

      {/* Stat cards — responsive grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <StatCard label="Budget Remaining" value={formatINR(budget.remaining, 4)}
          sub={`of ${formatINR(budget.max)} cap`}
          color={isWarning ? "#DC2626" : budget.pct < 40 ? "#D97706" : "#0D9488"}
          trend={isWarning ? "⚠ Budget exceeded!" : undefined}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Total Spend" value={formatINR(totalCost, 5)}
          sub={`across ${events.length} queries`} color="#6366F1"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard label="Avg Latency" value={formatLatency(avgLatency)}
          sub="per query" color="#16A34A"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard label="Block Rate" value={`${blockRate.toFixed(0)}%`}
          sub="queries stopped by policy" color={blockRate > 20 ? "#DC2626" : "#D97706"}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
      </div>

      {/* Budget bar */}
      <div className={`card${isWarning ? " animate-pulse-warning" : ""}`} style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Budget Consumption</p>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#F3F4F6" }}>
              <span className="font-mono-data" style={{ fontWeight: 700, color: budgetBarColor }}>{(100 - budget.pct).toFixed(1)}%</span>
              {" used · "}
              {isWarning ? "Budget exhausted — reset session to continue" : `${formatINR(budget.remaining, 5)} remaining`}
            </p>
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: budgetBarColor, background: `${budgetBarColor}18`, padding: "4px 10px", borderRadius: "999px" }}>
            {isWarning ? "EXCEEDED" : budget.pct > 60 ? "HEALTHY" : "LOW"}
          </span>
        </div>
        <div className="progress-track">
          <motion.div className="progress-fill"
            initial={{ width: "100%" }}
            animate={{ width: `${budget.pct}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            style={{ background: budgetBarColor }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
          <span className="font-mono-data" style={{ fontSize: "10.5px", color: "#9CA3AF" }}>{formatINR(0)}</span>
          <span className="font-mono-data" style={{ fontSize: "10.5px", color: "#9CA3AF" }}>{formatINR(budget.max)}</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", maxWidth: "1200px" }}>
        {/* Cost curve */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#F3F4F6", fontSize: "13.5px" }}>Cost Curve</p>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#9CA3AF" }}>Per-query cost + cumulative</p>
            </div>
            <span className="font-mono-data" style={{ fontSize: "10.5px", color: "#9CA3AF", background: "rgba(17,24,39,0.4)", padding: "3px 8px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.12)" }}>{chartData.length} pts</span>
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.2" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 9 }} tickFormatter={v => formatINR(Number(v), 3)} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", borderRadius: "8px", fontSize: "11px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }} />
                <Area type="monotone" dataKey="cost" name="Per-query" stroke="#0D9488" strokeWidth={3} fill="url(#gTeal)" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#6366F1" strokeWidth={3} fill="url(#gIndigo)" style={{ filter: "url(#shadow)" }} dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category mix */}
        <div className="card" style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#F3F4F6", fontSize: "13.5px" }}>Category Mix</p>
          <p style={{ margin: "0 0 14px", fontSize: "11.5px", color: "#9CA3AF" }}>Query distribution by type</p>
          {categoryData.length > 0 ? (
            <>
              <div style={{ height: "130px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={2} stroke="rgba(255,255,255,0.12)" isAnimationActive={true} animationDuration={1000} animationBegin={200} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", borderRadius: "8px", fontSize: "11px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                {categoryData.map(d => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "#D1D5DB" }}>{d.name}</span>
                    </div>
                    <span className="font-mono-data" style={{ fontSize: "12px", color: "#F3F4F6", fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: "20px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#6B7280" }}>No queries yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent events table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#F3F4F6", fontSize: "13.5px" }}>Recent Events</p>
            <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#9CA3AF" }}>Latest 8 audit decisions</p>
          </div>
          <Link href="/dashboard/events" className="btn btn-ghost" style={{ fontSize: "12px", padding: "5px 12px" }}>
            View all →
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Category</th>
                <th>Model</th>
                <th className="right">Cost</th>
                <th className="right">Latency</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {events.slice(0, 8).map((r, i) => (
                  <motion.tr key={`${r.timestamp_ms}-${i}`}
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <td className="font-mono-data" style={{ color: "#9CA3AF", fontSize: "11.5px" }}>{formatTime(r.timestamp_ms)}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12.5px", fontWeight: 500, color: CATEGORY_COLORS[r.category] ?? "#9CA3AF" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: CATEGORY_COLORS[r.category] ?? "#9CA3AF", display: "inline-block" }} />
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    </td>
                    <td className="font-mono-data" style={{ fontSize: "11.5px", color: "#D1D5DB" }}>{r.audit_event.model ?? "—"}</td>
                    <td className="font-mono-data right" style={{ fontSize: "12px", fontWeight: 600 }}>{formatINR(r.audit_event.cost_total ?? 0, 5)}</td>
                    <td className="font-mono-data right" style={{ color: "#9CA3AF", fontSize: "11.5px" }}>{formatLatency(r.audit_event.latency_used_ms ?? 0)}</td>
                    <td className="right"><ActionBadge action={r.audit_event.action} /></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {events.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF" }}>No events — <Link href="/dashboard/query" style={{ color: "#14B8A6", fontWeight: 600 }}>submit a query</Link> to begin.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {[
          { label: "Live Query", desc: "Submit queries to Groq", href: "/dashboard/query", color: "#0D9488" },
          { label: "Analytics", desc: "Deep cost analysis", href: "/dashboard/analytics", color: "#6366F1" },
          { label: "Session", desc: "Manage budget & reset", href: "/dashboard/session", color: "#D97706" },
          { label: "Health", desc: "Backend status check", href: "/dashboard/health", color: "#16A34A" },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div className="card card-hover" style={{ padding: "14px 16px", borderLeft: `3px solid ${item.color}`, cursor: "pointer" }}>
              <p style={{ margin: "0 0 3px", fontWeight: 600, color: "#F3F4F6", fontSize: "13px" }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#9CA3AF" }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
