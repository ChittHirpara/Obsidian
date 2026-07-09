"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAgents,
  getTrustScore,
  type AgentSummary,
  type TrustScoreResponse,
} from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";   // green
  if (score >= 55) return "#F59E0B";   // amber
  return "#EF4444";                    // red
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Trusted";
  if (score >= 55) return "Caution";
  return "At Risk";
}

// ── CircleGauge ───────────────────────────────────────────────────────────────
function CircleGauge({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const r      = (size / 2) - 12;
  const circ   = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const color  = scoreColor(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{ marginTop: -size - 8, height: size, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size > 100 ? 28 : 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

// ── SubScoreBar ───────────────────────────────────────────────────────────────
function SubScoreBar({
  label, value, weight, note,
}: {
  label: string; value: number; weight: string; note?: string;
}) {
  const color = scoreColor(value);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}/100 <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>({weight})</span></span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 6,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      {note && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{note}</p>}
    </div>
  );
}

// ── RecallEvalPanel ───────────────────────────────────────────────────────────
function RecallEvalPanel({ eval: ev }: { eval: TrustScoreResponse["recall_eval"] }) {
  const matchColor = ev.match === true ? "#10B981" : ev.match === false ? "#EF4444" : "#6B7280";
  const matchText  = ev.match === true ? "✓ Match" : ev.match === false ? "✗ No match" : "– N/A";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "16px 20px",
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>
          🧠 HINDSIGHT RECALL EVAL
        </span>
        <span
          style={{
            fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: `${matchColor}22`, color: matchColor, border: `1px solid ${matchColor}44`,
          }}
        >
          {matchText}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Question asked</span>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3, lineHeight: 1.5 }}>{ev.question}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
          <div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ground truth</span>
            <p style={{ fontSize: 12, color: "#10B981", marginTop: 3, fontFamily: "monospace" }}>{ev.ground_truth}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hindsight recalled</span>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3, fontFamily: "monospace", wordBreak: "break-all" }}>
              {ev.hindsight_answer?.slice(0, 120) || "–"}
            </p>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Method</span>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2, fontFamily: "monospace" }}>{ev.method}{ev.bank_id ? ` | bank: ${ev.bank_id}` : ""}</p>
          {ev.note && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>{ev.note}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrustScorePage() {
  const [agents, setAgents]           = useState<AgentSummary[]>([]);
  const [selectedId, setSelectedId]   = useState<string>("");
  const [customId, setCustomId]       = useState("");
  const [score, setScore]             = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading]         = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Load agent list
  useEffect(() => {
    getAgents()
      .then((r) => {
        setAgents(r.agents);
        if (r.agents.length > 0 && !selectedId) setSelectedId(r.agents[0].agent_id);
      })
      .catch(() => {})
      .finally(() => setAgentsLoading(false));
  }, []);

  const fetchScore = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTrustScore(id.trim());
      setScore(result);
    } catch (err: any) {
      setError(err.message || "Failed to load trust score");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetch = () => {
    const id = customId.trim() || selectedId;
    fetchScore(id);
  };

  const handleAgentSelect = (id: string) => {
    setSelectedId(id);
    setCustomId("");
    fetchScore(id);
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>
          🔐 Trust Score
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
          0-100 composite score per agent — compliance, cost efficiency, and Hindsight memory recall accuracy.
        </p>
      </div>

      {/* Agent picker */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "18px 22px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        {/* Known agents */}
        {!agentsLoading && agents.length > 0 && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Known agents
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {agents.map((a) => (
                <button
                  key={a.agent_id}
                  onClick={() => handleAgentSelect(a.agent_id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: `1px solid ${selectedId === a.agent_id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.12)"}`,
                    background: selectedId === a.agent_id ? "rgba(99,102,241,0.15)" : "transparent",
                    color: selectedId === a.agent_id ? "#818CF8" : "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {a.agent_id}
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.6 }}>{a.event_count}ev</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom agent id */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Custom agent_id
            </label>
            <input
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="e.g. sales-bot"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "7px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                width: 160,
              }}
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Loading…" : "Score"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#FCA5A5", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Score card */}
      {score && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "28px 28px 24px",
            animation: "fadeInUp 0.4s ease-out",
          }}
        >
          {/* Top section: gauge + headline stats */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center", marginBottom: 28 }}>
            <CircleGauge value={score.composite_score} size={140} label="Trust Score" />

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(score.composite_score) }}>
                  {score.composite_score}/100
                </span>
                <span
                  style={{
                    fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                    background: `${scoreColor(score.composite_score)}22`,
                    color: scoreColor(score.composite_score),
                    border: `1px solid ${scoreColor(score.composite_score)}44`,
                  }}
                >
                  {scoreLabel(score.composite_score)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                Agent: <strong style={{ color: "rgba(255,255,255,0.75)" }}>{score.agent_id}</strong>
                &nbsp;·&nbsp; {score.event_count} events
                &nbsp;·&nbsp; Bank: <code style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{score.hindsight_bank}</code>
              </p>
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#A5B4FC",
                }}
              >
                {score.math}
              </div>
            </div>
          </div>

          {/* Sub-scores */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, marginBottom: 4 }}>
            <SubScoreBar
              label="Compliance"
              value={score.compliance_score}
              weight="40%"
              note={score.compliance_note}
            />
            <SubScoreBar
              label="Cost Efficiency"
              value={score.cost_efficiency_score}
              weight="30%"
              note={score.cost_note}
            />
            <SubScoreBar
              label="Hindsight Recall Accuracy"
              value={score.recall_accuracy_score}
              weight="30%"
              note={
                score.recall_eval.method === "fallback_neutral"
                  ? "Needs ≥2 events to run recall eval."
                  : `Method: ${score.recall_eval.method}`
              }
            />
          </div>

          {/* Recall eval detail */}
          <RecallEvalPanel eval={score.recall_eval} />
        </div>
      )}

      {!score && !loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
          Select an agent or enter an agent_id above to compute its Trust Score.
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
