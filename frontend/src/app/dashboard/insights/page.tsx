"use client";

import React, { useState } from "react";
import { useDashboardData } from "@/components/DashboardContext";
import { motion } from "framer-motion";
import { Lightbulb, Brain, GitBranch, CheckCircle2 } from "lucide-react";

export default function InsightsPage() {
  const { insights, isLoading: loading, refreshData } = useDashboardData();
  const [isApplying, setIsApplying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = async () => {
    if (!insights?.routing_suggestion) return;
    setIsApplying(true);
    try {
      const res = await fetch("/api/apply-routing-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: insights.routing_suggestion })
      });
      if (res.ok) {
        await refreshData();
        setIsApplied(true);
        setIsDismissed(true);
      }
    } catch (e) {
      console.error("Failed to apply suggestion:", e);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div className="section-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lightbulb size={18} style={{ color: "#FBBF24" }} />
          </div>
          Insights
        </h1>
        <p>Hindsight continuously analyzes your audit events to surface cost inefficiencies and optimal routing suggestions.</p>
      </div>


      {loading && !insights ? (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 22, height: 22, border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "20px" }}>
          {/* Recall Panel */}
          <div className="card" style={{ padding: "24px", borderTop: "3px solid #6366F1" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Brain size={16} style={{ color: "var(--color-accent-light)" }} /> Hindsight Recall
            </h3>
            {insights?.recall ? (
              <div className="code-block" style={{ fontSize: "12px" }}>{insights.recall}</div>
            ) : (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>No recall data generated yet.</p>
              </div>
            )}
          </div>

          {/* Reflect Panel */}
          <div className="card" style={{ padding: "24px", borderTop: "3px solid #34D399" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lightbulb size={16} style={{ color: "var(--color-success)" }} /> Hindsight Reflect
            </h3>
            {insights?.reflect ? (
              <div className="code-block" style={{ fontSize: "12px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>{insights.reflect}</div>
            ) : (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>No reflection data generated yet.</p>
              </div>
            )}
          </div>

          {/* Routing Suggestion */}
          <div className="card" style={{ gridColumn: "1 / -1", padding: "24px", borderTop: "3px solid #FBBF24" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <GitBranch size={16} style={{ color: "var(--color-warning)" }} /> Routing Suggestion
            </h3>
            {insights?.routing_suggestion && !isDismissed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Based on recent activity, Hindsight suggests the following routing policy optimization:
                </p>
                <div className="code-block" style={{ fontSize: "12px" }}>
                  {JSON.stringify(insights.routing_suggestion, null, 2)}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleApply} disabled={isApplying} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12.5px", opacity: isApplying ? 0.7 : 1 }}>
                    {isApplying ? "Applying..." : "Apply Suggestion"}
                  </button>
                  <button onClick={handleDismiss} disabled={isApplying} className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: "12.5px" }}>Dismiss</button>
                </div>
              </div>
            ) : isApplied ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="empty-state" style={{ padding: "30px 0", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-success-dim)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", margin: "0 auto 12px" }}>
                  <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
                </div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-success)" }}>Routing Policy Optimized!</p>
                <p style={{ margin: "6px auto 0", fontSize: "12.5px", color: "var(--color-text-secondary)", maxWidth: "300px" }}>
                  The suggestion was successfully applied and your agent traffic is now being routed to the new model.
                </p>
              </motion.div>
            ) : (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-success-dim)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                  <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
                </div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>Routing is currently optimal</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>No cost-saving suggestions available at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
