"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAgents,
  getTrustScore,
  type AgentSummary,
  type TrustScoreResponse,
} from "@/lib/api";
import { ShieldCheck, Cpu, Brain, TrendingUp, Loader2 } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 55) return "#F59E0B";
  return "#EF4444";
}
function scoreBg(score: number): string {
  if (score >= 80) return "rgba(16,185,129,0.1)";
  if (score >= 55) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}
function scoreLabel(score: number): string {
  if (score >= 80) return "Trusted";
  if (score >= 55) return "Caution";
  return "At Risk";
}
function scoreGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

function AnimatedRing({ value, size = 160, label }: { value: number; size?: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const color = scoreColor(value);
  const r = (size / 2) - 16;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (value - start) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {/* Glow layer */}
        <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeDasharray={`${(value / 100) * circ} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ filter: `blur(8px)`, opacity: 0.35 }}
          />
        </svg>
        {/* Track */}
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (value / 100) * circ }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center content */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span className="stat-number" style={{ fontSize: size > 130 ? 36 : 24, fontWeight: 900, color, lineHeight: 1 }}>
            {displayValue}
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value, weight, note, icon, delay = 0 }: {
  label: string; value: number; weight: string; note?: string; icon: React.ReactNode; delay?: number;
}) {
  const color = scoreColor(value);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        padding: "18px 20px",
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 12,
        borderLeft: `2px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${color}12`,
            border: `1px solid ${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}>{icon}</div>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-primary)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="font-mono-data" style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
          <div>
            <div style={{ fontSize: 9, color: "var(--color-text-muted)", textAlign: "right" }}>/ 100</div>
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "var(--color-text-muted)",
              background: "rgba(255,255,255,0.04)",
              padding: "1px 8px",
              borderRadius: 999,
              border: "1px solid var(--color-border-subtle)",
            }}>{weight}</span>
          </div>
        </div>
      </div>
      {/* Progress track */}
      <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
      {note && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 8, lineHeight: 1.5, margin: "8px 0 0" }}>{note}</p>}
    </motion.div>
  );
}

