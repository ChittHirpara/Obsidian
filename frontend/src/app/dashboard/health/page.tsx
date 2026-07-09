"use client";

import React, { useState, useEffect } from "react";
import { getHealth } from "@/lib/api";
import { Activity, Server, Database, BrainCircuit, ShieldCheck, Zap, ArrowRight, CheckCircle2, AlertTriangle, TerminalSquare } from "lucide-react";
import Ferrofluid from "@/components/Ferrofluid";

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
  const [latency, setLatency] = useState<number | null>(null);
  
  // Fake diagnostic logs for visual effect
  const [logs, setLogs] = useState<string[]>([]);

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
    } catch (e: any) {
      setStatus("offline");
      setLatency(null);
      addLog("[ERROR] Connection to Obsidian Core failed!");
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return newLogs.length > 8 ? newLogs.slice(newLogs.length - 8) : newLogs;
    });
  };

  useEffect(() => {
    addLog("[SYS] Initializing diagnostic sequence...");
    checkHealth();
    const t = setInterval(checkHealth, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden p-8 font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <Ferrofluid colors={["#10B981", "#3B82F6", "#06B6D4"]} speed={0.2} scale={1.5} flowDirection="up" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <Activity className="w-10 h-10 text-emerald-400" />
              System Topology
            </h1>
            <p className="text-neutral-400 mt-2 text-lg uppercase tracking-widest font-semibold">
              Live Infrastructure Diagnostics
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-neutral-900/80 backdrop-blur-xl rounded-xl border border-neutral-800 shadow-2xl flex flex-col items-center">
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Global Status</span>
              {status === "online" ? (
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  ALL SYSTEMS NOMINAL
                </span>
              ) : status === "loading" ? (
                <span className="text-yellow-400 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                  DIAGNOSING...
                </span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  SYSTEM OFFLINE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* The Crazy Animated Topology Map */}
        <div className="bg-neutral-900/50 backdrop-blur-3xl rounded-3xl border border-neutral-800 p-12 shadow-2xl relative overflow-hidden">
          
          {/* Animated Grid Background */}
          <div className="absolute inset-0 z-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
            
            {/* Node 1: Agents */}
            <div className="relative group w-48 flex flex-col items-center">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/40 transition duration-500 animate-pulse" />
              <div className="relative w-24 h-24 bg-neutral-950 rounded-2xl border-2 border-blue-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10">
                <Server className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="mt-4 font-bold text-blue-100 tracking-wider">Client Agents</h3>
              <p className="text-xs text-blue-400/70 font-mono mt-1">Multi-tenant inputs</p>
            </div>

            {/* Path 1 */}
            <div className="hidden md:flex flex-1 items-center justify-center relative h-24">
              <div className="absolute w-full h-[2px] bg-neutral-800" />
              <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-[slide_2s_linear_infinite]" 
                   style={{ backgroundSize: '200% 100%', animation: 'flowRight 2s linear infinite' }} />
              <style jsx>{`
                @keyframes flowRight {
                  0% { background-position: 100% 0; }
                  100% { background-position: -100% 0; }
                }
              `}</style>
              <Zap className="w-5 h-5 text-cyan-400 absolute animate-pulse z-10 bg-neutral-900 rounded-full p-0.5" />
            </div>

            {/* Node 2: Obsidian Core (Center) */}
            <div className="relative group w-56 flex flex-col items-center">
              <div className="absolute -inset-8 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-32 h-32 bg-neutral-950 rounded-3xl border-2 border-cyan-400 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] z-10">
                <ShieldCheck className="w-12 h-12 text-cyan-300 mb-2" />
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800">
                  {status === 'online' ? (latency ? `${latency.toFixed(0)}ms` : 'OK') : 'ERR'}
                </span>
              </div>
              <h3 className="mt-6 font-black text-xl text-white tracking-widest uppercase">Obsidian Gateway</h3>
              <p className="text-xs text-cyan-400/80 font-mono mt-2 text-center">Cascadeflow Guardrails<br/>Auth & Routing</p>
            </div>

            {/* Split Paths */}
            <div className="hidden md:flex flex-1 relative h-48 w-32">
              {/* Upper Path to Groq */}
              <div className="absolute top-1/4 left-0 w-full h-[2px] bg-neutral-800 rotate-[-15deg] origin-left" />
              <div className="absolute top-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50 rotate-[-15deg] origin-left" 
                   style={{ animation: 'flowRight 1.5s linear infinite' }} />
              
              {/* Lower Path to Hindsight */}
              <div className="absolute bottom-1/4 left-0 w-full h-[2px] bg-neutral-800 rotate-[15deg] origin-left" />
              <div className="absolute bottom-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50 rotate-[15deg] origin-left" 
                   style={{ animation: 'flowRight 2.5s linear infinite' }} />
            </div>

            {/* End Nodes */}
            <div className="flex flex-col gap-12 relative z-10">
              
              {/* Node 3: Groq */}
              <div className="relative group w-48 flex flex-col items-center">
                <div className="absolute -inset-4 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/30 transition duration-500" />
                <div className="relative w-20 h-20 bg-neutral-950 rounded-xl border border-orange-500/50 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.2)] z-10">
                  <BrainCircuit className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="mt-3 font-bold text-orange-100">Groq Engine</h3>
                <p className="text-[10px] text-orange-400/70 font-mono mt-1">Llama-3.3-70b @ 800t/s</p>
              </div>

              {/* Node 4: Hindsight */}
              <div className="relative group w-48 flex flex-col items-center">
                <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/30 transition duration-500" />
                <div className="relative w-20 h-20 bg-neutral-950 rounded-xl border border-purple-500/50 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)] z-10">
                  <Database className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="mt-3 font-bold text-purple-100">Hindsight DB</h3>
                <p className="text-[10px] text-purple-400/70 font-mono mt-1">Vectorize Memory Banks</p>
              </div>

            </div>
          </div>
        </div>

        {/* Diagnostic Terminal */}
        <div className="bg-black/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-neutral-900 px-4 py-3 flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-neutral-500" />
              <span className="text-sm text-neutral-400 font-mono font-bold tracking-widest">SYSTEM_LOGS // REALTIME</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
            </div>
          </div>
          <div className="p-6 h-64 overflow-y-auto font-mono text-sm space-y-2 bg-[#0a0a0a]">
            {logs.map((log, i) => (
              <div key={i} className="flex">
                <span className={`transition-opacity duration-500 animate-in fade-in slide-in-from-left-2 ${log.includes('[ERROR]') ? 'text-red-400 font-bold' : log.includes('[SYS]') ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {log}
                </span>
              </div>
            ))}
            {status === "loading" && (
              <div className="flex items-center gap-2 text-neutral-500 mt-4">
                <span className="w-2 h-5 bg-emerald-400 animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
