"use client";

import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative pt-28 pb-12 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full"></div>

      {/* Announcement Pill */}
      <a
        href="#routing"
        className="inline-flex items-center gap-2 px-3.5 py-1 mb-8 rounded-full bg-[#121620]/90 border border-emerald-500/30 text-xs font-mono text-slate-300 hover:border-emerald-500/60 hover:bg-[#161B26] transition-all shadow-sm shadow-emerald-950/40"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-emerald-400">v2.4 Release</span>
        <span className="text-slate-600">|</span>
        <span>Zero-Auth Cloudflare Turnstile Auto-Bypass</span>
        <span className="material-symbols-outlined text-[13px] text-slate-400">arrow_forward</span>
      </a>

      {/* Giant Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-5xl text-balance">
        The Resilient AI Gateway for{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
          Production Engineering
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
        Route any LLM across zero-auth web backends and commercial APIs with sub-20ms auto-failover, continuous session auto-harvesting, and drop-in OpenAI SDK compatibility.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <button
          onClick={() => router.push("/dashboard/overview")}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base font-bold">terminal</span>
          Get Started Locally (:20128)
        </button>
        <a
          href="#routing"
          className="px-6 py-3 bg-[#121620] hover:bg-[#161B26] text-slate-200 border border-white/10 hover:border-white/20 font-medium text-xs rounded-lg flex items-center gap-2 backdrop-blur-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base text-slate-400">play_circle</span>
          Explore Live Sandbox
        </a>
      </div>

      {/* Metric Badges Ribbon */}
      <div className="mt-12 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-xl bg-[#0E1117]/80 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center py-3 px-3 rounded-lg bg-[#090A0F]/90 border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-sm font-bold text-white">0ms</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Downtime Failover</span>
        </div>

        <div className="flex flex-col items-center py-3 px-3 rounded-lg bg-[#090A0F]/90 border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-sm font-bold text-white">100+</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Upstream LLMs</span>
        </div>

        <div className="flex flex-col items-center py-3 px-3 rounded-lg bg-[#090A0F]/90 border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-sm font-bold text-white">4,800+ tok/s</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Stream Velocity</span>
        </div>

        <div className="flex flex-col items-center py-3 px-3 rounded-lg bg-[#090A0F]/90 border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-sm font-bold text-white">Drop-in</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">/v1 Endpoint</span>
        </div>
      </div>
    </section>
  );
}
