"use client";

import { useState, useEffect } from "react";
import { getHealth } from "@/lib/api";

export default function HealthPage() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkHealth = async () => {
    setStatus("loading");
    setErrorMsg(null);
    const start = performance.now();
    try {
      await getHealth();
      const end = performance.now();
      setLatency(end - start);
      setStatus("online");
    } catch (e: any) {
      setStatus("offline");
      setErrorMsg(e?.message ?? "Connection refused");
      setLatency(null);
    } finally {
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 10000); // check every 10s
    return () => clearInterval(t);
  }, []);

  const getStatusColor = () => {
    if (status === "loading") return "#6B7280";
    if (status === "online") return "#16A34A";
    return "#DC2626";
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Backend Connection</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>
              Monitoring connectivity to FastAPI core
            </p>
          </div>
          <button onClick={checkHealth} className="btn btn-ghost" disabled={status === "loading"} style={{ padding: "6px 12px" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", background: "#F7F9F8", borderRadius: "8px", border: "1px solid #E3E8E6" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `${getStatusColor()}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
             {status === "loading" ? (
               <div style={{ width: 20, height: 20, border: `2px solid ${getStatusColor()}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
             ) : status === "online" ? (
               <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={getStatusColor()} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
             ) : (
               <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={getStatusColor()} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             )}
          </div>
          
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: getStatusColor(), textTransform: "capitalize" }}>
              {status === "loading" ? "Checking..." : status}
            </p>
            <p className="font-mono-data" style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
              {status === "online" && latency !== null ? `Latency: ${latency.toFixed(0)}ms` : errorMsg ? `Error: ${errorMsg}` : "Awaiting response..."}
            </p>
          </div>
        </div>

        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #E3E8E6", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "#6B7280" }}>API Endpoint: <span className="font-mono-data" style={{ color: "#111827" }}>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</span></span>
          <span style={{ fontSize: "12px", color: "#6B7280" }}>
            Last checked: {lastCheck ? lastCheck.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            }) : "—"}
          </span>
        </div>
      </div>

    </div>
  );
}
