import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="absolute top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav 
        className="flex items-center justify-between px-6 py-3 w-full max-w-4xl rounded-full pointer-events-auto"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-[17px] tracking-wide">
            Obsidian
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
            Features
          </Link>
          <Link href="#about" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
            About
          </Link>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm ml-2">
            Sign up
          </button>
        </div>
      </nav>
    </div>
  );
}
