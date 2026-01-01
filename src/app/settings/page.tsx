'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from "./model";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setLoaded(true);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      setSavedNotice("Saved");
      setTimeout(() => setSavedNotice(null), 1500);
      return next;
    });
  };

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col">
      <div className="mx-auto w-full max-w-[480px] flex-1 flex flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest opacity-40 font-black">Warlords</span>
            <h1 className="text-xl font-black">Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Home
            </Link>
            <button
              onClick={() => router.push("/game")}
              className="rounded-lg border border-white/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-black"
            >
              Game
            </button>
          </div>
        </header>

        <div className="space-y-5">
          <Section title="Animation speed">
            <OptionGroup
              name="animation-speed"
              value={settings.animationSpeed}
              options={[
                { label: "Slow", value: "slow" },
                { label: "Normal", value: "normal" },
                { label: "Fast", value: "fast" },
              ]}
              onChange={(val) => update({ animationSpeed: val as Settings["animationSpeed"] })}
              disabled={!loaded}
            />
          </Section>

          <Section title="Show combat log">
            <OptionGroup
              name="combat-log"
              value={settings.showCombatLog ? "on" : "off"}
              options={[
                { label: "On", value: "on" },
                { label: "Off", value: "off" },
              ]}
              onChange={(val) => update({ showCombatLog: val === "on" })}
              disabled={!loaded}
            />
          </Section>

          <Section title="AI speed">
            <OptionGroup
              name="ai-speed"
              value={settings.aiSpeed}
              options={[
                { label: "Normal", value: "normal" },
                { label: "Fast", value: "fast" },
              ]}
              onChange={(val) => update({ aiSpeed: val as Settings["aiSpeed"] })}
              disabled={!loaded}
            />
          </Section>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          {savedNotice ? (
            <span className="text-[11px] uppercase tracking-wider text-green-400 font-bold">{savedNotice}</span>
          ) : (
            <span className="text-[11px] uppercase tracking-wider opacity-40">Changes save automatically</span>
          )}
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-[12px] font-bold uppercase tracking-widest"
          >
            Back
          </button>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="text-[11px] uppercase tracking-wider font-black opacity-50">{title}</div>
      {children}
    </div>
  );
}

type Option = { label: string; value: string };

function OptionGroup({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold uppercase tracking-wider text-center cursor-pointer transition ${
            value === opt.value ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            className="hidden"
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
