"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

export default function ExecutiveOverviewPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pingStates, setPingStates] = useState({});
  const [toggles, setToggles] = useState({
    aggressiveFailover: true,
    turnstileHarvesting: true,
    cacheLayer: true,
  });
  const { copied, copy } = useCopyToClipboard(2000);

  const [metrics, setMetrics] = useState({
    dailyTokens: "2,841,920",
    tokenGrowth: "+18.4%",
    meanLatency: "138ms",
    ttft: "76ms",
    activeUpstreams: "14",
    failoverSaves: "42",
  });

  const routes = [
    {
      id: "ox-alpha",
      name: "ox-alpha",
      provider: "Ox Alpha Web (Zero-Auth Session)",
      type: "zero-auth",
      protocol: "SSE Streaming",
      latency: "112ms",
      successRate: "99.8%",
      status: "PRIMARY",
      badgeColor: "emerald",
      endpoint: "/v1/chat/completions",
    },
    {
      id: "claude-3-7-sonnet",
      name: "claude-3-7-sonnet",
      provider: "Anthropic Direct",
      type: "api",
      protocol: "HTTP/2 Streaming",
      latency: "185ms",
      successRate: "99.99%",
      status: "ACTIVE",
      badgeColor: "emerald",
      endpoint: "/v1/chat/completions",
    },
    {
      id: "deepseek-v3",
      name: "deepseek-v3",
      provider: "DeepSeek Native",
      type: "api",
      protocol: "Open-SSE",
      latency: "94ms",
      successRate: "99.95%",
      status: "ACTIVE",
      badgeColor: "emerald",
      endpoint: "/v1/chat/completions",
    },
    {
      id: "gemini-2.5-flash",
      name: "gemini-2.5-flash",
      provider: "Google Web / Vertex",
      type: "zero-auth",
      protocol: "REST JSON",
      latency: "82ms",
      successRate: "100%",
      status: "STANDBY",
      badgeColor: "amber",
      endpoint: "/v1/chat/completions",
    },
    {
      id: "jev-systemone",
      name: "systemone",
      provider: "JEV AI SystemOne",
      type: "api",
      protocol: "REST Proxy",
      latency: "142ms",
      successRate: "99.7%",
      status: "ACTIVE",
      badgeColor: "emerald",
      endpoint: "/api/v1/systemone",
    },
  ];

  const filteredRoutes = routes.filter((r) => {
    if (filter === "zero-auth" && r.type !== "zero-auth") return false;
    if (filter === "api" && r.type !== "api") return false;
    if (filter === "fallbacks" && r.status !== "STANDBY") return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.provider.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handlePing = (id) => {
    setPingStates((prev) => ({ ...prev, [id]: "pinging" }));
    setTimeout(() => {
      setPingStates((prev) => ({ ...prev, [id]: "success" }));
      setTimeout(() => {
        setPingStates((prev) => ({ ...prev, [id]: null }));
      }, 2500);
    }, 600);
  };

  const toggleSwitch = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 text-slate-100 antialiased pb-12">
      {/* Top Banner Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Aris Core</span>
            <span>/</span>
            <span>Routing Cluster</span>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">Executive Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2.5">
            Multi-Provider Intelligent Dispatcher
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              Active v2.4
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0E1117] border border-white/10 rounded-lg text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Server:</span>
            <span className="text-emerald-400 font-medium">http://localhost:20128</span>
          </div>

          <button
            onClick={() => copy("http://localhost:20128/v1")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copied ? "Copied!" : "Copy /v1 Endpoint"}</span>
          </button>
        </div>
      </div>

      {/* 4 High-Density Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Daily Throughput */}
        <div className="p-4 rounded-xl bg-[#0E1117] border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Daily Gateway Throughput</span>
            <span className="material-symbols-outlined text-sm text-emerald-400">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-2xl font-bold text-white tracking-tight">{metrics.dailyTokens}</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {metrics.tokenGrowth}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Peak: 4,820 tok/sec</span>
            <span className="font-mono text-emerald-400">100% delivered</span>
          </div>
        </div>

        {/* Card 2: Mean Latency */}
        <div className="p-4 rounded-xl bg-[#0E1117] border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Global Mean Latency</span>
            <span className="material-symbols-outlined text-sm text-emerald-400">timer</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-2xl font-bold text-white tracking-tight">{metrics.meanLatency}</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              -12ms
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>TTFT: {metrics.ttft}</span>
            <span className="font-mono text-slate-300">P99: 210ms</span>
          </div>
        </div>

        {/* Card 3: Active Upstreams */}
        <div className="p-4 rounded-xl bg-[#0E1117] border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Active Upstreams</span>
            <span className="material-symbols-outlined text-sm text-emerald-400">dns</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-2xl font-bold text-white tracking-tight">{metrics.activeUpstreams}</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              0 Outages
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
            <span className="text-emerald-400">● Ox Alpha</span>
            <span>·</span>
            <span className="text-emerald-400">● Claude</span>
            <span>·</span>
            <span className="text-emerald-400">● DeepSeek</span>
          </div>
        </div>

        {/* Card 4: Auto-Failover Saves */}
        <div className="p-4 rounded-xl bg-[#0E1117] border border-white/10 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Auto-Failover Saves</span>
            <span className="material-symbols-outlined text-sm text-emerald-400">security_update_good</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-2xl font-bold text-white tracking-tight">{metrics.failoverSaves}</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              100% Recov.
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Downtime: 0ms</span>
            <span className="font-mono text-emerald-400">0 dropped tok</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid (2/3 Left, 1/3 Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routing Matrix & Latency Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Routing Matrix Card */}
          <div className="rounded-xl bg-[#0E1117] border border-white/10 overflow-hidden shadow-xl">
            {/* Matrix Header */}
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121620]/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Dynamic Multi-Provider Routing Matrix</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {filteredRoutes.length} Active Routes
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time health, priority dispatching, and automated failover rules</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#090A0F] p-1 rounded-lg border border-white/5 text-xs font-medium">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    filter === "all" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("zero-auth")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    filter === "zero-auth" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Zero-Auth Web
                </button>
                <button
                  onClick={() => setFilter("api")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    filter === "api" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Dedicated API
                </button>
                <button
                  onClick={() => setFilter("fallbacks")}
                  className={`px-2.5 py-1 rounded transition-all ${
                    filter === "fallbacks" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Fallbacks
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#090A0F]/80 text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Model Route</th>
                    <th className="py-3 px-4">Upstream Provider</th>
                    <th className="py-3 px-4">Protocol</th>
                    <th className="py-3 px-4">P95 Latency</th>
                    <th className="py-3 px-4">Success</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {route.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{route.provider}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{route.protocol}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{route.latency}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{route.successRate}</td>
                      <td className="py-3 px-4">
                        {route.status === "PRIMARY" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                            ACTIVE - PRIMARY
                          </span>
                        ) : route.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            STANDBY
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handlePing(route.id)}
                          disabled={pingStates[route.id] === "pinging"}
                          className="px-2.5 py-1 text-[11px] font-mono bg-[#161B26] hover:bg-[#222938] text-slate-200 border border-white/10 rounded transition-all active:scale-95"
                        >
                          {pingStates[route.id] === "pinging"
                            ? "Testing..."
                            : pingStates[route.id] === "success"
                            ? "200 OK (84ms)"
                            : "Test Ping"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latency & Velocity Telemetry Chart */}
          <div className="p-5 rounded-xl bg-[#0E1117] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">24h Latency & Token Velocity Visualizer</h3>
                <p className="text-xs text-slate-400">Dynamic routing performance across zero-auth sessions and fallback nodes</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono bg-[#090A0F] p-1 rounded border border-white/5">
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded">24h</span>
                <span className="px-2 py-0.5 text-slate-400">7d</span>
                <span className="px-2 py-0.5 text-slate-400">30d</span>
              </div>
            </div>

            {/* Vector Simulated Chart */}
            <div className="h-44 w-full bg-[#090A0F] rounded-lg p-3 border border-white/5 relative flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Peak: 4.8k tok/s</span>
                <span className="text-emerald-400">● Token Velocity (tok/s)</span>
                <span className="text-blue-400">● Latency (ms)</span>
                <span>Base: 1.2k tok/s</span>
              </div>

              {/* SVG Curve */}
              <svg className="w-full h-28 overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,70 Q70,40 140,55 T280,30 T420,45 T500,20 L500,100 L0,100 Z"
                  fill="url(#chartEmerald)"
                />
                <path
                  d="M0,70 Q70,40 140,55 T280,30 T420,45 T500,20"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
                <path
                  d="M0,45 Q70,65 140,50 T280,60 T420,38 T500,50"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />
              </svg>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>Now (15:20)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Terminal Stream & Toggles */}
        <div className="space-y-6">
          {/* Live Terminal Stream */}
          <div className="rounded-xl bg-[#0E1117] border border-white/10 overflow-hidden shadow-xl flex flex-col h-[380px]">
            {/* Terminal Header */}
            <div className="px-4 py-2.5 bg-[#121620] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                <span className="font-mono text-xs text-slate-300 ml-2">stream-stdout.log</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>

            {/* Terminal Monospace Body */}
            <div className="p-3.5 flex-1 bg-[#090A0F] font-mono text-[11px] leading-relaxed overflow-y-auto space-y-2 text-slate-300">
              <div className="text-emerald-400/80">
                [15:18:42] 200 OK: POST /v1/chat/completions (ox-alpha) &rarr; 412 tok @ 88 tok/s [Latency: 108ms]
              </div>
              <div className="text-amber-400/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                [15:17:10] 428 AUTO-BYPASS: Ox Alpha turnstile challenge intercepted &rarr; renewed session cookie via CDP in 18ms (0 dropped tokens)
              </div>
              <div className="text-emerald-400/80">
                [15:16:02] 200 OK: POST /v1/chat/completions (claude-3-7-sonnet) &rarr; 1,280 tok @ 74 tok/s [Latency: 182ms]
              </div>
              <div className="text-emerald-400/80">
                [15:14:55] 200 OK: POST /v1/chat/completions (deepseek-v3) &rarr; 820 tok @ 102 tok/s [Latency: 91ms]
              </div>
              <div className="text-slate-400">
                [15:12:30] 200 OK: GET /v1/models &rarr; 14 upstreams synced successfully
              </div>
              <div className="text-emerald-400/80">
                [15:11:15] 200 OK: POST /api/v1/systemone (jev-ai) &rarr; 310 tok @ 68 tok/s [Latency: 142ms]
              </div>
            </div>

            <div className="px-3.5 py-2 bg-[#121620] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Auto-scroll: ON</span>
              <span className="text-emerald-400">0 errors recorded</span>
            </div>
          </div>

          {/* Gateway Hardware Toggles */}
          <div className="p-5 rounded-xl bg-[#0E1117] border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-400">tune</span>
              Gateway Configuration Controls
            </h3>

            {/* Toggle 1 */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#121620]/60 border border-white/5">
              <div>
                <div className="text-xs font-semibold text-white">Aggressive Failover (0ms Retry)</div>
                <div className="text-[11px] text-slate-400">Instantly reroute on 428 / 429 status</div>
              </div>
              <button
                onClick={() => toggleSwitch("aggressiveFailover")}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  toggles.aggressiveFailover ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    toggles.aggressiveFailover ? "right-1" : "left-1"
                  }`}
                ></div>
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#121620]/60 border border-white/5">
              <div>
                <div className="text-xs font-semibold text-white">Turnstile Auto-Harvesting</div>
                <div className="text-[11px] text-slate-400">Headless token renewal daemon active</div>
              </div>
              <button
                onClick={() => toggleSwitch("turnstileHarvesting")}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  toggles.turnstileHarvesting ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    toggles.turnstileHarvesting ? "right-1" : "left-1"
                  }`}
                ></div>
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#121620]/60 border border-white/5">
              <div>
                <div className="text-xs font-semibold text-white">Redis Fast-Path Cache</div>
                <div className="text-[11px] text-slate-400">Sub-millisecond exact match cache</div>
              </div>
              <button
                onClick={() => toggleSwitch("cacheLayer")}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  toggles.cacheLayer ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    toggles.cacheLayer ? "right-1" : "left-1"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
