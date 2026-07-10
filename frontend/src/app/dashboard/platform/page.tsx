"use client";

import React, { useEffect, useState, useRef } from "react";
import { getAgents, getTrustScore, getRoi, getRemediations, getEvents, type AgentSummary, type TrustScoreResponse, type ROIResponse, type RemediationsResponse, type EventRecord } from "@/lib/api";
import { Activity, ShieldCheck, DollarSign, Terminal, ArrowRight, Zap, CheckCircle2, AlertTriangle, Code2, Database, Search } from "lucide-react";

export default function PlatformDashboard() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [trustScores, setTrustScores] = useState<Record<string, TrustScoreResponse>>({});
  const [rois, setRois] = useState<Record<string, ROIResponse>>({});
  const [remediations, setRemediations] = useState<RemediationsResponse | null>(null);
  const [liveEvents, setLiveEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentCode, setSelectedAgentCode] = useState<string | null>(null);
  const [selectedMemoryBank, setSelectedMemoryBank] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchAllData = async () => {
    try {
      const agentsRes = await getAgents();
      setAgents(agentsRes.agents);
      const tsMap: Record<string, TrustScoreResponse> = {};
      const roiMap: Record<string, ROIResponse> = {};
      for (const agent of agentsRes.agents) {
        tsMap[agent.agent_id] = await getTrustScore(agent.agent_id);
        roiMap[agent.agent_id] = await getRoi(agent.agent_id);
      }
      setTrustScores(tsMap);
      setRois(roiMap);
      setRemediations(await getRemediations());
      const evts = await getEvents();
      setLiveEvents(evts.events.slice(-30));
    } catch (err: any) { setError(err.message || "Failed to fetch platform data"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAllData(); const i = setInterval(fetchAllData, 2000); return () => clearInterval(i); }, []);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [liveEvents]);

  const getIntegrationCode = (agentId: string) => `import openai

client = openai.Client(
    base_url="https://obsidian-gateway.company.com/v1",
    api_key="obsidian_key"
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "I want a refund"}],
    extra_headers={"x-obsidian-agent-id": "${agentId}"}
)`;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div className="card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Zap size={22} style={{ color: "var(--color-accent-light)" }} /> Platform Control
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: 6 }}>
            Enterprise Middleware: Secure and audit multiple agents concurrently.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ padding: "8px 16px", background: "var(--color-surface-elevated)", borderRadius: 10, border: "1px solid var(--color-border-subtle)" }}>
            <span style={{ display: "block", fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Active Agents</span>
            <span className="font-mono-data" style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>{agents.length}</span>
          </div>
          <div style={{ padding: "8px 16px", background: "var(--color-surface-elevated)", borderRadius: 10, border: "1px solid var(--color-border-subtle)" }}>
            <span style={{ display: "block", fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Remediations</span>
            <span className="font-mono-data" style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "var(--color-success)" }}>{remediations?.total_remediations || 0}</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-dim)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--color-danger)", padding: "12px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Agent Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {loading && agents.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>Loading Platform Data...</div>
        ) : agents.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>No agents have processed events yet.</div>
        ) : (
          agents.map(agent => {
            const ts = trustScores[agent.agent_id];
            const roi = rois[agent.agent_id];
            const spent = agent.total_spend ?? 0;
            const maxBudget = 1.00;
            const pctSpent = (spent / maxBudget) * 100;

            return (
              <div key={agent.agent_id} className="card card-hover" style={{ overflow: "hidden" }}>
                {/* Top Bar */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={16} style={{ color: "var(--color-accent-light)" }} /> {agent.agent_id}
                  </h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setSelectedMemoryBank(agent.agent_id)} className="chip" style={{ fontSize: "10.5px", padding: "4px 10px" }}>
                      <Database size={12} /> Memory
                    </button>
                    <button onClick={() => setSelectedAgentCode(agent.agent_id)} className="chip" style={{ fontSize: "10.5px", padding: "4px 10px", borderColor: "rgba(99,102,241,0.3)", color: "var(--color-accent-light)" }}>
                      <Code2 size={12} /> Setup
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ padding: "20px" }}>
                  {/* Budget */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>Budget Spent</span>
                      <span className="font-mono-data" style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>${spent.toFixed(4)} / ${maxBudget.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: pctSpent > 90 ? "#F87171" : "linear-gradient(90deg, #6366F1, #818CF8)", width: `${Math.min(pctSpent, 100)}%`, transition: "width 1s" }} />
                    </div>
                  </div>

                  {/* Trust & ROI */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: "14px", background: "var(--color-surface-elevated)", borderRadius: 10, border: "1px solid var(--color-border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11.5px", color: "var(--color-text-muted)", marginBottom: 8 }}>
                        <ShieldCheck size={14} /> Trust Score
                      </div>
                      {ts ? (
                        <div className="font-mono-data" style={{ fontSize: "24px", fontWeight: 700, color: ts.composite_score >= 80 ? "#34D399" : ts.composite_score >= 50 ? "#FBBF24" : "#F87171" }}>
                          {ts.composite_score.toFixed(1)}<span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>/100</span>
                        </div>
                      ) : <div style={{ fontSize: "18px", color: "var(--color-text-muted)" }}>--</div>}
                    </div>
                    <div style={{ padding: "14px", background: "var(--color-surface-elevated)", borderRadius: 10, border: "1px solid var(--color-border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11.5px", color: "var(--color-text-muted)", marginBottom: 8 }}>
                        <DollarSign size={14} /> Savings
                      </div>
                      {roi ? (
                        <div className="font-mono-data" style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-success)" }}>
                          {roi.savings_percent.toFixed(0)}%
                        </div>
                      ) : <div style={{ fontSize: "18px", color: "var(--color-text-muted)" }}>--</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live Terminal */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(248,113,113,0.4)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(251,191,36,0.4)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(52,211,153,0.4)" }} />
          </div>
          <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>live_intercepts.sh (Cascadeflow Monitor)</span>
        </div>
        <div style={{ padding: "16px 20px", minHeight: "220px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", lineHeight: 1.8, background: "#0A0A0B", overflowY: "auto" }}>
          {liveEvents.length === 0 ? (
            <div style={{ color: "var(--color-text-muted)" }}>Waiting for incoming traffic...</div>
          ) : (
            liveEvents.map((ev, i) => {
              const ts = new Date(ev.timestamp_ms).toISOString().split("T")[1].slice(0, -1);
              const isBlocked = ev.audit_event?.action === "stop";
              return (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "var(--color-text-muted)" }}>[{ts}]</span>
                  <span style={{ color: "var(--color-accent-light)", width: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.agent_id}</span>
                  <span style={{ color: isBlocked ? "#F87171" : "#34D399", width: 44 }}>{isBlocked ? "BLCK" : "PASS"}</span>
                  <span style={{ color: "var(--color-text-muted)", width: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.audit_event?.model || "unknown"}</span>
                  <span style={{ color: "var(--color-warning)", width: 96 }}>cost=${ev.audit_event?.cost_total?.toFixed(5) || "0"}</span>
                  <span style={{ color: "var(--color-text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.category}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Remediations */}
      {remediations && remediations.remediations.length > 0 && (
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} /> Autonomous Routing Adjustments
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {remediations.remediations.map((rem, idx) => (
              <div key={idx} style={{ padding: "14px 16px", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", marginBottom: 4 }}>
                    <span className="font-mono-data" style={{ fontSize: "11px", color: "var(--color-success)" }}>{new Date(rem.applied_at_ms).toLocaleTimeString()}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>Cost escalation in <strong style={{ color: "var(--color-text-primary)" }}>{rem.category}</strong></span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{rem.old_model}</span>
                    <ArrowRight size={12} />
                    <span style={{ color: "var(--color-accent-light)" }}>{rem.new_model}</span>
                  </div>
                </div>
                <span className="badge badge-allow" style={{ fontSize: "10px" }}>Auto-Fixed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Modal */}
      {selectedAgentCode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: 640, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Terminal size={16} style={{ color: "var(--color-accent-light)" }} /> Drop-in Integration
              </h3>
              <button onClick={() => setSelectedAgentCode(null)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: "20px" }}>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                Connect <strong style={{ color: "var(--color-text-primary)" }}>{selectedAgentCode}</strong> to Obsidian. No SDKs, no architecture changes.
              </p>
              <div className="code-block" style={{ fontSize: "11.5px", lineHeight: 1.8 }}>{getIntegrationCode(selectedAgentCode)}</div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedAgentCode(null)} className="btn btn-ghost" style={{ padding: "6px 16px" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Inspector Modal */}
      {selectedMemoryBank && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: 900, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-accent-light)", display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={16} /> Memory Bank: obsidian-{selectedMemoryBank}
              </h3>
              <button onClick={() => setSelectedMemoryBank(null)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Indexed Events */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Database size={13} /> Indexed Events
                </h4>
                <div style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, padding: 12, height: 256, overflowY: "auto", fontSize: "11px", fontFamily: "monospace", color: "var(--color-text-muted)" }}>
                  {liveEvents.filter(e => e.agent_id === selectedMemoryBank).reverse().slice(0, 5).map((e, idx) => (
                    <div key={idx} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <span style={{ color: "var(--color-accent-light)" }}>ID:</span> vec_{e.timestamp_ms}<br />
                      <span style={{ color: "var(--color-accent-light)" }}>Embedding:</span> [0.123, -0.456, 0.789, ...]<br />
                      <span style={{ color: "var(--color-success)" }}>Payload:</span> {JSON.stringify({ category: e.category, model: e.audit_event.model, cost: e.audit_event.cost_total })}
                    </div>
                  ))}
                  {liveEvents.filter(e => e.agent_id === selectedMemoryBank).length === 0 && "No events stored yet."}
                </div>
              </div>
              {/* Recall Eval */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Search size={13} /> Live Recall Evaluation
                </h4>
                <div style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, padding: 16 }}>
                  {trustScores[selectedMemoryBank]?.recall_eval ? (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 600 }}>Vector Query</div>
                        <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)" }}>"{trustScores[selectedMemoryBank].recall_eval.question}"</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 600 }}>Ground Truth</div>
                          <div style={{ fontSize: "12.5px", color: "var(--color-accent-light)" }}>{trustScores[selectedMemoryBank].recall_eval.ground_truth}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 600 }}>Hindsight Output</div>
                          <div style={{ fontSize: "12.5px", color: "var(--color-success)" }}>{trustScores[selectedMemoryBank].recall_eval.hindsight_answer}</div>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Match:</span>
                        <span className="badge badge-allow">{trustScores[selectedMemoryBank].recall_eval.match ? "SUCCESS (100 pts)" : "FAILED (0 pts)"}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", padding: "40px 0", textAlign: "center" }}>Not enough data to evaluate recall yet.</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>Powered by Hindsight & Vectorize</span>
              <button onClick={() => setSelectedMemoryBank(null)} className="btn btn-ghost" style={{ padding: "6px 16px" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
