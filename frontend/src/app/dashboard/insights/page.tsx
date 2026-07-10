"use client";

import { useDashboardData } from "@/components/DashboardContext";
import { motion } from "framer-motion";
import { Lightbulb, Brain, GitBranch, CheckCircle2 } from "lucide-react";

export default function InsightsPage() {
  const { insights, isLoading: loading } = useDashboardData();

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, var(--color-surface) 100%)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: "var(--color-accent-light)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Lightbulb size={20} /> Hindsight AI Insights
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Obsidian continuously runs <strong style={{ color: "var(--color-accent-light)" }}>Hindsight</strong> in the background. It analyzes your recent audit events to identify cost inefficiencies and suggests optimized routing policies.
        </p>
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
            {insights?.routing_suggestion ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Based on recent activity, Hindsight suggests the following routing policy optimization:
                </p>
                <div className="code-block" style={{ fontSize: "12px" }}>
                  {JSON.stringify(insights.routing_suggestion, null, 2)}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12.5px" }}>Apply Suggestion</button>
                  <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: "12.5px" }}>Dismiss</button>
                </div>
              </div>
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
