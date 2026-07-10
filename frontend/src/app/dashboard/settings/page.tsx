"use client";

import React, { useState } from "react";
import { Settings, Shield, DollarSign, GitBranch, ShieldAlert, Plug, AlertTriangle, Save, Copy } from "lucide-react";

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ color: "var(--color-accent-light)" }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h2>
      </div>
      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>{desc}</p>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border-subtle)", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
        {desc && <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, color = "var(--color-accent)" }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 42, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: value ? color : "#26272B", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 16, height: 16, borderRadius: "50%", background: "#F5F5F7", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", transition: "left 0.2s", display: "block" }} />
    </button>
  );
}

function SelectInput({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="select" style={{ width: "auto", minWidth: "180px" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumberInput({ value, onChange, min, max, step, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 90, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-elevated)", color: "var(--color-text-primary)", fontSize: "12.5px", fontWeight: 600, outline: "none", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }} />
      {suffix && <span style={{ fontSize: "12.5px", color: "var(--color-text-muted)", fontWeight: 500 }}>{suffix}</span>}
    </div>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-success)", background: "var(--color-success-dim)", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.2)" }}>
      Saved
    </span>
  );
}

export default function SettingsPage() {
  const [autoRemediate, setAutoRemediate] = useState(true);
  const [blockOnBudget, setBlockOnBudget] = useState(true);
  const [logAllQueries, setLogAllQueries] = useState(true);
  const [streamEvents, setStreamEvents] = useState(true);
  const [hindsightEnabled, setHindsightEnabled] = useState(true);
  const [recallThreshold, setRecallThreshold] = useState(0.72);
  const [budgetCap, setBudgetCap] = useState(1.00);
  const [warningThreshold, setWarningThreshold] = useState(40);
  const [costAlerts, setCostAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [defaultModel, setDefaultModel] = useState("llama-3.3-70b-versatile");
  const [fallbackModel, setFallbackModel] = useState("llama-3.1-8b-instant");
  const [routingStrategy, setRoutingStrategy] = useState("category-based");
  const [latencyBudget, setLatencyBudget] = useState(5000);
  const [strictSensitive, setStrictSensitive] = useState(true);
  const [piiDetection, setPiiDetection] = useState(true);
  const [jailbreakBlock, setJailbreakBlock] = useState(true);
  const [auditRetention, setAuditRetention] = useState("30");
  const [apiKey] = useState("obs_prod_xK92mLpQr7...●●●●");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [corsOrigins, setCorsOrigins] = useState("http://localhost:3000");
  const [saved, setSaved] = useState(false);
  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 860 }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Settings size={18} style={{ color: "var(--color-accent-light)" }} />
              </div>
              Settings
            </h1>
            <p style={{ marginTop: 8 }}>
              Configure Obsidian&apos;s agentic AI middleware — policies, routing, budgets & integrations.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SavedBadge show={saved} />
            <button onClick={showSaved} className="btn btn-primary" style={{ padding: "8px 20px" }}>
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Agent Behaviour */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <SectionHeader icon={<Shield size={18} />} title="Agent Behaviour" desc="Control how Obsidian intercepts, audits, and remediates agentic AI requests." />
        <SettingRow label="Auto-Remediate Violations" desc="Automatically reroute blocked queries to a safe fallback answer.">
          <Toggle value={autoRemediate} onChange={setAutoRemediate} />
        </SettingRow>
        <SettingRow label="Block on Budget Exhaustion" desc="Hard-stop all agent requests when the session budget cap is reached.">
          <Toggle value={blockOnBudget} onChange={setBlockOnBudget} color="var(--color-danger)" />
        </SettingRow>
        <SettingRow label="Log All Queries" desc="Persist full audit trail of every query, decision, and cost.">
          <Toggle value={logAllQueries} onChange={setLogAllQueries} />
        </SettingRow>
        <SettingRow label="Real-Time Event Streaming" desc="Stream live audit events to the dashboard at 2-second polling intervals.">
          <Toggle value={streamEvents} onChange={setStreamEvents} />
        </SettingRow>
        <SettingRow label="Hindsight Memory (RAG)" desc="Enable vector memory bank to recall past agent decisions.">
          <Toggle value={hindsightEnabled} onChange={setHindsightEnabled} />
        </SettingRow>
        <SettingRow label="Recall Similarity Threshold" desc="Minimum cosine similarity for a memory hit (0.0 – 1.0).">
          <NumberInput value={recallThreshold} onChange={setRecallThreshold} min={0} max={1} step={0.01} />
        </SettingRow>
      </div>

      {/* Budget & Cost */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <SectionHeader icon={<DollarSign size={18} />} title="Budget & Cost Controls" desc="Set per-session spending caps and configure alert thresholds." />
        <SettingRow label="Session Budget Cap" desc="Hard ceiling on total LLM cost per agent session.">
          <NumberInput value={budgetCap} onChange={setBudgetCap} min={0.01} max={100} step={0.01} suffix="USD" />
        </SettingRow>
        <SettingRow label="Low Budget Warning Threshold" desc="Trigger alert when remaining budget drops below this percentage.">
          <NumberInput value={warningThreshold} onChange={setWarningThreshold} min={5} max={80} step={5} suffix="%" />
        </SettingRow>
        <SettingRow label="In-App Cost Alerts" desc="Show toast notifications when budget hits warning or exhaustion threshold.">
          <Toggle value={costAlerts} onChange={setCostAlerts} color="var(--color-warning)" />
        </SettingRow>
        <SettingRow label="Slack Budget Alerts" desc="Send a Slack webhook notification when budget is low or exhausted.">
          <Toggle value={slackAlerts} onChange={setSlackAlerts} />
        </SettingRow>
      </div>

      {/* Model & Routing */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <SectionHeader icon={<GitBranch size={18} />} title="Model & Routing" desc="Configure which LLM models handle each query category." />
        <SettingRow label="Routing Strategy" desc="How Obsidian decides which model to use.">
          <SelectInput value={routingStrategy} onChange={setRoutingStrategy} options={[
            { label: "Category-Based (default)", value: "category-based" },
            { label: "Cost-Optimized", value: "cost-optimized" },
            { label: "Latency-First", value: "latency-first" },
            { label: "Always Default Model", value: "single-model" },
          ]} />
        </SettingRow>
        <SettingRow label="Default Model" desc="Primary LLM for general and unclassified queries.">
          <SelectInput value={defaultModel} onChange={setDefaultModel} options={[
            { label: "llama-3.3-70b-versatile", value: "llama-3.3-70b-versatile" },
            { label: "llama-3.1-8b-instant", value: "llama-3.1-8b-instant" },
            { label: "qwen-2.5-32b", value: "qwen-2.5-32b" },
          ]} />
        </SettingRow>
        <SettingRow label="Fallback Model" desc="Model when primary is unavailable or over budget.">
          <SelectInput value={fallbackModel} onChange={setFallbackModel} options={[
            { label: "llama-3.1-8b-instant", value: "llama-3.1-8b-instant" },
            { label: "llama-3.3-70b-versatile", value: "llama-3.3-70b-versatile" },
          ]} />
        </SettingRow>
        <SettingRow label="Max Latency Budget" desc="Abort and fallback if inference exceeds this limit.">
          <NumberInput value={latencyBudget} onChange={setLatencyBudget} min={500} max={30000} step={500} suffix="ms" />
        </SettingRow>
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Active Routing Policy</p>
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--color-border-subtle)" }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead><tr><th>Category</th><th>Model</th><th>Action</th><th>Priority</th></tr></thead>
              <tbody>
                {[
                  { cat: "order_status", model: "qwen-2.5-32b", action: "allow", priority: "High" },
                  { cat: "refund", model: "qwen-2.5-32b", action: "allow", priority: "High" },
                  { cat: "general_faq", model: "llama-3.1-8b-instant", action: "allow", priority: "Low" },
                  { cat: "sensitive_data", model: "—", action: "block", priority: "Critical" },
                ].map(r => (
                  <tr key={r.cat}>
                    <td><span className={`badge ${r.action === "block" ? "badge-stop" : "badge-switch"}`}>{r.cat}</span></td>
                    <td className="font-mono-data" style={{ fontSize: 12, color: r.action === "block" ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{r.action === "block" ? "BLOCKED" : r.model}</td>
                    <td><span className={`badge ${r.action === "block" ? "badge-stop" : "badge-allow"}`}>{r.action}</span></td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>{r.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Safety & Compliance */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <SectionHeader icon={<ShieldAlert size={18} />} title="Safety & Compliance" desc="Configure guardrails for sensitive data, PII, and prompt injection attacks." />
        <SettingRow label="Strict Sensitive Data Blocking" desc="Immediately block any query classified as sensitive_data.">
          <Toggle value={strictSensitive} onChange={setStrictSensitive} color="var(--color-danger)" />
        </SettingRow>
        <SettingRow label="PII Detection & Redaction" desc="Scan all incoming queries for Personally Identifiable Information.">
          <Toggle value={piiDetection} onChange={setPiiDetection} color="var(--color-danger)" />
        </SettingRow>
        <SettingRow label="Jailbreak & Prompt Injection Block" desc="Block queries that attempt to override system prompts.">
          <Toggle value={jailbreakBlock} onChange={setJailbreakBlock} color="var(--color-danger)" />
        </SettingRow>
        <SettingRow label="Audit Log Retention" desc="How long raw audit events are kept before automatic purge.">
          <SelectInput value={auditRetention} onChange={setAuditRetention} options={[
            { label: "7 days", value: "7" },
            { label: "30 days", value: "30" },
            { label: "90 days", value: "90" },
            { label: "1 year", value: "365" },
            { label: "Forever", value: "forever" },
          ]} />
        </SettingRow>
      </div>

      {/* Integration & API */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <SectionHeader icon={<Plug size={18} />} title="Integration & API" desc="Your API credentials and webhook configuration." />
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--color-border-subtle)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>Obsidian Gateway API Key</p>
          <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: "var(--color-text-muted)" }}>Pass this as <code style={{ background: "var(--color-surface-elevated)", padding: "1px 6px", borderRadius: 4, fontSize: 11, color: "var(--color-accent-light)" }}>x-obsidian-api-key</code> header.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={apiKey} style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)", fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
            <button onClick={() => navigator.clipboard.writeText(apiKey)} className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: "11.5px" }}><Copy size={12} /> Copy</button>
          </div>
        </div>
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--color-border-subtle)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>1-Line Integration (Python)</p>
          <div className="code-block" style={{ fontSize: "11.5px", lineHeight: 1.8 }}>
            <span style={{ color: "#5C5D63" }}># Before: direct OpenAI call</span>{"\n"}
            <span style={{ color: "#9B9CA3" }}>client</span> <span style={{ color: "#F5F5F7" }}>=</span> <span style={{ color: "#34D399" }}>openai.Client</span><span style={{ color: "#F5F5F7" }}>(base_url=</span><span style={{ color: "#F87171" }}>"https://api.openai.com"</span><span style={{ color: "#F5F5F7" }}>)</span>{"\n\n"}
            <span style={{ color: "#5C5D63" }}># After: route through Obsidian (1 change)</span>{"\n"}
            <span style={{ color: "#9B9CA3" }}>client</span> <span style={{ color: "#F5F5F7" }}>=</span> <span style={{ color: "#34D399" }}>openai.Client</span><span style={{ color: "#F5F5F7" }}>(</span>{"\n"}
            {"    "}<span style={{ color: "#818CF8" }}>base_url</span><span style={{ color: "#F5F5F7" }}>=</span><span style={{ color: "#F87171" }}>"https://obsidian-gateway.company.com/v1"</span><span style={{ color: "#F5F5F7" }}>,</span>{"\n"}
            {"    "}<span style={{ color: "#818CF8" }}>extra_headers</span><span style={{ color: "#F5F5F7" }}>={`{`}</span><span style={{ color: "#F87171" }}>"x-obsidian-agent-id"</span><span style={{ color: "#F5F5F7" }}>: </span><span style={{ color: "#F87171" }}>"your-agent-id"</span><span style={{ color: "#F5F5F7" }}>{`}`}</span>{"\n"}
            <span style={{ color: "#F5F5F7" }}>)</span>
          </div>
        </div>
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--color-border-subtle)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>Webhook URL</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="input" style={{ flex: 1 }} />
            <button className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: "12px" }}>Test</button>
          </div>
        </div>
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>Allowed CORS Origins</p>
          <input value={corsOrigins} onChange={(e) => setCorsOrigins(e.target.value)} className="input" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ background: "var(--color-danger-dim)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 14, padding: "24px 28px" }}>
        <SectionHeader icon={<AlertTriangle size={18} />} title="Danger Zone" desc="Irreversible actions. These cannot be undone." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {["Purge All Audit Logs", "Clear Hindsight Memory Banks", "Reset All Agent Budgets"].map(label => (
            <button key={label} className="btn btn-danger" style={{ padding: "8px 16px", fontSize: "12.5px" }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
