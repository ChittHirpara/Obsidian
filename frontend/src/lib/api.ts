const API_URL = "https://obsidian-37k1.onrender.com";

export interface BudgetState {
  max: number;
  remaining: number;
}

export interface AuditEvent {
  timestamp_ms: number;
  category: string;
  model: string | null;
  cost_total: number;
  latency_used_ms: number;
  action: "allow" | "stop" | "deny_tool" | "switch_model" | string;
  budget_state: BudgetState;
  decision_mode?: string;
  run_id?: string;
  step?: number;
  reason?: string;
  query?: string;
  agent_id?: string;
  [key: string]: any;
}

export interface EventRecord {
  timestamp_ms: number;
  category: string;
  agent_id?: string;
  audit_event: AuditEvent;
}

export interface EventsResponse {
  total: number;
  events: EventRecord[];
  agent_id?: string | null;
}

export interface Insights {
  recall: string | null;
  reflect: string | null;
  routing_suggestion: any;
  agent_id?: string | null;
}

export interface QueryResponse {
  response: string;
  category: string;
  blocked: boolean;
  audit_event: AuditEvent;
  summary: Record<string, any>;
  routing_suggestion: any;
  agent_id?: string;
}

export interface SessionResetResponse {
  message: string;
  previous_summary: Record<string, any>;
}

export interface HealthResponse {
  status: string;
}

// ── API helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, { cache: "no-store", ...options });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getEvents = (agentId?: string): Promise<EventsResponse> =>
  apiFetch<EventsResponse>(`/events${agentId ? `?agent_id=${agentId}` : ""}`);

export const getInsights = (agentId?: string): Promise<Insights> =>
  apiFetch<Insights>(`/insights${agentId ? `?agent_id=${agentId}` : ""}`);

export const getHealth = (): Promise<HealthResponse> =>
  apiFetch<HealthResponse>("/health");

export const postQuery = (query: string, agentId?: string): Promise<QueryResponse> =>
  apiFetch<QueryResponse>("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, agent_id: agentId || "default" }),
  });

export const deleteSession = (): Promise<SessionResetResponse> =>
  apiFetch<SessionResetResponse>("/session", { method: "DELETE" });

// ── Multi-agent types + endpoints (new) ───────────────────────────────────

export interface AgentSummary {
  agent_id: string;
  event_count: number;
  total_spend: number;
  blocked_count: number;
  compliance_pass_rate: number;
}

export interface AgentListResponse {
  agents: AgentSummary[];
}

export interface RecallEval {
  question: string;
  ground_truth: string;
  hindsight_answer: string;
  match: boolean | null;
  method: string;
  bank_id?: string;
  note?: string;
}

export interface TrustScoreResponse {
  agent_id: string;
  composite_score: number;
  compliance_score: number;
  cost_efficiency_score: number;
  recall_accuracy_score: number;
  weights: { compliance: string; cost_efficiency: string; recall_accuracy: string };
  math: string;
  recall_eval: RecallEval;
  event_count: number;
  compliance_note: string;
  cost_note: string;
  hindsight_bank: string;
}

export interface ROIResponse {
  agent_id: string;
  query_count: number;
  actual_cost: number;
  baseline_cost: number;
  savings_dollars: number;
  savings_percent: number;
  most_expensive_model: string | null;
  most_expensive_cost_seen: number;
  model_breakdown: Record<string, { count: number; total_cost: number; avg_cost: number; pct_of_spend: number }>;
  math: string;
  note?: string;
}

export interface RemediationEntry {
  applied_at_ms: number;
  applied_at_iso: string;
  category: string;
  old_model: string;
  new_model: string;
  reason: string;
  escalation_rate?: number;
}

export interface RemediationsResponse {
  total_remediations: number;
  auto_applied: boolean;
  current_policy: Record<string, string>;
  remediations: RemediationEntry[];
}

export const getAgents = (): Promise<AgentListResponse> =>
  apiFetch<AgentListResponse>("/agents");

export const getTrustScore = (agentId: string): Promise<TrustScoreResponse> =>
  apiFetch<TrustScoreResponse>(`/trust-score?agent_id=${encodeURIComponent(agentId)}`);

export const getRoi = (agentId?: string): Promise<ROIResponse> =>
  apiFetch<ROIResponse>(agentId ? `/roi?agent_id=${encodeURIComponent(agentId)}` : "/roi");

export const getRemediations = (): Promise<RemediationsResponse> =>
  apiFetch<RemediationsResponse>("/remediations");

export const resetAgent = (agentId: string): Promise<SessionResetResponse> =>
  apiFetch<SessionResetResponse>(`/agents/${encodeURIComponent(agentId)}/reset`, { method: "DELETE" });

// ── Settings ───────────────────────────────────────────────────────────────

export interface ObsidianSettings {
  // Agent Behaviour
  autoRemediate: boolean;
  blockOnBudget: boolean;
  logAllQueries: boolean;
  streamEvents: boolean;
  hindsightEnabled: boolean;
  recallThreshold: number;

  // Budget & Cost Controls
  budgetCap: number;
  warningThreshold: number;
  costAlerts: boolean;
  slackAlerts: boolean;

  // Model & Routing
  routingStrategy: string;
  defaultModel: string;
  fallbackModel: string;
  latencyBudget: number;

  // Safety & Compliance Policies
  strictSensitive: boolean;
  piiDetection: boolean;
  jailbreakBlock: boolean;
  auditRetention: string;

  // Integration & API
  webhookUrl: string;
  corsOrigins: string;
}

export interface DangerActionResponse {
  success: boolean;
  message: string;
}

export const getSettings = (): Promise<ObsidianSettings> =>
  apiFetch<ObsidianSettings>("/settings");

export const postSettings = (settings: ObsidianSettings): Promise<ObsidianSettings> =>
  apiFetch<ObsidianSettings>("/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

export const purgeLogs = (): Promise<DangerActionResponse> =>
  apiFetch<DangerActionResponse>("/settings/danger/purge-logs", { method: "POST" });

export const clearMemory = (): Promise<DangerActionResponse> =>
  apiFetch<DangerActionResponse>("/settings/danger/clear-memory", { method: "POST" });

export const resetBudgets = (): Promise<DangerActionResponse> =>
  apiFetch<DangerActionResponse>("/settings/danger/reset-budgets", { method: "POST" });
