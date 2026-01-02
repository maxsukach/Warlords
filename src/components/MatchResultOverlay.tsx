'use client';

import type { MatchResult } from "@/lib/game/endConditions";

type Props = {
  result: MatchResult;
  onRestart: () => void;
};

function titleFor(result: MatchResult) {
  switch (result) {
    case "YOU_WIN":
      return "Victory";
    case "AI_WIN":
      return "Defeat";
    case "DRAW":
      return "Draw";
    default:
      return "";
  }
}

export function MatchResultOverlay({ result, onRestart }: Props) {
  if (!result) return null;

  const title = titleFor(result);
  const subtitle =
    result === "YOU_WIN"
      ? "Enemy fort destroyed."
      : result === "AI_WIN"
      ? "Your fort has fallen."
      : "Both forces are spent.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/90 p-6 text-center shadow-2xl">
        <div className="text-sm uppercase tracking-[0.2em] opacity-60">Match Result</div>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-widest">{title}</h2>
        <p className="mt-2 text-sm opacity-80">{subtitle}</p>
        <button
          onClick={onRestart}
          className="mt-6 w-full rounded-xl bg-white text-black px-4 py-3 font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
        >
          Restart Match
        </button>
      </div>
    </div>
  );
}
