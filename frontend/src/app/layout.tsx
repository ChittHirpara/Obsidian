import type { Metadata } from "next";
import "./globals.css";
import Ferrofluid from "@/components/Ferrofluid";

export const metadata: Metadata = {
  title: "Obsidian — AI Governance & Cost Audit",
  description:
    "AI Agent Governance & Cost Audit Dashboard. Real-time budget enforcement, decision audit trail, and routing insights powered by cascadeflow and Hindsight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
          <Ferrofluid
            colors={["#ffffff", "#ffffff", "#ffffff"]}
            speed={0.5}
            scale={1.6}
            turbulence={1}
            fluidity={0.1}
            rimWidth={0.2}
            sharpness={2.5}
            shimmer={1.5}
            glow={2}
            flowDirection="down"
            opacity={1}
            mouseInteraction={true}
            mouseStrength={1}
            mouseRadius={0.35}
          />
        </div>
        <div style={{ position: "relative", zIndex: 1, height: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
