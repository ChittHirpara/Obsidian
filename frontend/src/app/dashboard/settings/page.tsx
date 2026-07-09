"use client";

import { formatINR } from "@/lib/currency";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      
      {/* Configuration */}
      <div className="card" style={{ padding: "24px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>System Configuration</h2>
        
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ padding: "16px", background: "#F7F9F8", borderRadius: "8px", border: "1px solid #E3E8E6" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Backend API URL</p>
            <p className="font-mono-data" style={{ margin: 0, fontSize: "14px", color: "#111827" }}>
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>Configured via environment variables.</p>
          </div>

          <div style={{ padding: "16px", background: "#F7F9F8", borderRadius: "8px", border: "1px solid #E3E8E6" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Budget Cap</p>
            <p className="font-mono-data" style={{ margin: 0, fontSize: "14px", color: "#111827" }}>{formatINR(0.02, 2)}</p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>Fixed policy limit enforced by cascadeflow core.</p>
          </div>
        </div>
      </div>

      {/* Model & Routing Info */}
      <div className="card" style={{ padding: "24px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Routing Policies</h2>
        
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Target Model</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-teal">order_status</span></td>
                <td className="font-mono-data" style={{ fontSize: "12px", color: "#374151" }}>qwen-2.5-32b</td>
                <td style={{ fontSize: "12px", color: "#6B7280" }}>Standard cost/speed balance for common queries.</td>
              </tr>
              <tr>
                <td><span className="badge badge-indigo">refund</span></td>
                <td className="font-mono-data" style={{ fontSize: "12px", color: "#374151" }}>qwen-2.5-32b</td>
                <td style={{ fontSize: "12px", color: "#6B7280" }}>Requires accurate reasoning for financial logic.</td>
              </tr>
              <tr>
                <td><span className="badge badge-success">general_faq</span></td>
                <td className="font-mono-data" style={{ fontSize: "12px", color: "#374151" }}>llama-3.1-8b-instant</td>
                <td style={{ fontSize: "12px", color: "#6B7280" }}>High speed, low cost for simple questions.</td>
              </tr>
              <tr>
                <td><span className="badge badge-stop">sensitive_data</span></td>
                <td className="font-mono-data" style={{ fontSize: "12px", color: "#DC2626", fontWeight: 600 }}>BLOCKED</td>
                <td style={{ fontSize: "12px", color: "#6B7280" }}>Policy violation. Halted before reaching any model.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
