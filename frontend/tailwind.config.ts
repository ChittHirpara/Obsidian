import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0B",
          raised: "#0D0E10",
          surface: "#141416",
          elevated: "#1A1B1E",
          float: "#1F2023",
        },
        border: {
          DEFAULT: "rgba(38,39,43,0.6)",
          subtle: "rgba(38,39,43,0.35)",
          strong: "rgba(255,255,255,0.12)",
        },
        text: {
          primary: "#F5F5F7",
          secondary: "#9B9CA3",
          muted: "#5C5D63",
          accent: "#818CF8",
        },
        accent: {
          DEFAULT: "#6366F1",
          light: "#818CF8",
          dim: "rgba(99,102,241,0.12)",
          glow: "rgba(99,102,241,0.25)",
        },
        success: {
          DEFAULT: "#34D399",
          dim: "rgba(52,211,153,0.12)",
        },
        warning: {
          DEFAULT: "#FBBF24",
          dim: "rgba(251,191,36,0.12)",
        },
        danger: {
          DEFAULT: "#F87171",
          dim: "rgba(248,113,113,0.12)",
        },
        info: {
          DEFAULT: "#818CF8",
          dim: "rgba(129,140,248,0.12)",
        },
        obsidian: {
          light: "#0D0E10",
          slate: "#26272B",
          navy: "#0A0A0B",
          orange: "#6366F1",
        },
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        "card-md": "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-lg": "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 20px rgba(99,102,241,0.15)",
        "glow-sm": "0 0 10px rgba(99,102,241,0.1)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      fontSize: {
        "2xs": ["10px", "14px"],
      },
      letterSpacing: {
        "label": "0.06em",
        "wide-label": "0.08em",
      },
      animation: {
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.3s ease both",
        "slide-up": "slideUp 0.3s ease both",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99,102,241,0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(99,102,241,0.2)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
