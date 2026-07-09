"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    // Simulate auth — in a real implementation, call your auth API
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);

    // Navigate to dashboard on success
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F0FDFA 0%, #EEF2FF 50%, #F7F9F8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Navbar />
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}
      >
        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0D9488 0%, #6366F1 100%)",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(13,148,136,0.30)",
            }}
          >
            {/* Shield icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                fill="white"
                fillOpacity="0.95"
              />
              <path
                d="M10 14.5L7.5 12L6.5 13L10 16.5L17.5 9L16.5 8L10 14.5Z"
                fill="rgba(13,148,136,0.9)"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Obsidian
          </h1>
          <p
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#6B7280",
              fontWeight: 400,
            }}
          >
            AI Governance &amp; Cost Audit Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="card animate-fade-in"
          style={{ padding: "36px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          <div style={{ marginBottom: "28px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ marginTop: "6px", fontSize: "13.5px", color: "#6B7280" }}>
              Monitor, audit, and govern your AI agent spend.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label
                  htmlFor="password"
                  style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
                >
                  Password
                </label>
                <button
                  type="button"
                  style={{
                    fontSize: "13px",
                    color: "#0D9488",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  style={{ fontFamily: "Inter, sans-serif", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B7280",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  marginBottom: "16px",
                  padding: "10px 14px",
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#DC2626" fillOpacity="0.15" />
                  <path d="M12 8v4m0 4h.01" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" />
                </svg>
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.7rem", fontSize: "15px", fontWeight: 600 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </motion.span>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#E3E8E6" }} />
            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#E3E8E6" }} />
          </div>

          {/* SSO button */}
          <button
            id="sso-signin"
            type="button"
            className="btn btn-ghost"
            style={{ width: "100%", padding: "0.65rem" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#0D9488" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#6366F1" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#D97706" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#16A34A" />
            </svg>
            Continue with SSO
          </button>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12.5px",
            color: "#6B7280",
          }}
        >
          Don&apos;t have an account?{" "}
          <span
            style={{
              color: "#0D9488",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationColor: "transparent",
              transition: "text-decoration-color 0.2s",
            }}
          >
            Request access
          </span>
        </p>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginTop: "28px",
          }}
        >
          {["SOC 2 Type II", "GDPR", "End-to-End Encrypted"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                color: "#6B7280",
                fontWeight: 500,
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  stroke="#0D9488"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
