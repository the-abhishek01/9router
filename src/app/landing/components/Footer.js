"use client";

import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

export default function Footer() {
  const { copied, copy } = useCopyToClipboard(2000);
  const quickstartCmd = "curl -fsSL https://aris.sh | sh";

  return (
    <footer className="border-t border-white/10 bg-[#090A0F] pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Quickstart Callout Box */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-[#0E1117] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="text-xs font-mono text-emerald-400 font-semibold mb-1">
              ZERO CONFIG QUICKSTART
            </div>
            <h3 className="text-xl font-bold text-white">Deploy Aris Gateway Locally</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Run the universal LLM router on port 20128 with instant zero-auth session harvesting.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto bg-[#090A0F] p-2 rounded-xl border border-white/10">
            <code className="text-xs font-mono text-emerald-400 px-3 py-1 truncate">
              {quickstartCmd}
            </code>
            <button
              onClick={() => copy(quickstartCmd)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all active:scale-95 shrink-0 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? "check" : "content_copy"}
              </span>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative flex items-center justify-center size-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                <svg className="w-4 h-4 fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon fill="rgba(16,185,129,0.18)" points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  <line x1="12" x2="12" y1="22" y2="12" />
                  <polyline points="2 8.5 12 12 22 8.5" />
                </svg>
              </div>
              <span className="text-white text-base font-bold tracking-tight">ARIS GATEWAY</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
              The high-performance AI Infrastructure Gateway and Multi-Provider LLM Router. Unifying zero-auth sessions, commercial APIs, and failover topologies into a single endpoint.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Product</h4>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="#features">Features</a>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="/dashboard/overview">Executive Dashboard</a>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="/dashboard/endpoint">API Keys & Tunnel</a>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="/dashboard/providers">Providers</a>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Resources</h4>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="https://github.com/decolua/9router#readme" target="_blank" rel="noopener noreferrer">Documentation</a>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="https://github.com/decolua/9router" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="https://www.npmjs.com/package/9router" target="_blank" rel="noopener noreferrer">NPM Package</a>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Legal</h4>
            <a className="text-slate-400 hover:text-emerald-400 text-xs transition-colors" href="https://github.com/decolua/9router/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
            <span className="text-slate-500 text-xs">Zero Tracking Policy</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Aris AI Infrastructure. Open source under MIT.</p>
          <div className="flex gap-6 font-mono">
            <span className="text-emerald-400">Gateway Core: :20128</span>
            <span>Obsidian Hyper-Router</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
