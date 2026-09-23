"use client";

import { useRouter } from "next/navigation";
import Navigation from "./components/Navigation";
import HeroSection from "./components/HeroSection";
import PlaygroundSection from "./components/PlaygroundSection";
import Features from "./components/Features";
import Footer from "./components/Footer";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative text-white font-sans overflow-x-hidden antialiased selection:bg-emerald-500/20 selection:text-emerald-300 bg-[#090A0F]">
      {/* Deep Obsidian Grid Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#090A0F]">
        {/* Fine sub-pixel grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        ></div>

        {/* Ambient Emerald Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[150px]"></div>

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 0%, rgba(9, 10, 15, 0.7) 100%)",
          }}
        ></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="min-h-screen">
          <HeroSection />
          <PlaygroundSection />
          <Features />

          {/* CTA Section */}
          <section className="py-24 px-6 relative overflow-hidden border-t border-white/5">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider mb-3 inline-block">
                Production-Ready AI Gateway
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight text-white">
                Simplify & Scale Your AI Infrastructure
              </h2>
              <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Connect your CLI tools, IDE extensions, and services to Aris. Free, automated failover, and open source under MIT.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push("/dashboard/overview")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all shadow-[0_0_24px_rgba(16,185,129,0.35)] active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base font-bold">bolt</span>
                  Open Executive Dashboard
                </button>
                <a
                  href="https://github.com/decolua/9router"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#121620] hover:bg-[#161B26] text-white border border-white/10 hover:border-white/20 text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base text-slate-400">code</span>
                  View GitHub Repository
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
