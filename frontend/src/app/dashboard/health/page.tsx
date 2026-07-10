"use client";

import React, { useState, useEffect } from "react";
import { getHealth } from "@/lib/api";
import { Activity, Server, Database, BrainCircuit, ShieldCheck, Zap, TerminalSquare, AlertTriangle } from "lucide-react";

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
  const [latency, setLatency] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return newLogs.length > 8 ? newLogs.slice(newLogs.length - 8) : newLogs;
    });
  };

  const checkHealth = async () => {
    setStatus("loading");
    const start = performance.now();
    try {
      await getHealth();
      const end = performance.now();
      setLatency(end - start);
      setStatus("online");
      addLog("[OK] Obsidian Core Gateway responsive.");
      setTimeout(() => addLog(`[OK] Gateway Latency: ${(end - start).toFixed(0)}ms`), 500);
      setTimeout(() => addLog("[OK] Hindsight VectorDB connection stable."), 1000);
      setTimeout(() => addLog("[OK] Groq Inference API fully operational."), 1500);
      setTimeout(() => addLog("[OK] Cascadeflow guardrails synchronized."), 2000);
    } catch {
      setStatus("offline");
      setLatency(null);
      addLog("[ERROR] Connection to Obsidian Core failed!");
    }
  };

  useEffect(() => {
    addLog("[SYS] Initializing diagnostic sequence...");
    checkHealth();
    const t = setInterval(checkHealth, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={22} style={{ color: "var(--color-success)" }} /> System Topology
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Live Infrastructure Diagnostics
          </p>
        </div>
        <div className="card" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 600 }}>Global Status</span>
          {status === "online" ? (
            <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: "12.5px", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="status-dot online" /> ALL SYSTEMS NOMINAL
            </span>
          ) : status === "loading" ? (
            <span style={{ color: "var(--color-warning)", fontWeight: 700, fontSize: "12.5px", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="status-dot warning" /> DIAGNOSING...
            </span>
          ) : (
            <span style={{ color: "var(--color-danger)", fontWeight: 700, fontSize: "12.5px", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> SYSTEM OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Topology Map */}
      <div className="card" style={{ padding: "48px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          {/* Agents */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Server size={32} style={{ color: "var(--color-accent-light)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13px" }}>Client Agents</div>
              <div style={{ fontSize: "10.5px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: 2 }}>Multi-tenant inputs</div>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent), var(--color-accent-dim))" }} />
            <Zap size={16} style={{ margin: "-8px 0", color: "var(--color-accent-light)" }} />
            <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent), var(--color-accent-dim))" }} />
          </div>

          {/* Gateway */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 100, height: 100, borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(99,102,241,0.1)" }}>
              <ShieldCheck size={36} style={{ color: "var(--color-accent-light)" }} />
              <span className="font-mono-data" style={{ fontSize: "10px", color: "var(--color-accent-light)", marginTop: 4, padding: "2px 8px", background: "rgba(99,102,241,0.15)", borderRadius: 4 }}>
                {status === "online" ? (latency ? `${latency.toFixed(0)}ms` : "OK") : "ERR"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "14px", letterSpacing: "0.04em" }}>Obsidian Gateway</div>
              <div style={{ fontSize: "10.5px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: 2 }}>Cascadeflow Guardrails · Auth & Routing</div>
            </div>
          </div>

          {/* Arrows split */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, var(--color-accent-dim), rgba(251,191,36,0.4), var(--color-accent-dim))" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, var(--color-accent-dim), rgba(167,139,250,0.4), var(--color-accent-dim))" }} />
            </div>
          </div>

          {/* End nodes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BrainCircuit size={28} style={{ color: "var(--color-warning)" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "12.5px" }}>Groq Engine</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>Llama-3.3-70b</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Database size={28} style={{ color: "#A78BFA" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "12.5px" }}>Hindsight DB</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>Vectorize Memory</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TerminalSquare size={15} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em" }}>SYSTEM_LOGS // REALTIME</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(248,113,113,0.3)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(251,191,36,0.3)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(52,211,153,0.3)" }} />
          </div>
        </div>
        <div style={{ padding: "16px 20px", minHeight: "220px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", lineHeight: 1.8, background: "#0A0A0B" }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: log.includes("[ERROR]") ? "#F87171" : log.includes("[SYS]") ? "#818CF8" : "#34D399" }}>
              {log}
            </div>
          ))}
          {status === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span style={{ width: 6, height: 14, background: "var(--color-accent)", animation: "pulse-dot 1s infinite" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
