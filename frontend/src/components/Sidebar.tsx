"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ScrollText, Lightbulb, BarChart3,
  ShieldCheck, DollarSign, Settings, Activity, Globe, Database,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { id: "query", label: "Query", href: "/dashboard/query", icon: Search },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { id: "events", label: "Audit Trail", href: "/dashboard/events", icon: ScrollText },
      { id: "insights", label: "Insights", href: "/dashboard/insights", icon: Lightbulb },
      { id: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Governance",
    items: [
      { id: "trust-score", label: "Trust Score", href: "/dashboard/trust-score", icon: ShieldCheck },
      { id: "platform", label: "Platform", href: "/dashboard/platform", icon: Globe },
    ],
  },
  {
    label: "System",
    items: [
      { id: "session", label: "Session", href: "/dashboard/session", icon: Activity },
      { id: "health", label: "Health", href: "/dashboard/health", icon: Database },
      { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        height: "100vh",
        background: "#0D0E10",
        borderRight: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
              fill="white"
              fillOpacity="0.95"
            />
          </svg>
        </div>
        <div>
          <div style={{ color: "#F5F5F7", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Obsidian
          </div>
          <div style={{ color: "var(--color-text-muted)", fontSize: "10.5px", fontWeight: 500, letterSpacing: "0.04em" }}>
            AI GOVERNANCE
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: "4px" }}>
            <div className="nav-section-label" style={{ padding: "8px 8px 4px" }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-item${active ? " active" : ""}`}
                  style={{ marginBottom: "2px" }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom status */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--color-border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: "8px",
            background: "var(--color-success-dim)",
            border: "1px solid rgba(52,211,153,0.15)",
          }}
        >
          <span className="status-dot online" />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-success)", letterSpacing: "0.03em" }}>
            System Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
