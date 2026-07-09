"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/DashboardNavbar";
import { ToastContainer } from "@/components/Toast";
import { DashboardProvider } from "@/components/DashboardContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "transparent" }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative" }}>
        
        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 24px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <DashboardNavbar />

          <div style={{ width: "100%", maxWidth: "1152px" }}>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </div>
        </main>
      </div>

      {/* Global toast */}
      <ToastContainer />
    </div>
  );
}
