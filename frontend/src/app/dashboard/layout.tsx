"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ToastContainer } from "@/components/Toast";

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  "/dashboard": { title: "Dashboard Overview", desc: "Real-time budget and audit summary" },
  "/dashboard/analytics": { title: "Analytics", desc: "Cost trends, model usage, and category breakdown" },
  "/dashboard/query": { title: "Live Query Console", desc: "Submit queries through cascadeflow enforce mode" },
  "/dashboard/events": { title: "Audit Events", desc: "Full decision log with search and filter" },
  "/dashboard/insights": { title: "Routing Insights", desc: "AI-powered cost-reduction recommendations" },
  "/dashboard/session": { title: "Session Manager", desc: "Budget tracking and session reset" },
  "/dashboard/health": { title: "Health Monitor", desc: "Backend connectivity and API status" },
  "/dashboard/settings": { title: "Settings", desc: "Configuration and system information" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageInfo = PAGE_TITLES[pathname] ?? { title: "Obsidian", desc: "AI Governance Platform" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F7F9F8" }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Topbar */}
        <header
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E3E8E6",
            height: "60px",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: "14px",
            flexShrink: 0,
            zIndex: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              id="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", padding: "6px", borderRadius: "6px",
                display: "flex", alignItems: "center",
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0, fontSize: isMobile ? "15px" : "16px",
                fontWeight: 600, color: "#111827", letterSpacing: "-0.01em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {pageInfo.title}
            </h1>
            {!isMobile && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", lineHeight: 1.2 }}>
                {pageInfo.desc}
              </p>
            )}
          </div>

          {/* Right side — brand mark on mobile */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: "linear-gradient(135deg, #0D9488, #6366F1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="white" fillOpacity="0.95" />
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Obsidian</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? "16px" : "24px",
          }}
        >
          {children}
        </main>
      </div>

      {/* Global toast */}
      <ToastContainer />
    </div>
  );
}
