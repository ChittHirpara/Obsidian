"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { ToastContainer } from "@/components/Toast";
import { DashboardProvider } from "@/components/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState("");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-width)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <TopNavbar selectedAgent={selectedAgent} onAgentChange={setSelectedAgent} />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "24px 32px 32px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
