"use client";

import { useState, useEffect } from "react";
import { getInsights, type Insights } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await getInsights();
      setInsights(res);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
      
      {/* Header Explainer */}
      <div className="card" style={{ padding: "24px", background: "linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%)", border: "1px solid #CCFBF1" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: "#0F766E", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Hindsight AI Insights
        </h2>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#374151", lineHeight: 1.5 }}>
          Obsidian continuously runs <strong style={{ color: "#0D9488" }}>Hindsight</strong> in the background. It analyzes your recent audit events to identify cost inefficiencies and suggests optimized routing policies to reduce spend without sacrificing quality.
        </p>
      </div>

      {loading && !insights ? (
        <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, border: "2px solid #0D9488", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
          
          {/* Recall Panel */}
          <div className="card" style={{ padding: "24px", borderTop: "3px solid #6366F1" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6366F1" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Hindsight Recall
            </h3>
            {insights?.recall ? (
              <div className="code-block" style={{ fontSize: "12px", background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0", whiteSpace: "pre-wrap" }}>
                {insights.recall}
              </div>
            ) : (
               <div className="empty-state" style={{ padding: "20px 0" }}>
                 <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>No recall data generated yet.</p>
               </div>
            )}
          </div>

          {/* Reflect Panel */}
          <div className="card" style={{ padding: "24px", borderTop: "3px solid #0D9488" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Hindsight Reflect
            </h3>
            {insights?.reflect ? (
              <div className="code-block" style={{ fontSize: "12px", background: "#F0FDFA", color: "#134E4A", border: "1px solid #CCFBF1", whiteSpace: "pre-wrap" }}>
                {insights.reflect}
              </div>
            ) : (
               <div className="empty-state" style={{ padding: "20px 0" }}>
                 <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>No reflection data generated yet.</p>
               </div>
            )}
          </div>

          {/* Routing Suggestion */}
          <div className="card" style={{ gridColumn: "1 / -1", padding: "24px", borderTop: "3px solid #D97706" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Routing Suggestion
            </h3>
            {insights?.routing_suggestion ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>
                   Based on recent activity, Hindsight suggests the following routing policy optimization:
                 </p>
                 <div className="code-block" style={{ fontSize: "12.5px" }}>
                   {JSON.stringify(insights.routing_suggestion, null, 2)}
                 </div>
                 <div style={{ display: "flex", gap: "10px" }}>
                   <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>Apply Suggestion</button>
                   <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: "13px" }}>Dismiss</button>
                 </div>
              </div>
            ) : (
               <div className="empty-state" style={{ padding: "30px 0" }}>
                 <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                   <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 500, color: "#374151" }}>Routing is currently optimal</p>
                 <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#6B7280" }}>No cost-saving suggestions available at this time.</p>
               </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
