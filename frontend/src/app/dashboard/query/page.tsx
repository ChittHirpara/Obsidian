"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { postQuery, getEvents, type EventRecord, type QueryResponse } from "@/lib/api";
import { showToast } from "@/components/Toast";

const EXAMPLE_QUERIES = [
  "Where is my order #12345?",
  "I want a refund for order #98765",
  "What are your return policies?",
  "My credit card was charged twice",
  "Can I change my delivery address?",
  "Track my shipment",
];

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
  const [lastEvents, setLastEvents] = useState<EventRecord[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchRecent = async () => {
    try {
      const ev = await getEvents();
      setLastEvents([...ev.events].sort((a, b) => b.timestamp_ms - a.timestamp_ms).slice(0, 5));
    } catch {}
  };

  useEffect(() => { fetchRecent(); }, []);

  const handleSubmit = async () => {
    const q = query.trim();
    if (!q) { showToast("Please enter a query", "error"); return; }
    setLoading(true);
    try {
      const result = await postQuery(q);
      setHistory(prev => [{ query: q, result, ts: Date.now() }, ...prev]);
      setQuery("");
      await fetchRecent();
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
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
      {/* Query input card */}
      <div className="card" style={{ padding: "22px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827" }}>Submit a Query</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>
            Routed through cascadeflow enforce mode → Groq (qwen3-32b). Press Enter or click Send.
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
          {/* Example chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "#6B7280", fontWeight: 500, alignSelf: "center" }}>Try:</span>
            {EXAMPLE_QUERIES.slice(0, 4).map(ex => (
              <button key={ex} onClick={() => setQuery(ex)} className="chip" style={{ fontSize: "11.5px" }}>
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
              <><span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span> Sending…</>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>

        {/* Loading indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: "16px", padding: "12px 14px", background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid #0D9488", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "13px", color: "#0D9488", fontWeight: 500 }}>Routing through cascadeflow → Groq…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <AnimatePresence initial={false}>
        {history.map((item, idx) => {
          const r = item.result;
          const catColor = CATEGORY_COLORS[r.category] ?? "#6B7280";
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
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #E3E8E6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11.5px", fontFamily: "monospace", color: "#6B7280" }}>
                    {new Date(item.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: catColor }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, display: "inline-block" }} />
                    {CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                  {r.blocked ? (
                    <span className="badge badge-stop">Blocked</span>
                  ) : (
                    <span className="badge badge-allow">Allowed</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  {r.audit_event?.cost_total != null && (
                    <span className="font-mono-data" style={{ fontSize: "11.5px", color: "#6B7280" }}>
                      Cost: <strong style={{ color: "#111827" }}>${r.audit_event.cost_total.toFixed(5)}</strong>
                    </span>
                  )}
                  {r.audit_event?.latency_used_ms != null && (
                    <span className="font-mono-data" style={{ fontSize: "11.5px", color: "#6B7280" }}>
                      Latency: <strong style={{ color: "#111827" }}>{formatLatency(r.audit_event.latency_used_ms)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Query */}
              <div style={{ padding: "12px 20px 8px", background: "#F7F9F8" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Query</p>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#111827" }}>{item.query}</p>
              </div>

              {/* Response */}
              <div style={{ padding: "12px 20px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</p>
                <div className="code-block" style={{ fontSize: "12.5px" }}>{r.response}</div>
              </div>

              {/* Audit details */}
              <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[
                    { k: "Model", v: r.audit_event?.model ?? "—" },
                    { k: "Action", v: r.audit_event?.action ?? "—" },
                    { k: "Mode", v: r.audit_event?.decision_mode ?? "enforce" },
                    { k: "Budget left", v: `$${r.audit_event?.budget_state?.remaining?.toFixed(5) ?? "—"}` },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ padding: "5px 10px", background: "#F7F9F8", border: "1px solid #E3E8E6", borderRadius: "6px" }}>
                      <span style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}: </span>
                      <span className="font-mono-data" style={{ fontSize: "11.5px", color: "#111827" }}>{v}</span>
                    </div>
                  ))}
                  {r.routing_suggestion && (
                    <div style={{ padding: "5px 10px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6366F1", fontWeight: 600 }}>💡 Routing suggestion available</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {history.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: "#F0FDFA" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "14px" }}>No queries yet</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>Type a query above and press Send or Enter</p>
          </div>
        </div>
      )}
    </div>
  );
}
