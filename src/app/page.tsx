'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSettings } from "./settings/model";

export default function StartPage() {
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [settingsSummary, setSettingsSummary] = useState("Normal speed • Log On • AI Normal");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Placeholder: detect saved state when implemented
    const saved = localStorage.getItem("warlords_saved_state");
    setHasSavedGame(Boolean(saved));

    const s = getSettings();
    const animLabel = s.animationSpeed === "slow" ? "Anim Slow" : s.animationSpeed === "fast" ? "Anim Fast" : "Anim Normal";
    const logLabel = s.showCombatLog ? "Log On" : "Log Off";
    const aiLabel = s.aiSpeed === "fast" ? "AI Fast" : "AI Normal";
    setSettingsSummary(`${animLabel} • ${logLabel} • ${aiLabel}`);
  }, []);

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="mx-auto w-full max-w-[480px] flex-1 flex flex-col px-4 py-10 gap-10">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Warlords</span>
          <h1 className="text-3xl font-black">Command Your Army</h1>
          <p className="text-sm opacity-70 leading-6">
            Turn-based card strategy in portrait PWA form. Follow the locked rules; outmaneuver the AI.
          </p>
          <div className="text-[11px] uppercase tracking-widest opacity-50">{settingsSummary}</div>
        </header>

        <div className="space-y-4">
          {hasSavedGame && (
            <Link
              href="/game"
              className="block rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-black uppercase tracking-widest hover:bg-white/15 transition"
            >
              Continue
            </Link>
          )}
          <Link
            href="/game"
            className="block rounded-2xl bg-white text-black px-4 py-5 text-center text-lg font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition"
          >
            Start Game
          </Link>
          <Link
            href="/settings"
            className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition"
          >
            Settings
          </Link>
        </div>

        <footer className="mt-auto text-[11px] uppercase tracking-wider opacity-40">
          Portrait-only • Phase-driven UI • Single screen battle
        </footer>
      </div>
    </main>
  );
}
