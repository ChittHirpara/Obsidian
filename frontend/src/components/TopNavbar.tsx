"use client";

import React, { useState, useEffect } from "react";
import { getAgents, type AgentSummary } from "@/lib/api";
import { useDashboardData } from "@/components/DashboardContext";
import { formatINR } from "@/lib/currency";
import { ChevronDown } from "lucide-react";

interface TopNavbarProps {
  selectedAgent: string;
  onAgentChange: (id: string) => void;
}

export default function TopNavbar({ selectedAgent, onAgentChange }: TopNavbarProps) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { events } = useDashboardData();

  const latest = events[0]?.audit_event;
  const budget = latest?.budget_state ?? { remaining: 1.0, max: 1.0 };
  const budgetPct = budget.max > 0 ? (budget.remaining / budget.max) * 100 : 100;
  const isLow = budgetPct < 40;
  const isExhausted = budgetPct <= 0;

  useEffect(() => {
    getAgents().then((r) => setAgents(r.agents)).catch(() => {});
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
        padding: "10px 0",
        background: "rgba(10,10,11,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Agent selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} />
              {selectedAgent || "All Agents"}
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>
            {dropdownOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setDropdownOpen(false)} />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    minWidth: "200px",
                    background: "var(--color-surface-float)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    boxShadow: "var(--shadow-card-lg)",
                    padding: "4px",
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => { onAgentChange(""); setDropdownOpen(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: !selectedAgent ? "var(--color-accent-dim)" : "transparent",
                      color: !selectedAgent ? "var(--color-accent-light)" : "var(--color-text-secondary)",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
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
                        borderRadius: "6px",
                        border: "none",
                        background: selectedAgent === a.agent_id ? "var(--color-accent-dim)" : "transparent",
                        color: selectedAgent === a.agent_id ? "var(--color-accent-light)" : "var(--color-text-secondary)",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{a.agent_id}</span>
                      <span className="font-mono-data" style={{ fontSize: "10.5px", opacity: 0.6 }}>
                        {a.event_count} ev
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Budget pill + status */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Budget remaining pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 14px",
              borderRadius: "999px",
              background: isExhausted ? "var(--color-danger-dim)" : isLow ? "var(--color-warning-dim)" : "var(--color-success-dim)",
              border: `1px solid ${isExhausted ? "rgba(248,113,113,0.2)" : isLow ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)"}`,
            }}
          >
            <span className="font-mono-data" style={{ fontSize: "11.5px", fontWeight: 700, color: isExhausted ? "var(--color-danger)" : isLow ? "var(--color-warning)" : "var(--color-success)" }}>
              {formatINR(budget.remaining, 4)}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 500 }}>remaining</span>
          </div>

          {/* Live indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "999px",
              background: "var(--color-success-dim)",
              border: "1px solid rgba(52,211,153,0.15)",
            }}
          >
            <span className="status-dot online" />
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--color-success)", letterSpacing: "0.05em" }}>
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
