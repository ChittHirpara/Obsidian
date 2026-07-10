"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, ScrollText, Lightbulb, BarChart3,
  ShieldCheck, DollarSign, Settings, Activity, Globe, Database,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Dashboard",   href: "/dashboard",             icon: LayoutDashboard, color: "#818CF8" },
      { id: "query",    label: "Live Query",  href: "/dashboard/query",        icon: Search,          color: "#A5B4FC" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { id: "events",    label: "Audit Trail", href: "/dashboard/events",    icon: ScrollText,  color: "#34D399" },
      { id: "insights",  label: "Insights",    href: "/dashboard/insights",  icon: Lightbulb,   color: "#FBBF24" },
      { id: "analytics", label: "Analytics",   href: "/dashboard/analytics", icon: BarChart3,   color: "#F472B6" },
    ],
  },
  {
    label: "Governance",
    items: [
      { id: "trust-score", label: "Trust Score", href: "/dashboard/trust-score", icon: ShieldCheck, color: "#34D399" },
      { id: "platform",    label: "Platform",    href: "/dashboard/platform",    icon: Globe,       color: "#60A5FA" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "session",  label: "Session",  href: "/dashboard/session",  icon: Activity,  color: "#A78BFA" },
      { id: "health",   label: "Health",   href: "/dashboard/health",   icon: Database,  color: "#34D399" },
      { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings,  color: "#9094B0" },
    ],
  },
];

function ObsidianGem() {
  return (
    <motion.div
      animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.4)", "0 0 35px rgba(99,102,241,0.7)", "0 0 20px rgba(99,102,241,0.4)"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #818CF8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Inner shine */}
      <div style={{
        position: "absolute",
        top: -8,
        left: -8,
        width: 24,
        height: 24,
        background: "rgba(255,255,255,0.2)",
        borderRadius: "50%",
        filter: "blur(6px)",
      }} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L4 8.5L7 20H17L20 8.5L12 2Z"
          fill="white"
          fillOpacity={0.95}
        />
        <path
          d="M12 2L4 8.5H20L12 2Z"
          fill="white"
          fillOpacity={0.5}
        />
        <path
          d="M7 20L12 2L17 20H7Z"
          fill="white"
          fillOpacity={0.15}
        />
      </svg>
    </motion.div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

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
        background: "rgba(7, 8, 12, 0.95)",
        borderRight: "1px solid rgba(99, 102, 241, 0.08)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        overflowY: "auto",
        overflowX: "hidden",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Subtle gradient top */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Brand */}
      <div style={{
        padding: "20px 18px 16px",
        borderBottom: "1px solid rgba(99,102,241,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        position: "relative",
      }}>
        <ObsidianGem />
        <div>
          <div style={{
            color: "#F0F0FF",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            Obsidian
          </div>
          <div style={{
            color: "rgba(99, 102, 241, 0.7)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 2,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            AI Governance
          </div>
        </div>
        {/* Version badge */}
        <div style={{
          marginLeft: "auto",
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(99,102,241,0.5)",
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.12)",
          borderRadius: 999,
          padding: "2px 7px",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          v0.5
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
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
                  style={{ marginBottom: 2 }}
                >
                  <motion.div
                    animate={active ? { color: item.color } : {}}
                    style={{ color: active ? item.color : undefined, display: "flex" }}
                  >
                    <Icon size={16} />
                  </motion.div>
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      style={{
                        marginLeft: "auto",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: item.color,
                        boxShadow: `0 0 6px ${item.color}`,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom status widget */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid rgba(99,102,241,0.08)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* System operational */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(16, 185, 129, 0.06)",
          border: "1px solid rgba(16, 185, 129, 0.12)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <span className="status-dot online" />
            <span className="animate-radar" style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: "1px solid rgba(16,185,129,0.5)",
            }} />
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(52, 211, 153, 0.9)",
            letterSpacing: "0.06em",
            fontFamily: "'Space Grotesk', sans-serif",
            flex: 1,
          }}>
            System Operational
          </span>
          <span className="font-mono-data" style={{
            fontSize: 10,
            color: "rgba(78, 81, 112, 0.8)",
          }}>
            {time}
          </span>
        </div>

        {/* Powered by line */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            fontSize: 9.5,
            color: "rgba(78, 81, 112, 0.6)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}>
            powered by cascadeflow · hindsight
          </span>
        </div>
      </div>
    </aside>
  );
}
