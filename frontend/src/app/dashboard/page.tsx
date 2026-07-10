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
import {
  DollarSign, TrendingUp, Zap, ShieldAlert, Clock, ArrowRight,
} from "lucide-react";

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

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Asia/Kolkata",
  });
const formatLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;

function ActionBadge({ action }: { action: string }) {
  if (action === "allow")
    return <span className="badge badge-allow">Allow</span>;
  if (action === "stop")
    return <span className="badge badge-stop">Stop</span>;
  return <span className="badge badge-switch">{action}</span>;
}

function StatCard({ label, value, sub, color, icon, trend }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode; trend?: string;
}) {
  return (
    <div className="card card-hover" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(circle at top right, ${color}08, transparent)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <p className="font-mono-data" style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{value}</p>
          {sub && <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: "var(--color-text-muted)" }}>{sub}</p>}
          {trend && <p style={{ margin: "5px 0 0", fontSize: "11.5px", color, fontWeight: 600 }}>{trend}</p>}
        </div>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
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

  const totalCost   = useMemo(() => events.reduce((s, e) => s + (e.audit_event.cost_total ?? 0), 0), [events]);
  const avgLatency  = useMemo(() => {
    if (!events.length) return 0;
    return events.reduce((s, e) => s + (e.audit_event.latency_used_ms ?? 0), 0) / events.length;
  }, [events]);
  const blockRate   = useMemo(() => {
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
      color: CATEGORY_COLORS[cat] ?? "#5C5D63",
    }));
  }, [events]);

  const budgetBarColor = isWarning ? "#F87171" : budget.pct < 40 ? "#FBBF24" : "#34D399";

  const tooltipStyle = {
    background: "#1A1B1E",
    border: "1px solid rgba(38,39,43,0.8)",
    color: "#F5F5F7",
    borderRadius: "8px",
    fontSize: "11px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)"
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top action row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="status-dot online" />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Live
            <span className="font-mono-data" style={{ margin: "0 4px", color: "var(--color-text-muted)" }}>·</span>
            <span className="font-mono-data" style={{ color: "var(--color-text-muted)" }}>{uptime}</span>
            <span className="font-mono-data" style={{ margin: "0 4px", color: "var(--color-text-muted)" }}>·</span>
            <span style={{ color: "var(--color-text-muted)" }}>{events.length} events</span>
          </span>
        </div>
        <button onClick={handleReset} disabled={resetting} className="btn btn-danger" style={{ fontSize: "12px", padding: "6px 14px" }}>
          {resetting ? <span className="animate-spin" style={{ display: "inline-block", width: 13, height: 13 }}>↻</span> : (
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Reset Session
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <StatCard label="Budget Remaining" value={formatINR(budget.remaining, 4)}
          sub={`of ${formatINR(budget.max)} cap`}
          color={isWarning ? "#F87171" : budget.pct < 40 ? "#FBBF24" : "#34D399"}
          trend={isWarning ? "Budget exceeded!" : undefined}
          icon={<DollarSign size={18} />}
        />
        <StatCard label="Total Spend" value={formatINR(totalCost, 5)}
          sub={`across ${events.length} queries`} color="#6366F1"
          icon={<TrendingUp size={18} />}
        />
        <StatCard label="Avg Latency" value={formatLatency(avgLatency)}
          sub="per query" color="#A78BFA"
          icon={<Zap size={18} />}
        />
        <StatCard label="Block Rate" value={`${blockRate.toFixed(0)}%`}
          sub="queries stopped by policy" color={blockRate > 20 ? "#F87171" : "#FBBF24"}
          icon={<ShieldAlert size={18} />}
        />
      </div>

      {/* Budget bar */}
      <div className={`card${isWarning ? " animate-pulse-warning" : ""}`} style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Budget Consumption</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
              <span className="font-mono-data" style={{ fontWeight: 700, color: budgetBarColor }}>{(100 - budget.pct).toFixed(1)}%</span>
              {" used · "}
              <span style={{ color: "var(--color-text-muted)" }}>{isWarning ? "Budget exhausted — reset session to continue" : `${formatINR(budget.remaining, 5)} remaining`}</span>
            </p>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: budgetBarColor, background: `${budgetBarColor}18`, padding: "4px 12px", borderRadius: "999px", border: `1px solid ${budgetBarColor}30` }}>
            {isWarning ? "EXCEEDED" : budget.pct > 60 ? "HEALTHY" : "LOW"}
          </span>
        </div>
        <div className="progress-track" style={{ height: "8px" }}>
          <motion.div className="progress-fill"
            initial={{ width: "100%" }}
            animate={{ width: `${budget.pct}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            style={{ background: budgetBarColor }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span className="font-mono-data" style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{formatINR(0)}</span>
          <span className="font-mono-data" style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{formatINR(budget.max)}</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {/* Cost curve */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13.5px" }}>Cost Curve</p>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Per-query cost + cumulative</p>
            </div>
            <span className="font-mono-data" style={{ fontSize: "10.5px", color: "var(--color-text-muted)", background: "var(--color-surface-elevated)", padding: "3px 10px", borderRadius: "6px", border: "1px solid var(--color-border-subtle)" }}>{chartData.length} pts</span>
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAccent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 9, fill: "#5C5D63" }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 9, fill: "#5C5D63" }} tickFormatter={v => formatINR(Number(v), 3)} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} />
                <Area type="monotone" dataKey="cost" name="Per-query" stroke="#6366F1" strokeWidth={2} fill="url(#gAccent)" dot={false} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#A78BFA" strokeWidth={2} fill="url(#gPurple)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category mix */}
        <div className="card" style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13.5px" }}>Category Mix</p>
          <p style={{ margin: "0 0 14px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Query distribution by type</p>
          {categoryData.length > 0 ? (
            <>
              <div style={{ height: "130px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={2} stroke="#141416">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#F5F5F7" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                {categoryData.map(d => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: "12.5px", color: "var(--color-text-secondary)" }}>{d.name}</span>
                    </div>
                    <span className="font-mono-data" style={{ fontSize: "12.5px", color: "var(--color-text-primary)", fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: "20px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>No queries yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent events table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13.5px" }}>Recent Events</p>
            <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Latest 8 audit decisions</p>
          </div>
          <Link href="/dashboard/events" className="btn btn-ghost" style={{ fontSize: "11.5px", padding: "5px 12px" }}>
            View all <ArrowRight size={12} />
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
                    <td className="font-mono-data" style={{ color: "var(--color-text-muted)", fontSize: "11.5px" }}>{formatTime(r.timestamp_ms)}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: CATEGORY_COLORS[r.category] ?? "var(--color-text-muted)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: CATEGORY_COLORS[r.category] ?? "var(--color-text-muted)", display: "inline-block" }} />
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    </td>
                    <td className="font-mono-data" style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>{r.audit_event.model ?? "—"}</td>
                    <td className="font-mono-data right" style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{formatINR(r.audit_event.cost_total ?? 0, 5)}</td>
                    <td className="font-mono-data right" style={{ color: "var(--color-text-muted)", fontSize: "11.5px" }}>{formatLatency(r.audit_event.latency_used_ms ?? 0)}</td>
                    <td className="right"><ActionBadge action={r.audit_event.action} /></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {events.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>No events — <Link href="/dashboard/query" style={{ color: "var(--color-accent-light)", fontWeight: 600 }}>submit a query</Link> to begin.</p>
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
          { label: "Live Query",  desc: "Submit queries to Groq",  href: "/dashboard/query",     color: "#6366F1" },
          { label: "Analytics",   desc: "Deep cost analysis",       href: "/dashboard/analytics", color: "#A78BFA" },
          { label: "Session",     desc: "Manage budget & reset",    href: "/dashboard/session",   color: "#FBBF24" },
          { label: "Health",      desc: "Backend status check",     href: "/dashboard/health",    color: "#34D399" },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div className="card card-hover" style={{ padding: "16px 18px", borderLeft: `3px solid ${item.color}`, cursor: "pointer" }}>
              <p style={{ margin: "0 0 3px", fontWeight: 700, color: "var(--color-text-primary)", fontSize: "12.5px" }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-text-muted)" }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
