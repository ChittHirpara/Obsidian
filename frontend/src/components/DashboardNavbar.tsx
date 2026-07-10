"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  { id: "query", label: "Query", href: "/dashboard/query" },
  { id: "events", label: "Events", href: "/dashboard/events" },
  { id: "insights", label: "Insights", href: "/dashboard/insights" },
  { id: "platform", label: "Platform", href: "/dashboard/platform" },
  { id: "trust-score", label: "Trust Score", href: "/dashboard/trust-score" },
  { id: "session", label: "Session", href: "/dashboard/session" },
  { id: "health", label: "Health", href: "/dashboard/health" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAV_BG = "#293681";        // deep navy – always clearly visible
const NAV_ACCENT = "#4274D9";        // royal blue – active pill
const NAV_TEXT = "rgba(255,255,255,0.70)";
const NAV_TEXT_ACT = "#FFFFFF";
const NAV_HOVER = "rgba(255,255,255,0.08)";
const NAV_BORDER = "rgba(255,255,255,0.10)";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "10px 16px",
        transition: "all 0.2s ease",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1100px",
          padding: "8px 12px",
          borderRadius: "14px",
          background: NAV_BG,
          border: `1px solid ${NAV_BORDER}`,
          boxShadow: scrolled
            ? "0 8px 32px rgba(41,54,129,0.35), 0 2px 8px rgba(0,0,0,0.15)"
            : "0 4px 20px rgba(41,54,129,0.25), 0 1px 4px rgba(0,0,0,0.10)",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginRight: "12px" }}>
          {/* Logo icon */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #4274D9 0%, #95CCDD 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(66,116,217,0.5)",
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          </div>
          <span
            style={{
              color: NAV_TEXT_ACT,
              fontWeight: 800,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Obsidian
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "22px", background: NAV_BORDER, flexShrink: 0, marginRight: "12px" }} />

        {/* Nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            overflowX: "auto",
            flex: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 500,
                  color: active ? NAV_TEXT_ACT : NAV_TEXT,
                  background: active
                    ? NAV_ACCENT
                    : "transparent",
                  border: active ? "none" : "1px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: active ? "0 2px 8px rgba(66,116,217,0.35)" : "none",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = NAV_HOVER;
                    (e.currentTarget as HTMLElement).style.color = NAV_TEXT_ACT;
                    (e.currentTarget as HTMLElement).style.borderColor = NAV_BORDER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = NAV_TEXT;
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Live indicator pill */}
        <div
          style={{
            flexShrink: 0,
            marginLeft: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "999px",
            background: "rgba(22, 163, 74, 0.15)",
            border: "1px solid rgba(22,163,74,0.30)",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#16A34A",
              display: "inline-block",
              animation: "pulse-dot 1.8s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>
            LIVE
          </span>
        </div>
      </nav>
    </div>
  );
}
