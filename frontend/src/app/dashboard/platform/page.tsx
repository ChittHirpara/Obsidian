"use client";

import React, { useEffect, useState, useRef } from "react";
import { getAgents, getTrustScore, getRoi, getRemediations, getEvents, AgentSummary, TrustScoreResponse, ROIResponse, RemediationsResponse, EventRecord } from "@/lib/api";
import { Activity, ShieldCheck, DollarSign, Terminal, ArrowRight, Zap, CheckCircle2, AlertTriangle, Code2, Database, Search } from "lucide-react";
import Ferrofluid from "@/components/Ferrofluid";

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
      
      const rems = await getRemediations();
      setRemediations(rems);

      const evts = await getEvents();
      // Get the latest 30 events for the terminal
      setLiveEvents(evts.events.slice(-30));
    } catch (err: any) {
      setError(err.message || "Failed to fetch platform data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 2 seconds for the "live simulation" feel
    const interval = setInterval(fetchAllData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll terminal to bottom
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveEvents]);

  const getIntegrationCode = (agentId: string) => `import openai

# 1. Point the client to the Obsidian Gateway
client = openai.Client(
    base_url="https://obsidian-gateway.company.com/v1", 
    api_key="obsidian_key"
)

# 2. Add your agent_id to the headers
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "I want a refund"}],
    extra_headers={"x-obsidian-agent-id": "${agentId}"} # <-- All you add!
)`;

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden p-8 font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Ferrofluid 
          colors={["#4F46E5", "#06B6D4", "#E0F2FE"]}
          speed={0.3}
          scale={1.2}
          flowDirection="down"
          mouseInteraction={false}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/60 backdrop-blur-xl p-6 rounded-2xl border border-neutral-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400" />
              Obsidian Platform Control
            </h1>
            <p className="text-neutral-400 mt-2 text-lg">
              Enterprise Middleware: Secure and audit multiple agents concurrently with zero infrastructure changes.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
              <span className="block text-xs text-neutral-400 uppercase tracking-wider">Active Agents</span>
              <span className="block text-xl font-mono text-white">{agents.length}</span>
            </div>
            <div className="px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
              <span className="block text-xs text-neutral-400 uppercase tracking-wider">Total Remediations</span>
              <span className="block text-xl font-mono text-emerald-400">{remediations?.total_remediations || 0}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && agents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 animate-pulse">Loading Platform Data...</div>
          ) : agents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500">No agents have processed events yet. Run some queries!</div>
          ) : (
            agents.map(agent => {
              const ts = trustScores[agent.agent_id];
              const roi = rois[agent.agent_id];
              const spent = agent.total_spend;
              const maxBudget = 1.00;
              const pctSpent = (spent / maxBudget) * 100;

              return (
                <div key={agent.agent_id} className="group relative bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-cyan-900/20">
                  {/* Top Bar */}
                  <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      {agent.agent_id}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedMemoryBank(agent.agent_id)}
                        className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <Database className="w-3.5 h-3.5" /> Memory
                      </button>
                      <button 
                        onClick={() => setSelectedAgentCode(agent.agent_id)}
                        className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-full border border-cyan-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Setup
                      </button>
                    </div>
                  </div>

                  {/* Metrics Body */}
                  <div className="p-5 space-y-6">
                    {/* Budget Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-neutral-400">Budget Spent</span>
                        <span className="font-mono text-neutral-200">${spent.toFixed(4)} / ${maxBudget.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${pctSpent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                          style={{ width: `${Math.min(pctSpent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Trust & ROI Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Trust Score */}
                      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                          <ShieldCheck className="w-4 h-4" /> Trust Score
                        </div>
                        {ts ? (
                          <div className="text-3xl font-mono font-bold" style={{ color: ts.composite_score >= 80 ? '#4ade80' : ts.composite_score >= 50 ? '#facc15' : '#f87171' }}>
                            {ts.composite_score.toFixed(1)}<span className="text-sm text-neutral-500">/100</span>
                          </div>
                        ) : (
                          <div className="text-xl text-neutral-500">--</div>
                        )}
                      </div>

                      {/* ROI */}
                      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                          <DollarSign className="w-4 h-4" /> Routing Savings
                        </div>
                        {roi ? (
                          <div className="text-3xl font-mono font-bold text-emerald-400">
                            {roi.savings_percent.toFixed(0)}%
                          </div>
                        ) : (
                          <div className="text-xl text-neutral-500">--</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Terminal Stream */}
        <div className="bg-black/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="bg-neutral-900 px-4 py-2 flex items-center gap-2 border-b border-neutral-800">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-xs text-neutral-500 font-mono">live_intercepts.sh (Cascadeflow Monitor)</span>
          </div>
          <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
            {liveEvents.length === 0 ? (
              <div className="text-neutral-600">Waiting for incoming traffic... Run simulate_traffic.py</div>
            ) : (
              liveEvents.map((ev, i) => {
                const ts = new Date(ev.timestamp_ms).toISOString().split('T')[1].slice(0, -1);
                const isBlocked = ev.audit_event?.action === 'stop';
                const model = ev.audit_event?.model || 'unknown';
                const cost = ev.audit_event?.cost_total?.toFixed(5) || '0.00000';
                
                return (
                  <div key={i} className="flex gap-4 group">
                    <span className="text-neutral-600">[{ts}]</span>
                    <span className="text-cyan-600 w-32 truncate">{ev.agent_id}</span>
                    <span className={`${isBlocked ? 'text-red-400' : 'text-emerald-400'} w-12`}>
                      {isBlocked ? 'BLCK' : 'PASS'}
                    </span>
                    <span className="text-neutral-400 w-48 truncate">{model}</span>
                    <span className="text-yellow-600 w-24">cost=${cost}</span>
                    <span className="text-neutral-500 truncate flex-1">{ev.category}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Global Auto-Remediation Log */}
        {remediations && remediations.remediations.length > 0 && (
          <div className="bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-800 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Autonomous Routing Adjustments
            </h2>
            <div className="space-y-3">
              {remediations.remediations.map((rem, idx) => (
                <div key={idx} className="bg-neutral-800/50 border border-neutral-700 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="text-emerald-400 font-mono text-xs">{new Date(rem.applied_at_ms).toLocaleTimeString()}</span>
                      <span className="text-neutral-300">Obsidian detected cost escalation in <strong className="text-white">{rem.category}</strong>.</span>
                    </div>
                    <div className="text-neutral-400 text-sm flex items-center gap-2">
                      <span className="line-through decoration-red-500/50">{rem.old_model}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-cyan-400">{rem.new_model}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                    Auto-Fixed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Developer Integration Modal */}
      {selectedAgentCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Drop-in Integration
              </h3>
              <button onClick={() => setSelectedAgentCode(null)} className="text-neutral-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-neutral-300 mb-4 text-sm leading-relaxed">
                Connect the <strong className="text-white">{selectedAgentCode}</strong> to Obsidian's infrastructure. No SDKs, no architecture changes. Just point your existing OpenAI/OpenSource client to our gateway and pass your Agent ID.
              </p>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <pre className="relative bg-[#0d1117] p-5 rounded-lg border border-neutral-800 overflow-x-auto">
                  <code className="text-sm font-mono text-neutral-300">
                    {getIntegrationCode(selectedAgentCode)}
                  </code>
                </pre>
              </div>
            </div>
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button 
                onClick={() => setSelectedAgentCode(null)}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Inspector Modal */}
      {selectedMemoryBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h3 className="text-lg font-bold flex items-center gap-2 text-purple-400">
                <Database className="w-5 h-5" />
                Hindsight Vector Memory Bank (obsidian-{selectedMemoryBank})
              </h3>
              <button onClick={() => setSelectedMemoryBank(null)} className="text-neutral-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Left Column: Vector Storage */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Indexed Events
                </h4>
                <div className="bg-black border border-neutral-800 rounded-lg p-3 h-64 overflow-y-auto text-xs font-mono text-neutral-400 space-y-2">
                  {liveEvents.filter(e => e.agent_id === selectedMemoryBank).reverse().slice(0,5).map((e, idx) => (
                    <div key={idx} className="border-b border-neutral-800 pb-2">
                      <span className="text-purple-400">ID:</span> vec_{e.timestamp_ms}<br/>
                      <span className="text-cyan-400">Embedding:</span> [0.123, -0.456, 0.789, ...]<br/>
                      <span className="text-emerald-400">Payload:</span> {JSON.stringify({ category: e.category, model: e.audit_event.model, cost: e.audit_event.cost_total })}
                    </div>
                  ))}
                  {liveEvents.filter(e => e.agent_id === selectedMemoryBank).length === 0 && "No events stored in memory yet."}
                </div>
              </div>
              
              {/* Right Column: Recall Eval */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Live Recall Evaluation (Trust Score)
                </h4>
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-4">
                  {trustScores[selectedMemoryBank]?.recall_eval ? (
                    <>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Vector Query</div>
                        <div className="text-sm">"{trustScores[selectedMemoryBank].recall_eval.question}"</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Ground Truth</div>
                          <div className="text-sm text-cyan-400">{trustScores[selectedMemoryBank].recall_eval.ground_truth}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Hindsight Output</div>
                          <div className="text-sm text-emerald-400">{trustScores[selectedMemoryBank].recall_eval.hindsight_answer}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neutral-700 flex justify-between items-center">
                        <span className="text-sm text-neutral-400">Evaluation Match:</span>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                          {trustScores[selectedMemoryBank].recall_eval.match ? "SUCCESS (100 pts)" : "FAILED (0 pts)"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-neutral-500 py-10 text-center">
                      Not enough data to evaluate recall yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-mono">Powered by Hindsight & Vectorize</span>
              <button 
                onClick={() => setSelectedMemoryBank(null)}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
