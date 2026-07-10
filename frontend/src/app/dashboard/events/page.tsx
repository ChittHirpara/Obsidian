"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/components/DashboardContext";
import { formatINR } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, ScrollText } from "lucide-react";

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

export default function EventsPage() {
  const { events, isLoading: loading } = useDashboardData();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = events;
    if (filter !== "all") {
      list = list.filter((e) => {
        if (filter === "allow" || filter === "stop") return e.audit_event.action === filter;
        return e.category === filter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.category.toLowerCase().includes(q) ||
        (e.audit_event.model || "").toLowerCase().includes(q) ||
        e.audit_event.action.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, filter, search]);

  const downloadCSV = () => {
    const headers = ["Timestamp", "Category", "Model", "Action", "Cost", "Latency (ms)", "Budget Remaining", "Mode"];
    const rows = filtered.map(e => [
      new Date(e.timestamp_ms).toISOString(),
      e.category,
      e.audit_event.model ?? "",
      e.audit_event.action,
      e.audit_event.cost_total,
      e.audit_event.latency_used_ms,
      e.audit_event.budget_state?.remaining ?? "",
      e.audit_event.decision_mode ?? ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="section-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ScrollText size={18} style={{ color: "#34D399" }} />
          </div>
          Audit Trail
        </h1>
        <p>Complete log of every AI governance decision — filter, search, and export.</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1, minWidth: "250px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                className="input"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "34px" }}
              />
            </div>
            <select
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "auto", minWidth: "160px" }}
            >
              <option value="all">All Actions & Categories</option>
              <option disabled>── Actions ──</option>
              <option value="allow">Action: Allow</option>
              <option value="stop">Action: Stop</option>
              <option disabled>── Categories ──</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>Category: {v}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-muted)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 999, padding: "2px 10px" }}>{filtered.length} results</span>
            <button onClick={downloadCSV} className="btn btn-ghost" disabled={filtered.length === 0} style={{ padding: "5px 12px", fontSize: "12px" }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading && events.length === 0 ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 22, height: 22, border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Category</th>
                  <th>Model</th>
                  <th>Action</th>
                  <th className="right">Cost</th>
                  <th className="right">Latency</th>
                  <th className="right">Budget Left</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((r, i) => {
                    const catColor = CATEGORY_COLORS[r.category] ?? "#5C5D63";
                    return (
                      <motion.tr
                        key={`${r.timestamp_ms}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <td className="font-mono-data" style={{ color: "var(--color-text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {new Date(r.timestamp_ms).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                            hour12: false, timeZone: "Asia/Kolkata",
                          })}
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: catColor }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: catColor, display: "inline-block", flexShrink: 0 }} />
                            {CATEGORY_LABELS[r.category] ?? r.category}
                          </span>
                        </td>
                        <td className="font-mono-data" style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                          {r.audit_event.model ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td>
                          {r.audit_event.action === "allow" ? (
                            <span className="badge badge-allow">Allow</span>
                          ) : r.audit_event.action === "stop" ? (
                            <span className="badge badge-stop">Stop</span>
                          ) : (
                            <span className="badge badge-switch">{r.audit_event.action}</span>
                          )}
                        </td>
                        <td className="font-mono-data right" style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {r.audit_event.cost_total != null ? formatINR(r.audit_event.cost_total, 5) : "—"}
                        </td>
                        <td className="font-mono-data right" style={{ color: "var(--color-text-muted)", fontSize: "11.5px" }}>
                          {r.audit_event.latency_used_ms != null ? formatLatency(r.audit_event.latency_used_ms) : "—"}
                        </td>
                        <td className="font-mono-data right" style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                          {r.audit_event.budget_state?.remaining != null ? formatINR(r.audit_event.budget_state.remaining, 4) : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: "60px 20px" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13.5px" }}>No events found</p>
                        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)" }}>Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
