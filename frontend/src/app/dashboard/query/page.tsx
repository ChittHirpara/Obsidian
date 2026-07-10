"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { postQuery, type QueryResponse } from "@/lib/api";
import { formatINR } from "@/lib/currency";
import { showToast } from "@/components/Toast";
import { Send, Clock } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Where is my order #12345?",
  "I want a refund for order #98765",
  "What are your return policies?",
  "My credit card was charged twice",
];

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

const formatLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;

interface HistoryItem {
  query: string;
  result: QueryResponse;
  ts: number;
}

export default function QueryPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const q = query.trim();
    if (!q) { showToast("Please enter a query", "error"); return; }
    setLoading(true);
    try {
      const result = await postQuery(q);
      setHistory(prev => [{ query: q, result, ts: Date.now() }, ...prev]);
      setQuery("");
      if (result.blocked) {
        showToast("Query blocked by policy enforcement", "error");
      } else {
        showToast(`Query processed · ${CATEGORY_LABELS[result.category] ?? result.category}`, "success");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Failed to send query", "error");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Query input card */}
      <div className="card glow-focus" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>Submit a Query</h2>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
            Routed through cascadeflow enforce mode → Groq. Press Enter or click Send.
          </p>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <textarea
            ref={textareaRef}
            id="query-input"
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Where is my order #12345?"
            rows={3}
            style={{ fontFamily: "inherit", resize: "vertical" }}
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500, alignSelf: "center" }}>Try:</span>
            {EXAMPLE_QUERIES.map(ex => (
              <button key={ex} onClick={() => setQuery(ex)} className="chip" style={{ fontSize: "11px" }}>
                {ex}
              </button>
            ))}
          </div>
          <button
            id="send-query-btn"
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{ minWidth: "100px" }}
          >
            {loading ? (
              <><span className="animate-spin" style={{ display: "inline-block", width: 13, height: 13 }}>⟳</span> Sending…</>
            ) : (
              <><Send size={13} /> Send</>
            )}
          </button>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: "16px", padding: "10px 14px", background: "var(--color-accent-dim)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid var(--color-accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "12.5px", color: "var(--color-accent-light)", fontWeight: 500 }}>Routing through cascadeflow → Groq…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <AnimatePresence initial={false}>
        {history.map((item) => {
          const r = item.result;
          const catColor = CATEGORY_COLORS[r.category] ?? "#5C5D63";
          return (
            <motion.div
              key={item.ts}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="card"
              style={{ overflow: "hidden" }}
            >
              {/* Header */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(item.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: catColor }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: catColor, display: "inline-block" }} />
                    {CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                  {r.blocked ? <span className="badge badge-stop">Blocked</span> : <span className="badge badge-allow">Allowed</span>}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  {r.audit_event?.cost_total != null && (
                    <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      Cost: <strong style={{ color: "var(--color-text-primary)" }}>{formatINR(r.audit_event.cost_total, 5)}</strong>
                    </span>
                  )}
                  {r.audit_event?.latency_used_ms != null && (
                    <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                      {formatLatency(r.audit_event.latency_used_ms)}
                    </span>
                  )}
                </div>
              </div>

              {/* Query */}
              <div style={{ padding: "12px 20px 8px" }}>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Query</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-primary)" }}>{item.query}</p>
              </div>

              {/* Response */}
              <div style={{ padding: "8px 20px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</p>
                <div className="code-block" style={{ fontSize: "12px" }}>{r.response}</div>
              </div>

              {/* Audit details */}
              <div style={{ padding: "10px 20px 14px", borderTop: "1px solid var(--color-border-subtle)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    { k: "Model", v: r.audit_event?.model ?? "—" },
                    { k: "Action", v: r.audit_event?.action ?? "—" },
                    { k: "Mode", v: r.audit_event?.decision_mode ?? "enforce" },
                    { k: "Budget left", v: formatINR(r.audit_event?.budget_state?.remaining ?? 0, 5) },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ padding: "4px 10px", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}: </span>
                      <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {history.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: "var(--color-accent-dim)" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent-light)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13.5px" }}>No queries yet</p>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>Type a query above and press Send or Enter</p>
          </div>
        </div>
      )}
    </div>
  );
}
