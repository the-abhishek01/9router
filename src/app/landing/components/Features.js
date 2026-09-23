"use client";

export default function Features() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16" id="features">
      {/* Section Header */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h2 className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 font-semibold">
          Engineered Resilience
        </h2>
        <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Zero-Auth Architecture. Enterprise Reliability.
        </p>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Every feature is designed to isolate your production services from upstream LLM outages, sudden pricing tier shifts, and Cloudflare challenges.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Large 2-column (Zero-Auth Upstream Harvester) */}
        <div className="md:col-span-2 rounded-2xl bg-[#0E1117] border border-white/10 p-7 flex flex-col justify-between hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-xl">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-[20px]">vpn_key</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE HARVEST ENGINE
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Zero-Auth Upstream Harvester</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
              Automated headless Cloudflare Turnstile bypass and session rotation engine allowing free web model usage with zero API cost. Maintains a pool of warm ephemeral sessions automatically refreshed before token expiration.
            </p>
          </div>

          {/* Session Rotation Visualizer Diagram */}
          <div className="mt-6 p-4 rounded-xl bg-[#090A0F] border border-white/5 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-3 border-b border-white/5">
              <span>Session Pool [cluster-us-east-1a]</span>
              <span className="text-emerald-400 font-semibold">42/42 Warm Sessions Ready</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-[11px]">
              <div className="p-2.5 rounded-lg bg-[#121620] border border-emerald-500/30 text-slate-200">
                <div className="text-emerald-400 font-bold text-xs mb-0.5">Ox Alpha Pool</div>
                <div className="text-[10px] text-slate-400">Auto Turnstile Solved</div>
                <div className="mt-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded inline-block">
                  100% Valid
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121620] border border-white/5 text-slate-200">
                <div className="text-teal-400 font-bold text-xs mb-0.5">GLM-5.3 Web</div>
                <div className="text-[10px] text-slate-400">Continuous Cookies</div>
                <div className="mt-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded inline-block">
                  100% Valid
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121620] border border-white/5 text-slate-200">
                <div className="text-amber-400 font-bold text-xs mb-0.5">Gemini Web Mirror</div>
                <div className="text-[10px] text-slate-400">Automated Auth</div>
                <div className="mt-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded inline-block">
                  Standby
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Sub-20ms Failover Matrix */}
        <div className="rounded-2xl bg-[#0E1117] border border-white/10 p-7 flex flex-col justify-between hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#121620] border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sub-20ms Failover Matrix</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automatically reroutes 428, 429, or 500 upstream errors to pre-warmed backup providers without dropping or interrupting active client stream connections.
            </p>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-[#090A0F] border border-white/5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span>Primary Upstream</span>
              <span className="text-rose-400">428 Challenge</span>
            </div>
            <div className="w-full bg-[#161B26] h-1.5 rounded-full overflow-hidden mb-2.5">
              <div className="bg-rose-500 h-full w-2/5"></div>
            </div>
            <div className="flex items-center justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                Failover to Secondary
              </span>
              <span>14ms</span>
            </div>
          </div>
        </div>

        {/* Card 3: Universal Protocol Adapter */}
        <div className="rounded-2xl bg-[#0E1117] border border-white/10 p-7 flex flex-col justify-between hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#121620] border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Universal Protocol Adapter</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Drop-in OpenAI SDK compatibility. Automatically standardizes Open-SSE, Anthropic Messages API, and Google Vertex formats into standard OpenAI <code className="text-emerald-400 font-mono">/v1/chat/completions</code>.
            </p>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-[#090A0F] border border-white/5 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-emerald-400">&gt; Anthropic &rarr; OpenAI format</div>
            <div className="text-emerald-400">&gt; Open-SSE &rarr; OpenAI format</div>
            <div className="text-teal-400">&gt; Jev AI &rarr; SystemOne proxy</div>
          </div>
        </div>

        {/* Card 4: Large 2-column (Local Smart Semantic Cache) */}
        <div className="md:col-span-2 rounded-2xl bg-[#0E1117] border border-white/10 p-7 flex flex-col justify-between hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#121620] border border-white/10 flex items-center justify-center text-emerald-400 mb-3">
                <span className="material-symbols-outlined text-[20px]">database</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Local SQLite & Redis Fast Cache</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                Exact-match and semantic prompt caching layer. Eliminates duplicate LLM queries with sub-millisecond response delivery directly from local storage.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end font-mono">
              <span className="text-2xl font-bold text-emerald-400">0ms</span>
              <span className="text-[11px] text-slate-400">Cached Query Latency</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              99.9% Cache Hit Reliability
            </span>
            <span>·</span>
            <span>Zero Upstream Token Cost for Cached Responses</span>
          </div>
        </div>
      </div>
    </section>
  );
}
