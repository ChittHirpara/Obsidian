"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAgents, type AgentSummary } from "@/lib/api";
import { useDashboardData } from "@/components/DashboardContext";
import { formatINR } from "@/lib/currency";
import { ChevronDown, Zap, Users } from "lucide-react";

interface TopNavbarProps {
  selectedAgent: string;
  onAgentChange: (id: string) => void;
}

function LiveBadge() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: "rgba(16, 185, 129, 0.08)",
      border: "1px solid rgba(16, 185, 129, 0.2)",
    }}>
      <div style={{ position: "relative", width: 7, height: 7, flexShrink: 0 }}>
        <span className="status-dot online" style={{ position: "absolute", inset: 0 }} />
        <span className="animate-radar" style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          border: "1px solid rgba(16,185,129,0.6)",
        }} />
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(52, 211, 153, 0.9)",
        letterSpacing: "0.1em",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>LIVE</span>
    </div>
  );
}

export default function TopNavbar({ selectedAgent, onAgentChange }: TopNavbarProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { events } = useDashboardData();
  const prevCountRef = useRef(0);
  const [countPulse, setCountPulse] = useState(false);

  const latest = events[0]?.audit_event;
  const budget = latest?.budget_state ?? { remaining: 1.0, max: 1.0 };
  const budgetPct = budget.max > 0 ? (budget.remaining / budget.max) * 100 : 100;
  const isLow = budgetPct < 40;
  const isExhausted = budgetPct <= 0;

  const budgetColor = isExhausted ? "#F87171" : isLow ? "#FBBF24" : "#34D399";
  const budgetBg    = isExhausted ? "rgba(239,68,68,0.08)"  : isLow ? "rgba(245,158,11,0.08)"  : "rgba(16,185,129,0.08)";
  const budgetBorder = isExhausted ? "rgba(239,68,68,0.2)" : isLow ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)";

  useEffect(() => {
    getAgents().then((r) => setAgents(r.agents)).catch(() => {});
  }, []);

  useEffect(() => {
    if (events.length !== prevCountRef.current && prevCountRef.current > 0) {
      setCountPulse(true);
      setTimeout(() => setCountPulse(false), 600);
    }
    prevCountRef.current = events.length;
  }, [events.length]);

  const agentInitials = (id: string) => id.split("-").map(w => w[0]?.toUpperCase()).join("").slice(0, 2);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
        padding: "0 32px",
        height: "var(--topbar-height)",
        background: "rgba(7, 8, 12, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Left: Agent selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px 6px 8px",
              borderRadius: 10,
              border: "1px solid rgba(99,102,241,0.15)",
              background: "rgba(99,102,241,0.06)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {/* Agent avatar */}
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: selectedAgent
                ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                : "rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}>
              {selectedAgent ? agentInitials(selectedAgent) : <Users size={12} />}
            </div>
            <span>{selectedAgent || "All Agents"}</span>
            {agents.length > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(99,102,241,0.6)",
                background: "rgba(99,102,241,0.08)",
                borderRadius: 999,
                padding: "1px 6px",
              }}>
                {agents.length}
              </span>
            )}
            <ChevronDown size={13} style={{ opacity: 0.5, marginLeft: 2, transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 220,
                    background: "rgba(15, 16, 24, 0.95)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 12,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)",
                    padding: 6,
                    zIndex: 50,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Space Grotesk', sans-serif" }}>
                      Select Agent
                    </span>
                  </div>
                  <button
                    onClick={() => { onAgentChange(""); setDropdownOpen(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: !selectedAgent ? "rgba(99,102,241,0.1)" : "transparent",
                      color: !selectedAgent ? "var(--color-accent-bright)" : "var(--color-text-secondary)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Users size={14} style={{ opacity: 0.5 }} />
                    All Agents
                  </button>
                  {agents.map((a) => (
                    <button
                      key={a.agent_id}
                      onClick={() => { onAgentChange(a.agent_id); setDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: selectedAgent === a.agent_id ? "rgba(99,102,241,0.1)" : "transparent",
                        color: selectedAgent === a.agent_id ? "var(--color-accent-bright)" : "var(--color-text-secondary)",
                        fontSize: 12.5,
                        fontWeight: selectedAgent === a.agent_id ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "'Space Grotesk', sans-serif",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                        }}>
                          {agentInitials(a.agent_id)}
                        </div>
                        <span>{a.agent_id}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="font-mono-data" style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                          {a.event_count} ev
                        </span>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: a.compliance_pass_rate > 80 ? "#34D399" : a.compliance_pass_rate > 60 ? "#FBBF24" : "#F87171",
                          background: a.compliance_pass_rate > 80 ? "rgba(16,185,129,0.08)" : a.compliance_pass_rate > 60 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                          borderRadius: 999,
                          padding: "1px 5px",
                        }}>
                          {a.compliance_pass_rate.toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Event counter */}
        <motion.div
          animate={countPulse ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.12)",
          }}
        >
          <Zap size={11} style={{ color: "var(--color-accent-light)" }} />
          <span className="font-mono-data" style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent-light)" }}>
            {events.length}
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>events</span>
        </motion.div>
      </div>

      {/* Right: Budget + Live */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Budget pill with mini progress */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "6px 14px",
          borderRadius: 10,
          background: budgetBg,
          border: `1px solid ${budgetBorder}`,
          minWidth: 130,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif" }}>
              Budget
            </span>
            <span className="font-mono-data" style={{ fontSize: 12, fontWeight: 800, color: budgetColor }}>
              {formatINR(budget.remaining, 4)}
            </span>
          </div>
          {/* Mini budget bar */}
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${budgetPct}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              style={{
                height: "100%",
                borderRadius: 2,
                background: `linear-gradient(90deg, ${budgetColor}88, ${budgetColor})`,
                boxShadow: `0 0 4px ${budgetColor}60`,
              }}
            />
          </div>
        </div>

        <LiveBadge />
      </div>
    </div>
  );
}
