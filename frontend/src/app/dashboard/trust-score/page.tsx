"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAgents,
  getTrustScore,
  type AgentSummary,
  type TrustScoreResponse,
} from "@/lib/api";
import { ShieldCheck } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 80) return "#34D399";
  if (score >= 55) return "#FBBF24";
  return "#F87171";
}
function scoreBg(score: number): string {
  if (score >= 80) return "rgba(52,211,153,0.12)";
  if (score >= 55) return "rgba(251,191,36,0.12)";
  return "rgba(248,113,113,0.12)";
}
function scoreLabel(score: number): string {
  if (score >= 80) return "Trusted";
  if (score >= 55) return "Caution";
  return "At Risk";
}

function CircleGauge({ value, size = 130, label }: { value: number; size?: number; label: string }) {
  const r = (size / 2) - 14;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const color = scoreColor(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 100 ? 30 : 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3, fontWeight: 600 }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value, weight, note }: { label: string; value: number; weight: string; note?: string }) {
  const color = scoreColor(value);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="font-mono-data" style={{ fontSize: 13, color, fontWeight: 700 }}>{value}/100</span>
          <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", background: "var(--color-surface-elevated)", padding: "2px 8px", borderRadius: 999, border: "1px solid var(--color-border-subtle)", fontWeight: 600 }}>{weight}</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 6px ${color}50` }} />
      </div>
      {note && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.4 }}>{note}</p>}
    </div>
  );
}

function RecallEvalPanel({ eval: ev }: { eval: TrustScoreResponse["recall_eval"] }) {
  const matchColor = ev.match === true ? "#34D399" : ev.match === false ? "#F87171" : "var(--color-text-muted)";
  const matchBg = ev.match === true ? "rgba(52,211,153,0.12)" : ev.match === false ? "rgba(248,113,113,0.12)" : "var(--color-surface-elevated)";
  const matchText = ev.match === true ? "Match" : ev.match === false ? "No match" : "N/A";
  return (
    <div style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 12, padding: "18px 20px", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Hindsight Recall Eval</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999, background: matchBg, color: matchColor, border: `1px solid ${matchColor}30` }}>{matchText}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Question Asked</span>
          <p style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.5 }}>{ev.question}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, padding: "12px 14px" }}>
            <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Ground Truth</span>
            <p className="font-mono-data" style={{ fontSize: 12.5, color: "#34D399", marginTop: 4, fontWeight: 600 }}>{ev.ground_truth}</p>
          </div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, padding: "12px 14px" }}>
            <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Hindsight Recalled</span>
            <p className="font-mono-data" style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 4, wordBreak: "break-all" }}>{ev.hindsight_answer?.slice(0, 120) || "–"}</p>
          </div>
        </div>
        <div>
          <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Method</span>
          <p className="font-mono-data" style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 3 }}>{ev.method}{ev.bank_id ? ` | bank: ${ev.bank_id}` : ""}</p>
          {ev.note && <p style={{ fontSize: 11.5, color: "var(--color-warning)", marginTop: 4, fontWeight: 600 }}>{ev.note}</p>}
        </div>
      </div>
    </div>
  );
}

export default function TrustScorePage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [customId, setCustomId] = useState("");
  const [score, setScore] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgents().then((r) => { setAgents(r.agents); if (r.agents.length > 0 && !selectedId) setSelectedId(r.agents[0].agent_id); }).catch(() => {}).finally(() => setAgentsLoading(false));
  }, []);

  const fetchScore = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true); setError(null);
    try { setScore(await getTrustScore(id.trim())); } catch (err: any) { setError(err.message || "Failed to load trust score"); } finally { setLoading(false); }
  }, []);

  const handleFetch = () => fetchScore(customId.trim() || selectedId);
  const handleAgentSelect = (id: string) => { setSelectedId(id); setCustomId(""); fetchScore(id); };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} style={{ color: "var(--color-accent-light)" }} /> Trust Score
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6, lineHeight: 1.6 }}>
          0-100 composite score per agent — compliance, cost efficiency, and Hindsight memory recall accuracy.
        </p>
      </div>

      {/* Agent picker */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        {!agentsLoading && agents.length > 0 && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block", marginBottom: 8 }}>Known Agents</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {agents.map((a) => {
                const active = selectedId === a.agent_id;
                return (
                  <button key={a.agent_id} onClick={() => handleAgentSelect(a.agent_id)}
                    style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`, background: active ? "var(--color-accent-dim)" : "var(--color-surface)", color: active ? "var(--color-accent-light)" : "var(--color-text-secondary)", fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                    {a.agent_id} <span style={{ marginLeft: 4, fontSize: 10.5, color: "var(--color-text-muted)" }}>{a.event_count}ev</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 10.5, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block", marginBottom: 8 }}>Custom Agent ID</label>
            <input value={customId} onChange={(e) => setCustomId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFetch()} placeholder="e.g. sales-bot" className="input" style={{ width: 170 }} />
          </div>
          <button onClick={handleFetch} disabled={loading} className="btn btn-primary" style={{ padding: "8px 20px" }}>
            {loading ? "Loading…" : "Score"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-dim)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "12px 16px", color: "var(--color-danger)", fontSize: 12.5, marginBottom: 20, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {score && (
        <div className="card animate-fade-in" style={{ padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center", marginBottom: 28 }}>
            <CircleGauge value={score.composite_score} size={140} label="Trust Score" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="font-mono-data" style={{ fontSize: 36, fontWeight: 800, color: scoreColor(score.composite_score), lineHeight: 1 }}>{score.composite_score}</span>
                <span style={{ fontSize: 20, fontWeight: 400, color: "var(--color-text-muted)" }}>/100</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 999, background: scoreBg(score.composite_score), color: scoreColor(score.composite_score), border: `1px solid ${scoreColor(score.composite_score)}30` }}>
                  {scoreLabel(score.composite_score)}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
                Agent: <strong style={{ color: "var(--color-text-primary)" }}>{score.agent_id}</strong> · {score.event_count} events · Bank: <code style={{ fontSize: 11, color: "var(--color-accent-light)", background: "var(--color-accent-dim)", padding: "1px 6px", borderRadius: 4 }}>{score.hindsight_bank}</code>
              </p>
              <div className="font-mono-data" style={{ padding: "10px 16px", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, fontSize: 11.5, color: "var(--color-text-secondary)" }}>
                {score.math}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 24, marginBottom: 4 }}>
            <SubScoreBar label="Compliance" value={score.compliance_score} weight="40%" note={score.compliance_note} />
            <SubScoreBar label="Cost Efficiency" value={score.cost_efficiency_score} weight="30%" note={score.cost_note} />
            <SubScoreBar label="Hindsight Recall Accuracy" value={score.recall_accuracy_score} weight="30%"
              note={!score.recall_eval ? "No recall data available." : score.recall_eval.method === "fallback_neutral" ? "Needs ≥2 events to run recall eval." : `Method: ${score.recall_eval.method}`} />
          </div>
          {score.recall_eval && <RecallEvalPanel eval={score.recall_eval} />}
        </div>
      )}

      {!score && !loading && (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <ShieldCheck size={40} style={{ color: "var(--color-text-muted)", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>No agent selected</p>
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>Select an agent above or enter a custom agent_id to compute its Trust Score.</p>
        </div>
      )}
    </div>
  );
}
