"use client";

import { useState, useEffect, useRef } from "react";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

const codeSnippets = {
  ts: `// Configure standard OpenAI client targeting Aris Daemon
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:20128/v1',
  apiKey: 'aris-local-key'
});

// Instant seamless failover across web turnstile pools
const stream = await openai.chat.completions.create({
  model: 'ox-alpha', // auto-routed to zero-cost upstream
  stream: true,
  messages: [
    { role: 'user', content: 'Explain quantum error correction.' }
  ]
});`,
  py: `# Configure standard OpenAI client targeting Aris Daemon
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:20128/v1",
    api_key="aris-local-key"
)

# Instant seamless failover across web turnstile pools
stream = client.chat.completions.create(
    model="ox-alpha",
    stream=True,
    messages=[{"role": "user", "content": "Explain quantum error correction."}]
)`,
  curl: `# Direct cURL request through Aris local gateway
curl -N http://localhost:20128/v1/chat/completions \\
  -H "Authorization: Bearer aris-local-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "ox-alpha",
    "stream": true,
    "messages": [{"role": "user", "content": "Explain quantum error correction."}]
  }'`,
};

const streamSampleText =
  "Quantum error correction protects quantum information from decoherence and environmental noise using quantum codes. Unlike classical error correction, which copies bits, quantum mechanics prohibits cloning unknown quantum states due to the No-Cloning Theorem.\n\nInstead, quantum error correction spreads logical quantum information across entangled states of multiple physical qubits (e.g., in the Surface Code or Steane Code), allowing detection of both bit-flip (X) and phase-flip (Z) errors via non-destructive syndrome measurements.";

export default function PlaygroundSection() {
  const [activeTab, setActiveTab] = useState("ts");
  const [selectedModel, setSelectedModel] = useState("ox-alpha");
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIntervalRef = useRef(null);
  const { copied, copy } = useCopyToClipboard(2000);

  const startStream = () => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setDisplayedText("");
    setIsStreaming(true);
    let index = 0;
    const step = 4;

    streamIntervalRef.current = setInterval(() => {
      index += step;
      if (index >= streamSampleText.length) {
        setDisplayedText(streamSampleText);
        setIsStreaming(false);
        clearInterval(streamIntervalRef.current);
      } else {
        setDisplayedText(streamSampleText.slice(0, index));
      }
    }, 28);
  };

  useEffect(() => {
    startStream();
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [selectedModel]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-12" id="routing">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>GATEWAY RUNTIME SIMULATION</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Interactive Request Playground</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#0E1117] border border-white/10 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Local Core Daemon: ONLINE (port 20128)</span>
        </div>
      </div>

      {/* Split Screen Sandbox Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl border border-white/10 bg-[#0E1117]/80 backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Left Pane: Code Configuration */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between bg-[#090A0F]/70">
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#121620] border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("ts")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                  activeTab === "ts"
                    ? "bg-[#161B26] text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                TypeScript SDK
              </button>
              <button
                onClick={() => setActiveTab("py")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                  activeTab === "py"
                    ? "bg-[#161B26] text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setActiveTab("curl")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                  activeTab === "curl"
                    ? "bg-[#161B26] text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                cURL
              </button>
            </div>

            <button
              onClick={() => copy(codeSnippets[activeTab])}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              title="Copy Code"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-slate-300 min-h-[220px]">
            <pre className="whitespace-pre">{codeSnippets[activeTab]}</pre>
          </div>

          {/* Sandbox Footer Controller */}
          <div className="p-4 bg-[#121620]/60 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Target Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#090A0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ox-alpha">ox-alpha (Zero-Auth Auto)</option>
                <option value="claude-3-7-sonnet">claude-3-7-sonnet (Resilient)</option>
                <option value="deepseek-v3">deepseek-v3 (Direct API)</option>
              </select>
            </div>

            <button
              onClick={startStream}
              disabled={isStreaming}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm font-bold">play_arrow</span>
              {isStreaming ? "Streaming..." : "Dispatch Call"}
            </button>
          </div>
        </div>

        {/* Right Pane: Live Streaming Visualizer */}
        <div className="flex flex-col justify-between bg-[#090A0F]">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#121620] border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 ml-2">stream-stdout.sse</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE_SSE_BURST</span>
            </div>
          </div>

          {/* Live Output Screen */}
          <div className="p-5 font-mono text-xs leading-relaxed text-slate-200 h-64 overflow-y-auto flex flex-col justify-start">
            <div className="text-slate-500 text-[11px] mb-2 font-mono">
              [20128-INGRESS] POST /v1/chat/completions HTTP/1.1<br />
              [AUTH-BYPASS] Turnstile session injected from pool [cluster-us-east-1a]<br />
              [STATUS] 200 OK | Transfer-Encoding: chunked
            </div>
            <p className="whitespace-pre-wrap">
              {displayedText}
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle ml-1"></span>
            </p>
          </div>

          {/* Telemetry Bar */}
          <div className="p-3.5 bg-[#121620]/80 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="border-r border-white/10 pr-2">
              <span className="text-[10px] text-slate-400 block uppercase">Model</span>
              <span className="text-white font-medium truncate block">{selectedModel} (GLM-5.3)</span>
            </div>
            <div className="border-r border-white/10 pr-2">
              <span className="text-[10px] text-slate-400 block uppercase">TTFT</span>
              <span className="text-emerald-400 font-semibold block">74ms</span>
            </div>
            <div className="border-r border-white/10 pr-2">
              <span className="text-[10px] text-slate-400 block uppercase">Total Latency</span>
              <span className="text-slate-200 block">382ms</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Route Status</span>
              <span className="text-emerald-400 block truncate">Primary Zero-Auth</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
