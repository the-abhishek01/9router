"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { copied, copy } = useCopyToClipboard(2000);

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#0E1117]/90 backdrop-blur-md border-b border-white/10 shadow-sm shadow-emerald-950/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0"
            onClick={() => router.push("/")}
            aria-label="Navigate to home"
          >
            <div className="relative flex items-center justify-center size-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              <svg className="w-5 h-5 fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <polygon fill="rgba(16,185,129,0.18)" points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" x2="12" y1="22" y2="12" />
                <polyline points="2 8.5 12 12 22 8.5" />
              </svg>
            </div>
            <span className="text-white text-lg font-bold tracking-tight">ARIS</span>
            <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium font-sans">
            <a className="text-slate-400 hover:text-white transition-colors" href="#features">Features</a>
            <a className="text-emerald-400 font-semibold border-b-2 border-emerald-500 pb-0.5" href="#routing">Routing Engine</a>
            <a className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5" href="#models">
              Supported Models
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/5 text-slate-300 rounded border border-white/10">100+</span>
            </a>
            <a className="text-slate-400 hover:text-white transition-colors" href="https://github.com/decolua/9router#readme" target="_blank" rel="noopener noreferrer">Docs</a>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* GitHub Star Badge */}
          <a
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-[#161B26] border border-white/10 rounded-lg hover:border-white/20 text-slate-300 transition-all"
            href="https://github.com/decolua/9router"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-amber-400">★</span>
            <span>4.2k</span>
          </a>

          {/* Terminal status button */}
          <button
            onClick={() => copy("http://localhost:20128/v1")}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-[#121620] border border-white/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-emerald-400">terminal</span>
            <span>{copied ? "Copied!" : ":20128/v1"}</span>
          </button>

          {/* Primary Action: Deploy Gateway */}
          <button
            onClick={() => router.push("/dashboard/overview")}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_14px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">bolt</span>
            Deploy Gateway
          </button>

          <button
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0E1117] p-6 space-y-4">
          <a className="block text-slate-300 hover:text-white text-sm" href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a className="block text-slate-300 hover:text-white text-sm" href="#routing" onClick={() => setMobileMenuOpen(false)}>Routing Engine</a>
          <a className="block text-slate-300 hover:text-white text-sm" href="#features" onClick={() => setMobileMenuOpen(false)}>Supported Models (100+)</a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              router.push("/dashboard/overview");
            }}
            className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
          >
            Deploy Gateway (:20128)
          </button>
        </div>
      )}
    </nav>
  );
}
