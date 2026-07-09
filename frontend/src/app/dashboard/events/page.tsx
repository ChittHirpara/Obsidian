"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/components/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";

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
  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

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
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Controls */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1, minWidth: "250px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="input"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <select
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "auto" }}
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
            <span className="font-mono-data" style={{ fontSize: "12px", color: "#9CA3AF" }}>{filtered.length} results</span>
            <button onClick={downloadCSV} className="btn btn-ghost" disabled={filtered.length === 0} style={{ padding: "6px 14px", fontSize: "13px" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden", position: "relative" }}>
        {loading && events.length === 0 ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #0D9488", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
                    const catColor = CATEGORY_COLORS[r.category] ?? "#9CA3AF";
                    return (
                      <motion.tr
                        key={`${r.timestamp_ms}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <td className="font-mono-data" style={{ color: "#9CA3AF", fontSize: "11.5px", whiteSpace: "nowrap" }}>
                          {new Date(r.timestamp_ms).toLocaleString("en-US", { 
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" 
                          })}
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500, color: catColor }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, display: "inline-block", flexShrink: 0 }} />
                            {CATEGORY_LABELS[r.category] ?? r.category}
                          </span>
                        </td>
                        <td className="font-mono-data" style={{ fontSize: "12px", color: "#D1D5DB" }}>
                          {r.audit_event.model ?? <span style={{ color: "#9CA3AF" }}>—</span>}
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
                        <td className="font-mono-data right" style={{ fontSize: "12px", fontWeight: 600 }}>
                          {r.audit_event.cost_total != null ? `$${r.audit_event.cost_total.toFixed(5)}` : "—"}
                        </td>
                        <td className="font-mono-data right" style={{ color: "#9CA3AF", fontSize: "12px" }}>
                          {r.audit_event.latency_used_ms != null ? formatLatency(r.audit_event.latency_used_ms) : "—"}
                        </td>
                        <td className="font-mono-data right" style={{ fontSize: "12px" }}>
                          {r.audit_event.budget_state?.remaining != null ? `$${r.audit_event.budget_state.remaining.toFixed(4)}` : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: "60px 20px" }}>
                         <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5} style={{ marginBottom: "8px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p style={{ margin: 0, fontWeight: 600, color: "#F3F4F6", fontSize: "14px" }}>No events found</p>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9CA3AF" }}>Try adjusting your filters or search query.</p>
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