function RecallPanel({ ev }: { ev: TrustScoreResponse["recall_eval"] }) {
  const matchColor = ev.match === true ? "#10B981" : ev.match === false ? "#EF4444" : "var(--color-text-muted)";
  const matchText = ev.match === true ? "✓ Match" : ev.match === false ? "✗ No Match" : "N/A";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: "20px 22px",
        marginTop: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={16} style={{ color: "var(--color-accent-light)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Hindsight Recall Evaluation
          </span>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          padding: "3px 12px",
          borderRadius: 999,
          background: `${matchColor}15`,
          color: matchColor,
          border: `1px solid ${matchColor}30`,
          letterSpacing: "0.04em",
        }}>{matchText}</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Question</span>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 5, lineHeight: 1.6, margin: "5px 0 0" }}>{ev.question}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{
          background: "rgba(16,185,129,0.04)",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <span style={{ fontSize: 10, color: "rgba(16,185,129,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Ground Truth</span>
          <p className="font-mono-data" style={{ fontSize: 13, color: "#34D399", marginTop: 5, fontWeight: 700, margin: "6px 0 0" }}>{ev.ground_truth}</p>
        </div>
        <div style={{
          background: "rgba(99,102,241,0.04)",
          border: "1px solid rgba(99,102,241,0.12)",
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <span style={{ fontSize: 10, color: "rgba(99,102,241,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Hindsight Recalled</span>
          <p className="font-mono-data" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 5, wordBreak: "break-all", lineHeight: 1.4, margin: "6px 0 0" }}>
            {ev.hindsight_answer?.slice(0, 120) || "–"}
          </p>
        </div>
      </div>

      {ev.note && (
        <p style={{ fontSize: 11.5, color: "var(--color-warning-light)", marginTop: 14, fontWeight: 600, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "8px 12px" }}>
          ⚠ {ev.note}
        </p>
      )}
      <p className="font-mono-data" style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 10 }}>
        method: {ev.method}{ev.bank_id ? ` · bank: ${ev.bank_id}` : ""}
      </p>
    </motion.div>
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
      setScore(await getTrustScore(id.trim()));
    } catch (err: any) {
      setError(err.message || "Failed to load trust score");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetch = () => fetchScore(customId.trim() || selectedId);
  const handleAgentSelect = (id: string) => { setSelectedId(id); setCustomId(""); fetchScore(id); };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="section-header"
      >
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} style={{ color: "#34D399" }} />
          </div>
          Trust Score
        </h1>
        <p>Composite 0–100 trust score per agent — weighted across compliance, cost efficiency, and Hindsight recall accuracy.</p>
      </motion.div>

      {/* Agent picker */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card"
        style={{ padding: "22px 24px", marginBottom: 24 }}
      >
        <p style={{ margin: "0 0 16px", fontSize: 10, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Select Agent
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          {!agentsLoading && agents.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
              {agents.map((a) => {
                const active = selectedId === a.agent_id;
                return (
                  <motion.button
                    key={a.agent_id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAgentSelect(a.agent_id)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 999,
                      border: `1px solid ${active ? "rgba(99,102,241,0.4)" : "var(--color-border)"}`,
                      background: active ? "rgba(99,102,241,0.1)" : "var(--color-surface)",
                      color: active ? "var(--color-accent-bright)" : "var(--color-text-secondary)",
                      fontSize: 12.5,
                      fontWeight: active ? 800 : 500,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: active ? "0 0 12px rgba(99,102,241,0.15)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {a.agent_id}
                    <span style={{
                      fontSize: 10,
                      color: active ? "rgba(165,180,252,0.6)" : "var(--color-text-muted)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {a.event_count}ev
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Custom ID
              </label>
              <input
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="e.g. sales-bot"
                className="input"
                style={{ width: 160 }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleFetch}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "10px 22px" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Compute Score"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            padding: "12px 18px",
            color: "var(--color-danger-light)",
            fontSize: 13,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Score display */}
      <AnimatePresence mode="wait">
        {score && !loading && (
          <motion.div
            key={score.agent_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero score card */}
            <div className="card" style={{ padding: "36px", marginBottom: 20 }}>
              {/* Top glow accent */}
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${scoreColor(score.composite_score)}60, transparent)`,
              }} />
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 36, alignItems: "center" }}>
                <AnimatedRing value={score.composite_score} size={160} label="Trust Score" />
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                    <span className="stat-number" style={{ fontSize: 56, fontWeight: 900, color: scoreColor(score.composite_score), lineHeight: 1 }}>
                      {score.composite_score}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 400, color: "var(--color-text-muted)" }}>/100</span>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      padding: "4px 16px",
                      borderRadius: 999,
                      background: scoreBg(score.composite_score),
                      color: scoreColor(score.composite_score),
                      border: `1px solid ${scoreColor(score.composite_score)}30`,
                    }}>
                      {scoreLabel(score.composite_score)}
                    </span>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      background: `${scoreColor(score.composite_score)}15`,
                      color: scoreColor(score.composite_score),
                      border: `1px solid ${scoreColor(score.composite_score)}25`,
                    }}>
                      {scoreGrade(score.composite_score)}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
                    Agent: <strong style={{ color: "var(--color-text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>{score.agent_id}</strong>
                    {" · "}{score.event_count} events analyzed
                    {" · "}<code style={{ fontSize: 11, color: "var(--color-accent-light)", background: "var(--color-accent-dim)", padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>{score.hindsight_bank}</code>
                  </p>

                  {/* Math formula */}
                  <div className="code-block" style={{ fontSize: 11 }}>
                    {score.math}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-score bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 0 }}>
              <SubScoreBar
                label="Compliance"
                value={score.compliance_score}
                weight="40%"
                note={score.compliance_note}
                icon={<ShieldCheck size={14} />}
                delay={0.1}
              />
              <SubScoreBar
                label="Cost Efficiency"
                value={score.cost_efficiency_score}
                weight="30%"
                note={score.cost_note}
                icon={<TrendingUp size={14} />}
                delay={0.2}
              />
              <SubScoreBar
                label="Hindsight Recall Accuracy"
                value={score.recall_accuracy_score}
                weight="30%"
                note={
                  !score.recall_eval ? "No recall data available." :
                  score.recall_eval.method === "fallback_neutral" ? "Needs ≥2 events to run recall eval." :
                  `Method: ${score.recall_eval.method}`
                }
                icon={<Brain size={14} />}
                delay={0.3}
              />
            </div>

            {score.recall_eval && <RecallPanel ev={score.recall_eval} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!score && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ textAlign: "center", padding: "72px 24px" }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 20px",
              borderRadius: 16,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px rgba(16,185,129,0.1)",
            }}
          >
            <ShieldCheck size={28} style={{ color: "#34D399" }} />
          </motion.div>
          <p style={{ fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>Select an Agent</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Choose an agent above or enter a custom ID to compute its composite trust score.</p>
        </motion.div>
      )}
    </div>
  );
}
