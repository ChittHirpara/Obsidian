const API_BASE = "/api";

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
  [key: string]: any;
}

export interface EventRecord {
  timestamp_ms: number;
  category: string;
  audit_event: AuditEvent;
}

export interface EventsResponse {
  total: number;
  events: EventRecord[];
}

export interface Insights {
  recall: string | null;
  reflect: string | null;
  routing_suggestion: any;
}

export interface QueryResponse {
  response: string;
  category: string;
  blocked: boolean;
  audit_event: AuditEvent;
  summary: Record<string, any>;
  routing_suggestion: any;
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
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", ...options });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getEvents = (): Promise<EventsResponse> =>
  apiFetch<EventsResponse>("/events");

export const getInsights = (): Promise<Insights> =>
  apiFetch<Insights>("/insights");

export const getHealth = (): Promise<HealthResponse> =>
  apiFetch<HealthResponse>("/health");

export const postQuery = (query: string): Promise<QueryResponse> =>
  apiFetch<QueryResponse>("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

export const deleteSession = (): Promise<SessionResetResponse> =>
  apiFetch<SessionResetResponse>("/session", { method: "DELETE" });
